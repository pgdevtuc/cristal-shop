"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { WhatsAppProductCard } from "./whatsapp-product-card"
import { WhatsAppProductCardSkeleton } from "./whatsapp-product-card-skeleton"
import { ProductFilters } from "./product-filters"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import type { ApiListResponse } from "@/types/IWhatsappProductCatalog"
import type { Product } from "@/types/product"
import { useSearchParams, useRouter, usePathname } from "next/navigation"

// Hook de debounce optimizado
function useDebounce<T>(value: T, delay = 450): T {
  const [debounced, setDebounced] = useState(value)
  
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  
  return debounced
}

// Mapper de productos
function mapServerProduct(doc: any): Product {
  return {
    id: String(doc._id ?? doc.id ?? ""),
    name: doc.title ?? doc.name ?? "",
    description: doc.description ?? "",
    salePrice:
      doc.salePrice !== null && doc.salePrice !== undefined
        ? Number(doc.salePrice)
        : Number(doc.price ?? 0),
    price: doc.price !== undefined && doc.price !== null ? Number(doc.price) : 0,
    category: doc.category ?? "",
    image: doc.image,
    stock: Number(doc.stock ?? 0),
    colors: doc.colors ?? false,
  }
}

interface WhatsAppProductCatalogProps {
  initialProducts?: Product[]
  initialCatObjects?: { id: string; name: string; image?: string }[]
  initialCategories?: string[]
  initialSearchTerm?: string
  initialCategory?: string
  initialPriceFilter?: string
  initialPage?: number
  initialTotalPages?: number
}

