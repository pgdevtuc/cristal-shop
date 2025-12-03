"use client"

import { useState,Suspense } from "react"
import { useRouter } from "next/navigation"
import { ShopHeader } from "@/components/layout/whatsapp-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Heart,
  Share2,
  Truck,
  Shield,
  RotateCcw,
  Check,
  Star,
  Minus,
  Plus,
} from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import Link from "next/link"
import { formatPrice } from "@/lib/formatPrice"
import type { Product } from "@/types/product"
import { useCart } from "@/contexts/cart-context"
interface ExtendedProduct extends Product {
  colors?: string[]
  features?: string[]
}

export default function ProductClient({
  product,
  relatedProducts,
}: {
  product: ExtendedProduct
  relatedProducts: Product[]
}) {
  const router = useRouter()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [selectedColor, setSelectedColor] = useState<string | null>(
    product.colors && product.colors.length > 0 ? product.colors[0] : null,
  )
  const [isWishlisted, setIsWishlisted] = useState(false)
  const { addItem } = useCart();

  const nextImage = () => {
    if (product && product.image.length > 1) {
      setCurrentImageIndex((prev) => (prev === product.image.length - 1 ? 0 : prev + 1))
    }
  }

  const prevImage = () => {
    if (product && product.image.length > 1) {
      setCurrentImageIndex((prev) => (prev === 0 ? product.image.length - 1 : prev - 1))
    }
  }

  const handleAddToCart = () => {
    if (!product) return

    if (product.colors && product.colors.length > 0 && !selectedColor) {
      toast.error("Por favor selecciona un color")
      return
    }

    if (product.stock === 0) {
      toast.error("Producto agotado")
      return
    }

    if (quantity > product.stock) {
      toast.error(`Solo hay ${product.stock} unidades disponibles`)
      return
    }

    addItem({
      id: product.id,
      image: product.image[0],
      name: product.name,
      price: product.salePrice && product.salePrice > 0 ? product.salePrice : product.price,
      stock: product.stock,
      color: selectedColor || ""
    })

    toast.success("Producto agregado al carrito", { position: "top-center", style: { color: "green" }, duration: 1500 })
  }

  const currentPrice = product.salePrice || product.price
  const hasDiscount = product?.salePrice && product.salePrice > 0 && product.salePrice < product.price
  const discountPercentage = hasDiscount
    ? Math.round(((product.price - (product.salePrice ?? 0)) / product.price) * 100)
    : 0
  const savings = hasDiscount ? product.price - (product.salePrice ?? 0) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<div>Loading...</div>}>
        <ShopHeader />
      </Suspense>

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-red-600 transition-colors">
              Inicio
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link href={`/?category=${product.category}`} className="hover:text-red-600 transition-colors">
              {product.category}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900 font-medium truncate max-w-[200px]">{product.name}</span>
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Left: Image Gallery */}
            <div className="p-6 lg:p-8 bg-gray-50 lg:bg-white lg:border-r">
              {/* Main Image */}
              <div className="relative aspect-square bg-white rounded-xl overflow-hidden mb-4 group">
                <Image
                  src={product.image[currentImageIndex] || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                  sizes="(min-width:1024px) 50vw, 100vw"
                  priority
                />

                {/* Discount Badge */}
                {hasDiscount && (
                  <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1.5 rounded-lg font-bold text-sm shadow-lg">
                    -{discountPercentage}%
                  </div>
                )}

                {/* Navigation Arrows */}
                {product.image.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300"
                      aria-label="Imagen anterior"
                    >
                      <ChevronLeft className="h-5 w-5 text-gray-700" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300"
                      aria-label="Siguiente imagen"
                    >
                      <ChevronRight className="h-5 w-5 text-gray-700" />
                    </button>
                  </>
                )}

                {/* Wishlist Button */}
                <button
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className="absolute top-4 right-4 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all duration-300"
                  aria-label={isWishlisted ? "Quitar de favoritos" : "Agregar a favoritos"}
                >
                  <Heart
                    className={`h-5 w-5 transition-colors ${isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600"}`}
                  />
                </button>
              </div>

              {/* Thumbnails */}
              {product.image.length > 1 && (
                <div className="flex gap-3 justify-center">
                  {product.image.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`relative w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all duration-300 ${idx === currentImageIndex ? "border-red-600 shadow-md" : "border-gray-200 hover:border-gray-400"
                        }`}
                    >
                      <Image
                        src={img || "/placeholder.svg"}
                        alt={`${product.name} ${idx + 1}`}
                        fill
                        className="object-contain p-1"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Product Details */}
            <div className="p-6 lg:p-8 flex flex-col">
              {/* Category Badge */}
              <div className="mb-3">
                <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1 text-xs font-medium">
                  {product.category}
                </Badge>
              </div>

              {/* Product Name */}
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4 leading-tight">{product.name}</h1>

              {/* Rating */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-sm text-gray-600 font-medium"></span>
              </div>

              {/* Price Section */}
              <div className="bg-gray-50 rounded-xl p-5 mb-6">
                <div className="flex flex-wrap items-end gap-3 mb-2">
                  <span className="text-4xl font-bold text-gray-900">${formatPrice(currentPrice)}</span>
                  {hasDiscount && (
                    <span className="text-lg text-gray-400 line-through">${formatPrice(product.price)}</span>
                  )}
                </div>
                {hasDiscount && (
                  <div className="flex items-center gap-2">
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-sm font-semibold">
                      Ahorras ${formatPrice(savings)}
                    </span>
                    <span className="text-sm text-gray-500">con este precio</span>
                  </div>
                )}
              </div>

              {/* Color Selector */}
              {product.colors && product.colors.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Color: <span className="font-normal text-gray-600">{selectedColor}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all duration-200 ${selectedColor === color
                          ? "border-red-600 bg-red-50 text-red-700"
                          : "border-gray-200 hover:border-gray-400 text-gray-700"
                          }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-3">Cantidad</label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border-2 border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="p-3 hover:bg-gray-100 transition-colors"
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={product.stock}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, Number(e.target.value) || 1)))}
                      className="w-16 text-center font-semibold text-lg border-x-2 border-gray-200 py-2 focus:outline-none"
                    />
                    <button
                      onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                      className="p-3 hover:bg-gray-100 transition-colors"
                      disabled={quantity >= product.stock}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Stock Status */}
                  <div className="flex items-center gap-2">
                    {product.stock > 0 ? (
                      <>
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">
                          <span className="font-semibold text-green-600">{product.stock}</span> disponibles
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                        <span className="text-sm text-red-600 font-medium">Agotado</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <Button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-4 text-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {product.stock === 0 ? "Agotado" : "Agregar al carrito"}
                </Button>
                <Link href={`https://api.whatsapp.com/send?text=https://cristaltienda.waichatt.com/product/${product.id}`} target="_blank"
                >
                  <Button
                    variant="outline"
                    className="px-6 py-4 border-2 border-gray-300 hover:border-gray-400 rounded-xl bg-transparent">
                    <Share2 className="h-5 w-5" />
                  </Button>
                </Link>
              </div>

              {/* Trust Badges */}
              {/*               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Truck className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Envío Gratis</p>
                    <p className="text-xs text-gray-500">En pedidos +$100k</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Shield className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Garantía</p>
                    <p className="text-xs text-gray-500">12 meses oficial</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <RotateCcw className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Devolución</p>
                    <p className="text-xs text-gray-500">30 días gratis</p>
                  </div>
                </div>
              </div> */}
            </div>
          </div>

          {/* Product Description & Features */}
          <div className="border-t">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              {/* Description */}
              <div className="p-6 lg:p-8 lg:border-r">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="h-1 w-8 bg-red-600 rounded-full"></span>
                  Descripción
                </h2>
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </div>

              {/* Features */}
              {product.features && product.features.length > 0 && (
                <div className="p-6 lg:p-8 bg-gray-50 lg:bg-white">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="h-1 w-8 bg-red-600 rounded-full"></span>
                    Características
                  </h2>
                  <ul className="space-y-3">
                    {product.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="bg-green-100 p-1 rounded-full mt-0.5">
                          <Check className="h-3 w-3 text-green-600" />
                        </div>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Productos Relacionados</h2>
              <Link
                href={`/?category=${product.category}`}
                className="text-red-600 hover:text-red-700 font-medium text-sm flex items-center gap-1"
              >
                Ver más
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((p) => (
                <RelatedProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Mobile Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 lg:hidden z-50">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-xs text-gray-500">Precio total</p>
            <p className="text-xl font-bold text-gray-900">${formatPrice(currentPrice * quantity)}</p>
          </div>
          <Button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl"
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Agregar
          </Button>
        </div>
      </div>
    </div>
  )
}

function RelatedProductCard({ product }: { product: Product }) {
  const hasDiscount = product.salePrice && product.salePrice > 0 && product.salePrice < product.price
  const discountPercentage = hasDiscount
    ? Math.round(((product.price - product.salePrice!) / product.price) * 100)
    : null

  return (
    <Link href={`/product/${product.id}`}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-all duration-300">
        <div className="relative bg-white p-4 flex items-center justify-center h-40 md:h-48">
          <Image
            src={product.image[0] || "/placeholder.svg"}
            alt={product.name}
            width={160}
            height={160}
            className="object-contain max-h-full w-auto transition-transform duration-300 group-hover:scale-105"
          />
          {discountPercentage && (
            <Badge className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold">
              -{discountPercentage}%
            </Badge>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mb-2">{product.name}</h3>
          <div className="flex items-center gap-2">
            {hasDiscount ? (
              <>
                <span className="text-gray-400 line-through text-xs">${formatPrice(product.price)}</span>
                <span className="text-red-600 font-bold">${formatPrice(product.salePrice!)}</span>
              </>
            ) : (
              <span className="text-gray-900 font-bold">${formatPrice(product.price)}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
