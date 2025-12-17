"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Search, ShoppingCart, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { useCart } from "@/contexts/cart-context"

interface ShopHeaderProps {
  searchTerm?: string
  onSearchChange?: (term: string) => void
  onSearch?: () => void
}

export function ShopHeader({
  searchTerm = "",
  onSearchChange,
  onSearch,
}: ShopHeaderProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const q = searchParams.get('q') ?? ""
  const { items, getTotalPrice } = useCart()
  const [localSearch, setLocalSearch] = useState(q)

  let countItems = items.reduce((prev, curr) => prev + curr.quantity, 0)

  const handleSearchChange = (value: string) => {
    setLocalSearch(value)
    onSearchChange?.(value)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedSearch = localSearch.trim()

    const params = new URLSearchParams()
    const category = searchParams.get('category') ?? undefined
    const pf = searchParams.get("priceFilter") ?? undefined
    const mp = searchParams.get("maxPrice") ?? undefined

    if (trimmedSearch) params.set('q', trimmedSearch)
    if (category) params.set('category', category)
    if (pf) params.set('priceFilter', pf)
    if (mp) params.set('maxPrice', mp)

    const qs = params.toString()
    router.push(qs ? `/l?${qs}` : "/l")
    onSearch?.()
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <>
      <header className="bg-white border-b-2 border-red-600 top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-1 flex-shrink-0">
              <span className="text-xl md:text-[25px] font-bold text-gray-900 tracking-tight">CRISTAL</span>
              <div className="w-10 h-10 md:w-8 md:h-10 rounded-full flex items-center justify-center">
                <Image src="/images/CRISTAL_LOGO.webp" alt="" width={150} height={150} className="h-full w-full" />
              </div>
              <span className="text-lg md:text-[25px] font-bold text-gray-900 tracking-tight">SHOP</span>
            </Link>

            {/* Search Bar */}
            <form onSubmit={handleSubmit} className="flex-1 max-w-2xl hidden sm:flex">
              <div className="flex w-full">
                <Input
                  type="text"
                  placeholder="Buscar..."
                  value={localSearch}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="rounded-r-none border-r-0 border-gray-300 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-gray-300 h-10"
                />
                <Button type="submit" className="rounded-l-none bg-red-600 hover:bg-red-700 h-10 px-6">
                  <Search className="h-5 w-5" />
                </Button>
              </div>
            </form>

            {/* Right Icons */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Mobile Search Button */}
              <Button variant="ghost" size="sm" className="sm:hidden text-red-600 hover:bg-red-50 p-2">
                <Search className="h-5 w-5" />
              </Button>

              {/* Desktop Search Icon */}
              <Button variant="ghost" size="sm" className="hidden sm:flex text-red-600 hover:bg-red-50 p-2">
                <Search className="h-5 w-5" />
              </Button>

              {/* Cart */}
              <Link href="/cart">
                <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 p-2 flex items-center gap-1"
                >
                  <span className="text-sm font-medium hidden md:inline">${formatPrice(getTotalPrice())}</span>
                  <div className="relative">
                    <ShoppingCart className="h-5 w-5" />
                    {items && items.length > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                        {countItems}
                      </span>
                    )}
                  </div>
                </Button>
              </Link>

              {/* User */}
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 p-2">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <form onSubmit={handleSubmit} className="mt-3 sm:hidden">
            <div className="flex w-full">
              <Input
                type="text"
                placeholder="Buscar..."
                value={localSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="rounded-r-none border-r-0 border-gray-300 focus-visible:ring-0 focus-visible:ring-offset-0 h-10"
              />
              <Button type="submit" className="rounded-l-none bg-red-600 hover:bg-red-700 h-10 px-4">
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </form>
        </div>
      </header>
    </>
  )
}
