import { request } from '@/utils/request'

export interface UserProfile {
  userId: string
  nickname: string
  avatarUrl: string
  createdAt: number
  updatedAt: number
}

export interface LoginResult {
  token: string
}

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

          uni.setStorageSync('token', data.token)
          resolve(data)
        } catch (err) {
          reject(err)
        }
      },
      fail: reject,
    })
  })
}

export function getUserProfile() {
  return request<UserProfile>({
    url: '/users/profile',
    method: 'GET',
  })
}

export function getUserStats() {
  return request<{ consecutiveDays: number; recordDays: number; billCount: number }>({
    url: '/users/stats',
    method: 'GET',
  })
}
