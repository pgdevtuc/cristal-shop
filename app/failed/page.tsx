"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { XCircle, Home, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function FailedPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get('orderId')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Pago Fallido
          </h1>
          <p className="text-gray-600">
            No pudimos procesar tu pago
          </p>
        </div>

        {orderId && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Orden ID:</p>
            <p className="font-mono text-sm font-semibold text-gray-900">
              {orderId}
            </p>
          </div>
        )}

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Por favor, verifica tus datos de pago e intenta nuevamente.
          </p>

          <div className="space-y-2">
            <Button
              onClick={() => router.push('/')}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Intentar Nuevamente
            </Button>

            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="w-full"
            >
              <Home className="mr-2 h-4 w-4" />
              Volver al Inicio
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}