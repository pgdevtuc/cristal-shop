import { ShopHeader } from "@/components/layout/whatsapp-header"
import { WhatsAppProductCatalog } from "@/components/products/whatsapp-product-catalog"
import { FloatingCartButton } from "@/components/products/floating-cart-button"
import { Suspense } from "react"
import type { Product } from "@/types/product"

interface SearchParams {
    q?: string
    category?: string
    priceFilter?: string
    page?: string
}

interface PageProps {
    searchParams: SearchParams
}

// Tipos para las respuestas de la API
interface ApiProduct {
    _id?: string
    id?: string
    title?: string
    name?: string
    description?: string
    price?: number
    salePrice?: number | null
    category?: string
    image?: string[]
    stock?: number
    colors?: string[]
}

interface ApiProductsResponse {
    items: ApiProduct[]
    totalPages: number
    currentPage: number
    total: number
}

interface ApiCategory {
    id?: string
    name: string
    count?: number
    image?: string
}

interface ApiCategoriesResponse {
    categories: ApiCategory[]
}

// Helper para construir la URL base
function getBaseUrl() {
    if (process.env.NEXT_PUBLIC_APP_URL) {
        return process.env.NEXT_PUBLIC_APP_URL
    }
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`
    }
    if (process.env.NEXTAUTH_URL) {
        return `${process.env.NEXTAUTH_URL}`
    }
    return "http://localhost:3000"
}

// Función para fetch de productos
async function fetchProducts(params: SearchParams): Promise<{
    products: Product[]
    totalPages: number
    currentPage: number
}> {
    try {
        const baseUrl = getBaseUrl()
        const searchParams = new URLSearchParams()

        const page = Math.max(1, Number(params.page) || 1)
        searchParams.set("page", String(page))
        searchParams.set("limit", "12")

        if (params.q) searchParams.set("q", params.q)
        if (params.category && params.category !== "all") {
            searchParams.set("category", params.category)
        }
        if (params.priceFilter && params.priceFilter !== "all") {
            searchParams.set("priceFilter", params.priceFilter)
        }

        const url = `${baseUrl}/api/products?${searchParams.toString()}`
        const response = await fetch(url, {
            next: { revalidate: 60 }, // Cache por 60 segundos
            headers: { "Content-Type": "application/json" }
        })

        if (!response.ok) {
            throw new Error(`Failed to fetch products: ${response.status}`)
        }

        const data = await response.json()

        // Manejar respuesta como array o como objeto paginado
        if (Array.isArray(data)) {
            return {
                products: data.map(mapProduct),
                totalPages: 1,
                currentPage: 1,
            }
        }

        const apiData = data as ApiProductsResponse
        return {
            products: (apiData.items || []).map(mapProduct),
            totalPages: apiData.totalPages || 1,
            currentPage: apiData.currentPage || page,
        }
    } catch (error) {
        console.error("Error fetching products:", error)
        return {
            products: [],
            totalPages: 1,
            currentPage: 1,
        }
    }
}

function capitalize(str: String) {
    const split = str.split(' ');
    const formated = split.map(s => s[0] + s.slice(1, s.length).toLocaleLowerCase()).join(",").replaceAll(',', ' ');
    return formated
}

// Función para fetch de categorías
async function fetchCategories(): Promise<{
    categories: string[]
    categoryObjects: { id: string; name: string; image?: string }[]
}> {
    try {
        const baseUrl = getBaseUrl()
        const url = `${baseUrl}/api/categories`

        const response = await fetch(url, {
            next: { revalidate: 300 }, // Cache por 5 minutos
            headers: { "Content-Type": "application/json" }
        })

        if (!response.ok) {
            throw new Error(`Failed to fetch categories: ${response.status}`)
        }

        const data: ApiCategoriesResponse = await response.json()

        const categoryObjects = (data.categories || []).map((c) => ({
            id: c.id || c.name,
            name: c.name,
            image: c.image || "",
        }))

        const categoryNames = categoryObjects.map((c) => capitalize(c.name))

        return {
            categories: ["all", ...categoryNames],
            categoryObjects,
        }
    } catch (error) {
        console.error("Error fetching categories:", error)
        return {
            categories: ["all"],
            categoryObjects: [],
        }
    }
}

// Mapper de producto de API a tipo Product
function mapProduct(doc: ApiProduct): Product {
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
        image: doc.image || [],
        stock: Number(doc.stock ?? 0),
        colors: doc.colors ?? [],
    }
}

export default async function FilterPage({ searchParams }: PageProps) {
    // Normalizar parámetros de búsqueda
    const param = await searchParams;
    const normalizedParams: SearchParams = {
        q: param.q?.trim() || "",
        category: param.category?.trim() || "all",
        priceFilter: param.priceFilter?.trim() || "all",
        page: param.page || "1",
    }

    // Fetch paralelo de productos y categorías
    const [productsData, categoriesData] = await Promise.all([
        fetchProducts(normalizedParams),
        fetchCategories(),
    ])

    return (
        <div className="min-h-screen">
            <Suspense
                fallback={
                    <div className="flex items-center justify-center p-4">
                        <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-primary rounded-full" />
                    </div>
                }
            >
                <ShopHeader />
            </Suspense>

            <main>
                <WhatsAppProductCatalog
                    initialProducts={productsData.products}
                    initialCatObjects={categoriesData.categoryObjects}
                    initialCategories={categoriesData.categories}
                    initialSearchTerm={normalizedParams.q}
                    initialCategory={normalizedParams.category}
                    initialPriceFilter={normalizedParams.priceFilter}
                    initialPage={productsData.currentPage}
                    initialTotalPages={productsData.totalPages}
                />
            </main>
        </div>
    )
}