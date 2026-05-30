<template>
  <view class="page">
    <!-- 收支切换 -->
    <view class="type-selector">
      <view
        v-for="t in types"
        :key="t.value"
        class="type-btn"
        :class="{ active: currentType === t.value }"
        @tap="currentType = t.value"
      >
        <text>{{ t.label }}</text>
      </view>
    </view>

    <!-- 金额输入 -->
    <view class="amount-area">
      <text class="currency">¥</text>
      <input
        v-model="inputAmount"
        class="amount-input"
        type="digit"
        placeholder="0.00"
        placeholder-class="amount-placeholder"
      />
    </view>

    <!-- 日期选择 -->
    <view class="date-row">
      <text class="date-label">日期</text>
      <picker mode="date" :value="billDate" @change="onDateChange">
        <text class="date-value">{{ billDate }}</text>
      </picker>
    </view>

    <!-- 分类选择 -->
    <view class="categories">
      <view class="section-title">选择分类</view>
      <view class="category-grid">
        <view
          v-for="cat in filteredCategories"
          :key="cat._id"
          class="category-item"
          :class="{ selected: selectedCategory === cat._id }"
          @tap="selectedCategory = cat._id"
        >
          <view class="category-item-inner">
            <text class="category-icon">{{ cat.icon }}</text>
            <text class="category-name">{{ cat.name }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 备注 -->
    <view class="remark-area">
      <input
        v-model="remark"
        class="remark-input"
        placeholder="添加备注（可选）"
        placeholder-class="remark-placeholder"
      />
    </view>

    <CustomTabbar />
    <!-- 底部按钮区域 -->
    <view class="submit-area">
      <view class="btn-row">
        <!-- 语音按钮 -->
        <view class="btn-voice" @tap="goVoiceBill">
          <text class="voice-icon">🎤</text>
          <text class="voice-label">语音</text>
        </view>
        <!-- 拍照按钮 -->
        <view class="btn-voice" @tap="goPhotoBill">
          <text class="voice-icon">📷</text>
          <text class="voice-label">拍照</text>
        </view>
        <!-- 确认按钮 -->
        <view class="btn-confirm" @tap="handleSubmit">
          <text>确认记账</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useBillStore } from '@/store/bill'
import { getToday } from '@/utils/date'
import CustomTabbar from '@/components/custom-tabbar/custom-tabbar.vue'

const billStore = useBillStore()

const types = [
  { value: 'expense' as const, label: '支出' },
  { value: 'income' as const, label: '收入' },
]
const currentType = ref<'income' | 'expense'>('expense')
const inputAmount = ref('')
const selectedCategory = ref('')
const remark = ref('')
const billDate = ref(getToday())

const filteredCategories = computed(() => {
  return billStore.categories.filter((c) => c.type === currentType.value)
})

function onDateChange(e: any) {
  billDate.value = e.detail.value
}

function goVoiceBill() {
  uni.navigateTo({ url: '/pages/voice-bill/voice-bill' })
}

function goPhotoBill() {
  uni.navigateTo({ url: '/pages/photo-bill/photo-bill' })
}

async function handleSubmit() {
  if (!selectedCategory.value) {
    uni.showToast({ title: '请选择分类', icon: 'none' })
    return
  }
  const amount = parseFloat(inputAmount.value)
  if (!amount || amount <= 0) {
    uni.showToast({ title: '请输入正确的金额', icon: 'none' })
    return
  }

  uni.showLoading({ title: '保存中...' })
  try {
    await billStore.addBillRecord({
      categoryId: selectedCategory.value,
      amount,
      type: currentType.value,
      remark: remark.value,
      billDate: billDate.value,
    })
    uni.hideLoading()
    uni.showToast({ title: '记账成功', icon: 'success' })
    // 重置
    inputAmount.value = '0'
    selectedCategory.value = ''
    remark.value = ''
    billDate.value = getToday()
  } catch {
    uni.hideLoading()
  }
}

onShow(() => {
  billStore.loadCategories()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 300rpx;
}

.type-selector {
  display: flex;
  padding: 20rpx 30rpx;
  gap: 20rpx;
}

.type-btn {
  flex: 1;
  padding: 18rpx 0;
  text-align: center;
  background-color: #fff;
  border: 2rpx solid #ddd;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.type-btn.active {
  background-color: #667eea;
  color: #fff;
  border-color: #667eea;
}

.amount-area {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  background-color: #fff;
  margin: 0 30rpx 20rpx;
  border-radius: 12rpx;
}

.currency {
  font-size: 36rpx;
  color: #333;
  margin-right: 8rpx;
}

.amount-input {
  flex: 1;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  text-align: right;
}

.amount-placeholder {
  color: #ccc;
}

.date-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 30rpx;
  background-color: #fff;
  margin: 0 30rpx 20rpx;
  border-radius: 12rpx;
}

.date-label {
  font-size: 28rpx;
  color: #666;
}

.date-value {
  font-size: 28rpx;
  color: #333;
}

.categories {
  padding: 0 30rpx;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 16rpx;
}

.category-grid {
  display: flex;
  flex-wrap: wrap;
  margin: -8rpx;
}

.category-item {
  width: 25%;
  padding: 8rpx;
  box-sizing: border-box;
}

.category-item-inner {
  background-color: #fff;
  padding: 20rpx 0;
  border-radius: 12rpx;
  text-align: center;
  border: 2rpx solid transparent;
}

.category-item.selected .category-item-inner {
  border-color: #667eea;
  background-color: #f0f4ff;
}

.category-item.selected {
  border-color: #667eea;
  background-color: #f0f4ff;
}

.category-icon {
  font-size: 48rpx;
  display: block;
  margin-bottom: 8rpx;
}

.category-name {
  font-size: 22rpx;
  color: #666;
}

.remark-area {
  margin: 0 30rpx 20rpx;
  background-color: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
}

.remark-input {
  font-size: 28rpx;
}

.remark-placeholder {
  color: #ccc;
}

.submit-area {
  position: fixed;
  bottom: calc(87rpx + env(safe-area-inset-bottom) + 10rpx);
  left: 0;
  right: 0;
  padding: 20rpx 30rpx;
  background-color: #f5f5f5;
  z-index: 100;
}

.btn-row {
  display: flex;
  gap: 20rpx;
  align-items: center;
}

.btn-voice {
  width: 180rpx;
  height: 96rpx;
  background-color: #fff;
  border: 2rpx solid #667eea;
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
}

.btn-voice:active {
  background-color: #f0f4ff;
}

.voice-icon {
  font-size: 36rpx;
}

.voice-label {
  font-size: 20rpx;
  color: #667eea;
}

.btn-confirm {
  flex: 1;
  height: 96rpx;
  background-color: #667eea;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 32rpx;
}

.btn-confirm:active {
  opacity: 0.8;
}
</style>
