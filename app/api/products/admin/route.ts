import { NextResponse } from "next/server"
import connectDB from "@/lib/database"
import Product from "@/lib/models/product"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import dolarReference from "@/lib/models/dolarReference"
import { rateLimit } from "@/lib/rate-limits"

export async function GET(req: Request) {
    try {

        const { searchParams } = new URL(req.url)
        const page = Math.max(1, Number(searchParams.get("page") ?? 1))
        const limit = 16//Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 12)))
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
            return {
                ...p,
                id: p._id.toString(),
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
