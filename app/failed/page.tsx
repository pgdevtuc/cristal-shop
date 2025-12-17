"use client"

import { useRouter } from "next/navigation"
import { XCircle, Home, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ShopHeader } from "@/components/layout/whatsapp-header"
import { Suspense } from "react"

export default function FailedPage() {
  const router = useRouter()
  return (
    <>
      <Suspense fallback={<div className="flex items-center justify-center p-4">
        <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-primary rounded-full" />
      </div>}>
        <ShopHeader />
      </Suspense>
      <div className="flex items-center justify-center bg-white p-10">
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


          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Por favor, verifica tus datos de pago e intenta nuevamente.
            </p>

            <div className="space-y-2">
              <Button
                onClick={() => router.push('/cart')}
                variant="default"
                className="w-full"
              >
                <Home className="mr-2 h-4 w-4" />
                Volver al carrito
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}