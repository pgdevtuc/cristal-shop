"use client"

import type React from "react"
import { Suspense, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useCart } from "@/contexts/cart-context"
import { ShopHeader } from "@/components/layout/whatsapp-header"
import { formatPrice } from "@/lib/formatPrice"
import { toast } from "sonner"
import {
    Minus,
    Plus,
    Trash2,
    ShoppingBag,
    ArrowLeft,
    CreditCard,
    ChevronRight,
    Package,
    CheckCircle2,
    Lock,
} from "lucide-react"

export default function CartPage() {
    const router = useRouter()
    const { items, updateQuantity, removeItem, getTotalPrice, clearCart } = useCart()
    const [isProcessing, setIsProcessing] = useState(false)
    const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'shipping'>('pickup')
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        postalCode: "",
    })

    const totalItems = items.length || 0
    const subtotal = getTotalPrice()
    const total = subtotal

    const handleCheckout = async () => {
        if (!formData.name.trim()) {
            toast.error("Por favor ingresa tu nombre")
            return
        }

        if (deliveryMethod === 'shipping') {
            if (!formData.address.trim()) {
                toast.error("Por favor ingresa tu dirección para el envío")
                return
            }
            if (!formData.postalCode.trim()) {
                toast.error("Por favor ingresa tu código postal")
                return
            }
        }

        setIsProcessing(true)

        try {
            const products = items.map((item) => ({
                productId: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image: item.image,
                color: item.color,
            }))

            const response = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    products,
                    customerName: formData.name,
                    customerEmail: formData.email,
                    customerPhone: formData.phone,
                    customerAddress: formData.address,
                    shipping: deliveryMethod === 'shipping',
                    customerPostalCode: formData.postalCode,
                }),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || "Error en el checkout")
            }

            // Guardar datos en localStorage para la página de pago
            if (result.checkout && result.orderId) {
                localStorage.setItem('pendingPayment', JSON.stringify({
                    qrString: result.checkout.qr || '',
                    deeplink: result.checkout.deeplink || '',
                    amount: total,
                    orderId: result.orderId,
                    timestamp: Date.now()
                }))

                // Redirigir a la página de pago
                router.push(`/payment/${result.orderId}`)
                toast.success("Redirigiendo al pago...")
            } else {
                toast.error("Error: No se recibió información de pago")
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error al procesar el pedido")
        } finally {
            setIsProcessing(false)
        }
    }

    if (totalItems === 0) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Suspense fallback={
                    <div className="flex items-center justify-center p-4">
                        <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-primary rounded-full"></div>
                    </div>
                }>
                    <ShopHeader />
                </Suspense>
                <div className="max-w-4xl mx-auto px-4 py-16">
                    <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12 text-center">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShoppingBag className="h-12 w-12 text-gray-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Tu carrito está vacío</h1>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto">
                            Parece que aún no has agregado productos a tu carrito. Explora nuestra tienda y encuentra lo que necesitas.
                        </p>
                        <Link href="/">
                            <Button size="lg" className="bg-red-600 hover:bg-red-700">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Explorar Productos
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <ShopHeader />

            <div className="max-w-7xl mx-auto px-4 py-4">
                <nav className="flex items-center gap-2 text-sm text-gray-500">
                    <Link href="/" className="hover:text-red-600 transition-colors">
                        Inicio
                    </Link>
                    <ChevronRight className="h-4 w-4" />
                    <span className="text-gray-900 font-medium">Carrito de Compras</span>
                </nav>
            </div>

            <div className="max-w-7xl mx-auto px-4 pb-12">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                    Carrito de Compras
                    <span className="text-gray-400 font-normal text-lg ml-2">({totalItems} productos)</span>
                </h1>

                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <div className="p-4 border-b bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <h2 className="font-semibold text-gray-900">Productos en tu carrito</h2>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => clearCart()}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        Vaciar carrito
                                    </Button>
                                </div>
                            </div>

                            <div className="divide-y">
                                {items.map((item) => (
                                    <div key={`${item.id}-${item.color || ""}`} className="p-4 md:p-6">
                                        <div className="flex gap-4">
                                            <div className="relative w-24 h-24 md:w-32 md:h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                <Image
                                                    src={item.image || "/placeholder.svg"}
                                                    alt={item.name}
                                                    fill
                                                    className="object-contain p-2"
                                                />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900 line-clamp-2">{item.name}</h3>
                                                        {item.color && (
                                                            <p className="text-sm text-gray-500 mt-1">
                                                                Color: <span className="font-medium">{item.color}</span>
                                                            </p>
                                                        )}
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                            <span className="text-sm text-green-600">En stock</span>
                                                        </div>
                                                    </div>

                                                    <div className="text-right">
                                                        <p className="text-lg font-bold text-gray-900">
                                                            ${formatPrice(item.price * item.quantity)}
                                                        </p>
                                                        <p className="text-sm text-gray-500">${formatPrice(item.price)} c/u</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between mt-4">
                                                    <div className="flex items-center border rounded-lg">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => { if (item.quantity > 1) updateQuantity(item.id, item.quantity - 1) }}
                                                            className="h-9 w-9 rounded-r-none hover:bg-gray-100"
                                                            disabled={item.quantity == 1}
                                                        >
                                                            <Minus className="h-4 w-4" />
                                                        </Button>
                                                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                            className="h-9 w-9 rounded-l-none hover:bg-gray-100"
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                    </div>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeItem(item.id)}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Eliminar
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Link href="/">
                            <Button variant="outline" className="w-full md:w-auto bg-transparent">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Continuar Comprando
                            </Button>
                        </Link>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-white rounded-xl shadow-sm p-6 mt-16">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                <Package className="h-5 w-5 mr-2" />
                                Resumen del Pedido
                            </h2>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Subtotal ({totalItems} productos)</span>
                                    <span className="font-medium">${formatPrice(subtotal)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Total</span>
                                    <span className="text-red-600">${formatPrice(total)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Método de Entrega</h2>

                            <RadioGroup value={deliveryMethod} onValueChange={(v) => setDeliveryMethod(v as 'pickup' | 'shipping')} className="space-y-3">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="pickup" id="pickup" />
                                    <Label htmlFor="pickup">Retiro en sucursal (gratis en Villafañe 75, Perico, Jujuy, Argentina)</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="shipping" id="shipping" />
                                    <Label htmlFor="shipping">Envío a domicilio (a cotizar luego de la compra)</Label>
                                </div>
                            </RadioGroup>

                            {deliveryMethod === 'shipping' ? (
                                <div className="mt-4 space-y-4">
                                    <div>
                                        <Label htmlFor="address" className="text-gray-700">Dirección</Label>
                                        <Input
                                            id="address"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            placeholder="Tu dirección completa"
                                            disabled={isProcessing}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="postalCode" className="text-gray-700">Código Postal</Label>
                                        <Input
                                            id="postalCode"
                                            value={formData.postalCode}
                                            onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                                            placeholder="Ej: 4600"
                                            disabled={isProcessing}
                                            className="mt-1"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <p className="mt-4 text-sm text-gray-600">
                                    Retirá gratis en nuestra sucursal de <span className="font-medium">Villafañe 75, Perico, Jujuy, Argentina</span>.
                                </p>
                            )}
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                <CreditCard className="h-5 w-5 mr-2" />
                                Datos de Contacto
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="name" className="text-gray-700">
                                        Nombre Completo <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Tu nombre completo"
                                        disabled={isProcessing}
                                        className="mt-1"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="email" className="text-gray-700">
                                        Correo Electrónico
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="tu@email.com"
                                        disabled={isProcessing}
                                        className="mt-1"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="phone" className="text-gray-700">
                                        Teléfono
                                    </Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="388 123-4567"
                                        disabled={isProcessing}
                                        className="mt-1"
                                    />
                                </div>


                            </div>

                            <Button
                                onClick={handleCheckout}
                                disabled={isProcessing}
                                className="w-full mt-6 bg-red-600 hover:bg-red-700 h-12 text-base font-semibold"
                            >
                                {isProcessing ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                                fill="none"
                                            />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            />
                                        </svg>
                                        Procesando...
                                    </span>
                                ) : (
                                    <>
                                        <Lock className="h-4 w-4 mr-2" />
                                        Finalizar Compra - ${formatPrice(total)}
                                    </>
                                )}
                            </Button>

                            <p className="text-xs text-gray-500 text-center mt-4 flex items-center justify-center">
                                <Lock className="h-3 w-3 mr-1" />
                                Pago 100% seguro y encriptado con Modo
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
