import { formatMoneyFromCents } from './amount'

export function formatMoney(cents: number): string {
  return formatMoneyFromCents(cents)
}
