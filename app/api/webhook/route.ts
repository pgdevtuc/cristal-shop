import { NextResponse } from "next/server";
import Order from "@/lib/models/order";
import Cart from "@/lib/models/carts";
import Product from "@/lib/models/product";
import connectDB from "@/lib/database";
import { verifySignature } from "@/lib/modo-signature";
import { enviarEmail } from "@/lib/template-mail";

export const runtime = "nodejs";

function getArgentinaDate() {
  const date = new Date();
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  return new Date(utc - 3 * 60 * 60 * 1000);
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const rawBody = await req.text();
    const body = JSON.parse(rawBody);

    const isValid = await verifySignature(body);
    if (!isValid) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

    const { external_intention_id, status, id: paymentId, card } = body;

    const cart = await Cart.findById(external_intention_id);

    if (!cart) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    }

    let order = await Order.findOne({ refNumber: external_intention_id });

    if (!order) {
      order = await Order.create({
        refNumber: cart._id,
        customerName: cart.customerName,
        customerEmail: cart.customerEmail,
        customerPhone: cart.customerPhone,
        customerAddress: cart.customerAddress,
        customerPostalCode: cart.customerPostalCode,
        shipping: cart.shipping,
        items: cart.items,
        totalAmount: cart.totalAmount,
        status: "CREATED",
        paymentStatus: status,
        paymentId: paymentId ? String(paymentId) : undefined,
        stockUpdated: false,
        createdAt: getArgentinaDate(),
        updatedAt: getArgentinaDate(),
      });
    }

    // Evitar doble procesamiento del mismo webhook
    if (order.paymentStatus === "ACCEPTED") {
      return NextResponse.json({ received: true });
    }

    // Manejo de estados
    let newStatus = "CREATED";


    if (status === "ACCEPTED") {
      newStatus = "PAID";
      if (card) {
        order.card = {
          bank_name: card.bank_name,
          issuer_name: card.issuer_name,
          bin: card.bin,
          last_digits: card.last_digits,
          card_type: card.card_type,
        } as any;
      }

      if (!order.stockUpdated) {
        for (const item of cart.items) {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { stock: -item.quantity },
          });
        }

        order.stockUpdated = true;
      }
      // Enviar email de pago aprobado
      try {
        const productos = cart.items.map((it: any) => ({
          nombre: it.name,
          imagen: it.image || "",
          cantidad: it.quantity as any,
          precio: it.price
        }));
        const subtotal = cart.items.reduce((acc: number, it: any) => acc + it.price * it.quantity, 0);
        const tarjetaStr =
          (order.card && ((order.card.issuer_name || "Tarjeta") + " terminada en " + (order.card.last_digits || ""))) ||
          (card && ((card.issuer_name || "Tarjeta") + " terminada en " + (card.last_digits || ""))) ||
          "Pago confirmado";
        const dataForMail: any = {
          email: order.customerEmail || cart.customerEmail,
          nombre: order.customerName || cart.customerName,
          numeroPedido: String(order._id),
          tarjeta: tarjetaStr,
          envio: Boolean(order.shipping ?? cart.shipping),
          direccion: order.customerAddress || cart.customerAddress,
          codigoPostal: order.customerPostalCode || cart.customerPostalCode,
          productos,
          subtotal,
          descuentos: 0,
          costoEnvio: 0,
          total: cart.totalAmount,
          sucursalRetiro: " Villafañe 75, Perico, Jujuy, Argentina"
        };
        await enviarEmail("pago_aprobado", dataForMail);
      } catch (e) {
        console.error("Error enviando email pago aprobado (webhook):", e);
      }
    }
    if (status === "REJECTED") {
      newStatus = "PAYMENT_FAILED";
      const productos = cart.items.map((it: any) => ({
        nombre: it.name,
        imagen: it.image || "",
        cantidad: it.quantity as any,
        precio: it.price
      }));
      const subtotal = cart.items.reduce((acc: number, it: any) => acc + it.price * it.quantity, 0);
      const tarjetaStr =
        (order.card && ((order.card.issuer_name || "Tarjeta") + " terminada en " + (order.card.last_digits || ""))) ||
        (card && ((card.issuer_name || "Tarjeta") + " terminada en " + (card.last_digits || ""))) ||
        "Pago Rechazado";
      const dataForMail: any = {
        email: order.customerEmail || cart.customerEmail,
        nombre: order.customerName || cart.customerName,
        numeroPedido: String(order._id),
        tarjeta: tarjetaStr,
        envio: Boolean(order.shipping ?? cart.shipping),
        direccion: order.customerAddress || cart.customerAddress,
        codigoPostal: order.customerPostalCode || cart.customerPostalCode,
        productos,
        subtotal,
        descuentos: 0,
        costoEnvio: 0,
        total: cart.totalAmount,
        sucursalRetiro: ""
      };
      await enviarEmail("pago_rechazado", dataForMail);
    }

    // Actualizar order final
    order.status = newStatus;
    order.paymentStatus = status;
    order.updatedAt = getArgentinaDate();
    await order.save();

    return NextResponse.json({ received: true, status: newStatus });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Webhook endpoint OK",
  });
}
