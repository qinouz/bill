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

// 上传音频并识别
export async function recognizeVoice(tempFilePath: string): Promise<VoiceParseResult> {
  // 上传文件到后端，后端处理识别
  const result = await uploadFile<VoiceParseResult>(tempFilePath, '/api/voice/recognize')
  return result
}
