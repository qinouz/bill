export async function callCloud<T = any>(name: string, data?: Record<string, any>): Promise<T> {
  try {
    const res = await uni.cloud.callFunction({ name, data })
    const result = res.result as { code: number; data: T; message: string }
    if (result.code !== 0) {
      throw new Error(result.message || '云函数调用失败')
    }
    return result.data
  } catch (error: any) {
    uni.showToast({ title: error.message || '网络错误', icon: 'none' })
    throw error
  }
}
