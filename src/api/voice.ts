import { uploadFile } from '@/utils/request'

export interface VoiceItem {
  amountCents: number | null
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

function isSupportedAudioPath(filePath: string) {
  const path = filePath.split('?')[0].toLowerCase()
  return path.endsWith('.mp3') || path.endsWith('.wav')
}

export function recognizeVoice(tempFilePath: string): Promise<VoiceParseResult> {
  if (!isSupportedAudioPath(tempFilePath)) {
    return Promise.reject(new Error('仅支持 mp3/wav 音频格式'))
  }

  return uploadFile<VoiceParseResult>(tempFilePath, '/voice/recognize')
}
