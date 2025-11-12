import { NextResponse } from "next/server";
import Order from "@/lib/models/order";
import Product from "@/lib/models/product";
import connectDB from "@/lib/database";

// Función helper para obtener fecha en hora de Argentina (UTC-3)
function getArgentinaDate() {
  const now = new Date();
  // Argentina está a UTC-3, restamos 3 horas del UTC
  const argentinaOffset = -3 * 60; // -3 horas en minutos
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const argentinaTime = new Date(utcTime + (argentinaOffset * 60000));
  return argentinaTime;
}
export async function POST(req: Request) {
  try {
    await connectDB();

    const webhookData = await req.json();
    console.log('Webhook recibido:', JSON.stringify(webhookData, null, 2));

    const { data } = webhookData;

    if (!data || data.type !== "Payment") {
      console.log('Tipo de webhook no soportado:', data?.type);
      return NextResponse.json({ 
        received: true, 
        message: 'Webhook type not supported' 
      });
    }

    const { order, payment } = data;

    if (!order || !order.uuid) {
      console.error('Datos de orden inválidos en webhook');
      return NextResponse.json({ 
        error: 'Invalid order data' 
      }, { status: 400 });
    }

    // Buscar la orden por el UUID de Viumi
    const existingOrder = await Order.findOne({ viumiOrderId: order.uuid });

    if (!existingOrder) {
      console.error('Orden no encontrada:', order.uuid);
      return NextResponse.json({ 
        error: 'Order not found' 
      }, { status: 404 });
    }

    console.log('Orden encontrada:', existingOrder._id);

    // Actualizar el estado de la orden según el webhook
    let newStatus: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" | "CANCELLED" = "PROCESSING";

    if (order.status === "SUCCESS" && payment?.status === "APPROVED") {
      newStatus = "SUCCESS";
      
      // Reducir el stock de los productos
      console.log('Reduciendo stock de productos...');
      for (const item of existingOrder.items) {
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: -item.quantity } }
        );
      }
      console.log('Stock actualizado');
    } else if (order.status === "FAILED" || payment?.status === "REJECTED") {
      newStatus = "FAILED";
    } else if (order.status === "CANCELLED") {
      newStatus = "CANCELLED";
    }

    // Actualizar la orden con los datos del pago y fecha de Argentina
    await Order.findByIdAndUpdate(existingOrder._id, {
      status: newStatus,
      paymentId: payment?.id,
      authorizationCode: payment?.authorizationCode,
      refNumber: payment?.refNumber,
      paymentStatus: payment?.status,
      updatedAt: getArgentinaDate()
    });

    console.log(`Orden ${existingOrder._id} actualizada a estado: ${newStatus}`);

    return NextResponse.json({ 
      received: true,
      orderId: existingOrder._id,
      status: newStatus
    });

  } catch (error) {
    console.error('Error procesando webhook:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    message: 'Webhook endpoint is active' 
  });
}