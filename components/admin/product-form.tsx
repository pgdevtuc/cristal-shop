"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X } from "lucide-react"
import { toast } from "sonner"
import { Product } from "@/types/product"
import { formatPrice } from "@/lib/formatPrice"
import { cn } from "@/lib/utils"

interface ProductFormProps {
  product?: Product | null
  onSave: () => void
  onCancel: () => void
}

export function ProductForm({ product, onSave, onCancel }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price || "",
    salePrice: product?.salePrice || "",
    category: product?.category || "",
    manualImages: product?.image || [],
    colors: (product as any)?.colors || [],
    features: (product as any)?.features || [],
    stock: product?.stock || "",
    currency: (product as any)?.currency || "ARS",
    kibooId: (product as any)?.kibooId || "",
  })

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [imageFiles, setImageFiles] = useState<File[]>([])

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    let mounted = true
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return
        setCategories(data.categories || [])
      })
      .catch(() => {
        /* ignore */
      })
    return () => {
      mounted = false
    }
  }, [])

  const sanitizedManualImages = (formData.manualImages || []).map((value: string) => value.trim()).filter(Boolean)
  const totalImagesCount = sanitizedManualImages.length + imageFiles.length

  const handleFilesSelected = (files: File[]) => {
    if (!files.length) return

    const validImages = files.filter((file) => file.type.startsWith("image/"))
    if (!validImages.length) {
      toast.error("Solo se permiten archivos de imagen", {
        position: "top-center",
        style: { color: "red" },
        duration: 3000,
      })
      return
    }

    setImageFiles((prev) => [...prev, ...validImages])
    toast.success(`Se agregaron ${validImages.length} imagen(es) para subir`, {
      position: "top-center",
      style: { color: "green" },
      duration: 3000,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (totalImagesCount < 1) {
      toast.error("El producto debe contener al menos 1 imagen", {
        position: "top-center",
        style: { color: "red" },
        duration: 3000,
      })
      return
    }

    if (
      formData.colors &&
      formData.colors.length > 0 &&
      formData.colors.map((s: any) => String(s || "").trim()).filter(Boolean).length < 1
    ) {
      toast.error("Rellena los colores", {
        position: "top-center",
        style: { color: "red" },
        duration: 3000,
      })
      return
    }

    if (
      formData.features &&
      formData.features.length > 0 &&
      formData.features.map((s: any) => String(s || "").trim()).filter(Boolean).length < 1
    ) {
      toast.error("Rellena las características", {
        position: "top-center",
        style: { color: "red" },
        duration: 3000,
      })
      return
    }

    setLoading(true)

    try {
      const payload = new FormData()
      payload.append("name", formData.name)
      payload.append("description", formData.description)
      payload.append("price", formData.price.toString())
      payload.append("salePrice", formData.salePrice ? formData.salePrice.toString() : "")
      payload.append("category", formData.category)
      payload.append("stock", formData.stock.toString())
      payload.append("currency", (formData as any).currency === "USD" ? "USD" : "ARS")
      payload.append("kibooId", formData.kibooId)

      sanitizedManualImages.forEach((url) => payload.append("manualImages", url))
      formData.colors.forEach((color: string) => payload.append("colors", color))
      formData.features.forEach((feature: string) => payload.append("features", feature))
      imageFiles.forEach((file) => payload.append("imageFiles", file))

      if (product?.id) {
        payload.append("id", product.id)
      }

      const response = await fetch("/api/products", {
        method: product ? "PUT" : "POST",
        body: payload,
      })
      const data=await response.json();
      await fetch(process.env.NEXT_PUBLIC_URL_WEBHOOK ?? "",{
        headers:{
          "content-type":"application/json"
        },
        method:"POST",
        body:JSON.stringify({
          action:product? "PUT":"POST",
          id: product ? product.id : data?._id
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || "Error al guardar el producto")
      }

      toast.success(product ? "Producto actualizado" : "Producto creado", {
        position: "top-center",
        style: { color: "green" },
        duration: 3000,
      })

      setImageFiles([])
      onSave()
    } catch (error) {
      console.error("Error saving product:", error)
      toast.error("Error al guardar el producto", {
        position: "top-center",
        style: { color: "red" },
        duration: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{product ? "Editar Producto" : "Agregar Nuevo Producto"}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre del Producto *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">Categoría *</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  className="bg-white w-full border rounded-md px-2 py-2.5 "
                >
                  <option value="">Seleccionar categoría</option>
                  {categories?.length > 0 && categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="kibooId">ID Kiboo</Label>
              <Input
                id="kibooId"
                value={formData.kibooId}
                onChange={(e) => setFormData({ ...formData, kibooId: e.target.value })}
                placeholder="Ingresá el ID de Kiboo"
              />
            </div>

            <div>
              <Label htmlFor="description">Descripción *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="price">Precio Regular *</Label>
                <Input
                  id="price"
                  type="text"
                  value={formData.price}
                  onChange={(e) => {
                    let value = e.target.value.replace(/[^\d.,]/g, "")
                    value = value.replace(",", ".")
                    const parts = value.split(".")
                    if (parts.length > 2) {
                      value = parts.slice(0, -1).join("") + "." + parts[parts.length - 1]
                    }
                    setFormData({ ...formData, price: value })
                  }}
                  placeholder="12000"
                  required
                />
              </div>
              <div>
                <Label htmlFor="salePrice">Precio de Oferta</Label>
                <Input
                  id="salePrice"
                  type="text"
                  value={formData.salePrice}
                  onChange={(e) => {
                    let value = e.target.value.replace(/[^\d.,]/g, "")
                    value = value.replace(",", ".")
                    const parts = value.split(".")
                    if (parts.length > 2) {
                      value = parts.slice(0, -1).join("") + "." + parts[parts.length - 1]
                    }
                    setFormData({ ...formData, salePrice: value })
                  }}
                  placeholder="10000"
                />
              </div>
              <div>
                <Label htmlFor="stock">Stock *</Label>
                <Input
                  id="stock"
                  type="text"
                  step="0.01"
                  value={formatPrice(formData.stock)}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/\./g, "")
                    setFormData({ ...formData, stock: numericValue })
                  }}
                  onBlur={(e) => {
                    const numericValue = e.target.value.replace(/\./g, "")
                    if (!isNaN(Number(numericValue))) {
                      setFormData({ ...formData, stock: numericValue })
                    }
                  }}
                  required
                />
              </div>
              <div>
                <Label htmlFor="currency">Moneda</Label>
                <select
                  id="currency"
                  value={(formData as any).currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="bg-white w-full border rounded-md px-2 py-2.5"
                >
                  <option value="ARS">ARS</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>

            <div>
              <Label>Imágenes *</Label>
              <div
                className={cn(
                  "border border-dashed border-gray-300 rounded-md p-4 space-y-3 transition-colors",
                  dragging && "border-primary bg-primary/5"
                )}
                onDragOver={(event) => {
                  event.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault()
                  setDragging(false)
                  const files = Array.from(event.dataTransfer.files || [])
                  if (files.length) {
                    handleFilesSelected(files)
                  }
                }}
              >
                <div className="space-y-2">
                  {(formData.manualImages || []).map((img: string, idx: number) => (
                    <div key={`manual-${idx}`} className="flex items-center gap-2">
                      <Input
                        type="url"
                        value={img}
                        onChange={(e) => {
                          const next = [...(formData.manualImages || [])]
                          next[idx] = e.target.value
                          setFormData({ ...formData, manualImages: next })
                        }}
                        placeholder="https://ejemplo.com/imagen.jpg"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          const next = [...(formData.manualImages || [])]
                          next.splice(idx, 1)
                          setFormData({ ...formData, manualImages: next })
                        }}
                      >
                        Eliminar
                      </Button>
                    </div>
                  ))}

                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setFormData({ ...formData, manualImages: [...(formData.manualImages || []), ""] })}
                    >
                      Agregar URL manualmente
                    </Button>
                  </div>
                </div>

                {imageFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Archivos listos para subir</p>
                    <div className="space-y-1">
                      {imageFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                          <span className="truncate pr-2">{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            className="text-xs"
                            onClick={() => setImageFiles((prev) => prev.filter((_, fileIdx) => fileIdx !== idx))}
                          >
                            Quitar
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                    Seleccionar archivos
                  </Button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={(event) => {
                      const files = event.target.files ? Array.from(event.target.files) : []
                      if (files.length) {
                        handleFilesSelected(files)
                        event.target.value = ""
                      }
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Podés arrastrar imágenes o seleccionarlas desde tu equipo. También podés agregar URLs manualmente.
                  Las imágenes se subirán al guardar el producto.
                </p>
              </div>
            </div>

            <div>
              <Label>Colores </Label>
              <div className="space-y-2">
                {(formData.colors || []).map((c: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={c}
                      onChange={(e) => {
                        const next = [...(formData.colors || [])]
                        next[idx] = e.target.value
                        setFormData({ ...formData, colors: next })
                      }}
                      placeholder="Rojo"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        const next = [...(formData.colors || [])]
                        next.splice(idx, 1)
                        setFormData({ ...formData, colors: next })
                      }}
                    >
                      Eliminar
                    </Button>
                  </div>
                ))}

                <div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFormData({ ...formData, colors: [...(formData.colors || []), ""] })}
                  >
                    Agregar color
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Agregá colores (opcional). Los valores vacíos serán ignorados.</p>
              </div>
            </div>

            <div>
              <Label>Características </Label>
              <div className="space-y-2">
                {(formData.features || []).map((f: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={f}
                      onChange={(e) => {
                        const next = [...(formData.features || [])]
                        next[idx] = e.target.value
                        setFormData({ ...formData, features: next })
                      }}
                      placeholder="Ej: Material, Medida, Incluye..."
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        const next = [...(formData.features || [])]
                        next.splice(idx, 1)
                        setFormData({ ...formData, features: next })
                      }}
                    >
                      Eliminar
                    </Button>
                  </div>
                ))}

                <div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFormData({ ...formData, features: [...(formData.features || []), ""] })}
                  >
                    Agregar característica
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Agregá características (opcional). Los valores vacíos serán ignorados.</p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : product ? "Actualizar" : "Crear Producto"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}