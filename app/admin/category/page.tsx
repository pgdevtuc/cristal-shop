"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Trash2, Edit, Plus, X, ImagePlus, FolderOpen, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { AdminHeader } from "@/components/admin/AdminHeader"
import Image from "next/image"

type Category = { id: string; name: string; image?: string }

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [image, setImage] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [refreshToken, setRefreshToken] = useState(0)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [refreshToken])

  async function fetchCategories() {
    setLoading(true)
    try {
      const res = await fetch("/api/categories")
      const data = await res.json()
      setCategories(data.categories || [])
    } catch (e) {
      console.error(e)
      toast.error("Error al cargar categorías")
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault()
    const trimmed = String(name || "").trim()
    if (!trimmed) {
      toast.error("El nombre es requerido")
      return
    }
    setSaving(true)
    try {
      const method = editingId ? "PUT" : "POST"
      const body = editingId
        ? { id: editingId, name: trimmed, image: String(image || "").trim() }
        : { name: trimmed, image: String(image || "").trim() }
      const res = await fetch("/api/categories", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Error al guardar categoría")
      } else {
        toast.success(editingId ? "Categoría actualizada" : "Categoría creada")
        resetForm()
        setRefreshToken((s) => s + 1)
      }
    } catch (e) {
      console.error(e)
      toast.error("Error al guardar categoría")
    } finally {
      setSaving(false)
    }
  }

  function resetForm() {
    setName("")
    setImage("")
    setEditingId(null)
    setShowForm(false)
  }

  function handleEdit(cat: Category) {
    setEditingId(cat.id)
    setName(cat.name)
    setImage(cat.image || "")
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar categoría? Esta acción no modificará productos existentes.")) return
    try {
      const res = await fetch(`/api/categories?id=${encodeURIComponent(id)}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Error al eliminar")
      } else {
        toast.success("Categoría eliminada")
        setRefreshToken((s) => s + 1)
      }
    } catch (e) {
      console.error(e)
      toast.error("Error al eliminar categoría")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AdminHeader />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Categorías</h1>
            <p className="text-gray-500">Administra las categorías de tu tienda</p>
          </div>
          {!showForm && (
            <Button
              onClick={() => setShowForm(true)}
              className="bg-red-600 hover:bg-red-700 text-white gap-2 shadow-lg shadow-red-600/20"
            >
              <Plus className="h-4 w-4" />
              Nueva Categoría
            </Button>
          )}
        </div>

        {/* Form Card */}
        {showForm && (
          <Card className="mb-8 border-0 shadow-xl bg-white overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-4">
              <h2 className="text-lg font-semibold text-white">{editingId ? "Editar Categoría" : "Nueva Categoría"}</h2>
            </div>
            <CardContent className="p-6">
              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Preview */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-full aspect-video rounded-xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-200 flex items-center justify-center relative">
                      {image ? (
                        <Image
                          src={image || "/placeholder.svg"}
                          alt="Preview"
                          fill
                          className="object-cover"
                          onError={() => setImage("")}
                        />
                      ) : (
                        <div className="text-center p-4">
                          <ImagePlus className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-400">Vista previa de imagen</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Inputs */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la categoría</label>
                      <Input
                        placeholder="Ej: Electrónica, Ropa, Accesorios..."
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-12 text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">URL de la imagen</label>
                      <Input
                        placeholder="https://ejemplo.com/imagen.jpg"
                        value={image}
                        type="url"
                        onChange={(e) => setImage(e.target.value)}
                        className="h-12 text-base"
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button
                        type="submit"
                        disabled={saving}
                        className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Guardando...
                          </>
                        ) : editingId ? (
                          "Actualizar Categoría"
                        ) : (
                          "Crear Categoría"
                        )}
                      </Button>
                      <Button type="button" variant="outline" onClick={resetForm} className="h-12 px-6 bg-transparent">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Categories Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-red-600" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
              <FolderOpen className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No hay categorías</h3>
            <p className="text-gray-500 mb-4">Comienza creando tu primera categoría</p>
            {!showForm && (
              <Button onClick={() => setShowForm(true)} className="bg-red-600 hover:bg-red-700 text-white gap-2">
                <Plus className="h-4 w-4" />
                Crear Categoría
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <Card
                key={cat.id}
                className="group border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden bg-white"
              >
                {/* Image */}
                <div className="aspect-video relative bg-gradient-to-br from-gray-100 to-gray-50 overflow-hidden">
                  {cat.image ? (
                    <Image
                      src={cat.image || "/placeholder.svg"}
                      alt={cat.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FolderOpen className="h-16 w-16 text-gray-200" />
                    </div>
                  )}
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleEdit(cat)}
                      className="bg-white hover:bg-gray-100 shadow-lg"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(cat.id)} className="shadow-lg">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Eliminar
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 text-lg truncate">{cat.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{cat.image ? "Con imagen" : "Sin imagen"}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Stats */}
        {categories.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              {categories.length} {categories.length === 1 ? "categoría" : "categorías"} en total
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
