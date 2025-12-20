"use client"

import type React from "react"
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Heart, Star, Zap } from "lucide-react"
import type { Product } from "@/types/product"

interface PromoProductCardProps {
  product: Product
}

export function PromoProductCard({ product }: PromoProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  const discountPercentage =
    product.price > 0 ? Math.round(((product.price - ((product.salePrice ?? 0) ?? 0)) / product.price) * 100) : 0

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsFavorite(!isFavorite)
  }

  return (
    <Link
      href={`/product/${product.id}`}
      className="block group relative bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-red-100 hover:border-red-300"
    >
      {/* Badge de descuento animado */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
        <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1 animate-pulse">
          <Zap className="h-3 w-3 fill-current" />-{discountPercentage}%
        </div>
        <div className="bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg">¡OFERTA!</div>
      </div>


      {/* Imagen del producto */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {!imageLoaded && <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-100 animate-pulse" />}
        <Image
          src={product.image[0] || "/placeholder.svg?height=400&width=400"}
          alt={product.name}
          fill
          className={`object-cover group-hover:scale-110 transition-transform duration-500 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {/* Overlay con efecto hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Información del producto */}
      <div className="p-4 space-y-3">
        {/* Rating */}
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`h-3 w-3 ${i < 4 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
          ))}
          <span className="text-xs text-gray-500 ml-1">(4.5)</span>
        </div>

        {/* Nombre del producto */}
        <h3 className="font-semibold text-gray-900 line-clamp-2 min-h-[2.5rem] group-hover:text-red-600 transition-colors">
          {product.name}
        </h3>

        {/* Categoría */}
        <p className="text-xs text-gray-500 uppercase tracking-wide">{product.category}</p>

        {/* Precios */}
        <div className="flex items-end gap-2">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-red-600">${(product.salePrice ?? 0).toLocaleString()}</span>
            <span className="text-sm text-gray-400 line-through">${product.price.toLocaleString()}</span>
          </div>
          <div className="ml-auto">
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
              Ahorrás ${(product.price - (product.salePrice ?? 0)).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Stock indicator */}
        {product.stock < 10 && product.stock > 0 && (
          <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full w-fit">
            <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse" />
            ¡Solo quedan {product.stock}!
          </div>
        )}
      </div>

      {/* Borde animado en hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-500 via-pink-500 to-red-500 blur-xl opacity-20" />
      </div>
    </Link>
  )
}
