import { loginWithWechat, request } from '@/utils/request'

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
  return loginWithWechat()
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
