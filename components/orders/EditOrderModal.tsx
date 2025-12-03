"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, Search } from "lucide-react"
import { toast } from "sonner"
import { Product } from "@/lib/types"
import Image from "next/image"
import { IOrder } from "@/types/order"

interface OrderProduct {
  productId: string
  name: string
  quantity: number
  price: number
  image?: string
}

interface EditOrderModalProps {
  isOpen: boolean
  onClose: () => void
  order: IOrder
  onOrderUpdated: () => void
}

export default function EditOrderModal({ isOpen, onClose, order, onOrderUpdated }: EditOrderModalProps) {
  const [products, setProducts] = useState<OrderProduct[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [selectedQuantity, setSelectedQuantity] = useState(1)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const [customerName, setCustomerName] = useState(order.customerName)
  const [customerPhone, setCustomerPhone] = useState(order.customerPhone)
  const [shipping, setShipping] = useState(Boolean(order.shipping))
  const [customerAddress, setCustomerAddress] = useState(order.customerAddress || "")

  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  // Initialize form from order when opening
  useEffect(() => {
    if (isOpen && order) {
      setProducts(
        (order.items || []).map((it) => ({
          productId: it.productId,
          name: it.name,
          quantity: it.quantity,
          price: it.price,
          image: it.image,
        }))
      )
      setCustomerName(order.customerName)
      setCustomerPhone(order.customerPhone)
      setShipping(Boolean(order.shipping))
      setCustomerAddress(order.customerAddress || "")
      setSearchTerm("")
      setSearchResults([])
      setSelectedProduct(null)
      setSelectedQuantity(1)
    }
  }, [isOpen, order])

  // Debounced search like CreateOrderModal
  useEffect(() => {
    const delayed = setTimeout(() => {
      if (searchTerm.trim()) {
        searchProducts(searchTerm)
      } else {
        setSearchResults([])
      }
    }, 1500)
    return () => clearTimeout(delayed)
  }, [searchTerm])

  const searchProducts = async (term: string) => {
    setIsSearching(true)
    try {
      const response = await fetch(`/api/products?page=1&limit=14&q=${encodeURIComponent(term)}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.items || [])
      }
    } catch (error) {
      console.error("Error searching products:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const addProductToOrder = (product?: Product) => {
    const productToAdd = product || selectedProduct

    if (!productToAdd) {
      toast.error("Por favor selecciona un producto primero", { position: "top-center", style: { color: "red" }, duration: 3000 })
      return
    }

    const existingIndex = products.findIndex((p) => p.productId === productToAdd.id)
    if (existingIndex >= 0) {
      const updated = [...products]
      const newQuantity = updated[existingIndex].quantity + selectedQuantity
      updated[existingIndex].quantity = newQuantity
      // precio se mantiene (el backend recalcula)
      setProducts(updated)
    } else {
      const orderProduct: OrderProduct = {
        productId: productToAdd.id,
        name: productToAdd.name,
        quantity: selectedQuantity,
        price: productToAdd.salePrice || productToAdd.price,
        image: productToAdd.image || "/placeholder.jpg",
      }
      setProducts([...products, orderProduct])
    }

    setSearchTerm("")
    setSearchResults([])
    setSelectedProduct(null)
    setSelectedQuantity(1)
  }

  const removeProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index))
  }

  const updateProductQty = (index: number, qty: number) => {
    if (qty < 1) qty = 1
    const updated = [...products]
    updated[index].quantity = qty
    setProducts(updated)
  }

  const calculateTotal = () => {
    return products.reduce((sum, p) => sum + p.price * p.quantity, 0)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const selectProduct = (product: Product) => {
    setSelectedProduct(product)
    setSearchTerm(product.name)
    setSearchResults([])
  }

  const handleSubmit = async () => {
    if (!customerName || !customerPhone || products.length === 0 || (shipping && !customerAddress.trim())) {
      toast.error("Por favor completa todos los campos requeridos", { position: "top-center", style: { color: "red" }, duration: 3000 })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order._id,
          customerName,
          customerPhone,
          shipping,
          customerAddress: shipping ? customerAddress : undefined,
          items: products.map(({ productId, name, quantity, price }) => ({ productId, name, quantity, price })),
        }),
      })

      if (response.ok) {
        toast.success("Orden actualizada", { position: "top-center", style: { color: "green" }, duration: 3000 })
        onOrderUpdated()
        onClose()
      } else {
        const { error } = await response.json().catch(() => ({ error: "Error updating order" }))
        throw new Error(error || "Error updating order")
      }
    } catch (error: any) {
      toast.error(error?.message || "Error al actualizar la orden", { position: "top-center", style: { color: "red" }, duration: 3000 })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Orden #{order.orderNumber}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Información del Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer-name">Nombre</Label>
                <Input id="customer-name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="customer-phone">Teléfono</Label>
                <Input id="customer-phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="shipping" checked={shipping} onCheckedChange={(val) => setShipping(Boolean(val))} />
                <Label htmlFor="shipping">¿Con envío?</Label>
              </div>
              <div>
                {shipping && (
                  <div>
                    <Label htmlFor="customer-address">Dirección</Label>
                    <Input
                      id="customer-address"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="Dirección de envío"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Add Product Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Productos</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="relative">
                <Label htmlFor="product-search">Agregar producto</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="product-search"
                    placeholder="Buscar producto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map((product) => (
                      <div
                        key={product.id}
                        className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                        onClick={() => selectProduct(product)}
                      >
                        <div className="flex items-start gap-3">
                          <Image
                            src={product.image || "/placeholder.jpg"}
                            width={48}
                            height={48}
                            alt={product.name}
                            className="h-12 w-12 rounded-md object-cover bg-muted"
                          />
                          <div className="min-w-0">
                            <div className="font-medium truncate">{product.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Precio: {formatCurrency(product.salePrice || product.price)} | Stock: {product.stock}
                            </div>
                            {product.description && (
                              <div className="text-xs text-muted-foreground mt-1">{product.description}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {isSearching && (
                  <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg p-3">
                    <div className="text-sm text-muted-foreground">Buscando productos...</div>
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="quantity">Cantidad</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={selectedQuantity}
                  onChange={(e) => setSelectedQuantity(Number.parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="md:col-span-2">
                <Button
                  onClick={() => addProductToOrder()}
                  disabled={!selectedProduct || selectedQuantity < 1}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  + Agregar a la orden
                </Button>
              </div>
            </div>
          </div>

          {/* Products in Order */}
          {products.length > 0 && (
            <div>
              <div className="space-y-2">
                {products.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <Image
                        src={product.image || "/placeholder.jpg"}
                        width={48}
                        height={48}
                        alt={product.name}
                        className="h-12 w-12 rounded-md object-cover bg-muted"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-medium truncate">{product.name}</span>
                          <div className="text-sm text-muted-foreground">
                            Precio: {formatCurrency(product.price)}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`qty-${index}`}>Cant.</Label>
                            <Input
                              id={`qty-${index}`}
                              type="number"
                              min="1"
                              className="w-24"
                              value={product.quantity}
                              onChange={(e) => updateProductQty(index, Number.parseInt(e.target.value) || 1)}
                            />
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Subtotal: <span className="font-medium">{formatCurrency(product.price * product.quantity)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProduct(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="text-right mt-4">
                <span className="text-xl font-bold">Total: {formatCurrency(calculateTotal())}</span>
              </div>
            </div>
          )}

          {/* Save Button */}
          <Button onClick={handleSubmit} className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
            {isLoading ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
