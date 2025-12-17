import { NextResponse } from "next/server"
import connectDB from "@/lib/database"
import Product from "@/lib/models/product"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import dolarReference from "@/lib/models/dolarReference"
import { rateLimit } from "@/lib/rate-limits"

export async function GET(req: Request) {
  try {

    const ip = getClientIp(req)

    if (rateLimit(ip)) {
      return Response.json(
        { error: "Too many requests, slow down." },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, Number(searchParams.get("page") ?? 1))
    const limit = 12//Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 12)))
    const rawQ = searchParams.get("q") ?? ""
    const q = decodeURIComponent(rawQ).trim()
    const category = (searchParams.get("category") ?? "").trim()
    const id = (searchParams.get("id") ?? "").trim()
    const priceFilter = (searchParams.get("priceFilter") ?? "").trim()
    const stockFilter = (searchParams.get("filter") ?? "").trim()

    await connectDB()
    const dolar = await dolarReference.findOne({}).lean()

    const filter: any = q
      ? {
        $or: [{ name: { $regex: q, $options: "i" } }, { category: { $regex: q, $options: "i" } }],
      }
      : {}

    if (category) filter.category = category.toUpperCase();

    if (id) filter._id = { $ne: id }


    // Stock/discount filters
    if (stockFilter === "inStock") {
      filter.stock = { $gt: 0 }
    } else if (stockFilter === "outOfStock") {
      filter.stock = 0
    } else if (stockFilter === "discounted") {
      filter.salePrice = { $ne: 0 }
      filter.$expr = { $lt: ["$salePrice", "$price"] }
    } else if (stockFilter === "lowStock") {
      filter.stock = { $gte: 1, $lt: 3 }
    }

    const total = await Product.countDocuments(filter)

    let sort: Record<string, 1 | -1> = { createdAt: -1, _id: -1 }

    if (priceFilter === "low-to-high") {
      sort = { price: 1, _id: -1 }
    } else if (priceFilter === "high-to-low") {
      sort = { price: -1, _id: -1 }
    }

    const rawItems = await Product.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    // normalize image (now stored as array) and include colors if present
    const dolarPrice = Number((dolar as any)?.price) || 1
    const items = rawItems.map((p: any) => {
      const isUSD = p.currency === "USD"
      const price = isUSD ? p.price * dolarPrice : p.price
      const salePrice = p.salePrice && p.salePrice > 0 ? (isUSD ? p.salePrice * dolarPrice : p.salePrice) : null
      return {
        ...p,
        id: p._id.toString(),
        price,
        salePrice,
        currency: p.currency || "ARS",
      }
    })

    const [inStock, outOfStock, discounted] = await Promise.all([
      Product.countDocuments({ stock: { $gt: 0 } }),
      Product.countDocuments({ stock: 0 }),
      Product.countDocuments({ salePrice: { $ne: 0 }, $expr: { $lt: ["$salePrice", "$price"] } }),
    ])

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      summary: { inStock, outOfStock, discounted },
    })
  } catch {
    return NextResponse.json({ error: "Error al obtener productos" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== "admin")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const product = await request.json()
    if (
      !product.name ||
      !product.price?.toString() ||
      Number(product.price) < 0 ||
      !product.category ||
      product.stock < 0 ||
      !product.description
    ) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }

    // validate images array: must be an array with at least one non-empty URL
    const imgs = Array.isArray(product.image) ? product.image.map((s: any) => String(s || "").trim()).filter(Boolean) : []
    if (imgs.length === 0) {
      return NextResponse.json({ error: "Debe incluir al menos una URL de imagen" }, { status: 400 })
    }

    await connectDB()

    const imgsToSave = imgs
    const colorsToSave = Array.isArray(product.colors) ? product.colors.map((s: any) => String(s || "").trim()).filter(Boolean) : []
    const featuresToSave = Array.isArray(product.features) ? product.features.map((s: any) => String(s || "").trim()).filter(Boolean) : []

    const newProduct = new Product({
      ...product,
      image: imgsToSave,
      colors: colorsToSave,
      features: featuresToSave,
      stock: product.stock || 0,
      salePrice: Number(product.salePrice) || 0,
      price: Number(product.price),
      currency: product.currency === "USD" ? "USD" : "ARS",
    })

    const savedProduct = await newProduct.save()

    return NextResponse.json(savedProduct, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Error al crear producto" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== "admin")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const product = await request.json()
    const { id, ...updateData } = product

    if (!id) return NextResponse.json({ error: "No se encontro el ID de el producto" }, { status: 404 })

    await connectDB()

    // Normalize image/colors fields if provided in update
    if (updateData.image) {
      updateData.image = Array.isArray(updateData.image)
        ? updateData.image.map((s: any) => String(s || "").trim()).filter(Boolean)
        : updateData.image
          ? [String(updateData.image).trim()]
          : []
    }
    if (updateData.colors) {
      updateData.colors = Array.isArray(updateData.colors)
        ? updateData.colors.map((s: any) => String(s || "").trim()).filter(Boolean)
        : updateData.colors
          ? [String(updateData.colors).trim()]
          : []
    }
    if (updateData.features) {
      updateData.features = Array.isArray(updateData.features)
        ? updateData.features.map((s: any) => String(s || "").trim()).filter(Boolean)
        : updateData.features
          ? [String(updateData.features).trim()]
          : []
    }

    if (updateData.currency) {
      updateData.currency = updateData.currency === "USD" ? "USD" : "ARS"
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })

    if (!updatedProduct) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    return NextResponse.json(updatedProduct, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar producto" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== "admin")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID de producto inválido" }, { status: 400 })
    }

    await connectDB()

    const result = await Product.findByIdAndDelete(id)

    if (!result) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ message: "Producto eliminado correctamente" }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: "Error al eliminar producto" }, { status: 500 })
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