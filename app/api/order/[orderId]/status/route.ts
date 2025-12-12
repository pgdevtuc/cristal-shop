import Order from "@/lib/models/order";
import connectDB from "@/lib/database";
import { NextRequest } from "next/server";
import { rateLimit } from "@/lib/rate-limits";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    await connectDB();

    const ip = getClientIp(req)

    if (rateLimit(ip)) {
      return Response.json(
        { error: "Too many requests, slow down." },
        { status: 429 }
      );
    }

    const { orderId } = await context.params;

    if (!orderId) {
      return Response.json(
        { error: "ID de orden no proporcionado" },
        { status: 400 }
      );
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return Response.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    return Response.json({
      success: true,
      status: order.paymentStatus,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    });
  } catch (error) {
    console.error("Error obteniendo estado de orden:", error);
    return Response.json(
      {
        error: "Error al obtener el estado de la orden",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}

function getClientIp(req: Request): string {
  const headers = req.headers;

  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() || // proxies comunes
    headers.get("x-real-ip") ||                              // Nginx
    headers.get("cf-connecting-ip") ||                       // Cloudflare
    headers.get("x-vercel-forwarded-for") ||                 // Vercel
    (req as any).ip ||                                       // Node.js / Next local
    "unknown"
  );
}
