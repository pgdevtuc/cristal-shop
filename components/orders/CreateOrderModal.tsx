"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Trash2, Search } from "lucide-react"
import { toast } from "sonner"
import { Product } from "@/lib/types"
import Image from "next/image"


interface OrderProduct {
  productId: string
  name: string
  quantity: number
  price: number
  image?: string
}

interface CreateOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onOrderCreated: () => void
}

export default function CreateOrderModal({ isOpen, onClose, onOrderCreated }: CreateOrderModalProps) {
  const [products, setProducts] = useState<OrderProduct[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [selectedQuantity, setSelectedQuantity] = useState(1)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [shipping, setShipping] = useState(false)
  const [customerAddress, setCustomerAddress] = useState("")
  const [status, setStatus] = useState<
    "CREATED" | "PAYMENT_FAILED" | "PAID" | "PREPARING" | "READY" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED"
  >("CREATED")
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm.trim()) {
        searchProducts(searchTerm)
      } else {
        setSearchResults([])
      }
    }, 1500)

    return () => clearTimeout(delayedSearch)
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
      toast.error("Por favor selecciona un producto primero", {position:"top-center",style:{color:"red"},duration:3000})
      return
    }

    if (selectedQuantity > productToAdd.stock) {
      toast.error(`Stock insuficiente. Solo hay ${productToAdd.stock} unidades disponibles`, {position:"top-center",style:{color:"red"},duration:3000})
      return
    }

    const existingProductIndex = products.findIndex((p) => p.productId === productToAdd.id)

    if (existingProductIndex >= 0) {
      const existingProduct = products[existingProductIndex]
      const newQuantity = existingProduct.quantity + selectedQuantity

      if (newQuantity > productToAdd.stock) {
        toast.error(`Stock insuficiente. Ya tienes ${existingProduct.quantity} unidades. Máximo disponible: ${productToAdd.stock}`, {position:"top-center",style:{color:"red"},duration:3000})
        return
      }

      const updatedProducts = [...products]
      updatedProducts[existingProductIndex].quantity = newQuantity
      setProducts(updatedProducts)
    } else {
      const orderProduct: OrderProduct = {
        productId: productToAdd.id,
        name: productToAdd.name,
        quantity: selectedQuantity,
        price: productToAdd.salePrice || productToAdd.price,
        image: Array.isArray(productToAdd.image)
          ? (productToAdd.image[0] || "/placeholder.jpg")
          : (productToAdd.image || "/placeholder.jpg"),
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

  const calculateTotal = () => {
    return products.reduce((sum, product) => sum + product.price * product.quantity, 0)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleSubmit = async () => {
    if (!customerName || !customerPhone || products.length === 0 || (shipping && !customerAddress.trim())) {
      toast.error("Por favor completa todos los campos requeridos", {position:"top-center",style:{color:"red"},duration:3000})
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName,
          customerPhone,
          shipping,
          customerAddress: shipping ? customerAddress : undefined,
          items: products.map(({ productId, name, quantity, price }) => ({ productId, name, quantity, price })),
          totalAmount: calculateTotal(),
          status,
        }),
      })

      if (response.ok) {
        toast.success("Orden creada exitosamente", { position: "top-center", style: { color: "green" }, duration: 3000 })

        setProducts([])
        setSearchTerm("")
        setSearchResults([])
        setSelectedProduct(null)
        setSelectedQuantity(1)
        setCustomerName("")
        setCustomerPhone("")
        setCustomerAddress("")
        setShipping(false)
        setStatus("CREATED")

        onOrderCreated()
        onClose()
      } else {
        throw new Error("Error creating order")
      }
    } catch (error) {
      toast.error("Error al crear la orden", {position:"top-center",style:{color:"red"},duration:3000})
    } finally {
      setIsLoading(false)
    }
  }

  const selectProduct = (product: Product) => {
    setSelectedProduct(product)
    setSearchTerm(product.name)
    setSearchResults([])
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nueva Orden</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add Product Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Agregar Producto</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="relative">
                <Label htmlFor="product-search">Producto</Label>
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
                            src={Array.isArray(product.image) ? (product.image[0] || "/placeholder.jpg") : (product.image || "/placeholder.jpg")}
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
                  max={selectedProduct?.stock || 999}
                  value={selectedQuantity}
                  onChange={(e) => setSelectedQuantity(Number.parseInt(e.target.value) || 1)}
                />
              </div>
              <div>
                {selectedProduct && (
                  <div className="text-sm">
                    <div className="font-medium text-green-600">{selectedProduct.name}</div>
                    <div className="text-muted-foreground">
                      Precio: {formatCurrency(selectedProduct.salePrice || selectedProduct.price)}
                    </div>
                    <div className="text-muted-foreground">Stock: {selectedProduct.stock}</div>
                  </div>
                )}
              </div>
              <div>
                <Button
                  onClick={() => addProductToOrder()}
                  disabled={!selectedProduct || selectedQuantity < 1}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  + Agregar
                </Button>
              </div>
            </div>
          </div>

          {/* Products in Order */}
          {products.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Productos en la Orden</h3>
              <div className="space-y-2">
                {products.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <Image
                        src={Array.isArray(product.image) ? (product.image[0] || "/placeholder.jpg") : (product.image || "/placeholder.jpg")}
                        width={48}
                        height={48}
                        alt={product.name}
                        className="h-12 w-12 rounded-md object-cover bg-muted"
                      />
                      <div className="min-w-0">
                        <span className="font-medium">{product.name}</span>
                        <div className="text-sm text-muted-foreground">
                          Cantidad: {product.quantity} | Precio: {formatCurrency(product.price)} | Subtotal: {formatCurrency(product.price * product.quantity)}
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

          {/* Customer Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Información del Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer-name">Nombre del Cliente</Label>
                <Input id="customer-name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="customer-phone">Teléfono</Label>
                <Input id="customer-phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="shipping" checked={shipping} onCheckedChange={(val) => setShipping(Boolean(val))} />
                <Label htmlFor="shipping">¿Necesita envío?</Label>
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
              <div>
                <Label>Estado</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CREATED">Creada</SelectItem>
                    <SelectItem value="PAID">Pagada</SelectItem>
                    <SelectItem value="PREPARING">Preparando</SelectItem>
                    <SelectItem value="READY">Listo</SelectItem>
                    <SelectItem value="IN_TRANSIT">En camino</SelectItem>
                    <SelectItem value="DELIVERED">Entregado</SelectItem>
                    <SelectItem value="CANCELLED">Cancelada</SelectItem>
                    <SelectItem value="PAYMENT_FAILED">Pago rechazado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Create Order Button */}
          <Button onClick={handleSubmit} className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
            {isLoading ? "Creando..." : "Crear Orden"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
