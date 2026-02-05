import { NextResponse } from "next/server"
import connectDB from "@/lib/database"
import Product from "@/lib/models/product"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

function parseCSV(text: string) {
  const rows: string[][] = []
  let current: string[] = []
  let field = ""
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
      continue
    }

    if (char === ',') {
      current.push(field)
      field = ""
      continue
    }

    if (char === '\r') {
      continue
    }

    if (char === '\n') {
      current.push(field)
      rows.push(current)
      current = []
      field = ""
      continue
    }

    field += char
  }

  if (field !== "" || current.length > 0) {
    current.push(field)
    rows.push(current)
  }

  return rows
}

const normalizeHeader = (value: string) => value.trim().toLowerCase().replace(/\s+/g, "")
const normalizeNumber = (value: string | undefined) => {
  if (!value) return null
  const normalized = value.replace(/,/g, ".").trim()
  if (!normalized) return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) {
    return NextResponse.json({ error: "Se requiere un archivo CSV" }, { status: 400 })
  }

  if (!file.name.toLowerCase().endsWith(".csv")) {
    return NextResponse.json({ error: "Solo se permiten archivos CSV" }, { status: 400 })
  }

  const text = await file.text()
  const rows = parseCSV(text).filter((row) => row.some((cell) => String(cell || "").trim() !== ""))
  if (rows.length < 2) {
    return NextResponse.json({ error: "El archivo no contiene filas válidas" }, { status: 400 })
  }

  const header = rows[0].map((cell) => normalizeHeader(cell))
  const variantIndex = header.findIndex((value) => value === "variantid")
  const kibooIndex = header.findIndex((value) => value === "kibooid")
  const priceIndex = header.findIndex((value) => value === "price")
  const stockIndex = header.findIndex((value) => value === "stock")
  const currencyIndex = header.findIndex((value) => value === "currency")

  if (priceIndex === -1 || stockIndex === -1) {
    return NextResponse.json({ error: "Las columnas price y stock son obligatorias" }, { status: 400 })
  }

  await connectDB()

  const errors: { row: number; reason: string }[] = []
  const validRows: {
    rowNumber: number
    variantId: string
    kibooId: string
    price: number
    stock: number
    currency?: "USD" | "ARS"
  }[] = []
  const skippedRows: { row: number; reason: string }[] = []
  const variantIds = new Set<string>()
  const kibooIds = new Set<string>()

  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i]
    const rowNumber = i + 1
    const variantId = variantIndex !== -1 ? (cells[variantIndex] ?? "").trim() : ""
    const kibooId = kibooIndex !== -1 ? (cells[kibooIndex] ?? "").trim() : ""
    const price = normalizeNumber(cells[priceIndex])
    const stock = normalizeNumber(cells[stockIndex])
    const rawCurrency = currencyIndex !== -1 ? (cells[currencyIndex] ?? "").trim() : ""
    const formattedCurrency =
      rawCurrency.toLowerCase() === "dolar"
        ? "USD"
        : rawCurrency.toLowerCase() === "pesos"
        ? "ARS"
        : rawCurrency
    let currencyValue: "USD" | "ARS" | undefined
    if (formattedCurrency) {
      const upperCurrency = formattedCurrency.toUpperCase()
      if (upperCurrency !== "USD" && upperCurrency !== "ARS") {
        errors.push({ row: rowNumber, reason: "Currency inválida (solo USD/ARS)" })
        continue
      }
      currencyValue = upperCurrency as "USD" | "ARS"
    }

    if (!variantId && !kibooId) {
      errors.push({ row: rowNumber, reason: "Falta variantId o kibooId" })
      continue
    }

    if (price === null) {
      errors.push({ row: rowNumber, reason: "Precio inválido" })
      continue
    }

    if (stock === null) {
      errors.push({ row: rowNumber, reason: "Stock inválido" })
      continue
    }

    validRows.push({ rowNumber, variantId, kibooId, price, stock, currency: currencyValue })
    if (variantId) variantIds.add(variantId)
    if (kibooId) kibooIds.add(kibooId)
  }

  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400 })
  }

  const matchConditions: { [key: string]: any }[] = []
  if (variantIds.size > 0) {
    matchConditions.push({ variantId: { $in: Array.from(variantIds) } })
  }
  if (kibooIds.size > 0) {
    matchConditions.push({ kibooId: { $in: Array.from(kibooIds) } })
  }

  const foundProducts =
    matchConditions.length > 0
      ? await Product.find({ $or: matchConditions }).lean()
      : []

  const variantLookup = new Map<string, typeof foundProducts[0]>()
  const kibooLookup = new Map<string, typeof foundProducts[0]>()
  for (const product of foundProducts) {
    if (product.variantId) {
      variantLookup.set(product.variantId, product)
    }
    if (product.kibooId) {
      kibooLookup.set(product.kibooId, product)
    }
  }

  const bulkOps: any[] = []
  for (const row of validRows) {
    const product =
      (row.variantId && variantLookup.get(row.variantId)) ||
      (row.kibooId && kibooLookup.get(row.kibooId))

    if (!product) {
      skippedRows.push({ row: row.rowNumber, reason: "Producto inexistente" })
      continue
    }

    const updatePayload: Record<string, number | "USD" | "ARS"> = {
      price: row.price,
      stock: row.stock,
    }
    if (row.currency) {
      updatePayload.currency = row.currency
    }

    bulkOps.push({
      updateOne: {
        filter: { _id: product._id },
        update: { $set: updatePayload },
      },
    })
  }

  if (bulkOps.length > 0) {
    await Product.bulkWrite(bulkOps)
  }

  return NextResponse.json({
    updated: bulkOps.length,
    skipped: skippedRows.length,
    skippedRows,
  })
}
