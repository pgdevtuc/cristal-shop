"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ShopHeader } from "@/components/layout/whatsapp-header"
import { formatPrice } from "@/lib/formatPrice"
import { toast } from "sonner"
import QRCode from 'qrcode'
import { ArrowLeft, Lock, Smartphone, AlertCircle, Clock } from "lucide-react"

interface PaymentData {
    qrString: string
    deeplink: string
    amount: number
    orderNumber: string
    orderId: string
    timestamp: number
}

export default function PaymentPage() {
    const params = useParams()
    const router = useRouter()
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [timeRemaining, setTimeRemaining] = useState<number>(0)
    const [isCheckingStatus, setIsCheckingStatus] = useState(false)


    // Función para formatear el tiempo restante
    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${minutes}:${secs.toString().padStart(2, '0')}`
    }

    useEffect(() => {
        // Cargar datos desde localStorage
        const loadPaymentData = () => {
            try {
                const savedData = localStorage.getItem('pendingPayment')
                if (!savedData) {
                    setError("No se encontró información de pago")
                    setLoading(false)
                    return
                }

                const data: PaymentData = JSON.parse(savedData)

                // Verificar que el orderId coincida
                if (data.orderId !== params.orderId) {
                    setError("ID de orden no válido")
                    setLoading(false)
                    return
                }

                // Calcular tiempo restante en segundos (10 minutos = 600 segundos)
                const tenMinutes = 10 * 60 * 1000
                const elapsed = Date.now() - data.timestamp
                const remaining = Math.max(0, Math.floor((tenMinutes - elapsed) / 1000))

                if (remaining === 0) {
                    setError("El tiempo de pago ha expirado")
                    setLoading(false)
                    return
                }

                setTimeRemaining(remaining)
                setPaymentData(data)
                setLoading(false)
            } catch (err) {
                setError("Error al cargar los datos de pago")
                setLoading(false)
            }
        }

        loadPaymentData()
    }, [params.orderId])

    // Contador regresivo
    useEffect(() => {
        if (timeRemaining <= 0) return

        const interval = setInterval(() => {
            setTimeRemaining((prev) => {
                const newTime = prev - 1
                if (newTime <= 0) {
                    clearInterval(interval)
                    setError("El tiempo de pago ha expirado")
                    return 0
                }
                return newTime
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [timeRemaining])

    useEffect(() => {
        if (canvasRef.current && paymentData?.qrString) {
            QRCode.toCanvas(
                canvasRef.current,
                paymentData.qrString,
                {
                    width: 300,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    }
                },
                (error) => {
                    if (error) console.error('Error generando QR:', error)
                }
            )
        }
    }, [paymentData])

    const handleOpenApp = () => {
        if (paymentData?.deeplink) {
            window.location.href = paymentData.deeplink
        }
    }

    const handleBack = () => {
        router.push('/cart')
    }

    const handleCheckStatus = async () => {
        if (!paymentData?.orderId) return

        setIsCheckingStatus(true)

        try {
            const response = await fetch(`/api/order/${paymentData.orderId}/status`)
            const result = await response.json()

            if (!response.ok) {
                toast.error('Error al verificar el estado del pago')
                return
            }

            switch (result.status) {
                case 'COMPLETED':
                case 'APPROVED':
                case 'ACCEPTED':
                    toast.success('¡Pago confirmado!')
                    localStorage.removeItem('pendingPayment')
                    setTimeout(() => {
                        router.push(`/success?orderId=${paymentData.orderId}`)
                    }, 1000)
                    break

                case 'SCANNED':
                    toast.info('Escaneaste el codigo, procede con el pago para continuar.')
                    break
                case 'PROCESSING':
                    toast.info('El pago aún no ha sido confirmado. Por favor, intenta nuevamente en unos momentos.')
                    break

                case 'FAILED':
                case 'CANCELLED':
                case 'REJECTED':
                    toast.error('El pago ha fallado')
                    setTimeout(() => {
                        router.push(`/failed?orderId=${paymentData.orderId}`)
                    }, 1500)
                    break

                default:
                    toast.warning('Estado desconocido. Por favor, verifica tu pago.')
            }
        } catch (err) {
            console.error('Error verificando estado:', err)
            toast.error('Error al verificar el estado del pago')
        } finally {
            setIsCheckingStatus(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin h-12 w-12 border-4 border-gray-300 border-t-purple-600 rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando información de pago...</p>
                </div>
            </div>
        )
    }

    if (error || !paymentData) {
        return (
            <div className="min-h-screen bg-gray-50">
                <ShopHeader />
                <div className="max-w-2xl mx-auto px-4 py-16">
                    <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <Button onClick={() => router.push('/cart')} className="bg-red-600 hover:bg-red-700">
                            Volver al carrito
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    const isExpiringSoon = timeRemaining <= 120 // 2 minutos

    return (
        <div className="min-h-screen bg-gray-50">
            <ShopHeader />

            <div className="max-w-2xl mx-auto px-4 py-8">
                <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                            <Smartphone className="w-8 h-8 text-green-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Pagar con Modo
                        </h1>
                        <p className="text-gray-600 text-sm">
                            Orden #{paymentData.orderId}
                        </p>
                    </div>

                    {/* Contador regresivo */}
                    <div className={`mb-6 p-4 rounded-xl flex items-center justify-center gap-3 ${isExpiringSoon
                            ? 'bg-red-50 border-2 border-red-200'
                            : 'bg-blue-50 border-2 border-blue-200'
                        }`}>
                        <Clock className={`w-5 h-5 ${isExpiringSoon ? 'text-red-600' : 'text-blue-600'}`} />
                        <div className="text-center">
                            <p className="text-xs text-gray-600 mb-1">Tiempo restante para pagar</p>
                            <p className={`text-2xl font-bold ${isExpiringSoon ? 'text-red-600' : 'text-blue-600'
                                }`}>
                                {formatTime(timeRemaining)}
                            </p>
                        </div>
                    </div>

                    <div className="bg-purple-50 rounded-xl p-4 mb-6 text-center">
                        <p className="text-sm text-gray-600 mb-1">Monto a pagar</p>
                        <p className="text-3xl font-bold text-green-600">
                            ${formatPrice(paymentData.amount)}
                        </p>
                    </div>

                    {paymentData.qrString && (
                        <div className="bg-white border-4 border-purple-200 rounded-xl p-4 mb-6 flex justify-center">
                            <canvas ref={canvasRef} className="max-w-full" />
                        </div>
                    )}

                    <div className="space-y-4 mb-6 bg-gray-50 rounded-xl p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">¿Cómo pagar?</h3>
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-semibold text-sm">
                                1
                            </div>
                            <p className="text-sm text-gray-700">
                                Abrí la app de <span className="font-semibold">Modo</span>
                            </p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-semibold text-sm">
                                2
                            </div>
                            <p className="text-sm text-gray-700">
                                Escaneá este código QR
                            </p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-semibold text-sm">
                                3
                            </div>
                            <p className="text-sm text-gray-700">
                                Confirmá el pago en tu teléfono
                            </p>
                        </div>
                    </div>

                    {paymentData.deeplink && (
                        <Button
                            onClick={handleOpenApp}
                            className="w-full bg-gradient-to-r from-green-600 to-green-400 text-white font-semibold py-6 rounded-xl hover:from-green-700 hover:to-green-500 transition-all duration-200 shadow-lg hover:shadow-xl mb-3"
                        >
                            <Smartphone className="h-5 w-5 mr-2" />
                            Abrir app de Modo
                        </Button>
                    )}

                    <Button
                        onClick={handleCheckStatus}
                        disabled={isCheckingStatus}
                        variant="outline"
                        className="w-full mb-3 border-gray-300"
                    >
                        {isCheckingStatus ? (
                            <span className="flex items-center">
                                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
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
                                Verificando...
                            </span>
                        ) : (
                            'Verificar estado del pago'
                        )}
                    </Button>

                    <Button
                        onClick={handleBack}
                        variant="ghost"
                        className="w-full"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Volver al carrito
                    </Button>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                            <Lock className="w-4 h-4" />
                            <span>Pago seguro con Modo</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}