import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { CartProvider } from "@/contexts/cart-context"
import { Toaster } from "sonner"
import { AuthProvider } from "@/components/auth/auth-providers"

export const metadata: Metadata = {
  title: "Cristal Shop - Tu Tienda de Confianza",
  description: "Encuentra los mejores productos al mejor precio",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/images/CRISTAL_LOGO.webp",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/images/CRISTAL_LOGO.webp",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/images/CRISTAL_LOGO.webp",
        type: "image/webp",
      },
    ],
    apple: "/images/CRISTAL_LOGO.webp",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <CartProvider>
              {children}
            <Toaster />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
