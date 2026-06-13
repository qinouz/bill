function toAmountText(value: unknown) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : ''
  }

  if (typeof value === 'string') {
    return value.trim()
  }

  return ''
}

export function yuanToCents(value: unknown): number | null {
  const rawText = toAmountText(value)
  if (!rawText) return null

  const text = rawText.startsWith('.') ? `0${rawText}` : rawText
  if (!/^\d+(\.\d{0,2})?$/.test(text) || text === '.') return null

  const [yuanPart, centPart = ''] = text.split('.')
  const yuan = Number(yuanPart)
  if (!Number.isSafeInteger(yuan)) return null

  const cents = Number(centPart.padEnd(2, '0'))
  const total = yuan * 100 + cents
  return Number.isSafeInteger(total) ? total : null
}

export function formatMoneyFromCents(cents: unknown): string {
  const value = typeof cents === 'number' ? cents : Number(cents)
  if (!Number.isFinite(value)) return '0.00'

  const normalized = Math.trunc(value)
  const sign = normalized < 0 ? '-' : ''
  const abs = Math.abs(normalized)
  const yuan = Math.floor(abs / 100)
  const centPart = String(abs % 100).padStart(2, '0')
  return `${sign}${yuan}.${centPart}`
}

export function centsToYuanInput(cents: unknown): string {
  return formatMoneyFromCents(cents)
}
