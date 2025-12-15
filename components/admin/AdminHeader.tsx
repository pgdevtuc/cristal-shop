"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, Package, BarChart3 } from "lucide-react"
import { usePathname } from "next/navigation"

export function AdminHeader() {
  const pathname=usePathname();
  return (
    <header className="bg-white shadow-sm border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="font-semibold text-xl text-gray-900">Cristal Shop</span>
            </div>
            <span className="text-gray-300">|</span>
            <span className="text-gray-600 font-light">Panel Administrativo</span>
          </div>

          <nav className="flex items-center space-x-2">
            <Link href="/admin/orders">
              <Button variant="ghost" size="sm" className={`hover:bg-red-50 hover:text-red-700 ${pathname==="/admin/orders"?"bg-red-50 text-red-700":""}`}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Pedidos
              </Button>
            </Link>
            <Link href="/admin/products">
              <Button variant="ghost" size="sm" className={`hover:bg-red-50 hover:text-red-700 ${pathname==="/admin/products"?"bg-red-50 text-red-700":""}`}>
                <Package className="h-4 w-4 mr-2" />
                Productos
              </Button>
            </Link>
            <Link href="/admin/category">
              <Button variant="ghost" size="sm" className={`hover:bg-red-50 hover:text-red-700 ${pathname==="/admin/category"?"bg-red-50 text-red-700":""}`}>
                <Package className="h-4 w-4 mr-2" />
                Categorias
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="sm" className="border-red-200 hover:bg-red-50">
                <Home className="h-4 w-4 mr-2" />
                Ver Tienda
              </Button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
