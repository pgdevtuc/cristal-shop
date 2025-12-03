import { NextResponse } from "next/server"
import connectDB from "@/lib/database"
import Product from "@/lib/models/product"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { features } from "process"

/**
 * Simple CSV parser that handles quoted fields and commas inside quotes.
 * Returns array of rows, each row is array of cells (strings).
 */
function parseCSV(text: string) {
  const rows: string[][] = []
  let i = 0
  const len = text.length
  let row: string[] = []
  let cur = ""
  let inQuotes = false

  while (i < len) {
    const ch = text[i]

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < len && text[i + 1] === '"') {
          // escaped quote
          cur += '"'
          i += 2
          continue
        } else {
          inQuotes = false
          i++
          continue
        }
      } else {
        cur += ch
        i++
        continue
      }
    } else {
      if (ch === '"') {
        inQuotes = true
        i++
        continue
      }
      if (ch === ",") {
        row.push(cur)
        cur = ""
        i++
        continue
      }
      if (ch === "\r") {
        // ignore, handle with \n
        i++
        continue
      }
      if (ch === "\n") {
        row.push(cur)
        rows.push(row)
        row = []
        cur = ""
        i++
        continue
      }
      cur += ch
      i++
    }
  }

  // push last
  if (cur !== "" || inQuotes || row.length > 0) {
    row.push(cur)
    rows.push(row)
  }

  return rows
}

function normalizeHeader(h: string) {
  const s = h.trim().toLowerCase()
  if (!s) return ""
  if (s.includes("nombre") || s === "name") return "name"
  if (s.includes("descrip") || s === "description") return "description"
  if (s.includes("precio oferta") || s.includes("saleprice") || s.includes("sale price") || s.includes("precio_oferta")) return "salePrice"
  if (s === "precio" || s === "price") return "price"
  if (s.includes("categor") || s === "category") return "category"
  if (s.includes("imagen") || s.includes("url") || s.includes("image")) return "image"
  if (s.includes("stock")) return "stock"
  if (s.includes("Colores") || s.includes("colores") || s.includes("Colors") || s.includes("colors")) return "colors"
  if (s.includes("Caracteristicas") || s.includes("caracteristicas")) return "features"
  return s.replace(/\s+/g, "_")
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url)
    const action = url.searchParams.get("action") || "preview"

    // Preview: expect multipart/form-data with file
    if (action === "preview") {
      const formData = await req.formData()
      const file = formData.get("file") as Blob | null
      if (!file) {
        return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 })
      }
      const text = await file.text()
      const rows = parseCSV(text).filter((r) => r.length > 0 && r.some((c) => String(c || "").trim() !== ""))

      if (rows.length === 0) {
        return NextResponse.json({ items: [] })
      }

      const header = rows[0].map((h) => normalizeHeader(String(h || "")))
      const dataRows = rows.slice(1)

      const items = dataRows.map((r) => {
        const obj: any = {}
        for (let i = 0; i < header.length; i++) {
          const key = header[i]
          if (!key) continue
          obj[key] = r[i] ?? ""
        }
        // map spanish to fields expected by frontend/backend
        return {
          name: obj.name || obj.Nombre || obj.nombre || "",
          description: obj.description || obj.Descripción || obj.descripcion || "",
          price: obj.price || obj.Precio || obj.PRECIO || "",
          category: obj.category || obj.Categoría || obj.categoria || "",
          image: obj.image || obj["url de imagen"] || obj["url_imagen"] || obj["url"] || "",
          salePrice: obj.salePrice || obj["precio oferta"] || obj["precio_oferta"] || "",
          stock: obj.stock || obj.Stock || 0,
          colors:
            obj.colors ||
            obj.colores ||
            obj.Colores ||
            obj.Color ||
            obj.color ||
            "",
          features: obj.features || obj.caracteristicas || obj.Caracteristicas || ""
        }
      })

      return NextResponse.json({ items })
    }

    // action=save -> expect JSON { items: [...] } and authenticated admin
    if (action === "save") {
      const session = await getServerSession(authOptions)
      if (!session || (session.user as any).role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const body = await req.json()
      const items = Array.isArray(body.items) ? body.items : []

      if (items.length === 0) {
        return NextResponse.json({ error: "No hay items para importar" }, { status: 400 })
      }

      await connectDB()

      const toInsert: any[] = []
      const errors: any[] = []

      for (let i = 0; i < items.length; i++) {
        const row = items[i]
        const name = String(row.name || row.Nombre || "").trim()
        const description = String(row.description || row.Descripción || row.descripcion || "").trim()
        const priceRaw = row.price ?? row.Precio ?? ""
        const price = Number(String(priceRaw).replace(",", "."))
        const category = String(row.category || row.Categoría || row.categoria || "").trim()
        const rawImage = row.image ?? row["URL de Imagen"] ?? row["url de imagen"] ?? row.url ?? row.imagen ?? ""
        const image =
          typeof rawImage === "string" && rawImage.trim() !== ""
            ? rawImage
              .split(";")
              .map((c) => c.trim())
              .filter(Boolean)
            : []
        const salePriceRaw = row.salePrice ?? row["precio oferta"] ?? ""
        const salePrice = salePriceRaw !== "" ? Number(String(salePriceRaw).replace(",", ".")) : 0
        const stockRaw = row.stock ?? row.Stock ?? ""
        const stock = stockRaw !== "" ? parseInt(String(stockRaw), 10) || 0 : 0
        const rawColors = row.Colores ?? row.colores ?? row.Color ?? row.color ?? row.colors ?? ""
        const colores =
          typeof rawColors === "string" && rawColors.trim() !== ""
            ? rawColors
              .split(";")
              .map((c) => c.trim())
              .filter(Boolean)
            : []

        const rawFeatures = row.features ?? row.Caracteristicas ?? row.caracteristicas ?? ""
        const features =
          typeof rawFeatures === "string" && rawFeatures.trim() !== ""
            ? rawFeatures
              .split(";")
              .map((c) => c.trim())
              .filter(Boolean)
            : []


        if (!name || !description || !category || !image || Number.isNaN(price)) {
          errors.push({ row: i + 2, reason: "Faltan campos requeridos o precio inválido", data: row })
          continue
        }

        toInsert.push({
          name,
          description,
          category,
          image,
          salePrice: Number(salePrice) || 0,
          stock: Number(stock) || 0,
          price: Number(price),
          colors: colores,
          features
        })
      }

      if (errors.length > 0) {
        return NextResponse.json({ error: "Errores en algunas filas", errors }, { status: 400 })
      }

      if (toInsert.length === 0) {
        return NextResponse.json({ error: "No hay filas válidas para insertar" }, { status: 400 })
      }

      console.log(toInsert)
      // Insert many
      const inserted = await Product.insertMany(toInsert)

      return NextResponse.json({ message: `Importados ${inserted.length} productos.`, insertedCount: inserted.length })
    }

    return NextResponse.json({ error: "Acción desconocida" }, { status: 400 })
  } catch (err) {
    console.error("Error import route:", err)
    return NextResponse.json({ error: "Error processing import" }, { status: 500 })
  }
}
