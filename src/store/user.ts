import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, getUserStats } from '@/api/user'
import { initCategories } from '@/api/category'

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
    // 先从缓存读取，立即可用
    const cached = uni.getStorageSync('userInfo')
    if (cached) {
      userInfo.value = cached
    }

    // 后台静默刷新，不阻塞
    loginApi()
      .then((data) => {
        userInfo.value = data
        uni.setStorageSync('userInfo', data)
        // 初始化默认分类（仅新用户）
        if (!cached) {
          initCategories({ userId: data.userId }).catch(() => {})
        }
      })
      .catch(() => {
        // API 失败，如果有缓存继续用，没有则标记未登录
        if (!cached) {
          userInfo.value = null
        }
      })
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
