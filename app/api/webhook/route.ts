import { NextResponse } from "next/server";
import Order from "@/lib/models/order";
import Product from "@/lib/models/product";
import connectDB from "@/lib/database";
import { verifySignature } from "@/lib/modo-signature";

// Obtener el body RAW (obligatorio para firmas JWS)
export const runtime = "nodejs"; // Importante para Next.js

function getArgentinaDate() {
  const date = new Date();
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  return new Date(utc - 3 * 60 * 60 * 1000);
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const rawBody = await req.text(); // ← RAW BODY
    const body = JSON.parse(rawBody);

    // ❗ Firma primero, antes de modificar body
    const isValid = await verifySignature(body);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    const { external_intention_id, status } = body;

    if (!external_intention_id) {
      return NextResponse.json(
        { error: "Missing external_intention_id" },
        { status: 400 }
      );
    }

    const order = await Order.findById(external_intention_id);

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Evitar doble procesamiento
    if (order.status === "SUCCESS") {
      return NextResponse.json({ received: true });
    }

    let newStatus: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" | "CANCELLED" =
      "PROCESSING";

    if (status === "ACCEPTED") {
      newStatus = "SUCCESS";

      // Reducir stock solo una vez
      if (!order.stockUpdated) {
        for (const item of order.items) {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { stock: -item.quantity },
          });
        }

        await Order.findByIdAndUpdate(order._id, { stockUpdated: true });
      }
    } else if (status === "REJECTED") {
      newStatus = "FAILED";
    }

    await Order.findByIdAndUpdate(order._id, {
      status: newStatus,
      paymentStatus: status,
      updatedAt: getArgentinaDate(),
    });

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
