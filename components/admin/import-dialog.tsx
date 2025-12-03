"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Upload, FileText, Download,Eye } from "lucide-react"
import { toast } from "sonner"

interface ImportDialogProps {
  onClose: () => void
  onImportComplete: () => void
}

export function ImportDialog({ onClose, onImportComplete }: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [previewItems, setPreviewItems] = useState<any[] | null>(null)
  const [step, setStep] = useState<"select" | "preview">("select")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const validTypes = ["text/csv", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]
      if (
        validTypes.includes(selectedFile.type) ||
        selectedFile.name.endsWith(".csv") ||
        selectedFile.name.endsWith(".xlsx")
      ) {
        setFile(selectedFile)
        setPreviewItems(null)
        setStep('select')
      } else {
        toast.error( "Solo se permiten archivos CSV y Excel (.xlsx)")
      }
    }
  }

  // Step 1: upload file and request a preview from the server
  const handleUploadPreview = async () => {
    if (!file) return
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/products/import?action=preview", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()
      if (response.ok) {
        // Expect result.items = parsed products
        setPreviewItems(result.items || [])
        setStep("preview")
      } else {
        toast.error(result.error || "Error al parsear el archivo")
      }
    } catch (e) {
      console.error(e)
      toast.error("Error al procesar el archivo")
    } finally {
      setLoading(false)
    }
  }

  console.log(previewItems)

  // Step 2: confirm and save parsed items to DB
  const handleConfirmImport = async () => {
    if (!previewItems || previewItems.length === 0) return
    setLoading(true)
    try {
      const response = await fetch("/api/products/import?action=save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: previewItems }),
      })
      const result = await response.json()
      if (response.ok) {
        toast.success(result.message || "Productos importados")
        onImportComplete()
        onClose()
      } else {
        toast.error(result.error || "Error al guardar productos")
      }
    } catch (e) {
      console.error(e)
      toast.error("Error al guardar productos")
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = () => {
    const csvContent =
      "Nombre,Descripción,Precio,Categoría,URL de Imagen,Precio Oferta,Stock,Colores,Caracteristicas\n" +
      "Smartphone Premium,Teléfono inteligente de última generación,85999,Electrónicos,https://imagen.com,749.99,15,Blanco;Gris,El mejor celular en 2025; La mejor camara\n" +
      "Laptop Gaming,Laptop para gaming con procesador Intel i7,129999,Computadoras,https://imagen1.com,,8,Rojo,La mejor duración de bateria; Los mejores componentes"

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "plantilla_productos.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Importar Productos</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="file">Seleccionar Archivo</Label>
            <Input id="file" type="file" accept=".csv,.xlsx" onChange={handleFileChange} className="mt-1" />
            <p className="text-xs text-gray-500 mt-1">Formatos soportados: CSV, Excel (.xlsx)</p>
          </div>

          {file && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                <FileText className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-900">{file.name}</span>
              </div>

              {step === "preview" && previewItems && (
                <div className="bg-white border rounded-md p-3 max-h-64 overflow-y-auto">
                  <h5 className="font-medium mb-2">Vista previa ({previewItems.length})</h5>
                  <div className="text-xs text-muted-foreground mb-2">Revisa las filas antes de confirmar la importación.</div>
                  <div className="grid grid-cols-1 gap-2">
                    {previewItems.slice(0, 300).map((row: any, i: number) => (
                      <div key={i} className="p-2 bg-gray-50 rounded-md flex justify-between text-sm">
                        <div className="truncate pr-2">
                          <strong>{row.Nombre || row.name}</strong>
                          <div className="text-muted-foreground text-xs">{row.Descripción || row.description}</div>
                        </div>
                        <div className="text-right text-xs">
                          <div>Precio: {row.Precio ?? row.price}</div>
                          <div>Stock: {row.Stock ?? row.stock ?? 0}</div>
                          <div>Colores: {row.colors ?? row.colors ?? ""}</div>
                          <div>Caracteristicas: {row.features ?? row.Caracteristicas ?? ""}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Formato esperado:</h4>
            <p className="text-sm text-blue-800 mb-3">El archivo debe contener las siguientes columnas:</p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Nombre (requerido)</li>
              <li>• Descripción (requerido)</li>
              <li>• Precio (requerido)</li>
              <li>• Categoría (requerido)</li>
              <li>• URL de Imagen (requerido)</li>
              <li>• Precio Oferta (opcional)</li>
              <li>• Stock (opcional, por defecto 0)</li>
              <li>• Colores (opcional, por defecto ninguno)</li>
              <li>• Caracteristicas (opcional, por defecto ninguno)</li>
            </ul>
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="mt-3 w-full">
              <Download className="h-3 w-3 mr-2" />
              Descargar Plantilla
            </Button>
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>

            {step === "preview" ? (
              <>
                <Button variant="outline" onClick={() => { setStep("select"); setPreviewItems(null); }}>
                  Volver
                </Button>
                <Button onClick={handleConfirmImport} disabled={loading || !previewItems || previewItems.length === 0}>
                  {loading ? "Guardando..." : "Confirmar e Importar"}
                </Button>
              </>
            ) : (
              <Button onClick={handleUploadPreview} disabled={!file || loading}>
                {loading ? (
                  <>Procesando...</>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Previsualizar
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
