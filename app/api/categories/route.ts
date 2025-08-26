// app/api/categories/route.ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/database";

export async function GET() {
  try {
    const db = await connectDB();

    if (!db) return NextResponse.json({ error: "Error de conexión a la base de datos" }, { status: 500 });
    
    if (db.connection.readyState !== 1) {
      await new Promise((resolve) => {
        db.connection.once('connected', resolve);
      });
    }
    if (!db.connection.db) {
      throw new Error("Base de datos no disponible");
    }

    const col = db.connection.db.collection(process.env.DATABSE_COLECCTION_PROD || "");

    const rows = await col.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();

    const categories = rows
      .map(r => ({ name: String(r._id ?? "").trim(), count: r.count }))
      .filter(c => c.name.length > 0);

    return NextResponse.json({ categories });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ categories: [] }, { status: 200 });
  }
}