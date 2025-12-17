"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"

interface CategoryItem {
  id: string
  name: string
  image?: string
}

interface CategoryCarouselProps {
  categories: CategoryItem[]
  selectedCategory: string
  onCategoryChange: (category: string) => void
  onSearchClear?: () => void
  autoScrollInterval?: number
}

export function CategoryCarousel({
  categories,
  selectedCategory,
  onCategoryChange,
  onSearchClear,
  autoScrollInterval = 2000,
}: CategoryCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const visibleCategories = [...categories,...categories,...categories]
  const totalCategories = visibleCategories.length

  const goToNext = useCallback(() => {
    if (isTransitioning || totalCategories === 0) return
    setIsTransitioning(true)
    setCurrentIndex((prev) => (prev + 1) % totalCategories)
    setTimeout(() => setIsTransitioning(false), 700)
  }, [totalCategories, isTransitioning])

  const goToPrev = useCallback(() => {
    if (isTransitioning || totalCategories === 0) return
    setIsTransitioning(true)
    setCurrentIndex((prev) => (prev - 1 + totalCategories) % totalCategories)
    setTimeout(() => setIsTransitioning(false), 700)
  }, [totalCategories, isTransitioning])

  useEffect(() => {
    if (isPaused || totalCategories === 0) return

    const interval = setInterval(() => {
      goToNext()
    }, autoScrollInterval)

    return () => clearInterval(interval)
  }, [isPaused, autoScrollInterval, goToNext, totalCategories])


  return (
    <div className="relative w-full" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
      {/* Flecha izquierda */}
      <button
        onClick={goToPrev}
        disabled={isTransitioning}
        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center bg-white hover:bg-gray-50 rounded-full shadow-lg transition-colors disabled:opacity-50"
        aria-label="Anterior"
        type="button"
      >
        <ChevronLeft className="h-7 w-7 text-red-600" strokeWidth={3} />
      </button>

      <div className="overflow-hidden py-6 px-14 md:px-20">
        <div
          ref={containerRef}
          className="flex gap-5"
          style={{
            transform: `translateX(-${currentIndex * 300}px)`,
            transition: "transform 700ms cubic-bezier(0.4, 0, 0.2, 1)",
            willChange: "transform",
          }}
        >
          {visibleCategories.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => {
                onCategoryChange(cat.name)
                onSearchClear?.()
              }}
              className={`
                relative flex-shrink-0 rounded-2xl overflow-hidden
                transition-all duration-500 ease-in-out
                min-w-[280px] md:min-w-[320px] lg:min-w-[380px]
                h-48 md:h-56 lg:h-64
                ${
                  selectedCategory.toUpperCase() === cat.name.toLocaleLowerCase()
                    ? "ring-4 ring-red-600 ring-offset-2 scale-[1.02]"
                    : "hover:ring-2 hover:ring-red-400 hover:ring-offset-1"
                }
              `}
              type="button"
            >
              {/* Imagen de fondo */}
              {cat.image ? (
                <Image
                  src={cat.image || "/placeholder.svg"}
                  alt={cat.name}
                  fill
                  sizes="(min-width: 1024px) 380px, (min-width: 768px) 320px, 280px"
                  className="object-cover"
                  priority={idx < 4}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
              )}

              {/* Overlay con gradiente */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />

              {/* Texto de categoría */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white font-bold text-2xl md:text-3xl lg:text-4xl uppercase tracking-wider text-center px-6 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                  {cat.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Flecha derecha */}
      <button
        onClick={goToNext}
        disabled={isTransitioning}
        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center bg-white hover:bg-gray-50 rounded-full shadow-lg transition-colors disabled:opacity-50"
        aria-label="Siguiente"
        type="button"
      >
        <ChevronRight className="h-7 w-7 text-red-600" strokeWidth={3} />
      </button>

    </div>
  )
}
