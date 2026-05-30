<template>
  <view class="page">
    <!-- 提醒开关 -->
    <view class="setting-card">
      <view class="setting-item">
        <view class="setting-left">
          <text class="setting-icon">🔔</text>
          <text class="setting-label">记账提醒</text>
        </view>
        <switch :checked="isEnabled" @change="toggleReminder" color="#667eea" />
      </view>
    </view>

    <!-- 提醒时间 -->
    <view v-if="isEnabled" class="setting-card">
      <view class="setting-item">
        <view class="setting-left">
          <text class="setting-icon">⏰</text>
          <text class="setting-label">提醒时间</text>
        </view>
        <picker mode="time" :value="reminderTime" @change="onTimeChange">
          <text class="setting-value">{{ reminderTime }}</text>
        </picker>
      </view>
    </view>

    <!-- 提示信息 -->
    <view class="tip-card">
      <text class="tip-title">温馨提示</text>
      <text class="tip-text">• 开启后每天定时提醒您记账</text>
      <text class="tip-text">• 需要授权订阅消息才能收到提醒</text>
      <text class="tip-text">• 授权后可随时在设置中关闭</text>
    </view>

    <!-- 授权按钮 -->
    <view v-if="isEnabled" class="auth-area">
      <view class="btn-auth" @tap="subscribeMessage">
        <text>授权订阅消息</text>
      </view>
      <view class="btn-test" @tap="testReminder">
        <text>测试发送提醒</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
const isEnabled = ref(false)
const reminderTime = ref('20:00')

onMounted(() => {
  // 从本地存储读取设置
  const settings = uni.getStorageSync('reminderSettings')
  if (settings) {
    isEnabled.value = settings.enabled || false
    reminderTime.value = settings.time || '20:00'
  }
})

// 切换提醒开关
function toggleReminder(e: any) {
  isEnabled.value = e.detail.value
  saveSettings()
}

// 修改时间
function onTimeChange(e: any) {
  reminderTime.value = e.detail.value
  saveSettings()
}

// 保存设置
async function saveSettings() {
  // 保存到本地
  uni.setStorageSync('reminderSettings', {
    enabled: isEnabled.value,
    time: reminderTime.value,
  })

  // 保存到云端
  if (userStore.userInfo) {
    try {
      await uni.cloud.callFunction({
        name: 'updateReminder',
        data: {
          userId: userStore.userInfo.userId,
          enabled: isEnabled.value,
          time: reminderTime.value,
        },
      })
    } catch (err) {
      console.error('保存提醒设置失败:', err)
    }
  }
}

// 订阅消息
function subscribeMessage() {
  // 需要在微信公众平台配置订阅消息模板
  // 这里是示例代码，实际需要替换 templateId
  uni.requestSubscribeMessage({
    tmplIds: ['p7Ef4vKVCJVVimX6W3Cp4OgT8e4Jvmo1hL84SdJBgWI'],
    success: (res) => {
      console.log('订阅成功:', res)
      uni.showToast({ title: '授权成功', icon: 'success' })
    },
    fail: (err) => {
      console.error('订阅失败:', err)
      uni.showToast({ title: '授权失败', icon: 'none' })
    },
  })
}

// 测试发送提醒
async function testReminder() {
  if (!userStore.userInfo) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }

  try {
    uni.showLoading({ title: '发送中...' })
    const res = await uni.cloud.callFunction({
      name: 'sendReminder',
      data: {
        manual: true,
        openid: userStore.userInfo.openid,
      },
    })
    uni.hideLoading()
    console.log('发送结果:', res)
    uni.showToast({ title: '发送成功，请查看微信消息', icon: 'success' })
  } catch (err) {
    uni.hideLoading()
    console.error('发送失败:', err)
    uni.showToast({ title: '发送失败', icon: 'none' })
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 30rpx;
}

.setting-card {
  background-color: #fff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
}

.setting-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.setting-icon {
  font-size: 40rpx;
}

.setting-label {
  font-size: 30rpx;
  color: #333;
}

.setting-value {
  font-size: 30rpx;
  color: #667eea;
}

.tip-card {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
}

.tip-title {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
  display: block;
  margin-bottom: 16rpx;
}

.tip-text {
  font-size: 24rpx;
  color: #999;
  display: block;
  line-height: 1.8;
}

.auth-area {
  margin-top: 40rpx;
}

.btn-auth {
  width: 100%;
  height: 96rpx;
  background-color: #667eea;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  color: #fff;
}

.btn-test {
  width: 100%;
  height: 96rpx;
  background-color: #fff;
  border: 2rpx solid #667eea;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  color: #667eea;
  margin-top: 20rpx;
}
</style>