export const WhatsAppProductCatalog: React.FC<WhatsAppProductCatalogProps> = ({
  initialProducts = [],
  initialCatObjects = [],
  initialCategories = ["all"],
  initialSearchTerm = "",
  initialCategory = "all",
  initialPriceFilter = "all",
  initialPage = 1,
  initialTotalPages = 1,
}) => {
  // Estados de productos y paginación
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [page, setPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(initialTotalPages)

  // Estados de carga
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [initialLoading, setInitialLoading] = useState(initialProducts.length === 0)

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm)
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [filterPrice, setFilterPrice] = useState(initialPriceFilter)
  
  const debouncedSearch = useDebounce(searchTerm, 450)

  // Estados de categorías
  const [categories, setCategories] = useState<string[]>(initialCategories)
  const [catObjects, setCatObjects] = useState<{ id: string; name: string; image?: string }[]>(
    initialCatObjects
  )

  // Referencias
  const abortRef = useRef<AbortController | null>(null)
  const isInitialMount = useRef(true)
  const isFetchingRef = useRef(false)

  // Hooks de navegación
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const limit = 12

  // Función para actualizar query params en URL
  const updateQuery = useCallback(
    (updates: Record<string, string | undefined>) => {
      const sp = new URLSearchParams(searchParams.toString())
      
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === "" || value === "all") {
          sp.delete(key)
        } else {
          sp.set(key, value)
        }
      })

      router.push(`${pathname}?${sp.toString()}`, { scroll: false })
    },
    [searchParams, router, pathname]
  )

  // Función para cargar categorías
  const loadCategories = useCallback(async () => {
    if (initialCatObjects.length > 0) return

    try {
      const res = await fetch("/api/categories")
      if (!res.ok) throw new Error("Failed to fetch categories")

      const data = await res.json()
      const names = data.categories?.map((c: any) => c.name) ?? []
      const objs =
        data.categories?.map((c: any) => ({
          id: c.id ?? c.name,
          name: c.name,
          image: c.image || "",
        })) ?? []

      setCategories(["all", ...names])
      setCatObjects(objs)
    } catch (error) {
      console.error("Error loading categories:", error)
      setCategories(["all"])
      setCatObjects([])
    }
  }, [initialCatObjects.length])

  // Función principal de fetch de productos
  const fetchProducts = useCallback(
    async (
      targetPage: number,
      shouldReplace: boolean,
      options?: {
        search?: string
        category?: string
        priceFilter?: string
      }
    ) => {
      // Prevenir múltiples fetches simultáneos
      if (isFetchingRef.current) return
      isFetchingRef.current = true

      // Cancelar fetch anterior
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      const params = new URLSearchParams()
      params.set("page", String(targetPage))
      params.set("limit", String(limit))

      const searchValue = options?.search ?? debouncedSearch
      const categoryValue = options?.category ?? selectedCategory
      const priceValue = options?.priceFilter ?? filterPrice

      if (searchValue) params.set("q", searchValue)
      if (categoryValue && categoryValue !== "all") params.set("category", categoryValue)
      if (priceValue && priceValue !== "all") params.set("priceFilter", priceValue)

      try {
        // Actualizar estado de carga
        if (shouldReplace || targetPage === 1) {
          setLoading(true)
        } else {
          setLoadingMore(true)
        }

        const res = await fetch(`/api/products?${params.toString()}`, {
          signal: controller.signal,
        })

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)

        const data = await res.json()

        // Manejar diferentes formatos de respuesta
        if (Array.isArray(data)) {
          const mapped = data.map(mapServerProduct)
          setProducts(shouldReplace ? mapped : (prev) => [...prev, ...mapped])
          setTotalPages(1)
          setPage(targetPage)
        } else {
          const apiData = data as ApiListResponse
          const mapped = (apiData.items ?? []).map(mapServerProduct)

          if (shouldReplace) {
            setProducts(mapped)
          } else {
            setProducts((prev) => {
              const seen = new Set(prev.map((p) => p.id))
              const toAdd = mapped.filter((p) => !seen.has(p.id))
              return [...prev, ...toAdd]
            })
          }

          setTotalPages(apiData.totalPages || 1)
          setPage(targetPage)
        }
      } catch (error: any) {
        if (error?.name !== "AbortError") {
          console.error("Error fetching products:", error)
        }
      } finally {
        setLoading(false)
        setLoadingMore(false)
        setInitialLoading(false)
        isFetchingRef.current = false
      }
    },
    [debouncedSearch, selectedCategory, filterPrice]
  )

  // Efecto de inicialización
  useEffect(() => {
    loadCategories()

    // Solo hacer fetch inicial si no hay productos
    if (initialProducts.length === 0) {
      const q = searchParams.get("q") || ""
      const cat = searchParams.get("category") || "all"
      const pf = searchParams.get("priceFilter") || "all"

      fetchProducts(1, true, {
        search: q,
        category: cat,
        priceFilter: pf,
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sincronizar filtros desde URL
  useEffect(() => {
    const q = searchParams.get("q") || ""
    const cat = searchParams.get("category") || "all"
    const pf = searchParams.get("priceFilter") || "all"

    setSearchTerm(q)
    setSelectedCategory(cat)
    setFilterPrice(pf)
  }, [searchParams])

  // Efecto para cambios en filtros (después del mount inicial)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    // Resetear página y hacer fetch
    setPage(1)
    fetchProducts(1, true)
  }, [debouncedSearch, selectedCategory, filterPrice]) // eslint-disable-line react-hooks/exhaustive-deps

  // Handlers de filtros
  const handleCategoryChange = useCallback(
    (category: string) => {
      setSelectedCategory(category)
      updateQuery({ category: category === "all" ? undefined : category })
    },
    [updateQuery]
  )

  const handlePriceFilterChange = useCallback(
    (priceFilter: string) => {
      setFilterPrice(priceFilter)
      updateQuery({ priceFilter: priceFilter === "all" ? undefined : priceFilter })
    },
    [updateQuery]
  )

  const handleClearFilters = useCallback(() => {
    setSelectedCategory("all")
    setFilterPrice("all")
    setSearchTerm("")
    updateQuery({ category: undefined, priceFilter: undefined, q: undefined })
  }, [updateQuery])

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && page < totalPages) {
      fetchProducts(page + 1, false)
    }
  }, [loadingMore, page, totalPages, fetchProducts])

  const hasMore = page < totalPages

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Filtros */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <ProductFilters
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          priceFilter={filterPrice}
          onPriceFilterChange={handlePriceFilterChange}
          clearFilter={handleClearFilters}
        />
      </div>

      {/* Título */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Más Vendidos</h2>
      </div>

      {/* Grid de productos */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        {initialLoading ? (
          // Skeleton loading
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: limit }).map((_, i) => (
              <WhatsAppProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          // Sin resultados
          <div className="text-center py-20">
            <div className="bg-white rounded-xl p-8 shadow-sm max-w-md mx-auto">
              <p className="text-gray-600 text-lg mb-4">No se encontraron productos</p>
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                Limpiar filtros
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Grid con overlay de loading */}
            <div className="relative">
              <div
                className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 transition-opacity ${
                  loading ? "opacity-50" : ""
                }`}
              >
                {products.map((product) => (
                  <WhatsAppProductCard key={product.id} product={product} />
                ))}
              </div>

              {loading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              )}
            </div>

            {/* Botón cargar más */}
            <div className="flex justify-center mt-8">
              {hasMore ? (
                <Button
                  onClick={handleLoadMore}
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