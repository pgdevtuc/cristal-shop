"use client"

import { useEffect, useState } from "react"
import { AdminHeader } from "@/components/admin/AdminHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Pencil, Plus, X } from "lucide-react"
import { toast } from "sonner"

type Blue = { compra: number; venta: number }

type Reference = { id: string; price: number; createdAt: string; updatedAt: string } | null

export default function AdminDolarPage() {
  const [blue, setBlue] = useState<Blue | null>(null)
  const [reference, setReference] = useState<Reference>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [price, setPrice] = useState("")
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch("/api/dolar", { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error")
      setBlue(data.blue)
      setReference(data.reference)
      if (data.reference?.price) setPrice(String(data.reference.price))
    } catch (e) {
      console.error(e)
      toast.error("Error al obtener cotización")
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    const val = Number(price)
    if (!Number.isFinite(val) || val <= 0) {
      toast.error("Ingrese un precio válido")
      return
    }
    setSaving(true)
    try {
      const method = reference ? "PUT" : "POST"
      const body = reference ? { id: reference.id, price: val } : { price: val }
      const res = await fetch("/api/dolar", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error guardando")
      toast.success(reference ? "Valor actualizado" : "Valor creado")
      setReference({ id: data.id, price: data.price, createdAt: data.createdAt, updatedAt: data.updatedAt })
      setEditing(false)
    } catch (e) {
      console.error(e)
      toast.error("No se pudo guardar")
    } finally {
      setSaving(false)
    }
  }

  function resetForm() {
    setEditing(false)
    setPrice(reference ? String(reference.price) : "")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AdminHeader />
      <main className="mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Cotización del dólar</h1>
          <p className="text-gray-500">Consulta el dólar blue y define tu valor de referencia</p>
        </div>

        <div className="grid gap-6">
          {/* Blue card */}
          <Card className="border-0 bg-white overflow-hidden">
            <div className="bg-primary px-6 py-4">
              <h2 className="text-lg font-semibold text-white">Dólar Blue</h2>
            </div>
            <CardContent className="p-6">
              {loading ? (
                <div className="flex items-center gap-2 text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Cargando...</div>
              ) : blue ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Compra</p>
                    <p className="text-2xl font-semibold">${blue.compra.toLocaleString("es-AR")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Venta</p>
                    <p className="text-2xl font-semibold">${blue.venta.toLocaleString("es-AR")}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No se pudo obtener el valor del dólar blue.</p>
              )}
            </CardContent>
          </Card>

          {/* Reference card */}
          <Card className="border-0 bg-white overflow-hidden">
            <div className="bg-primary px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Dólar Usado en Web</h2>
              {!editing && (
                <Button size="sm" variant="secondary" onClick={() => setEditing(true)} className="bg-white hover:bg-gray-100 text-gray-900">
                  {reference ? <><Pencil className="h-4 w-4 mr-1" /> Editar</> : <><Plus className="h-4 w-4 mr-1" /> Agregar</>}
                </Button>
              )}
            </div>
            <CardContent className="p-6">
              {!editing ? (
                reference ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Valor actual</p>
                      <p className="text-3xl font-semibold">${reference.price.toLocaleString("es-AR")}</p>
                    </div>
                    <div className="text-sm text-gray-400">
                      <p>Actualizado: {new Date(reference.updatedAt).toLocaleString("es-AR")}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Aún no hay un valor de referencia. Presiona "Agregar" para crear uno.</p>
                )
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Precio de referencia</label>
                    <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Ej: 1000" className="h-12 text-base" />
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={handleSave} disabled={saving} className="flex-1 h-12 bg-primary text-white">
                      {saving ? (<><Loader2 className="h-4 w-4 animate-spin mr-2" /> Guardando...</>) : (reference ? "Actualizar" : "Crear")}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm} className="h-12 px-6 bg-transparent">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
