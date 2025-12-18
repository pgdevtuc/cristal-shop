"use client"

import { Suspense } from "react"
import OrdersView from "@/components/orders/orderView"
export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-primary rounded-full" />
        </div>
      }
    >
      <main>
        <OrdersView />
      </main>
    </Suspense>
  )
}