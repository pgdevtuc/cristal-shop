import { NextResponse } from "next/server";
import connectDB from "@/lib/database";
import Category from "@/lib/models/category";
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

/**
 * Categories API - CRUD
 *
 * GET /api/categories
 *   - Returns list of categories [{ _id, name, createdAt, updatedAt }]
 *
 * POST /api/categories
 *   - Admin only
 *   - Body: { name }
 *   - Creates a category (name must be non-empty and unique)
 *
 * PUT /api/categories
 *   - Admin only
 *   - Body: { id, name }
 *   - Updates category name
 *
 * DELETE /api/categories?id=...
 *   - Admin only
 *   - Deletes category by id
 */

export async function GET() {
  try {
    await connectDB();
    const categories = (await Category.find({}).sort({ name: 1 }).lean().exec()) as any[];
    const normalized = categories.map((c: any) => ({ id: String(c._id), name: c.name, image: c.image || "" }));
    return NextResponse.json({ categories: normalized });
  } catch (e) {
    console.error("Error fetching categories:", e);
    return NextResponse.json({ categories: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const image = String(body.image ?? "").trim();

    if (!name) {
      return NextResponse.json({ error: "Nombre de categoría requerido" }, { status: 400 });
    }

    await connectDB();

    // Prevent duplicates (case-insensitive)
    const exists = await Category.findOne({ name: { $regex: `^${name}$`, $options: "i" } }).lean().exec();
    if (exists) {
      return NextResponse.json({ error: "La categoría ya existe" }, { status: 400 });
    }

    const created = await Category.create({ name, image });
    return NextResponse.json({ id: String(created._id), name: created.name, image: created.image || "" }, { status: 201 });
  } catch (e) {
    console.error("Error creating category:", e);
    return NextResponse.json({ error: "Error creando categoría" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const id = String(body.id ?? "").trim();
    const name = String(body.name ?? "").trim();
    const image = String(body.image ?? "").trim();

    if (!id || !name) {
      return NextResponse.json({ error: "ID y nombre son requeridos" }, { status: 400 });
    }

    await connectDB();

    const exists = await Category.findOne({ _id: { $ne: id }, name: { $regex: `^${name}$`, $options: "i" } }).lean().exec();
    if (exists) {
      return NextResponse.json({ error: "Otra categoría ya usa ese nombre" }, { status: 400 });
    }

    const updated = await Category.findByIdAndUpdate(id, { name, image }, { new: true, runValidators: true }).lean().exec();
    if (!updated) return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });

    return NextResponse.json({ id: String((updated as any)._id), name: (updated as any).name, image: (updated as any).image || "" }, { status: 200 });
  } catch (e) {
    console.error("Error updating category:", e);
    return NextResponse.json({ error: "Error actualizando categoría" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    await connectDB();
    const deleted = await Category.findByIdAndDelete(id).lean().exec();
    if (!deleted) return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });

    return NextResponse.json({ message: "Categoría eliminada" }, { status: 200 });
  } catch (e) {
    console.error("Error deleting category:", e);
    return NextResponse.json({ error: "Error eliminando categoría" }, { status: 500 });
  }
}
