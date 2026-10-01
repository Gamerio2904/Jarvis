/** Bild aus einer Einfügen-Aktion. Text in der Zwischenablage bleibt unangetastet. */

type ClipItem = {
  kind: string
  type: string
  getAsFile: () => File | null
}

export function clipboardImageFile(
  data: { items?: ArrayLike<ClipItem> | null; files?: ArrayLike<File> | null } | null | undefined,
): File | null {
  const items = data?.items
  if (items) {
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i]
      if (!item || item.kind !== 'file' || !/^image\//i.test(item.type || '')) continue
      const file = item.getAsFile()
      if (file && file.size > 0) return file
    }
  }
  const files = data?.files
  if (files) {
    for (let i = 0; i < files.length; i += 1) {
      const file = files[i]
      if (file && /^image\//i.test(file.type || '') && file.size > 0) return file
    }
  }
  return null
}
