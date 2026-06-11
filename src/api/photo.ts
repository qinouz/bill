import { uploadFile } from '@/utils/request'
import type { VoiceItem } from './voice'

export interface PhotoParseResult {
  items: VoiceItem[]
}

export function recognizePhoto(filePath: string): Promise<PhotoParseResult> {
  return uploadFile<PhotoParseResult>(filePath, '/photo/recognize')
}
