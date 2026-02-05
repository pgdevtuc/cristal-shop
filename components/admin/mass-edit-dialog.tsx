"use client"

import { useState, type ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Upload } from "lucide-react"
import { toast } from "sonner"

interface MassEditDialogProps {
  onClose: () => void
  onComplete: () => void
}

export function MassEditDialog({ onClose, onComplete }: MassEditDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [serverErrors, setServerErrors] = useState<string[] | null>(null)

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null
    if (selected && !selected.name.toLowerCase().endsWith(".csv")) {
      toast.error("Solo se permiten archivos CSV")
      event.target.value = ""
      setFile(null)
      return
    }
    setFile(selected)
  }

  const handleSubmit = async () => {
    if (!file) {
      toast.error("Seleccioná un archivo CSV")
      return
    }
    setLoading(true)
    setServerErrors(null)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/products/admin/mass-edit", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      console.log("Mass edit response:", data)
      if (!response.ok) {
        const errors = Array.isArray(data.errors)
          ? data.errors.map((error: any) => `Fila ${error.row}: ${error.reason}`)
          : null
        setServerErrors(errors)
        toast.error(data.error || "Error en edición masiva")
        return
      }

      const summary = [`Productos actualizados: ${data.updated ?? 0}`]
      if (data.skipped) {
        summary.push(`Filas no encontradas: ${data.skipped}`)
      }
      toast.success(summary.join(" • "))
      onComplete()
      onClose()
    } catch (error) {
      console.error(error)
      toast.error("No se pudo procesar la edición masiva")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-lg">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Edición Masiva</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mass-edit-file">Archivo CSV</Label>
            <Input
              id="mass-edit-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
            />
            <p className="text-xs text-muted-foreground">
              El CSV debe contener columnas <strong>kibooId</strong>, <strong>variantId</strong>, <strong>stock</strong>, <strong>price</strong> y <strong>currency</strong> (USD o ARS opcional).
              El sistema intentará editar por <strong>variantId</strong> y, si no existe, buscará por <strong>kibooId</strong>. Los productos no encontrados se omiten y solo se actualizan los existentes.
            </p>
          </div>

          {serverErrors && serverErrors.length > 0 && (
            <div className="space-y-1 rounded-md bg-red-50 p-3 text-sm text-red-800">
              <p className="font-semibold">Errores detectados:</p>
              {serverErrors.map((error, index) => (
                <p key={`${error}-${index}`}>{error}</p>
              ))}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <>
                  Procesando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Subir y editar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
