import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/database"
import Order from "@/lib/models/order"
import Product from "@/lib/models/product"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { enviarEmail } from "@/lib/template-mail"

import type { PipelineStage } from "mongoose"; // 👈 importante

// Helper to get Argentina date (UTC-3) as ISO string with offset
function getArgentinaDate() {
  const now = new Date();
  const argentinaTime = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const isoString = argentinaTime.toISOString().slice(0, -1);
  return isoString + "-03:00";
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");
    const status = searchParams.get("status");
    const shipping = searchParams.get("shipping");
    const dateFromStr = searchParams.get("dateFrom");
    const dateToStr = searchParams.get("dateTo");

    const baseMatch: Record<string, any> = {};
    if (phone) {
      baseMatch.$or = [
        { customerPhone: { $regex: phone, $options: "i" } },
        { customerName: { $regex: phone, $options: "i" } },
        { customerEmail: { $regex: phone, $options: "i" } }
      ];
    }
    if (status && status !== "Todos") baseMatch.status = status.toUpperCase();
    if (shipping === "true") baseMatch.shipping = true;
    if (shipping === "false") baseMatch.shipping = false;

    // Si NO hay fechas, podés usar find normal
    if (!dateFromStr || !dateToStr) {
      const orders = await Order.find(baseMatch).sort({ createdAt: -1 }).lean();
      return NextResponse.json(orders);
    }

    const from = new Date(dateFromStr as string);
    const to = new Date(dateToStr as string);
    const tz = "America/Argentina/Buenos_Aires";

    const pipeline: PipelineStage[] = [];

    // 1) match base
    pipeline.push({ $match: baseMatch });

    // 2) match por rango de DÍAS en horario AR
    pipeline.push({
      $match: {
        $expr: {
          $and: [
            {
              $gte: [
                { $dateTrunc: { date: "$createdAt", unit: "day", timezone: tz } },
                { $dateTrunc: { date: from, unit: "day", timezone: tz } },
              ],
            },
            {
              $lt: [
                { $dateTrunc: { date: "$createdAt", unit: "day", timezone: tz } },
                {
                  $dateAdd: {
                    startDate: { $dateTrunc: { date: to, unit: "day", timezone: tz } },
                    unit: "day",
                    amount: 1,
                  },
                },
              ],
            },
          ],
        },
      },
    });

    // 3) sort (usar literal -1)
    pipeline.push({ $sort: { createdAt: -1 as -1 } });
    // Alternativa: pipeline.push({ $sort: { createdAt: -1 } as const });

    const orders = await Order.aggregate(pipeline);

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Error fetching orders" }, { status: 500 });
  }
}



