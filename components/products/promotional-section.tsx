"use client"

import { ChevronLeft, ChevronRight, Flame, Zap } from "lucide-react"
import { useRef, useState, useEffect } from "react"
import { PromoProductCard } from "./promo-product-card"
import { Button } from "@/components/ui/button"
import type { Product } from "@/types/product"

interface PromotionalSectionProps {
  products: Product[]
}

export function PromotionalSection({ products }: PromotionalSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    checkScroll()
    const ref = scrollRef.current
    if (ref) {
      ref.addEventListener("scroll", checkScroll)
      return () => ref.removeEventListener("scroll", checkScroll)
    }
  }, [products])

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  if (products.length === 0) return null

  return (
    <section className="relative whatsapp-bg py-12 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-500 rounded-2xl blur-lg opacity-50 animate-pulse" />
              <div className="relative bg-gradient-to-r from-red-600 to-orange-500 p-4 rounded-2xl">
                <Flame className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3">
                <span className="bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">
                  Ofertas Relámpago
                </span>
                <Zap className="h-8 w-8 text-yellow-500 fill-yellow-500 animate-bounce" />
              </h2>
              <p className="text-gray-600 mt-1 font-medium">
                ¡Aprovechá estos precios increíbles antes de que se acaben!
              </p>
            </div>
          </div>

          {/* Navigation buttons - Desktop only */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className="rounded-full bg-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed border-2 border-red-100 hover:border-red-300"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className="rounded-full bg-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed border-2 border-red-100 hover:border-red-300"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Products carousel */}
        <div className="relative">
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {products.map((product,i) => (
              <div key={i} className="flex-none w-[280px] md:w-[320px]">
                <PromoProductCard product={product} />
              </div>
            ))}
          </div>

          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-4 w-12 bg-gradient-to-r from-[#ECE5DD] to-transparent pointer-events-none" />
          )}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-[#ECE5DD] to-transparent pointer-events-none" />
          )}
        </div>

        {/* Mobile navigation hint */}
        <div className="md:hidden flex justify-center mt-6 gap-2">
          {products.map((_, i) => (
            <div key={i} className="h-2 w-2 rounded-full bg-red-300" />
          ))}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  )
}
