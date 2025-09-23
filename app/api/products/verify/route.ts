import product from "@/lib/models/product";
import { NextResponse } from "next/server";
import connectDB from "@/lib/database";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("productId")

    if (!id) return NextResponse.json({ error: "No se encontro el id del producto" }, { status: 400 })
    try {
        await connectDB();
        const findProduct = await product.findById(id)
        
        if (findProduct) return NextResponse.json({ product: {...findProduct._doc,image:[findProduct.image],id:findProduct._id} }, { status: 200 })
        return NextResponse.json({ message: "No se encontro el producto" }, { status: 400 })

    } catch (error) {
        return NextResponse.error()
    }

}