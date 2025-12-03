"use client"

import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Product } from "@/types/product"
import { formatPrice } from "@/lib/formatPrice"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface WhatsAppProductCardProps {
  product: Product
}

export function WhatsAppProductCard({ product }: WhatsAppProductCardProps) {
  const hasDiscount = product.salePrice && product.salePrice > 0 && product.salePrice < product.price
  const discountPercentage =
    hasDiscount && product.salePrice && product.salePrice > 0
      ? Math.round(((product.price - product.salePrice!) / product.price) * 100)
      : null

  const router = useRouter();
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
      <Link href={`/product/${product.id}`} className="flex flex-col flex-1">
        {/* Imagen del producto */}
        <div className="relative bg-white p-4 flex items-center justify-center h-48 md:h-56">
          <Image
            src={product.image[0] || "/placeholder.svg"}
            alt={product.name}
            width={200}
            height={200}
            className="object-contain max-h-full w-auto transition-transform duration-300 hover:scale-105"
          />
          {/* Badge de descuento */}
          {discountPercentage && discountPercentage > 0 && (
            <Badge className="absolute top-3 left-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold">
              -{discountPercentage}%
            </Badge>
          )}
          {/* Stock bajo */}
          {product.stock <= 5 && product.stock > 0 && (
            <Badge variant="outline" className="absolute top-3 right-3 bg-white text-gray-700 text-xs border-gray-300">
              Últimas {product.stock}
            </Badge>
          )}
          {/* Agotado */}
          {product.stock === 0 && (
            <Badge className="absolute top-3 right-3 bg-gray-800 text-white text-xs">Agotado</Badge>
          )}
        </div>

        {/* Contenido */}
        <div className="p-4 flex flex-col flex-1">
          {/* Nombre del producto */}
          <h3 className="font-bold text-gray-900 text-sm md:text-base line-clamp-2 mb-2 leading-tight">
            {product.name}
          </h3>

          {/* Precios */}
          <div className="flex items-center gap-2 mt-auto mb-3">
            {hasDiscount ? (
              <>
                <span className="text-gray-400 line-through text-sm">${formatPrice(product.price)}</span>
                <span className="text-red-600 font-bold text-base md:text-lg">${formatPrice(product.salePrice!)}</span>
              </>
            ) : (
              <span className="text-gray-900 font-bold text-base md:text-lg">${formatPrice(product.price)}</span>
            )}
          </div>
        </div>
      </Link>

      {/* Botón de acción */}
      <div className="px-4 pb-4">
        <Button
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold text-sm py-2 rounded-md"
          onClick={() => router.push(`/product/${product.id}`)}
        >
          {product.stock === 0 ? "Leer más" : "Ver producto"}
        </Button>
      </div>
    </div>
  )
}
