import { request } from '@/utils/request'

export interface LoginResult {
  token: string
  userId: string
  nickname: string
  avatarUrl: string
}

// 登录：uni.login 获取 code，然后调用后端
export function login(): Promise<LoginResult> {
  return new Promise((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: async ({ code }) => {
        try {
          const data = await request<LoginResult>({
            url: '/auth/login',
            method: 'POST',
            data: { code },
          })

          // 存储 token 和用户信息
          uni.setStorageSync('token', data.token)
          uni.setStorageSync('userInfo', {
            userId: data.userId,
            nickname: data.nickname,
            avatarUrl: data.avatarUrl,
          })

          resolve(data)
        } catch (err) {
          reject(err)
        }
      },
      fail: reject,
    })
  })
}

// 获取用户统计（无需传 userId，后端从 JWT 解析）
export function getUserStats() {
  return request<{ consecutiveDays: number; recordDays: number; billCount: number }>({
    url: '/users/stats',
    method: 'GET',
  })
}
