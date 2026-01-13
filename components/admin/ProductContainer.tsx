"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LayoutGrid, List } from "lucide-react";
import { ProductList } from "./product-list";
import { ProductTable } from "./product-table";
import { Product } from "@/types/product";

type Summary = { inStock: number; outOfStock: number; discounted: number };
type ViewMode = "grid" | "table";

function useDebounce<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function ProductsContainer({
  onEdit,
  onDelete,
  refreshToken = 0,
}: {
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
  refreshToken?: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Inicializar estados desde URL
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [limit] = useState(12);
  const [loading, setLoading] = useState(false);
  const [stockFilter, setStockFilter] = useState<string>(searchParams.get("filter") || "all");
  const [viewMode, setViewMode] = useState<ViewMode>((searchParams.get("view") as ViewMode) || "table");
  const [category, setCategory] = useState<string>(searchParams.get("category") || "");

  const debouncedQuery = useDebounce(q, 1000);

  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState<Summary>({ inStock: 0, outOfStock: 0, discounted: 0 });

  // categories list for the category filter
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  // jump page input state
  const [jumpPage, setJumpPage] = useState<string>(String(page));

  // Función para actualizar la URL
  const updateURL = (newPage: number, newQuery: string, newFilter: string, newView: ViewMode, newCategory: string) => {
    const params = new URLSearchParams();

    if (newQuery) params.set("q", newQuery);
    if (newPage > 1) params.set("page", String(newPage));
    if (newFilter && newFilter !== "all") params.set("filter", newFilter);
    if (newView !== "grid") params.set("view", newView);
    if (newCategory) params.set("category", newCategory);

    const newURL = params.toString() ? `?${params.toString()}` : window.location.pathname;
    router.push(newURL, { scroll: false });
  };

  async function fetchPage(p = page, query = debouncedQuery, cat = category) {
    setLoading(true);
    try {
      const qParam = encodeURIComponent(query);
      const catParam = encodeURIComponent(cat || "");

      const res = await fetch(
        `/api/products/admin?page=${p}&limit=${limit}&q=${qParam}&filter=${encodeURIComponent(stockFilter)}${catParam ? `&category=${catParam}` : ""}`
      );
      const data = await res.json();

      setItems(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setSummary(data.summary || { inStock: 0, outOfStock: 0, discounted: 0 });
    } finally {
      setLoading(false);
    }
  }

  // load categories for the select
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/categories`);
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        console.log(data.categories)
        setCategories(data.categories || []);
      } catch (e) {
        console.error("Error fetching categories", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Cuando cambia el query, filtro o categoria, resetear a página 1
  useEffect(() => {
    if (page !== 1) {
      setPage(1);
      setJumpPage("1");
    }
  }, [debouncedQuery, stockFilter, category]);

  // Actualizar URL cuando cambian los filtros
  useEffect(() => {
    updateURL(page, debouncedQuery, stockFilter, viewMode, category);
  }, [page, debouncedQuery, stockFilter, viewMode, category]);

  // Fetch cuando cambian los parámetros
  useEffect(() => {
    fetchPage(page, debouncedQuery, category);
  }, [page, debouncedQuery, stockFilter, category, refreshToken]);

  // keep jumpPage input synced with page
  useEffect(() => {
    setJumpPage(String(page));
  }, [page]);

  const handleJump = (value?: string) => {
    const v = value ?? jumpPage;
    const n = Number(v);
    if (Number.isNaN(n)) return;
    const target = Math.max(1, Math.min(totalPages, Math.floor(n)));
    setPage(target);
  };

  return (
    <div className="space-y-6">
      {/* búsqueda + contador + toggle vista */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Buscar por título, categoría o ID kiboo…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />

        <Select value={stockFilter} onValueChange={setStockFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="inStock">En stock</SelectItem>
            <SelectItem value="outOfStock">Agotados</SelectItem>
            <SelectItem value="discounted">Con descuento</SelectItem>
            <SelectItem value="lowStock">Por agotarse (1-2)</SelectItem>
            <SelectItem value="withoutImage">Sin Imagen</SelectItem>
          </SelectContent>
        </Select>

        {/* category select */}
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.name}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(loading || (q !== debouncedQuery && q.length > 0)) && (
          <span className="text-sm text-muted-foreground">
            {loading ? "Cargando…" : "Buscando…"}
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{total} productos</span>
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-r-none"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Productos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">En Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.inStock}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Agotados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.outOfStock}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Con Descuento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.discounted}</div>
          </CardContent>
        </Card>
      </div>

      {/* Vista de productos: grid o tabla */}
      {viewMode === "grid" ? (
        <ProductList
          loading={loading}
          products={items}
          onEdit={onEdit}
          onDelete={async (id) => {
            await onDelete(id);
            setItems((prev) => prev.filter((p) => p.id !== id));
          }}
        />
      ) : (
        <ProductTable
          loading={loading}
          products={items}
          onEdit={onEdit}
          onDelete={async (id) => {
            await onDelete(id);
            setItems((prev) => prev.filter((p) => p.id !== id));
          }}
        />
      )}

      {/* paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            ←
          </Button>
          <span className="px-2 text-sm">
            {page} / {totalPages}
          </span>

          {/* jump to page input */}
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min={1}
              max={totalPages}
              value={jumpPage}
              onChange={(e) => setJumpPage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleJump();
              }}
              className="w-20 text-sm"
            />
            <Button size="sm" variant="outline" onClick={() => handleJump()}>
              Ir
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            →
          </Button>
        </div>
      )}
    </div>
  );
}
