export async function compressImage(
  file: File,
  {
    maxSizeMB = 1,
    maxWidthOrHeight = 1600,
    quality = 0.8,
  } = {}
): Promise<File> {
  const imageBitmap = await createImageBitmap(file)

  let { width, height } = imageBitmap
  const scale = Math.min(1, maxWidthOrHeight / Math.max(width, height))

  width = Math.round(width * scale)
  height = Math.round(height * scale)

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext("2d")!
  ctx.drawImage(imageBitmap, 0, 0, width, height)

  let blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality)
  )

  if (!blob) throw new Error("Error al comprimir imagen")

  // Si todavía pesa más de 1MB, bajamos calidad
  while (blob && blob.size / 1024 / 1024 > maxSizeMB && quality > 0.4) {
    quality -= 0.1
    blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    )
  }

  return new File([blob || ""], file.name.replace(/\.\w+$/, ".jpg"), {
    type: "image/jpeg",
  })
}
