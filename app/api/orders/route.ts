import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/database"
import Order from "@/lib/models/order"
import Product from "@/lib/models/product"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

import type { PipelineStage } from "mongoose"; // 👈 importante

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");
    const status = searchParams.get("status");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const baseMatch: Record<string, any> = {};
    if (phone) baseMatch.customerPhone = { $regex: phone, $options: "i" };
    if (status && status !== "Todos") baseMatch.status = status;

    // Si NO hay fechas, podés usar find normal
    if (!dateFrom || !dateTo) {
      const orders = await Order.find(baseMatch).sort({ createdAt: -1 }).lean();
      return NextResponse.json(orders);
    }

    const from = new Date(dateFrom);
    const to = new Date(dateTo);
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
    console.log("Fetched orders with aggregation pipeline:", orders);
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
    const { customerName, customerPhone, products } = body

    if (!customerName || !customerPhone || !products || products.length === 0) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }

    for (const product of products) {
      const existingProduct = await Product.findOne({ name: product.name })
      if (!existingProduct) {
        return NextResponse.json({ error: `Producto "${product.name}" no encontrado` }, { status: 400 })
      }
      if (existingProduct.stock < product.quantity) {
        return NextResponse.json({ error: `Stock insuficiente para "${product.name}"` }, { status: 400 })
      }
    }

    // Generate unique order ID
    const orderId = `#68b${Math.random().toString(36).substr(2, 9)}${Date.now().toString(36)}`

    // Calculate total
    const total = products.reduce((sum: number, product: any) => sum + product.price * product.quantity, 0)

    const newOrder = new Order({
      orderId,
      customerName,
      customerPhone,
      products,
      total,
    })

    const savedOrder = await newOrder.save()

    for (const product of products) {
      await Product.findOneAndUpdate({ name: product.name }, { $inc: { stock: -product.quantity } })
    }

    return NextResponse.json(savedOrder, { status: 201 })
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
    const { orderId, status } = body

    if (!orderId || !status) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }

    const updatedOrder = await Order.findOneAndUpdate({ orderId }, { status }, { new: true, runValidators: true })

    if (!updatedOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error("Error updating order:", error)
    return NextResponse.json({ error: "Error updating order" }, { status: 500 })
  }
}
