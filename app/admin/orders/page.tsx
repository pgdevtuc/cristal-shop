"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import OrderFilters from "@/components/orders/OrderFilters"
import OrderCard from "@/components/orders/OrderCard"
import CreateOrderModal from "@/components/orders/CreateOrderModal"
import { toast } from "sonner"
import { IOrder } from "@/types/order"
import { AdminHeader } from "@/components/admin/AdminHeader"
import { OrderStats } from "@/components/orders/OrderStats"
import type { DateRange } from "react-day-picker"

export default function OrdersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [orders, setOrders] = useState<IOrder[]>([])
  const [filteredOrders, setFilteredOrders] = useState<IOrder[]>([])
  
  // Inicializar desde URL
  const [phoneFilter, setPhoneFilter] = useState(searchParams.get("phone") || "")
  const [debouncedPhoneFilter, setDebouncedPhoneFilter] = useState(searchParams.get("phone") || "")
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status")?.toUpperCase() || "Todos")
  const [shippingFilter, setShippingFilter] = useState(searchParams.get("shipping") || "Todos")
  const [statusRefresh, SetStatusRefresh] = useState("")
  
  // Inicializar dateRange desde URL
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const fromParam = searchParams.get("dateFrom")
    const toParam = searchParams.get("dateTo")
    
    if (fromParam && toParam) {
      return {
        from: new Date(fromParam),
        to: new Date(toParam),
      }
    }
    
    const today = new Date()
    return { from: today, to: today }
  })
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Debounce del teléfono
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedPhoneFilter(phoneFilter)
    }, 1200)
    return () => clearTimeout(handler)
  }, [phoneFilter])

  // Función para actualizar la URL
  const updateURL = (phone: string, status: string, shipping: string, range?: DateRange) => {
    const params = new URLSearchParams()

    if (phone) params.set("phone", phone)
    if (status && status !== "Todos") params.set("status", status)
    if (shipping && shipping !== "Todos") params.set("shipping", shipping)
    if (range?.from) params.set("dateFrom", range.from.toISOString())
    if (range?.to) params.set("dateTo", range.to.toISOString())

    const newURL = params.toString() ? `?${params.toString()}` : window.location.pathname
    router.push(newURL, { scroll: false })
  }

  const fetchOrders = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()

      if (debouncedPhoneFilter) params.append("phone", debouncedPhoneFilter)
      if (statusFilter !== "Todos") params.append("status", statusFilter)
      if (shippingFilter !== "Todos") params.append("shipping", shippingFilter)

      if (dateRange?.from) params.append("dateFrom", dateRange.from.toISOString())
      if (dateRange?.to) params.append("dateTo", dateRange.to.toISOString())

      const response = await fetch(`/api/orders?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
        setFilteredOrders(data)
      } else {
        throw new Error("Response not ok")
      }
    } catch (error) {
      toast.error("Error", { position: "top-center", style: { color: "red" }, duration: 3000 })
    } finally {
      setIsLoading(false)
    }
  }

  // Actualizar URL cuando cambian los filtros
  useEffect(() => {
    updateURL(debouncedPhoneFilter, statusFilter, shippingFilter, dateRange)
  }, [debouncedPhoneFilter, statusFilter, shippingFilter, dateRange?.from?.toISOString(), dateRange?.to?.toISOString()])

  // Fetch cuando cambian los filtros
  useEffect(() => {
    fetchOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedPhoneFilter,
    statusFilter,
    shippingFilter,
    dateRange?.from?.toISOString(),
    dateRange?.to?.toISOString(),
  ])

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      })

      if (response.ok) {
        toast.success("Estado de la orden actualizado", { position: "top-center", style: { color: "green" }, duration: 3000 })
        SetStatusRefresh(newStatus)
        fetchOrders()
      } else {
        throw new Error("Update failed")
      }
    } catch (error) {
      toast("Error al actualizar el estado", { position: "top-center", style: { color: "red" }, duration: 3000 })
    }
  }

  const handleClearFilters = () => {
    setPhoneFilter("")
    setDebouncedPhoneFilter("")
    setStatusFilter("Todos")
    setShippingFilter("Todos")
    const today = new Date()
    setDateRange({ from: today, to: today })
  }

  const handleOrderCreated = () => {
    fetchOrders()
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-balance">Órdenes</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">Gestiona pedidos y ventas</p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Orden
          </Button>
        </div>

        <OrderStats status={statusRefresh} />

        {/* Filters */}
        <OrderFilters
          phoneFilter={phoneFilter}
          setPhoneFilter={setPhoneFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          shippingFilter={shippingFilter}
          setShippingFilter={setShippingFilter}
          dateRange={dateRange}
          setDateRange={setDateRange}
          onClearFilters={handleClearFilters}
        />

        {/* Orders List */}
        <div className="space-y-4">
          {isLoading && (
            <div className="container mx-auto p-6">
              <div className="flex items-center justify-center h-64">
                <div className="text-lg">Cargando órdenes...</div>
              </div>
            </div>
          )}

          {!isLoading && filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No se encontraron órdenes</p>
            </div>
          ) : (
            !isLoading &&
            filteredOrders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                onStatusChange={handleStatusChange}
                onUpdated={fetchOrders}
              />
            ))
          )}
        </div>

        {/* Create Order Modal */}
        <CreateOrderModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onOrderCreated={handleOrderCreated}
        />
      </div>
    </div>
  )
}