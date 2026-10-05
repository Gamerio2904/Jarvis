export async function copyText(text: string): Promise<boolean> {
  const v = text.trim()
  if (!v) return false
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(v)
      return true
    }
  } catch {
    /* fallback below */
  }
  try {
    const el = document.createElement('textarea')
    el.value = v
    el.setAttribute('readonly', '')
    el.style.position = 'fixed'
    el.style.left = '-9999px'
    document.body.appendChild(el)
    el.select()
    const ok = document.execCommand('copy')
    el.remove()
    return ok
  } catch {
    return false
  }
}
