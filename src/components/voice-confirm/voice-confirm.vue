<template>
  <view v-if="visible" class="modal-mask" @tap="$emit('close')">
    <view class="modal-content" @tap.stop>
      <!-- 识别文本 -->
      <view class="recognized-text">
        <text class="label">识别内容：</text>
        <text class="text">{{ result?.remark || '无' }}</text>
      </view>

      <!-- 解析结果 -->
      <view class="result-card">
        <!-- 金额 -->
        <view class="result-item">
          <text class="item-label">金额</text>
          <text class="item-value amount" :class="{ empty: !result?.amountCents }">
            {{ result?.amountCents ? '¥' + formatMoneyFromCents(result.amountCents) : '未识别' }}
          </text>
        </view>

        <!-- 分类 -->
        <view class="result-item">
          <text class="item-label">分类</text>
          <text class="item-value" :class="{ empty: !result?.categoryId }">
            {{ result?.categoryName || '未匹配' }}
          </text>
        </view>

        <!-- 类型 -->
        <view class="result-item">
          <text class="item-label">类型</text>
          <text class="item-value" :class="result?.type">
            {{ result?.type === 'income' ? '收入' : '支出' }}
          </text>
        </view>

        <!-- 日期 -->
        <view class="result-item">
          <text class="item-label">日期</text>
          <text class="item-value">{{ result?.billDate }}</text>
        </view>

        <!-- 备注 -->
        <view v-if="result?.remark" class="result-item">
          <text class="item-label">备注</text>
          <text class="item-value">{{ result.remark }}</text>
        </view>

        <!-- 置信度 -->
        <view class="confidence" :class="result?.confidence">
          <text>{{ confidenceText }}</text>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="btn-group">
        <view class="btn btn-retry" @tap="$emit('reRecord')">
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
import { computed } from 'vue'
import type { VoiceItem } from '@/api/voice'
import type { Category } from '@/store/bill'
import { formatMoneyFromCents } from '@/utils/amount'

const props = defineProps<{
  visible: boolean
  result: VoiceItem | null
  categories: Category[]
}>()

const emit = defineEmits<{
  confirm: [data: { categoryId: string; amountCents: number; type: string; remark: string; billDate: string }]
  close: []
  reRecord: []
}>()

const canConfirm = computed(() => {
  return props.result?.amountCents && props.result?.categoryId
})

const confidenceText = computed(() => {
  switch (props.result?.confidence) {
    case 'high': return '识别准确'
    case 'medium': return '建议核对'
    case 'low': return '信息不全，请补充'
    default: return ''
  }
})

function handleConfirm() {
  if (!canConfirm.value || !props.result) return

  emit('confirm', {
    categoryId: props.result.categoryId!,
    amountCents: props.result.amountCents!,
    type: props.result.type,
    remark: props.result.remark,
    billDate: props.result.billDate
  })
}
</script>

<style scoped>
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 85%;
  background-color: #fff;
  border-radius: 24rpx;
  padding: 40rpx;
}

.recognized-text {
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #eee;
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

.result-card {
  background-color: #f8f8f8;
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
  border-bottom: 1rpx solid #eee;
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
  color: #333;
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
  height: 88rpx;
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
