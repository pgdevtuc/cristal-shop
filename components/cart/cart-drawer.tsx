"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useCart } from "@/contexts/cart-context"
import { CartItem } from "./cart-item"
import { CheckoutForm } from "./checkout-form"
import { ShoppingBag, CreditCard } from "lucide-react"
import { toast } from "sonner"

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const [showCheckout, setShowCheckout] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const { items, getTotalPrice } = useCart()

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = getTotalPrice()

  // Cerrar automáticamente si el carrito se vacía
  useEffect(() => {
    if (totalItems === 0 && isOpen) {
      onClose()
    }
  }, [totalItems, isOpen, onClose])

  // Reset checkout state when drawer closes
  const handleClose = () => {
    setShowCheckout(false)
    onClose()
  }

  // Reset checkout state when items change
  useEffect(() => {
    if (totalItems === 0) {
      setShowCheckout(false)
    }
  }, [totalItems])

  // Función para procesar el checkout
  const handleCheckout = async (checkoutData: any) => {
    setIsProcessing(true)
    
    try {
      // Preparar los productos para el backend
      const products = items.map(item => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image
      }))

      // Hacer la petición al backend
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          products,
          customerName: checkoutData.name,
          customerAddress: checkoutData.address || null,
        })
      })

      const result = await response.json()

      if (!response.ok) {
        // Manejar errores de stock u otros errores
        if (result.details && Array.isArray(result.details)) {
          // Mostrar errores específicos de stock
          const errorMessages = result.details.map((err: any) => 
            `${err.name || 'Producto'}: ${err.error}`
          ).join('\n')
          
          toast.error("Error en el checkout", {
            description: errorMessages,
            position: 'top-right',
          })
        } else {
          throw new Error(result.error || 'Error en el checkout')
        }
        return { success: false, error: result.error }
      }

      // Checkout exitoso - Obtener URL de checkout de Viumi
      const checkoutUrl = result.checkout?.data?.attributes?.links?.checkout

      if (checkoutUrl) {
        toast.success("¡Redirigiendo al pago!", {
          description: "Serás redirigido a la página de pago...",
          position: 'top-right',
        })

        // Redirigir después de un breve delay
        setTimeout(() => {
          window.location.href = checkoutUrl
        }, 1500)

        return { success: true, data: result.checkout, checkoutUrl }
      } else {
        throw new Error('No se recibió la URL de checkout')
      }

    } catch (error) {
      console.error('Error en checkout:', error)
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Ocurrió un error al procesar tu pedido",
        position: 'top-right',
      })
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center space-x-2">
            <ShoppingBag className="h-5 w-5" />
            <span>{showCheckout ? "Finalizar Pedido" : `Carrito de Compras (${totalItems})`}</span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full">
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Tu carrito está vacío</p>
                <Button onClick={handleClose} className="mt-4">
                  Continuar Comprando
                </Button>
              </div>
            </div>
          ) : showCheckout ? (
            <CheckoutForm
              items={items}
              totalPrice={totalPrice}
              onBack={() => setShowCheckout(false)}
              onClose={handleClose}
              onCheckout={handleCheckout}
              isProcessing={isProcessing}
            />
          ) : (
            <>
              <div className="flex-1 overflow-y-auto py-4">
                <div className="space-y-4">
                  {items.map((item) => (
                    <CartItem key={item.id} item={item} />
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 space-y-4 mb-5">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total:</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>

                <div className="space-y-2">
                  <Button 
                    className="w-full bg-emerald-600 hover:bg-emerald-700" 
                    onClick={() => setShowCheckout(true)}
                    disabled={isProcessing}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Proceder al Pago
                  </Button>
                  <Button variant="outline" className="w-full" onClick={handleClose}>
                    Continuar Comprando
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}