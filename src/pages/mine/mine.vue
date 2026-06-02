<template>
  <view class="page">
    <!-- 用户信息 -->
    <view class="profile">
      <view class="avatar">
        <image :src="userStore.userInfo?.avatarUrl || '/static/default-avatar.png'" mode="aspectFill" />
      </view>
      <view class="user-info">
        <text class="user-name">{{ userStore.userInfo?.nickname || '未登录' }}</text>
        <text class="user-id">{{ userStore.isLogin ? '已登录' : '点击登录' }}</text>
      </view>
    </view>

    <!-- 统计数据 -->
    <view class="stats">
      <view class="stat-item">
        <text class="stat-value">{{ userStore.stats.consecutiveDays }}</text>
        <text class="stat-label">连续打卡</text>
      </view>
      <view class="stat-item">
        <text class="stat-value">{{ userStore.stats.recordDays }}</text>
        <text class="stat-label">记账天数</text>
      </view>
      <view class="stat-item">
        <text class="stat-value">{{ userStore.stats.billCount }}</text>
        <text class="stat-label">记账笔数</text>
      </view>
    </view>

    <!-- 菜单 -->
    <view class="menu">
      <view class="menu-item" @tap="goTo('/pages/category-manage/category-manage')">
        <text class="menu-icon">📁</text>
        <text class="menu-text">分类管理</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @tap="goTo('/pages/reminder/reminder')">
        <text class="menu-icon">🔔</text>
        <text class="menu-text">记账提醒</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @tap="showAbout">
        <text class="menu-icon">ℹ️</text>
        <text class="menu-text">关于应用</text>
        <text class="menu-arrow">›</text>
      </view>
    </view>

    <!-- 登录/退出 -->
    <view class="actions">
      <button v-if="userStore.isLogin" class="btn btn-logout" @tap="handleLogout">
        退出登录
      </button>
    </view>
    <CustomTabbar />
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'
import CustomTabbar from '@/components/custom-tabbar/custom-tabbar.vue'

const userStore = useUserStore()

function goTo(url: string) {
  uni.navigateTo({ url })
}

function showAbout() {
  uni.showModal({ title: '关于', content: '家庭记账小程序 v1.0.0', confirmText: '知道了' })
}

function handleLogout() {
  uni.showModal({
    title: '提示',
    content: '确认退出登录？',
    success: (res) => {
      if (res.confirm) {
        userStore.clearUserInfo()
        uni.showToast({ title: '已退出', icon: 'success' })
      }
    },
  })
}

onShow(() => {
  if (userStore.isLogin) {
    userStore.loadStats()
  }
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20rpx 30rpx 180rpx;
}

.profile {
  display: flex;
  align-items: center;
  background-color: #fff;
  padding: 30rpx;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
}

.avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 24rpx;
  background-color: #eee;
}

.avatar image {
  width: 100%;
  height: 100%;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 6rpx;
}

.user-id {
  font-size: 22rpx;
  color: #999;
  display: block;
}

.stats {
  display: flex;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.stat-item {
  flex: 1;
  background-color: #fff;
  padding: 24rpx;
  border-radius: 12rpx;
  text-align: center;
}

.stat-value {
  font-size: 40rpx;
  font-weight: bold;
  color: #667eea;
  display: block;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 22rpx;
  color: #999;
}

.menu {
  background-color: #fff;
  border-radius: 12rpx;
  overflow: hidden;
  margin-bottom: 30rpx;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 28rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-icon {
  font-size: 36rpx;
  margin-right: 20rpx;
}

.menu-text {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.menu-arrow {
  color: #ccc;
  font-size: 32rpx;
}

.actions {
  padding: 20rpx 0;
}

.btn {
  width: 100%;
  padding: 24rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.btn-logout {
  background-color: #fff;
  color: #ff5252;
  border: 2rpx solid #ff5252;
}
</style>
