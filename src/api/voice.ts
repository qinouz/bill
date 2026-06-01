import { callCloud } from '@/utils/cloud'

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

// 上传音频到云存储并识别
export async function recognizeVoice(tempFilePath: string): Promise<VoiceParseResult> {
  // 1. 上传到云存储
  const ext = tempFilePath.split('.').pop() || 'mp3'
  const cloudPath = `voice/${Date.now()}.${ext}`

  const uploadRes = await uni.cloud.uploadFile({
    cloudPath,
    filePath: tempFilePath,
  })

  // 2. 调用识别云函数（传文件ID，云函数会获取临时URL）
  const result = await callCloud<VoiceParseResult>('audioRecognize', {
    fileID: uploadRes.fileID,
  })

  return result
}
