"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, SlidersHorizontal, ChevronDown, Check } from "lucide-react"

interface ProductFiltersProps {
  categories: string[]
  selectedCategory: string
  onCategoryChange: (category: string) => void
  priceFilter: string
  onPriceFilterChange: (filter: string) => void
  clearFilter: () => void
}

export function ProductFilters({
  categories,
  selectedCategory,
  onCategoryChange,
  priceFilter,
  onPriceFilterChange,
  clearFilter,
}: ProductFiltersProps) {
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  
  // Estados temporales para mobile (solo se aplican al presionar "Aplicar")
  const [tempCategory, setTempCategory] = useState(selectedCategory)
  const [tempPriceFilter, setTempPriceFilter] = useState(priceFilter)

  // Sincronizar estados temporales cuando se abra el modal
  useEffect(() => {
    if (showMobileFilters) {
      setTempCategory(selectedCategory)
      setTempPriceFilter(priceFilter)
    }
  }, [showMobileFilters, selectedCategory, priceFilter])

  const hasActiveFilters = selectedCategory !== "all" || priceFilter !== "all"
  const activeFilterCount = 
    (selectedCategory !== "all" ? 1 : 0) + 
    (priceFilter !== "all" ? 1 : 0)

  const priceOptions = [
    { value: "all", label: "Sin ordenar" },
    { value: "low-to-high", label: "Menor a mayor" },
    { value: "high-to-low", label: "Mayor a menor" },
  ]

  const getPriceLabel = (value: string) => {
    return priceOptions.find(opt => opt.value === value)?.label || "Sin ordenar"
  }

  const getCategoryLabel = (value: string) => {
    return value === "all" ? "Todas las categorías" : value
  }

  const handleApplyFilters = () => {
    onCategoryChange(tempCategory)
    onPriceFilterChange(tempPriceFilter)
    setShowMobileFilters(false)
  }

  const handleClearFilters = () => {
    setTempCategory("all")
    setTempPriceFilter("all")
    clearFilter()
    setShowMobileFilters(false)
  }

  // Componente de Select Custom
  const CustomSelect = ({ 
    value, 
    onChange, 
    options, 
    label,
    getLabel,
    isMobile = false
  }: { 
    value: string
    onChange: (value: string) => void
    options: { value: string; label: string }[]
    label: string
    getLabel: (value: string) => string
    isMobile?: boolean
  }) => {
    const [isOpen, setIsOpen] = useState(false)

    return (
      <div className="relative">
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-left focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all hover:border-gray-400 flex items-center justify-between"
        >
          <span className="truncate">{getLabel(value)}</span>
          <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <>
            <div 
              className={isMobile ? "fixed inset-0 z-[60]" : "fixed inset-0 z-50"}
              onClick={() => setIsOpen(false)}
            />
            <div className={`${isMobile ? "fixed left-4 right-4 z-[70]" : "absolute z-50 w-full"} mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-auto`}>
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                  className={`w-full px-4 py-3 text-sm text-left hover:bg-gray-50 transition-colors flex items-center justify-between border-b border-gray-100 last:border-b-0 ${
                    value === option.value ? 'bg-red-50 text-red-600 font-medium' : 'text-gray-700'
                  }`}
                >
                  <span>{option.label}</span>
                  {value === option.value && (
                    <Check className="h-4 w-4 text-red-600 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  const FilterContent = ({ isMobile = false }: { isMobile?: boolean }) => {
    const currentCategory = isMobile ? tempCategory : selectedCategory
    const currentPriceFilter = isMobile ? tempPriceFilter : priceFilter
    
    const categoryOptions = (categories?.length ? categories : ["all"]).map(c => ({
      value: c,
      label: c === "all" ? "Todas las categorías" : c
    }))

    return (
      <>
        {/* Categoría */}
        <div className="flex-1 min-w-0">
          <CustomSelect
            value={currentCategory}
            onChange={isMobile ? setTempCategory : onCategoryChange}
            options={categoryOptions}
            label="Categoría"
            getLabel={getCategoryLabel}
            isMobile={isMobile}
          />
        </div>

        {/* Orden de precio */}
        <div className="flex-1 min-w-0">
          <CustomSelect
            value={currentPriceFilter}
            onChange={isMobile ? setTempPriceFilter : onPriceFilterChange}
            options={priceOptions}
            label="Ordenar por precio"
            getLabel={getPriceLabel}
            isMobile={isMobile}
          />
        </div>

        {/* Botón limpiar (solo desktop) */}
        {!isMobile && hasActiveFilters && (
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={clearFilter}
              className="w-full md:w-auto h-[42px] border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all"
            >
              <X className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      {/* Vista Desktop */}
      <div className="hidden md:block bg-white/80 border border-gray-200 rounded-xl shadow-sm p-4">
        <div className="flex items-end gap-4">
          <FilterContent isMobile={false} />
        </div>
      </div>

      {/* Vista Mobile - Botón flotante */}
      <div className="md:hidden">
        <Button
          onClick={() => setShowMobileFilters(true)}
          className="w-full bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 text-gray-900 h-12 relative"
          variant="outline"
        >
          <SlidersHorizontal className="h-5 w-5 mr-2" />
          <span className="font-medium">Filtros</span>
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {/* Modal Mobile */}
        {showMobileFilters && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 justify-center">
            <div className="fixed inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl h-[60vh] flex flex-col animate-in slide-in-from-bottom duration-300 z-50">
              {/* Header del modal */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5 text-gray-700" />
                  <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
                  {activeFilterCount > 0 && (
                    <span className="bg-red-600 text-white text-xs font-bold rounded-full px-2 py-0.5">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Contenido del modal */}
              <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                <FilterContent isMobile={true} />
              </div>

              <div className=""></div>
              {/* Footer del modal */}
              <div className="p-4 rounded-t-2xl">
                <div className="flex gap-3">
                  {(tempCategory !== "all" || tempPriceFilter !== "all") && (
                    <Button
                      variant="outline"
                      onClick={handleClearFilters}
                      className="flex-1 border-gray-300"
                    >
                      Limpiar todo
                    </Button>
                  )}
                  <Button
                    onClick={handleApplyFilters}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    Aplicar filtros
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}