import { callCloud } from '@/utils/cloud'

export interface LoginResult {
  openid: string
  userId: string
  nickName: string
  avatarUrl: string
}

export function login() {
  return callCloud<LoginResult>('login')
}

export function getUserStats(data: { userId: string }) {
  return callCloud<{ consecutiveDays: number; recordDays: number; billCount: number }>('getUserStats', data)
}
