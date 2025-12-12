"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react"
import { format } from "date-fns"
import { ca, es } from "date-fns/locale"
import { IOrder } from "@/types/order"
import Image from "next/image"
import EditOrderModal from "@/components/orders/EditOrderModal"

interface OrderCardProps {
  order: IOrder
  onStatusChange: (orderId: string, newStatus: IOrder["status"]) => void
  onUpdated?: () => void
}

export default function OrderCard({ order, onStatusChange, onUpdated }: OrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)

  const getStatusColor = (status: IOrder["status"]) => {
    switch (status) {
      case "CREATED":
        return "bg-yellow-500 text-white hover:bg-yellow-600"
      case "PAYMENT_FAILED":
        return "bg-red-600 text-white hover:bg-red-700"
      case "PAID":
        return "bg-green-600 text-white hover:bg-green-700"
      case "PREPARING":
        return "bg-blue-500 text-white hover:bg-blue-600"
      case "READY":
        return "bg-purple-500 text-white hover:bg-purple-600"
      case "IN_TRANSIT":
        return "bg-indigo-500 text-white hover:bg-indigo-600"
      case "DELIVERED":
        return "bg-green-700 text-white hover:bg-green-800"
      case "CANCELLED":
        return "bg-gray-500 text-white hover:bg-gray-600"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getPaymentStatusSpanish = (status: string) => {
    switch (status) {
      case "SCANNED":
        return "QR escaneado"
      case "PROCESSING":
        return "En proceso"
      case "REJECTED":
        return "Rechazado"
      case "ACCEPTED":
        return "Pagado"
      default:
        return status || "Sin pago"
    }
  }

  const getStatusLabel = (status: IOrder["status"]) => {
    switch (status) {
      case "CREATED":
        return "Creada"
      case "PAYMENT_FAILED":
        return "Pago rechazado"
      case "PAID":
        return "Pagada"
      case "PREPARING":
        return "Preparando"
      case "READY":
        return "Listo"
      case "IN_TRANSIT":
        return "En camino"
      case "DELIVERED":
        return "Entregado"
      case "CANCELLED":
        return "Cancelada"
      default:
        return status
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getAllowedNextStatuses = (): IOrder["status"][] => {
    const current = order.status
    const flow: IOrder["status"][] = order.shipping
      ? ["PAID", "PREPARING", "READY", "IN_TRANSIT", "DELIVERED"]
      : ["PAID", "PREPARING", "READY", "DELIVERED"]

    if (current === "DELIVERED" || current === "CANCELLED") return []
    if (current === "CREATED") return ["PAID", "CANCELLED"]
    if (current === "PAYMENT_FAILED") return ["CANCELLED"]

    const idx = flow.indexOf(current)
    if (idx >= 0 && idx < flow.length - 1) {
      return [flow[idx + 1], "CANCELLED"]
    }
    return []
  }

  return (
    <Card className="mb-4">
      <CardContent className="p-3 md:p-4">
        <div className="space-y-3 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          {/* Primera fila: Botón expandir, ID de orden y badge de estado */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              <Button variant="ghost" size="sm" className="p-1">
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
              <span className="font-medium text-sm md:text-base">ID #{order._id}</span>
              <Badge className={getStatusColor(order.status)}>{getStatusLabel(order.status)}</Badge>
              <Badge className={`${order.shipping ? "bg-green-400 hover:bg-green-500 text-gray-600" : "bg-gray-300 hover:bg-gray-100 text-gray-600"}`}>{order.shipping ? "Con Envío" : "Sin Envío"}</Badge>
              <Badge className={`${order.paymentStatus === "ACCEPTED" ? "bg-green-600 hover:bg-green-500 text-white" : order.paymentStatus === "REJECTED" ? "bg-red-600 hover:bg-red-400 text-white" : order.paymentStatus === "PROCESSING" || order.paymentStatus === "SCANNED" ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-gray-500 hover:bg-gray-500 text-white"}`}>{getPaymentStatusSpanish(order.paymentStatus ?? "")}</Badge>

            </div>
          </div>

          {/* Segunda fila: Información del cliente y orden */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs md:text-sm text-muted-foreground pl-8 md:pl-12">
            <div>
              <span className="block font-medium text-foreground truncate">{order.customerName}</span>
            </div>
            <div>
              <span className="block">{format(new Date(order.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}</span>
            </div>
            <div>
              <span className="block font-semibold text-foreground">{formatCurrency(order.totalAmount)}</span>
            </div>
            <div>
              <span className="block">{order.items.length} prod.</span>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 md:mt-6 pl-4 md:pl-8 border-t pt-4">
            <div className="mb-4 md:flex md:justify-between md:items-center md:mb-6">
              <div>
                <h4 className="font-medium mb-2">Detalles de la orden</h4>
              </div>
              <div className="flex justify-center md:justify-end mb-4 gap-2">
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsEditOpen(true)
                  }}
                  className="w-full md:w-auto"
                >
                  Editar
                </Button>
                <Select
                  value={order.status}
                  onValueChange={(newStatus: IOrder["status"]) => onStatusChange(order._id, newStatus)}
                >
                  <SelectTrigger className="w-full md:w-56">
                    <SelectValue placeholder="Cambiar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAllowedNextStatuses().length === 0 ? (
                      <SelectItem value={order.status} disabled>
                        {getStatusLabel(order.status)}
                      </SelectItem>
                    ) : (
                      getAllowedNextStatuses().map((st) => (
                        <SelectItem key={st} value={st}>
                          {getStatusLabel(st)}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Productos */}
            <div className="space-y-3 mb-6">
              {order.items.map((item, index) => (
                <div key={index} className="flex gap-3 p-3 md:p-4 bg-gray-50 rounded-lg">
                  {item.image && (
                    <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-gray-200">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h5 className="font-semibold text-base md:text-lg mb-2">{item.name}</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Cantidad: </span>
                        <span>{item.quantity}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Precio: </span>
                        <span>{formatCurrency(item.price)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Subtotal: </span>
                        <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Información adicional */}
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Cliente: </span>
                  <span className="font-medium">{order.customerName}</span>
                </div>
                {order.customerAddress && (
                  <div>
                    <span className="text-muted-foreground">Dirección: </span>
                    <span>{order.customerAddress}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Telefono: </span>
                  <span>{order.customerPhone}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Fecha: </span>
                  <span>{format(new Date(order.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}</span>
                </div>
                {order.viumiOrderNumber && (
                  <div>
                    <span className="text-muted-foreground">N° Orden Viumi: </span>
                    <span className="font-mono text-xs">{order.viumiOrderNumber}</span>
                  </div>
                )}
                {order.viumiOrderId && (
                  <div>
                    <span className="text-muted-foreground">ID Viumi: </span>
                    <span className="font-mono text-xs">{order.viumiOrderId}</span>
                  </div>
                )}
                {order.paymentId && (
                  <div>
                    <span className="text-muted-foreground">ID Pago: </span>
                    <span>{order.paymentId}</span>
                  </div>
                )}
                {order.authorizationCode && (
                  <div>
                    <span className="text-muted-foreground">Código Autorización: </span>
                    <span className="font-mono">{order.authorizationCode}</span>
                  </div>
                )}
                {order.refNumber && (
                  <div>
                    <span className="text-muted-foreground">Ref. Número: </span>
                    <span className="font-mono">{order.refNumber}</span>
                  </div>
                )}
                {order.paymentStatus && (
                  <div>
                    <span className="text-muted-foreground">Estado de pago: </span>
                    <span className={order.paymentStatus === "ACCEPTED" ? "text-green-600 font-medium" : order.paymentStatus === "REJECTED" ? "text-red-600 font-medium" : ""}>
                      {getPaymentStatusSpanish(order.paymentStatus)}
                    </span>
                  </div>
                )}
              </div>

              {/* Link de checkout si está pendiente */}

              {/* Total */}
              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <span className="text-muted-foreground">Total:</span>
                <span className="text-xl md:text-2xl font-bold">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>
        )}
        {/* Edit Modal */}
        <EditOrderModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          order={order}
          onOrderUpdated={() => {
            setIsEditOpen(false)
            onUpdated && onUpdated()
          }}
        />
      </CardContent>
    </Card>
  )
}
