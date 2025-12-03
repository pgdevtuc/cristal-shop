"use client"

import type React from "react"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Product } from "@/types/product";
import { formatPrice } from "@/lib/formatPrice";

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
    images: product?.image || [],
    colors: (product as any)?.colors || [],
    features: (product as any)?.features || [],
    stock: product?.stock || "",
  })

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  useEffect(() => {
    // fetch categories for select
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

  const [loading, setLoading] = useState(false)


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.images.length < 1) return toast.error("El producto debe contener al menos 1 imagen", { position: "top-center", style: { color: "red" }, duration: 3000 })
    if (formData.colors && formData.colors.length > 0 && formData.colors.map((s: any) => String(s || "").trim()).filter(Boolean).length < 1) return toast.error("Rellena los colores", { position: "top-center", style: { color: "red" }, duration: 3000 })
    if (formData.features && formData.features.length > 0 && formData.features.map((s: any) => String(s || "").trim()).filter(Boolean).length < 1) return toast.error("Rellena las características", { position: "top-center", style: { color: "red" }, duration: 3000 })
      setLoading(true)

    try {
      // sanitize arrays: only non-empty trimmed strings
      const images = Array.isArray(formData.images) ? formData.images.map((s: any) => String(s || "").trim()).filter(Boolean) : []
      const colors = Array.isArray(formData.colors) ? formData.colors.map((s: any) => String(s || "").trim()).filter(Boolean) : []
      const features = Array.isArray(formData.features) ? formData.features.map((s: any) => String(s || "").trim()).filter(Boolean) : []

      const productData = {
        ...formData,
        image: images,
        colors,
        features,
        salePrice: formData.salePrice ? Number(formData.salePrice.toString()) : null,
        price: Number(formData.price.toString()),
        stock: Number(formData.stock.toString())
      }

      const response = await fetch("/api/products", {
        method: product ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          product ? { ...productData, id: product.id } : productData
        ),
      })

      if (response.ok) {
        toast.success(product ? "Producto actualizado" : "Producto creado", { position: "top-center", style: { color: "green" }, duration: 3000 })
        onSave()
      }
    } catch (error) {
      console.error("Error saving product:", error)
      toast.error("Error al guardar el producto", { position: "top-center", style: { color: "red" }, duration: 3000 })
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
                <Label htmlFor="name">Nombre del Producto</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">Categoría</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  className="bg-white w-full border rounded-md px-2 py-2.5 "
                >
                  <option value="">Seleccionar categoría</option>
                  {categories?.length > 0  && categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price">Precio Regular</Label>
                <Input
                  id="price"
                  type="text"
                  value={formatPrice(formData.price)}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/\./g, '');
                    setFormData({ ...formData, price: numericValue });
                  }}
                  onBlur={(e) => {
                    const numericValue = e.target.value.replace(/\./g, '');
                    if (!isNaN(Number(numericValue))) {
                      setFormData({ ...formData, price: numericValue });
                    }
                  }}
                  placeholder="10.000"
                  required
                />
              </div>
              <div>
                <Label htmlFor="salePrice">Precio de Oferta (Opcional)</Label>
                <Input
                  id="salePrice"
                  type="text"
                  step="0.01"
                  value={formatPrice(formData.salePrice)}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/\./g, '');
                    setFormData({ ...formData, salePrice: numericValue });
                  }}
                  onBlur={(e) => {
                    const numericValue = e.target.value.replace(/\./g, '');
                    if (!isNaN(Number(numericValue))) {
                      setFormData({ ...formData, salePrice: numericValue });
                    }
                  }}
                />
              </div>
              <div>
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  type="text"
                  step="0.01"
                  value={formatPrice(formData.stock)}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/\./g, '');
                    setFormData({ ...formData, stock: numericValue });
                  }}
                  onBlur={(e) => {
                    const numericValue = e.target.value.replace(/\./g, '');
                    if (!isNaN(Number(numericValue))) {
                      setFormData({ ...formData, stock: numericValue });
                    }
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <Label>Imágenes</Label>
              <div className="space-y-2">
                {(formData.images || []).map((img: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      type="url"
                      value={img}
                      onChange={(e) => {
                        const next = [...(formData.images || [])]
                        next[idx] = e.target.value
                        setFormData({ ...formData, images: next })
                      }}
                      placeholder="https://ejemplo.com/imagen.jpg"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        const next = [...(formData.images || [])]
                        next.splice(idx, 1)
                        setFormData({ ...formData, images: next })
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
                    onClick={() => setFormData({ ...formData, images: [...(formData.images || []), ""] })}
                  >
                    Agregar imagen
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Agregá una o más URLs de imágenes (no vacías).</p>
              </div>
            </div>

            <div>
              <Label>Colores (opcional)</Label>
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
              <Label>Características (opcional)</Label>
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
