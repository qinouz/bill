import type { VoiceItem } from './voice'

export interface PhotoParseResult {
  items: VoiceItem[]
}

// 上传图片并识别
export function recognizePhoto(filePath: string): Promise<PhotoParseResult> {
  const token = uni.getStorageSync('token')

  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: 'http://localhost:8721/api/photo/recognize',
      filePath,
      name: 'file',
      header: {
        Authorization: `Bearer ${token}`,
      },
      success: (res) => {
        const body = JSON.parse(res.data || '{}')

        if (body.code === 0) {
          resolve(body.data)
          return
        }

        if (body.code === 401) {
          uni.removeStorageSync('token')
          uni.removeStorageSync('userInfo')
          uni.reLaunch({ url: '/pages/index/index' })
          reject(new Error('Unauthorized'))
          return
        }

        uni.showToast({
          title: body.message || '图片识别失败',
          icon: 'none',
        })
        reject(new Error(body.message || '图片识别失败'))
      },
      fail: reject,
    })
  })
}
