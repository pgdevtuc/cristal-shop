"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Loader2 } from "lucide-react"
import { Product } from "@/types/product"
import { formatPrice } from "@/lib/formatPrice"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"

interface ProductTableProps {
  products: Product[]
  loading: boolean
  onEdit: (product: Product) => void
  onDelete: (productId: string) => void
}

export function ProductTable({ products, loading, onEdit, onDelete }: ProductTableProps) {
  if (loading) {
    return (
      <div className="min-h-screen pt-24">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <span className="ml-2 text-gray-600">Cargando productos...</span>
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-gray-600 mb-4">No hay productos registrados</p>
          <p className="text-sm text-gray-500">Agrega tu primer producto o importa un archivo CSV</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-gray-50">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">Imagen</TableHead>
            <TableHead>Producto</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Precio</TableHead>
            <TableHead className="text-center">ID kiboo</TableHead>
            <TableHead className="text-center">Stock</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const hasDiscount = product.salePrice &&
              product.salePrice > 0 &&
              product.salePrice < product.price

            const discountPercentage = hasDiscount && product.salePrice && product.salePrice > 0
              ? Math.round(((product.price - product.salePrice!) / product.price) * 100)
              : null

            return (
              <TableRow key={product.id} className="hover:bg-gray-200/80">
                <TableCell>
                  <Image
                    src={Array.isArray(product.image) ? product.image[0] ?? "/placeholder.svg" : product.image ?? "/placeholder.svg"}
                    alt={product.name}
                    width={60}
                    height={60}
                    className="rounded object-contain"
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500 line-clamp-1">{product.description}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {product.category}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {product.salePrice && product.salePrice < product.price ? (
                      <>
                        <span className="font-bold text-green-600">
                          {(product as any)?.currency ?? "ARS"} ${formatPrice(product.salePrice)}
                        </span>
                        <span className="text-sm text-gray-500 line-through">
                          ${formatPrice(product.price)}
                        </span>
                        {discountPercentage && (
                          <Badge className="bg-red-500 w-fit text-xs">
                            -{discountPercentage}%
                          </Badge>
                        )}
                      </>
                    ) : (
                      <span className="font-bold text-gray-900">
                        {(product as any)?.currency ?? "ARS"} ${formatPrice(product.price)}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className={`font-medium`}>
                    {product.kibooId ?? ""}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className={`font-medium ${product.stock === 0 ? 'text-red-600' : product.stock <= 5 ? 'text-yellow-600' : 'text-gray-900'}`}>
                    {product.stock}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {product.stock === 0 && (
                      <Badge variant="destructive" className="w-fit">Agotado</Badge>
                    )}
                    {product.stock > 0 && product.stock <= 5 && (
                      <Badge variant="outline" className="bg-yellow-100 w-fit ">
                        Poco Stock
                      </Badge>
                    )}
                    {product.stock > 5 && (
                      <Badge variant="outline" className="bg-green-100 w-fit">
                        Disponible
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(product)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDelete(product.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}