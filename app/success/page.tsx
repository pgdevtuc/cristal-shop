"use client"

import { useEffect, useState } from "react"
import {  useRouter } from "next/navigation"
import { CheckCircle, Package, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SuccessPage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-12 h-12 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ¡Pago Exitoso!
          </h1>
          <p className="text-gray-600">
            Tu pedido ha sido procesado correctamente
          </p>
        </div>

     

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Recibirás un email de confirmación con los detalles de tu pedido.
          </p>

          <Button
            onClick={() => router.push('/')}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            Volver al Inicio
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <p className="text-xs text-gray-500">
            Serás redirigido automáticamente en {countdown} segundos
          </p>
        </div>
      </div>
    </div>
  )
}