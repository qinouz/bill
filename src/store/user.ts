import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, getUserStats } from '@/api/user'

export interface User {
  openid: string
  userId: string
  nickName: string
  avatarUrl: string
}

export const useUserStore = defineStore('user', () => {
  const userInfo = ref<User | null>(null)
  const isLogin = computed(() => !!userInfo.value)
  const stats = ref({ consecutiveDays: 0, recordDays: 0, billCount: 0 })

  async function autoLogin() {
    try {
      const data = await loginApi()
      userInfo.value = data
      uni.setStorageSync('userInfo', data)
    } catch {
      const cached = uni.getStorageSync('userInfo')
      if (cached) userInfo.value = cached
    }
  }

  async function loadStats() {
    if (!userInfo.value) return
    try {
      const data = await getUserStats({ userId: userInfo.value.userId })
      stats.value = data
    } catch {}
  }

  function clearUserInfo() {
    userInfo.value = null
    uni.removeStorageSync('userInfo')
  }

  return {
    userInfo,
    isLogin,
    stats,
    autoLogin,
    loadStats,
    clearUserInfo,
  }
})
