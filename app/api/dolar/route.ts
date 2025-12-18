import { NextResponse } from "next/server"
import connectDB from "@/lib/database"
import DolarReference from "@/lib/models/dolarReference"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { getDolar } from "@/lib/dolar"

/**
 * Dólar API
 *
 * GET /api/dolar
 *   - Returns: { blue: { compra, venta }, reference: { id, price, createdAt, updatedAt } | null }
 *
 * POST /api/dolar
 *   - Admin only
 *   - Body: { price: number }
 *   - Creates the reference value (or upserts if one exists)
 *
 * PUT /api/dolar
 *   - Admin only
 *   - Body: { id: string, price: number }
 *   - Updates the reference value by id
 */

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const blue = await getDolar()
    await connectDB()
    const ref: any = await DolarReference.findOne({}).sort({ updatedAt: -1 }).lean().exec()

    const reference = ref
      ? {
        id: String(ref._id),
        price: ref.price,
        createdAt: ref.createdAt,
        updatedAt: ref.updatedAt,
      }
      : null

    return NextResponse.json({ blue, reference })
  } catch (e) {
    console.error("Error fetching dolar:", e)
    return NextResponse.json({ error: "Error obteniendo cotización" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const priceNum = Number(body.price)
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      return NextResponse.json({ error: "Precio inválido" }, { status: 400 })
    }

    await connectDB()

    // Upsert single document
    const existing = await DolarReference.findOne({}).lean().exec()
    let saved
    if (existing) {
      saved = await DolarReference.findByIdAndUpdate((existing as any)._id, { price: priceNum }, { new: true }).lean().exec()
    } else {
      saved = await DolarReference.create({ price: priceNum })
    }

    return NextResponse.json(
      {
        id: String((saved as any)._id),
        price: (saved as any).price,
        createdAt: (saved as any).createdAt,
        updatedAt: (saved as any).updatedAt,
      },
      { status: existing ? 200 : 201 }
    )
  } catch (e) {
    console.error("Error creating/updating dolar reference:", e)
    return NextResponse.json({ error: "Error guardando valor" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const id = String(body.id ?? "").trim()
    const priceNum = Number(body.price)
    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 })
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      return NextResponse.json({ error: "Precio inválido" }, { status: 400 })
    }

    await connectDB()
    const updated = await DolarReference.findByIdAndUpdate(id, { price: priceNum }, { new: true }).lean().exec()
    if (!updated) return NextResponse.json({ error: "Valor no encontrado" }, { status: 404 })

    return NextResponse.json({
      id: String((updated as any)._id),
      price: (updated as any).price,
      createdAt: (updated as any).createdAt,
      updatedAt: (updated as any).updatedAt,
    })
  } catch (e) {
    console.error("Error updating dolar reference:", e)
    return NextResponse.json({ error: "Error actualizando valor" }, { status: 500 })
  }
}