export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    await connectDB()

    const body = await request.json()
    const {
      customerName,
      customerPhone,
      items,
      shipping = false,
      customerAddress,
      status,
    } = body as any

    if (!customerName || !customerPhone || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }
    if (shipping && (!customerAddress || !String(customerAddress).trim())) {
      return NextResponse.json({ error: "La dirección es requerida cuando hay envío" }, { status: 400 })
    }

    // Validate stock and compute totals using DB pricing
    const orderItems: {
      productId: string
      name: string
      price: number
      quantity: number
      image?: string
    }[] = []
    let computedTotal = 0

    for (const item of items) {
      const product = await Product.findById(item.productId)
      if (!product) {
        return NextResponse.json({ error: `Producto no encontrado (id: ${item.productId})` }, { status: 400 })
      }
      const qty = Number(item.quantity) || 0
      if (qty <= 0) {
        return NextResponse.json({ error: `Cantidad inválida para el producto ${product.name}` }, { status: 400 })
      }
      if (product.stock < qty) {
        return NextResponse.json({ error: `Stock insuficiente para "${product.name}"` }, { status: 400 })
      }

      const unitPrice = product.salePrice > 0 ? product.salePrice : product.price
      orderItems.push({
        productId: product._id.toString(),
        name: product.name,
        price: unitPrice,
        quantity: qty,
        image: product.image,
      })
      computedTotal += unitPrice * qty
    }

    // Generate unique order number
    const orderCount = await Order.countDocuments()
    const orderNumber = `ORD-${Date.now()}-${String(orderCount + 1).padStart(5, "0")}`

    const nowAR = getArgentinaDate()

    const newOrder = await Order.create({
      orderNumber,
      customerName,
      customerPhone,
      shipping: Boolean(shipping),
      customerAddress: shipping ? customerAddress : undefined,
      items: orderItems,
      totalAmount: computedTotal,
      status: status ?? "CREATED",
      createdAt: nowAR,
      updatedAt: nowAR,
    })

    // Decrement stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -Number(item.quantity) } })
    }

    return NextResponse.json(newOrder, { status: 201 })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json({ error: "Error creating order" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    await connectDB()

    const body = await request.json()
    const {
      orderId,
      orderNumber,
      status,
      customerName,
      customerPhone,
      shipping,
      customerAddress,
      items,
    } = body as any

    const query = orderId ? { _id: orderId } : orderNumber ? { orderNumber } : null
    if (!query) {
      return NextResponse.json({ error: "Falta orderId u orderNumber" }, { status: 400 })
    }

    // Path 1: solo actualizar estado (comportamiento previo)
    if (!Array.isArray(items)) {
      if (!status) {
        return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
      }

      const updatedOrder = await Order.findOneAndUpdate(
        query,
        { status, updatedAt: getArgentinaDate() },
        { new: true, runValidators: true },
      )

      if (!updatedOrder) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 })
      }

      // Enviar email de pago aprobado si se marcó como PAID
      if (updatedOrder.customerEmail) {
        try {
          const productos = updatedOrder.items.map((it: any) => ({
            nombre: it.name,
            imagen: it.image || "",
            cantidad: it.quantity as any,
            precio: it.price,
          }));
          const subtotal = updatedOrder.items.reduce(
            (acc: number, it: any) => acc + it.price * it.quantity,
            0,
          );
          const tarjetaStr = updatedOrder.card
            ? `${updatedOrder.card.issuer_name || "Tarjeta"} terminada en ${updatedOrder.card.last_digits || ""}`
            : "Pago confirmado";

          const dataForMail: any = {
            email: updatedOrder.customerEmail,
            nombre: updatedOrder.customerName,
            numeroPedido: String(updatedOrder._id),
            tarjeta: tarjetaStr,
            envio: Boolean(updatedOrder.shipping),
            direccion: updatedOrder.customerAddress,
            codigoPostal: updatedOrder.customerPostalCode,
            productos,
            subtotal,
            descuentos: 0,
            costoEnvio: 0,
            total: updatedOrder.totalAmount,
            sucursalRetiro: "Villafañe 75, Perico, Jujuy, Argentina",
          };

          switch (status) {
            case "PREPARING":
              await enviarEmail("pedido_preparacion", dataForMail);
              break;

            case "IN_TRANSIT":
              await enviarEmail("preparado_enviado", dataForMail);
              break;

            case "READY":
              await enviarEmail("preparado_enviado", dataForMail);
              break;

            default:
              break;
          }


        } catch (e) {
          console.error("Error enviando email pago aprobado (PUT orders):", e);
        }
      }

      return NextResponse.json(updatedOrder)
    }

    // Path 2: Edición completa (nombre, teléfono, envío, dirección, productos)
    if (!customerName || !customerPhone || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }
    if (shipping && (!customerAddress || !String(customerAddress).trim())) {
      return NextResponse.json({ error: "La dirección es requerida cuando hay envío" }, { status: 400 })
    }

    const existingOrder = await Order.findOne(query)
    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Cantidades previas por producto
    const prevQty = new Map<string, number>()
    for (const it of existingOrder.items) {
      prevQty.set(String(it.productId), Number(it.quantity) || 0)
    }

    // Validar nuevos items y calcular totales y deltas
    const newIds = new Set<string>()
    const productIds = Array.from(new Set<string>(items.map((it: any) => String(it.productId))))
    const products = await Product.find({ _id: { $in: productIds } })
    const prodMap = new Map<string, any>()
    for (const p of products) prodMap.set(String(p._id), p)

    const orderItems: {
      productId: string
      name: string
      price: number
      quantity: number
      image?: string
    }[] = []
    let computedTotal = 0

    for (const it of items) {
      const id = String(it.productId)
      newIds.add(id)
      const p = prodMap.get(id)
      if (!p) {
        return NextResponse.json({ error: `Producto no encontrado (id: ${id})` }, { status: 400 })
      }
      const qNew = Number(it.quantity) || 0
      if (qNew <= 0) {
        return NextResponse.json({ error: `Cantidad inválida para el producto ${p.name}` }, { status: 400 })
      }
      const qPrev = prevQty.get(id) || 0
      const delta = qNew - qPrev
      if (delta > 0 && p.stock < delta) {
        return NextResponse.json({ error: `Stock insuficiente para "${p.name}". Disponible: ${p.stock}, solicitado extra: ${delta}` }, { status: 400 })
      }

      const unitPrice = p.salePrice > 0 ? p.salePrice : p.price
      orderItems.push({
        productId: String(p._id),
        name: p.name,
        price: unitPrice,
        quantity: qNew,
        image: p.image,
      })
      computedTotal += unitPrice * qNew
    }

    // Aplicar ajustes de stock por delta
    // a) Productos editados/agregados
    for (const it of items) {
      const id = String(it.productId)
      const qNew = Number(it.quantity) || 0
      const qPrev = prevQty.get(id) || 0
      const delta = qNew - qPrev
      if (delta !== 0) {
        await Product.findByIdAndUpdate(id, { $inc: { stock: -delta } })
      }
    }
    // b) Productos removidos
    for (const [id, qPrev] of prevQty.entries()) {
      if (!newIds.has(id) && qPrev > 0) {
        await Product.findByIdAndUpdate(id, { $inc: { stock: qPrev } })
      }
    }

    const nowAR = getArgentinaDate()
    const updated = await Order.findOneAndUpdate(
      query,
      {
        customerName,
        customerPhone,
        shipping: Boolean(shipping),
        customerAddress: shipping ? customerAddress : undefined,
        items: orderItems,
        totalAmount: computedTotal,
        updatedAt: nowAR,
      },
      { new: true, runValidators: true },
    )

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating order:", error)
    return NextResponse.json({ error: "Error updating order" }, { status: 500 })
  }
}
