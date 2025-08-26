import { NextResponse } from "next/server"
import { IProduct } from "@/types/product"
import connectDB from "@/lib/database"
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ObjectId } from "mongodb"


export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, Number(searchParams.get("page") ?? 1))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 12)))
    const q = (searchParams.get("q") ?? "").trim()
    const category = (searchParams.get("category") ?? "").trim()
    const priceFilter = (searchParams.get("priceFilter") ?? "").trim()
    const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined

    const db = await connectDB()
    if (!db) return NextResponse.json({ error: "Error de conexión a la base de datos" }, { status: 500 })
    const col = db.connection.db!.collection(process.env.DATABSE_COLECCTION_PROD || "")

    const filter: any = q
      ? {
        $or: [{ name: { $regex: q, $options: "i" } }, { category: { $regex: q, $options: "i" } }],
      }
      : {}

    if (category) filter.category = category

    if (maxPrice) {
      filter.$or = [

        { salePrice: { $gt: 0, $lte: maxPrice } },

        {
          $and: [{ $or: [{ salePrice: 0 }, { salePrice: { $exists: false } }] }, { price: { $lte: maxPrice } }],
        },
      ]
    }

    const total = await col.countDocuments(filter)

    let sort: Record<string, 1 | -1> = { createdAt: -1, _id: -1 }

    if (priceFilter === "low-to-high") {
      sort = { price: 1, _id: -1 } // Low to high price
    } else if (priceFilter === "high-to-low") {
      sort = { price: -1, _id: -1 } // High to low price
    }

    const rawItems = await col
      .find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray()

    const items = rawItems.map((p) => ({ ...p, id: p._id.toString() }))

    const [inStock, outOfStock, discounted] = await Promise.all([
      col.countDocuments({ stock: { $gt: 0 } }),
      col.countDocuments({ stock: 0 }),
      col.countDocuments({ salesPrice: { $ne: 0 }, $expr: { $lt: ["$salesPrice", "$price"] } }),
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
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "admin")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const product = await request.json()
    if (!product.name || !product.price?.toString() || Number(product.price) < 0 || !product.category || product.stock < 0 || !product.description) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }
    const newProduct = {
      ...product,
      image: product.image || "",
      stock: product.stock || 0,
      salePrice: Number(product.salePrice) || 0,
      price: Number(product.price),
    }
    const db = await connectDB();
    if (!db) {
      return NextResponse.json({ error: "Error de conexión a la base de datos" }, { status: 500 })
    }

    const collection = db.connection.db?.collection<IProduct>(process.env.DATABSE_COLECCTION_PROD || "");
    if (!collection) {
      return NextResponse.json({ error: "Colección no encontrada" }, { status: 500 })
    }

    await collection.insertOne(newProduct);

    return NextResponse.json(newProduct, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Error al crear producto" }, { status: 500 })
  }
}


export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "admin")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const product = await request.json();
    console.log("Producto a actualizar", product)
    const { id, ...updateData } = product;

    if (!id) return NextResponse.json({ error: "No se encontro el ID de el producto" }, { status: 404 });

    const db = await connectDB();
    if (!db) {
      return NextResponse.json({ error: "Error de conexión a la base de datos" }, { status: 500 });
    }

    const collection = db.connection.db?.collection<IProduct>(process.env.DATABSE_COLECCTION_PROD || "");
    if (!collection) {
      return NextResponse.json({ error: "Colección no encontrada" }, { status: 500 });
    }

    const updatedProduct = await collection.findOneAndUpdate(
      { _id: typeof id === "string" && ObjectId.isValid(id) ? new ObjectId(id) : id },
      { $set: updateData },
      { returnDocument: "after" }
    );

    if (!updatedProduct) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar producto" }, { status: 500 });
  }
}


export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "admin")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    console.log("ID recibido:", id);

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID de producto inválido" }, { status: 400 });
    }

    const db = await connectDB();
    if (!db) {
      return NextResponse.json({ error: "Error de conexión a la base de datos" }, { status: 500 });
    }

    const collection = db.connection.db?.collection(process.env.DATABSE_COLECCTION_PROD || "");
    if (!collection) {
      return NextResponse.json({ error: "Colección no encontrada" }, { status: 500 });
    }

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ message: "Producto eliminado correctamente" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Error al eliminar producto" }, { status: 500 });
  }

}

