import { uploadFile } from '@/utils/request'

export interface VoiceItem {
  amount: number | null
  categoryId: string | null
  categoryName: string | null
  type: 'income' | 'expense'
  remark: string
  billDate: string
  confidence: 'high' | 'medium' | 'low'
}

export interface VoiceParseResult {
  recognizedText: string
  items: VoiceItem[]
}

export function recognizeVoice(tempFilePath: string): Promise<VoiceParseResult> {
  return uploadFile<VoiceParseResult>(tempFilePath, '/voice/recognize')
}
