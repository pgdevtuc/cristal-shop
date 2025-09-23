"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { WhatsAppHeader } from "@/components/layout/whatsapp-header"
import { useCart } from "@/contexts/cart-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Star, ShoppingCart } from "lucide-react"
import { toast } from "sonner"
import { notFound } from "next/navigation"
import { ProductPageSkeleton } from "@/components/products/product-page-skeleton"

interface Product {
    id: string
    image: string[]
    name: string
    stock: number
    category: string
    description: string
    price: number
    salePrice: number
}


export default function ProductPage() {
    const params = useParams()
    const { addItem } = useCart()
    const [product, setProduct] = useState<Product | null>(null)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!params.id) return
        const fetchProduct = async () => {
            setLoading(true)
            try {
                const res = await fetch(`/api/products/verify?productId=${params.id}`)
                if (res.ok) {
                    const data = await res.json();
                    setProduct(data.product)
                }
                else {
                    notFound()
                }
            } catch (error) {

            }
            finally {
                setLoading(false)
            }
        }

        fetchProduct()
    }, [params.id])

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

        if (product.stock === 0) {
            toast.error("Producto agotado")
            return
        }

        addItem({
            id: product.id,
            name: product.name,
            price: product.salePrice || product.price,
            image: product.image[0],
            stock: product.stock,
        })

    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100">
                <WhatsAppHeader />
                <ProductPageSkeleton />
            </div>
        )
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-gray-100">
                <WhatsAppHeader />
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <p className="text-gray-600">Producto no encontrado</p>
                    </div>
                </div>
            </div>
        )
    }

    const currentPrice = product.salePrice || product.price
    const hasDiscount = product.salePrice > 0

    return (
        <div className="min-h-screen whatsapp-bg">
            <WhatsAppHeader />

            <div className="max-w-md mx-auto bg-white">
                {/* Image Carousel */}
                <div className="relative">
                    <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                        <img
                            src={product.image[currentImageIndex] || "/placeholder.svg"}
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Carousel Controls */}
                    {product.image.length > 1 && (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full p-2"
                                onClick={prevImage}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full p-2"
                                onClick={nextImage}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>

                            {/* Image Indicators */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                {product.image.map((_, index) => (
                                    <button
                                        key={index}
                                        className={`w-2 h-2 rounded-full transition-colors ${index === currentImageIndex ? "bg-white" : "bg-white/50"
                                            }`}
                                        onClick={() => setCurrentImageIndex(index)}
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    {/* Stock Badge */}
                    {product.stock === 0 && <Badge className="absolute top-4 right-4 bg-red-500 hover:bg-red-600">Agotado</Badge>}

                    {hasDiscount && <Badge className="absolute top-4 left-4 bg-red-500 hover:bg-red-600">Oferta</Badge>}
                </div>

                {/* Product Info */}
                <div className="p-4 space-y-4">
                    <div>
                        <Badge variant="secondary" className="mb-2">
                            {product.category}
                        </Badge>
                        <h1 className="text-xl font-semibold text-gray-900 mb-2">{product.name}</h1>

                        {/* Rating */}
                        <div className="flex items-center gap-1 mb-3">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            ))}
                            <span className="text-sm text-gray-600 ml-1">(4.8)</span>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <h3 className="font-medium text-gray-900 mb-2">Descripción</h3>
                        <div className="text-gray-600 text-sm space-y-1">
                            {product.description}
                        </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-gray-900">${currentPrice.toLocaleString()}</span>
                        {hasDiscount && (
                            <span className="text-lg text-gray-500 line-through">${product.price.toLocaleString()}</span>
                        )}
                    </div>

                    {/* Stock Info */}
                    <div className="text-sm text-gray-600">
                        {product.stock > 0 ? (
                            <span className="text-emerald-600">✓ Disponible ({product.stock} en stock)</span>
                        ) : (
                            <span className="text-red-600">✗ Producto agotado</span>
                        )}
                    </div>

                    {/* Add to Cart Button */}
                    <Button
                        onClick={handleAddToCart}
                        disabled={product.stock === 0}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-base font-medium"
                    >
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        {product.stock === 0 ? "Agotado" : "Agregar al carrito"}
                    </Button>
                </div>
            </div>
        </div>
    )
}
