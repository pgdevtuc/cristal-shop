import product from "@/lib/models/product";
import { NextResponse } from "next/server";
import connectDB from "@/lib/database";
import dolarReference from "@/lib/models/dolarReference";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("productId")

    if (!id) return NextResponse.json({ error: "No se encontro el id del producto" }, { status: 400 })
    try {
        await connectDB();
        const findProduct = await product.findById(id)
        
        if (findProduct) {
            const dolar = await dolarReference.findOne({}).lean()
            const dolarPrice = Number((dolar as any)?.price) || 1
            const doc: any = (findProduct as any)._doc || findProduct
            const isUSD = doc.currency === "USD"
            const price = isUSD ? doc.price * dolarPrice : doc.price
            const salePrice = doc.salePrice && doc.salePrice > 0 ? (isUSD ? doc.salePrice * dolarPrice : doc.salePrice) : null
            const images = Array.isArray(doc.image) ? doc.image : (doc.image ? [doc.image] : [])
            return NextResponse.json({ product: { ...doc, image: images, id: findProduct._id.toString(), price, salePrice, currency: doc.currency || "ARS" } }, { status: 200 })
        }
        return NextResponse.json({ message: "No se encontro el producto" }, { status: 400 })

    } catch (error) {
        return NextResponse.error()
    }

}
