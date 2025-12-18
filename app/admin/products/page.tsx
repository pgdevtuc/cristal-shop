import { ProductManagement } from "@/components/admin/ProductMagnament"
import { AdminHeader } from "@/components/admin/AdminHeader"
import { Suspense } from "react"

export default function AdminProductsPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-primary rounded-full" />
          </div>
        }
      >
        <AdminHeader />
        <main className="container mx-auto px-4 py-8">
          <ProductManagement />
        </main>
      </Suspense>
    </div>
  )
}
