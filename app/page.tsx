"use client"
import { WhatsAppHeader } from "@/components/layout/whatsapp-header"
import { WhatsAppProductCatalog } from "@/components/products/whatsapp-product-catalog"
import { FloatingCartButton } from "@/components/products/floating-cart-button"
import { CartLoader } from "@/components/cart/cart-loader"


export default function HomePage() {

  return (
    <div className="min-h-screen">
      <WhatsAppHeader />
      <main>
        <WhatsAppProductCatalog />
      </main>
      <FloatingCartButton />
      <CartLoader />
    </div>
  );

}