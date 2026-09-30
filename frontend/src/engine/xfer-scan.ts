/** QR aus einem Foto, vor dem Lesen. */

import jsQR from 'jsqr'

export async function readQrFromFile(file: File): Promise<string | null> {
  if (typeof createImageBitmap !== 'function') return null
  try {
    const bitmap = await createImageBitmap(file)
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(bitmap, 0, 0)
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
    bitmap.close?.()
    const hit = jsQR(img.data, img.width, img.height)
    return hit?.data?.trim() || null
  } catch {
    return null
  }
}
