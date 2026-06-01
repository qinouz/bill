import { callCloud } from '@/utils/cloud'
import type { VoiceItem } from './voice'

export interface PhotoParseResult {
  items: VoiceItem[]
}

// 上传图片到云存储并识别
export async function recognizePhoto(filePath: string): Promise<PhotoParseResult> {
  // 1. 上传到云存储
  const ext = filePath.split('.').pop() || 'jpg'
  const cloudPath = `photo/${Date.now()}.${ext}`

  const uploadRes = await uni.cloud.uploadFile({
    cloudPath,
    filePath,
  })

  // 2. 调用识别云函数（传文件ID）
  const result = await callCloud<PhotoParseResult>('photoRecognize', {
    fileID: uploadRes.fileID,
  })

  return result
}
