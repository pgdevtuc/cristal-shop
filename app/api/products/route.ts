import { NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { PutObjectCommand } from "@aws-sdk/client-s3"

import connectDB from "@/lib/database"
import Product from "@/lib/models/product"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import dolarReference from "@/lib/models/dolarReference"
import { rateLimit } from "@/lib/rate-limits"
import { s3, BUCKET } from "@/lib/s3"

const PUBLIC_ENDPOINT = process.env.MINIO_PUBLIC_ENDPOINT || process.env.MINIO_ENDPOINT || ""

const buildPublicUrl = (key: string) => {
  const base = PUBLIC_ENDPOINT.replace(/\/$/, "")
  if (!base) {
    return `/${BUCKET}/${key}`
  }
  return `${base}/${BUCKET}/${key}`
}

const isFile = (value: unknown): value is File => value instanceof File

const normalizeNumber = (value: string | null | undefined, fallback = 0) => {
  if (!value) return fallback
  const normalized = value.replace(/,/g, ".").trim()
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : fallback
}

const uploadImageFiles = async (files: File[]) => {
  const urls: string[] = []
  for (const file of files) {
    if (!file || !file.size) continue

    const arrayBuffer = await file.arrayBuffer()
    const body = Buffer.from(arrayBuffer)
    const extension = file.name?.split?.(".").pop?.()
    const key = `products/${new Date().toISOString().split("T")[0]}/${randomUUID()}${extension ? `.${extension}` : ""}`

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: body,
        ContentType: file.type || "application/octet-stream",
        ACL: "public-read",
      })
    )

    urls.push(buildPublicUrl(key))
  }
  return urls
}

const parseProductFormData = async (formData: FormData) => {
  const name = String(formData.get("name") ?? "").trim()
  const kibooId = String(formData.get("kibooId") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  const category = String(formData.get("category") ?? "").trim()
  const currency = String(formData.get("currency") ?? "ARS").trim()

  const manualImages = formData
    .getAll("manualImages")
    .map((value) => String(value || "").trim())
    .filter(Boolean)

  const colors = formData
    .getAll("colors")
    .map((value) => String(value || "").trim())
    .filter(Boolean)

  const features = formData
    .getAll("features")
    .map((value) => String(value || "").trim())
    .filter(Boolean)

  const imageFiles = formData.getAll("imageFiles").filter(isFile)
  const uploadedUrls = await uploadImageFiles(imageFiles)

  const price = normalizeNumber(String(formData.get("price") ?? ""))
  const salePriceRaw = String(formData.get("salePrice") ?? "").trim()
  const salePrice = salePriceRaw ? normalizeNumber(salePriceRaw, 0) : 0
  const stock = normalizeNumber(String(formData.get("stock") ?? ""), 0)

  const image = [...manualImages, ...uploadedUrls].filter(Boolean)

  return {
    name,
    description,
    category,
    currency,
    price,
    salePrice,
    stock,
    colors,
    features,
    image,
    kibooId
  }
}

const validateProductPayload = (payload: {
  name: string
  description: string
  category: string
  price: number
  stock: number
  image: string[]
}) => {
  if (!payload.name) return "El nombre es requerido"
  if (!payload.description) return "La descripción es requerida"
  if (!payload.category) return "La categoría es requerida"
  if (!Number.isFinite(payload.price) || payload.price < 0) return "El precio es inválido"
  if (!Number.isFinite(payload.stock) || payload.stock < 0) return "El stock es inválido"
  if (!Array.isArray(payload.image) || payload.image.length === 0) return "Debe incluir al menos una imagen"
  return null
}

export async function GET(req: Request) {
  try {
    const ip = getClientIp(req)

    if (rateLimit(ip)) {
      return Response.json(
        { error: "Too many requests, slow down." },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, Number(searchParams.get("page") ?? 1))
    const limit = 12
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

    if (category) filter.category = category.toUpperCase()

    if (id) filter._id = { $ne: id }

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

    const dolarPrice = Number((dolar as any)?.price) || 1

    const items = rawItems.map(({ currency, updatedAt, createdAt, __v, kibooId, ...p }) => {
      const isUSD = currency == "USD"
      const price = isUSD
        ? Math.round((p.price * dolarPrice + Number.EPSILON) * 100) / 100
        : p.price

      const salePrice =
        p.salePrice && p.salePrice > 0
          ? isUSD
            ? Math.round((p.salePrice * dolarPrice + Number.EPSILON) * 100) / 100
            : p.salePrice
          : null
      return {
        ...p,
        id: p._id?.toString(),
        price: price,
        salePrice: salePrice ? parseInt(String(Math.round(salePrice))) : null,
      }
    })

    const rawproductsPromotion = await Product.find({
      salePrice: { $ne: null, $gt: 0 },
      $expr: { $lt: ["$salePrice", "$price"] },
    }).lean();
    const productsPromotion = rawproductsPromotion.map(({ currency, updatedAt, createdAt, __v, kibooId, ...p }) => {
      const isUSD = currency == "USD"
      const price = isUSD
        ? Math.round((p.price * dolarPrice + Number.EPSILON) * 100) / 100
        : p.price

      const salePrice =
        p.salePrice && p.salePrice > 0
          ? isUSD
            ? Math.round((p.salePrice * dolarPrice + Number.EPSILON) * 100) / 100
            : p.salePrice
          : null
      return {
        ...p,
        id: p._id?.toString(),
        price: price,
        salePrice: salePrice ? parseInt(String(Math.round(salePrice))) : null,
      }
    })

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      productsPromotion,
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

    const formData = await request.formData()
    const payload = await parseProductFormData(formData)

    const validationError = validateProductPayload(payload)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    await connectDB()

    const newProduct = new Product({
      ...payload,
      salePrice: Number.isFinite(payload.salePrice) ? payload.salePrice : 0,
      price: Number(payload.price),
      stock: Number(payload.stock) || 0,
      category: payload.category.toUpperCase(),
      currency: payload.currency === "USD" ? "USD" : "ARS",
    })

    const savedProduct = await newProduct.save()

    return NextResponse.json(savedProduct, { status: 201 })
  } catch (error) {
    console.error("Error creating product", error)
    return NextResponse.json({ error: "Error al crear producto" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== "admin")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const formData = await request.formData()
    const id = String(formData.get("id") ?? "").trim()

    if (!id) {
      return NextResponse.json({ error: "No se encontró el ID del producto" }, { status: 400 })
    }

    const payload = await parseProductFormData(formData)

    const validationError = validateProductPayload(payload)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    await connectDB()

    const updateData: Record<string, any> = {
      ...payload,
      salePrice: Number.isFinite(payload.salePrice) ? payload.salePrice : 0,
      price: Number(payload.price),
      stock: Number(payload.stock) || 0,
      category: payload.category.toUpperCase(),
      currency: payload.currency === "USD" ? "USD" : "ARS",
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })

    if (!updatedProduct) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    return NextResponse.json(updatedProduct, { status: 200 })
  } catch (error) {
    console.error("Error updating product", error)
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
  const headers = req.headers

  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    headers.get("x-vercel-forwarded-for") ||
    (req as any).ip ||
    "unknown"
  )
}
