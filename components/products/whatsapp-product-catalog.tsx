"use client"

import { useState, useEffect, useRef } from "react"
import { WhatsAppProductCard } from "./whatsapp-product-card"
import { WhatsAppProductCardSkeleton } from "./whatsapp-product-card-skeleton"
import { CategoryCarousel } from "./category-corousel"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import type { ApiListResponse } from "@/types/IWhatsappProductCatalog"
import type { Product } from "@/types/product"
import { useSearchParams, useRouter, usePathname } from "next/navigation"

type ApiCategories = { categories: { id?: string; name: string; count: number; image?: string }[] }

function useDebounce<T>(value: T, delay = 450) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

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

export function WhatsAppProductCatalog() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  const [categories, setCategories] = useState<string[]>([])
  const [catObjects, setCatObjects] = useState<{ id: string; name: string; image?: string }[]>([])
  const [catLoading, setCatLoading] = useState(true)

  const [filterPrice, setFilterPrice] = useState<string>("all")
  const [maxPrice, setMaxPrice] = useState<number>(0)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearch = useDebounce(searchTerm, 450)

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 12

  // Query helpers to sync filters with URL
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  function updateQuery(updates: Record<string, string | undefined>) {
    const sp = new URLSearchParams(searchParams.toString())
    
    Object.entries(updates).forEach(([k, v]) => {
      if (v === undefined || v === "") sp.delete(k)
      else sp.set(k, v)
    })
    router.push(`${pathname}?${sp.toString()}`, { scroll: false })
  }

  const abortRef = useRef<AbortController | null>(null)

  // Cargar categorías al inicio
  useEffect(() => {
    ;(async () => {
      try {
        setCatLoading(true)
        const res = await fetch("/api/categories")
        const data: ApiCategories = await res.json()
        const names = data.categories?.map((c) => c.name) ?? []
        const objs =
          data.categories?.map((c) => ({
            id: c.id ?? c.name,
            name: c.name,
            image: c.image || "",
          })) ?? []
        setCategories(["all", ...names])
        setCatObjects(objs)
      } catch {
        setCategories(["all"])
        setCatObjects([])
      } finally {
        setCatLoading(false)
      }
    })()
    fetchPage(1, true, debouncedSearch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync local filter state from URL params (updated by Header)
  useEffect(() => {
    const q = searchParams.get("q") || ""
    const cat = searchParams.get("category") || "all"
    const pf = searchParams.get("priceFilter") || "all"
    const mp = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : 0

    setSearchTerm(q)
    setSelectedCategory(cat)
    setFilterPrice(pf)
    setMaxPrice(mp)
  }, [searchParams])

  // Cuando cambian filtros/búsqueda
  useEffect(() => {
    if (!initialLoading) {
      setProducts([])
      setPage(1)
      fetchPage(1, true, debouncedSearch)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, debouncedSearch, initialLoading, filterPrice])

  async function fetchPage(nextPage: number, replace = false, qOverride?: string) {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    const params = new URLSearchParams()
    params.set("page", String(nextPage))
    params.set("limit", String(limit))
    if (filterPrice !== "all" && filterPrice !== "under-limit") params.set("priceFilter", filterPrice)
    if (filterPrice === "under-limit" && maxPrice > 0) params.set("maxPrice", String(maxPrice))
    const q = qOverride ?? debouncedSearch
    if (q) params.set("q", q)
    if (selectedCategory && selectedCategory !== "all") params.set("category", selectedCategory)

    try {
      if (replace || nextPage === 1) setLoading(true)
      else setLoadingMore(true)

      const res = await fetch(`/api/products?${params.toString()}`, {
        signal: ctrl.signal,
      })
      const raw = await res.json()

      if (Array.isArray(raw)) {
        const mapped = raw.map(mapServerProduct)
        if (replace) {
          setProducts(mapped)
        } else {
          setProducts((prev) => {
            const seen = new Set(prev.map((p) => p.id))
            const toAdd = mapped.filter((p) => !seen.has(p.id))
            return [...prev, ...toAdd]
          })
        }
        setTotalPages(1)
        setPage(1)
      } else {
        const data = raw as ApiListResponse
        const mapped = (data.items ?? []).map(mapServerProduct)
        if (replace) {
          setProducts(mapped)
        } else {
          setProducts((prev) => {
            const seen = new Set(prev.map((p) => p.id))
            const toAdd = mapped.filter((p) => !seen.has(p.id))
            return [...prev, ...toAdd]
          })
        }
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

      {/* Carrusel de categorías con auto-scroll */}
      {catObjects.length > 0 && !catLoading && (
        <div className="max-w-7xl mx-auto py-6">
          <CategoryCarousel
            categories={catObjects}
            selectedCategory={selectedCategory}
            onCategoryChange={(c) => {
              setSelectedCategory(c)
              updateQuery({ category: c === "all" ? undefined : c })
            }}
            onSearchClear={() => {
              setSearchTerm("")
              updateQuery({ q: undefined })
            }}
            autoScrollInterval={2000}
          />
        </div>
      )}

      {/* Título de sección */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Más Vendidos</h2>
      </div>

      {/* Grid de productos */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        {initialLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(limit)].map((_, i) => (
              <WhatsAppProductCardSkeleton key={i} />
            ))}
          </div>
        ) : loading && !initialLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 opacity-60">
            {[...Array(8)].map((_, i) => (
              <WhatsAppProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-white rounded-xl p-8 shadow-sm max-w-md mx-auto">
              <p className="text-gray-600 text-lg mb-4">No se encontraron productos</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedCategory("all")
                  setSearchTerm("")
                  setFilterPrice("all")
                  setMaxPrice(0)
                }}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                Limpiar filtros
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div
              className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 ${loading ? "opacity-50" : ""}`}
            >
              {products.map((p) => (
                <WhatsAppProductCard key={p.id} product={p} />
              ))}
            </div>

            {/* Cargar más */}
            <div className="flex justify-center mt-8">
              {hasMore ? (
                <Button
                  onClick={() => fetchPage(page + 1)}
                  disabled={loadingMore}
                  className="bg-red-600 hover:bg-red-700 text-white px-8"
                >
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
                <span className="text-sm text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm">
                  No hay más productos
                </span>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
