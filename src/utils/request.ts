const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8721/api'

interface RequestOptions {
  url: string
  data?: any
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
}

export function request<T = any>(options: RequestOptions): Promise<T> {
  const token = uni.getStorageSync('token')

  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      success: (res: any) => {
        const body = res.data || {}

        if (body.code === 0) {
          resolve(body.data)
          return
        }

        if (body.code === 401) {
          uni.removeStorageSync('token')
          uni.removeStorageSync('userInfo')
          uni.showToast({ title: '登录已过期', icon: 'none' })
          uni.reLaunch({ url: '/pages/index/index' })
          reject(new Error('Unauthorized'))
          return
        }

        uni.showToast({ title: body.message || '请求失败', icon: 'none' })
        reject(new Error(body.message || '请求失败'))
      },
      fail: reject,
    })
  })
}

// 文件上传
export function uploadFile<T = any>(filePath: string, url: string): Promise<T> {
  const token = uni.getStorageSync('token')

  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: BASE_URL + url,
      filePath,
      name: 'file',
      header: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      success: (res: any) => {
        const body = JSON.parse(res.data)

        if (body.code === 0) {
          resolve(body.data)
          return
        }

        uni.showToast({ title: body.message || '上传失败', icon: 'none' })
        reject(new Error(body.message || '上传失败'))
      },
      fail: reject,
    })
  })
}
