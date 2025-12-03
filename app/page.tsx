"use client"
import {ShopHeader } from "@/components/layout/whatsapp-header"
import { WhatsAppProductCatalog } from "@/components/products/whatsapp-product-catalog"
import { FloatingCartButton } from "@/components/products/floating-cart-button"
import { Suspense } from "react"


export default function HomePage() {

  return (
    <div className="min-h-screen">
      <Suspense fallback={<div>Loading...</div>}>
        <ShopHeader />
      </Suspense>
      <main>
        <WhatsAppProductCatalog />
      </main>
      <FloatingCartButton />
    </div>
  );

}