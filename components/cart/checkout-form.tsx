"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Package, CreditCard } from "lucide-react"
import { toast } from "sonner"
import { formatPrice } from "@/lib/formatPrice"

interface CheckoutFormProps {
  items: Array<{
    id: string
    name: string
    price: number
    image: string
    quantity: number
  }>
  totalPrice: number
  onBack: () => void
  onClose: () => void
  onCheckout: (data: any) => Promise<{ success: boolean; data?: any; error?: string; checkoutUrl?: string }>
  isProcessing: boolean
}

export function CheckoutForm({ 
  items, 
  totalPrice, 
  onBack, 
  onClose, 
  onCheckout, 
  isProcessing 
}: CheckoutFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.warning("El nombre es obligatorio", { 
        position: 'top-right', 
      })
      return
    }

    // Llamar a la función de checkout
    const result = await onCheckout({
      name: formData.name,
      address: formData.address,
    })

    // Si es exitoso, el redirect se maneja en cart-drawer
    // No necesitamos hacer nada más aquí
  }

  const finalTotal = totalPrice

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center space-x-3 pb-4 border-b">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBack}
          disabled={isProcessing}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h3 className="font-semibold text-gray-900">Finalizar Pedido</h3>
          <p className="text-sm text-gray-600">Completa tus datos</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4">
        {/* Datos del cliente */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Datos del Cliente</h4>

          <div>
            <Label htmlFor="name">Nombre Completo *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Tu nombre completo"
              required
              disabled={isProcessing}
            />
          </div>
        </div>

        {/* Resumen del pedido */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-gray-900 flex items-center">
            <Package className="h-4 w-4 mr-2" />
            Resumen del Pedido
          </h4>

          <div className="space-y-2 text-sm">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span className="text-gray-600">
                  {item.name} x{item.quantity}
                </span>
                <span className="font-medium">${formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}

            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">${formatPrice(totalPrice)}</span>
            </div>

            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Total:</span>
              <span>${formatPrice(finalTotal)}</span>
            </div>
          </div>
        </div>
      </form>

      {/* Footer con botón */}
      <div className="border-t pt-4 mb-5">
        <Button
          type="submit"
          onClick={handleSubmit}
          disabled={isProcessing}
          className="w-full bg-emerald-600 hover:bg-emerald-700"
        >
          {isProcessing ? (
            "Procesando..."
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Finalizar Pedido (${formatPrice(finalTotal)})
            </>
          )}
        </Button>
      </div>
    </div>
  )
}