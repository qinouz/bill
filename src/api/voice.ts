import { callCloud } from '@/utils/cloud'

export interface VoiceParseResult {
  amount: number | null
  categoryId: string | null
  categoryName: string | null
  type: 'income' | 'expense'
  remark: string
  billDate: string
  confidence: 'high' | 'medium' | 'low'
}

export function parseVoice(data: { text: string; userId: string }) {
  return callCloud<VoiceParseResult>('parseVoice', data)
}
