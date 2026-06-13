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
      <view class="btn-test" @tap="testReminderSend">
        <text>测试发送提醒</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getReminder, saveReminder, testReminder } from '@/api/reminder'

const isEnabled = ref(false)
const reminderTime = ref('20:00')

onMounted(async () => {
  await loadSettings()
})

async function loadSettings() {
  try {
    const settings = await getReminder()
    isEnabled.value = settings.isEnabled || false
    reminderTime.value = settings.reminderTime || '20:00'
    cacheSettings()
  } catch {
    const settings = uni.getStorageSync('reminderSettings')
    if (settings) {
      isEnabled.value = settings.isEnabled || false
      reminderTime.value = settings.reminderTime || '20:00'
    }
  }
}

function toggleReminder(e: any) {
  isEnabled.value = e.detail.value
  saveSettings()
}

function onTimeChange(e: any) {
  reminderTime.value = e.detail.value
  saveSettings()
}

async function saveSettings() {
  cacheSettings()

  try {
    await saveReminder({
      isEnabled: isEnabled.value,
      reminderTime: reminderTime.value,
    })
  } catch (err) {
    console.error('保存提醒设置失败:', err)
  }
}

function cacheSettings() {
  uni.setStorageSync('reminderSettings', {
    isEnabled: isEnabled.value,
    reminderTime: reminderTime.value,
  })
}

function subscribeMessage() {
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

async function testReminderSend() {
  try {
    uni.showLoading({ title: '发送中...' })
    await testReminder()
    uni.hideLoading()
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
