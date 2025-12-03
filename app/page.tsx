"use client"
import { ShopHeader } from "@/components/layout/whatsapp-header"
import { WhatsAppProductCatalog } from "@/components/products/whatsapp-product-catalog"
import { FloatingCartButton } from "@/components/products/floating-cart-button"
import { Suspense } from "react"


export default function HomePage() {

  return (
    <div className="min-h-screen">
      <Suspense fallback={<div className="flex items-center justify-center p-4">
        <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-primary rounded-full" />
      </div>}>
        <ShopHeader />
      </Suspense>
      <main>
        <Suspense fallback={<div className="flex items-center justify-center p-4">
          <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-primary rounded-full" />
        </div>}>
          <WhatsAppProductCatalog />
        </Suspense>
      </main>
      <FloatingCartButton />
    </div>
  );

}