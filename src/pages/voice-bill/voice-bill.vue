<template>
  <view class="page">
    <!-- 顶部提示 -->
    <view class="tip-area">
      <text class="tip-text">说出你的账单，例如"午饭花了35块"</text>
    </view>

    <!-- 录音区域 -->
    <view class="record-area">
      <!-- 中间状态文本 -->
      <view v-if="interimText" class="interim-text">
        <text>{{ interimText }}</text>
      </view>

      <!-- 最终识别文本 -->
      <view v-if="recognizedText && !isRecording" class="recognized-text">
        <text class="label">识别内容：</text>
        <text class="text">{{ recognizedText }}</text>
      </view>

      <!-- 录音按钮 -->
      <view
        class="record-btn"
        :class="{ recording: isRecording, recognizing: isRecognizing }"
        @touchstart="onVoiceStart"
        @touchend="onVoiceEnd"
        @touchcancel="onVoiceCancel"
      >
        <text class="record-icon">{{ isRecording ? '🔴' : '🎤' }}</text>
        <text class="record-label">
          {{ isRecognizing ? '识别中...' : (isRecording ? '松开结束' : '长按说话') }}
        </text>
      </view>
    </view>

    <!-- 解析结果 -->
    <view v-if="voiceResult" class="result-area">
      <view class="result-card">
        <view class="result-item">
          <text class="item-label">金额</text>
          <text class="item-value amount" :class="{ empty: !voiceResult.amount }">
            {{ voiceResult.amount ? '¥' + voiceResult.amount.toFixed(2) : '未识别' }}
          </text>
        </view>
        <view class="result-item">
          <text class="item-label">分类</text>
          <text class="item-value" :class="{ empty: !voiceResult.categoryId }">
            {{ voiceResult.categoryName || '未匹配' }}
          </text>
        </view>
        <view class="result-item">
          <text class="item-label">类型</text>
          <text class="item-value" :class="voiceResult.type">
            {{ voiceResult.type === 'income' ? '收入' : '支出' }}
          </text>
        </view>
        <view class="result-item">
          <text class="item-label">日期</text>
          <text class="item-value">{{ voiceResult.billDate }}</text>
        </view>
        <view v-if="voiceResult.remark" class="result-item">
          <text class="item-label">备注</text>
          <text class="item-value">{{ voiceResult.remark }}</text>
        </view>

        <view class="confidence" :class="voiceResult.confidence">
          <text>{{ confidenceText }}</text>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="btn-group">
        <view class="btn btn-retry" @tap="handleRetry">
          <text>重新录入</text>
        </view>
        <view
          class="btn btn-confirm"
          :class="{ disabled: !canConfirm }"
          @tap="handleConfirm"
        >
          <text>确认记账</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '@/store/user'
import { useVoiceRecord } from '@/composables/useVoiceRecord'
import { parseVoice } from '@/api/voice'
import type { VoiceParseResult } from '@/api/voice'

const userStore = useUserStore()

const { isRecording, interimText, recognizedText, startRecord, stopRecord, cancelRecord, onResult } = useVoiceRecord()
const isRecognizing = ref(false)
const voiceResult = ref<VoiceParseResult | null>(null)

// 语音识别结果回调
onResult(async (text: string) => {
  if (!text.trim()) {
    uni.showToast({ title: '未识别到内容', icon: 'none' })
    return
  }
  if (!userStore.userInfo) return

  isRecognizing.value = true
  try {
    uni.showLoading({ title: '解析中...' })
    const result = await parseVoice({ text, userId: userStore.userInfo.userId })
    voiceResult.value = result
  } catch {
    // error handled by callCloud
  } finally {
    uni.hideLoading()
    isRecognizing.value = false
  }
})

function onVoiceStart() {
  voiceResult.value = null
  startRecord()
}

function onVoiceEnd() {
  stopRecord()
}

function onVoiceCancel() {
  cancelRecord()
}

function handleRetry() {
  voiceResult.value = null
}

const canConfirm = computed(() => {
  return voiceResult.value?.amount && voiceResult.value?.categoryId
})

const confidenceText = computed(() => {
  switch (voiceResult.value?.confidence) {
    case 'high': return '识别准确'
    case 'medium': return '建议核对'
    case 'low': return '信息不全，请补充'
    default: return ''
  }
})

function handleConfirm() {
  if (!canConfirm.value || !voiceResult.value) return

  // 将结果存入缓存，返回记账页面后读取
  uni.setStorageSync('voiceResult', {
    categoryId: voiceResult.value.categoryId,
    amount: voiceResult.value.amount,
    type: voiceResult.value.type,
    remark: voiceResult.value.remark,
    billDate: voiceResult.value.billDate,
  })

  uni.navigateBack()
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 30rpx;
}

.tip-area {
  text-align: center;
  padding: 30rpx 0;
}

.tip-text {
  font-size: 28rpx;
  color: #999;
}

.record-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0;
}

.interim-text {
  margin-bottom: 30rpx;
  padding: 20rpx 40rpx;
  background-color: #fff;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #667eea;
  max-width: 100%;
}

.recognized-text {
  margin-bottom: 30rpx;
  padding: 20rpx 40rpx;
  background-color: #fff;
  border-radius: 12rpx;
  max-width: 100%;
}

.recognized-text .label {
  font-size: 24rpx;
  color: #999;
}

.recognized-text .text {
  font-size: 28rpx;
  color: #333;
  margin-top: 10rpx;
  display: block;
}

.record-btn {
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  background-color: #fff;
  border: 4rpx solid #667eea;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}

.record-btn.recording {
  background-color: #667eea;
  animation: pulse 1s infinite;
}

.record-btn.recognizing {
  opacity: 0.6;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.record-icon {
  font-size: 60rpx;
}

.record-label {
  font-size: 24rpx;
  color: #667eea;
}

.record-btn.recording .record-label {
  color: #fff;
}

.result-area {
  margin-top: 40rpx;
}

.result-card {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
}

.result-item:not(:last-child) {
  border-bottom: 1rpx solid #f0f0f0;
}

.item-label {
  font-size: 28rpx;
  color: #666;
}

.item-value {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.item-value.amount {
  font-size: 36rpx;
  font-weight: bold;
}

.item-value.empty {
  color: #ff5252;
}

.item-value.income {
  color: #00b26a;
}

.item-value.expense {
  color: #333;
}

.confidence {
  text-align: center;
  margin-top: 20rpx;
  padding: 12rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
}

.confidence.high {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.confidence.medium {
  background-color: #fff3e0;
  color: #ef6c00;
}

.confidence.low {
  background-color: #ffebee;
  color: #c62828;
}

.btn-group {
  display: flex;
  gap: 20rpx;
}

.btn {
  flex: 1;
  height: 96rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
}

.btn-retry {
  background-color: #f5f5f5;
  color: #666;
}

.btn-confirm {
  background-color: #667eea;
  color: #fff;
}

.btn-confirm.disabled {
  opacity: 0.5;
}
</style>
