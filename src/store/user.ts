import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getUserProfile, getUserStats, type UserProfile } from '@/api/user'
import { initCategories } from '@/api/category'
import { clearAuthSession, restoreSessionToken } from '@/utils/request'

export const useUserStore = defineStore('user', () => {
  const userInfo = ref<UserProfile | null>(null)
  const isLogin = computed(() => !!userInfo.value && !!uni.getStorageSync('token'))
  const stats = ref({ consecutiveDays: 0, recordDays: 0, billCount: 0 })

  async function autoLogin() {
    const cached = uni.getStorageSync('userInfo')

    try {
      // 先续期缓存 token；失效或超过刷新期限时再走微信登录。
      await restoreSessionToken()

      const user = await getUserProfile()
      userInfo.value = user
      uni.setStorageSync('userInfo', user)

      // 初始化默认分类（仅新用户）
      if (!cached) {
        initCategories().catch(() => {})
      }
    } catch (error) {
      console.error('恢复登录状态失败:', error)
      userInfo.value = cached || null
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
    clearAuthSession()
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
