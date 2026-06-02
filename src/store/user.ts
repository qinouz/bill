import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, getUserStats } from '@/api/user'
import { initCategories } from '@/api/category'

export interface User {
  userId: string
  nickname: string
  avatarUrl: string
}

export const useUserStore = defineStore('user', () => {
  const userInfo = ref<User | null>(null)
  const isLogin = computed(() => !!userInfo.value && !!uni.getStorageSync('token'))
  const stats = ref({ consecutiveDays: 0, recordDays: 0, billCount: 0 })

  async function autoLogin() {
    // 先从缓存读取，立即可用
    const cached = uni.getStorageSync('userInfo')
    const token = uni.getStorageSync('token')
    if (cached && token) {
      userInfo.value = cached
    }

    try {
      // 调用登录（内部会调用 uni.login 获取 code）
      const data = await loginApi()

      const user: User = {
        userId: data.userId,
        nickname: data.nickname,
        avatarUrl: data.avatarUrl,
      }
      userInfo.value = user

      // 初始化默认分类（仅新用户）
      if (!cached) {
        initCategories().catch(() => {})
      }
    } catch (error) {
      console.error('登录失败:', error)
      if (!cached) {
        userInfo.value = null
      }
    }
  }

  async function loadStats() {
    if (!isLogin.value) return
    try {
      const data = await getUserStats()
      stats.value = data
    } catch {}
  }

  function clearUserInfo() {
    userInfo.value = null
    uni.removeStorageSync('userInfo')
    uni.removeStorageSync('token')
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
