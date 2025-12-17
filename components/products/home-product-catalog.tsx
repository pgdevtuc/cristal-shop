"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { WhatsAppProductCard } from "./whatsapp-product-card"
import { WhatsAppProductCardSkeleton } from "./whatsapp-product-card-skeleton"
import { CategoryCarousel } from "./category-corousel"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import type { Product } from "@/types/product"
import { ApiListResponse } from "@/types/IWhatsappProductCatalog"

export type CatObject = { id: string; name: string; image?: string }

function mapServerProduct(doc: any): Product {
    return {
        id: String(doc._id ?? doc.id ?? ""),
        name: doc.title ?? doc.name ?? "",
        description: doc.description ?? "",
        salePrice: doc.salePrice !== null && doc.salePrice !== undefined ? Number(doc.salePrice) : Number(doc.price ?? 0),
        price: doc.price !== undefined && doc.price !== null ? Number(doc.price) : 0,
        category: doc.category ?? "",
        image: doc.image,
        stock: Number(doc.stock ?? 0),
        colors: doc.colors ?? false,
    }
}


interface HomeProductCatalogProps {
    dataInitial: ApiListResponse
    initialCatObjects: CatObject[]
}

export function HomeProductCatalog({ dataInitial, initialCatObjects }: HomeProductCatalogProps) {
    const router = useRouter()
    // Productos (sin filtros ni query params)
    const [products, setProducts] = useState<Product[]>(dataInitial.items)
    const [loading, setLoading] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false)
    const [initialLoading, setInitialLoading] = useState(dataInitial.items.length === 0)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(dataInitial.totalPages)
    

    // Categorías para el carrusel (solo visual; clic lleva a /l)
    const [catObjects, setCatObjects] = useState<CatObject[]>(initialCatObjects)

    const abortRef = useRef<AbortController | null>(null)


    async function fetchPage(nextPage: number, replace = false) {
        abortRef.current?.abort()
        const ctrl = new AbortController()
        abortRef.current = ctrl
        try {
            if (replace || nextPage === 1) setLoading(true)
            else setLoadingMore(true)

            const res = await fetch(`/api/products?page=${nextPage}`, { signal: ctrl.signal })
            const raw = await res.json()

            if (Array.isArray(raw)) {
                const mapped = raw.map(mapServerProduct)
                if (replace) setProducts(mapped)
                else setProducts((prev) => [...prev, ...mapped])
                setTotalPages(1)
                setPage(1)
            } else {
                const data = raw as ApiListResponse
                const mapped = (data.items ?? []).map(mapServerProduct)
                if (replace) setProducts(mapped)
                setProducts((prev) => [...prev, ...mapped])
                setTotalPages(data.totalPages || 1)
                setPage(nextPage)
            }
        } catch (err: any) {
            if (err?.name !== "AbortError") console.error("Error fetching products:", err)
        } finally {
            setLoading(false)
            setLoadingMore(false)
            setInitialLoading(false)
        }
    }

    const hasMore = page < totalPages

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto py-6">
                <CategoryCarousel
                    categories={catObjects}
                    selectedCategory={"all"}
                    onCategoryChange={(c) => {
                        router.push(`/l?category=${encodeURIComponent(c)}`)
                    }}
                    autoScrollInterval={2000}
                />
            </div>

            {/* Título de sección */}
            <div className="max-w-7xl mx-auto px-4 py-4">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Más Vendidos</h2>
            </div>

            {/* Grid de productos (sin filtros) */}
            <div className="max-w-7xl mx-auto px-4 pb-20">
                {initialLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {[...Array(12)].map((_, i) => (
                            <WhatsAppProductCardSkeleton key={i} />
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="bg-white rounded-xl p-8 shadow-sm max-w-md mx-auto">
                            <p className="text-gray-600 text-lg mb-4">No se encontraron productos</p>
                            <Button
                                variant="outline"
                                onClick={() => fetchPage(1, true)}
                                className="bg-red-600 text-white hover:bg-red-700"
                            >
                                Reintentar
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className={`relative`}>
                            <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 ${loading ? "opacity-50" : ""}`}>
                                {products.map((p) => (
                                    <WhatsAppProductCard key={p.id} product={p} />
                                ))}
                            </div>
                            {loading && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                                </div>
                            )}
                        </div>

                        {/* Cargar más */}
                        <div className="flex justify-center mt-8">
                            {hasMore ? (
                                <Button onClick={() => fetchPage(page + 1)} disabled={loadingMore} className="bg-red-600 hover:bg-red-700 text-white px-8">
                                    {loadingMore ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Cargando…
                                        </>
                                    ) : (
                                        "Cargar más productos"
                                    )}
                                </Button>
                            ) : products.length > 0 ? (
                                <span className="text-sm text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm">No hay más productos</span>
                            ) : null}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
