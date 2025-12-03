"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Download } from "lucide-react";
import { ProductForm } from "./product-form";
import { ProductsContainer } from "@/components/admin/ProductContainer";
import { ImportDialog } from "./import-dialog";
import type {  Product } from "@/types/product";
import { toast } from "sonner"

export function ProductManagement() {
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const bumpRefresh = () => setRefreshToken((x) => x + 1);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este producto?")) return;
    const res = await fetch(`/api/products?id=${productId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error("Error deleting product:", data?.error || res.statusText);
      toast.error("Error al eliminar el producto", {position:"top-center",style:{color:"red"},duration:3000});
    }else{
      toast.success("Producto eliminado", {position:"top-center",style:{color:"green"},duration:3000});
    }
  };


  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Productos</h1>
          <p className="text-gray-600">Administra tu catálogo de productos</p>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => setShowImport(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Button onClick={() => { setEditingProduct(null); setShowForm(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Producto
          </Button>
        </div>
      </div>

      {/* Contenedor: busca, pagina, muestra stats y la grilla */}
      <ProductsContainer
        onEdit={handleEdit}
        onDelete={handleDelete}
        refreshToken={refreshToken}
      />

      {/* Modal de formulario */}
      {showForm && (
        <ProductForm
          product={editingProduct}
          onSave={() => { setShowForm(false); setEditingProduct(null); bumpRefresh();  }}
          onCancel={() => { setShowForm(false); setEditingProduct(null); }}
        />
      )}

      {showImport && (
        <ImportDialog
          onClose={() => setShowImport(false)}
          onImportComplete={() => { setShowImport(false); bumpRefresh(); }}
        />
      )}
    </div>
  );
}
