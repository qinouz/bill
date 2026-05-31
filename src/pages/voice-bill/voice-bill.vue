<template>
  <view class="page">
    <!-- 顶部提示 -->
    <view class="tip-area">
      <text class="tip-text">说出你的账单，例如"午饭35块，打车20"</text>
    </view>

    <!-- 录音区域 -->
    <view class="record-area">
      <!-- 状态提示 -->
      <view v-if="statusText" class="status-text">
        <text>{{ statusText }}</text>
      </view>

      <!-- 录音按钮 -->
      <view
        class="record-btn"
        :class="{ recording: isRecording, processing: isProcessing }"
        @touchstart="onVoiceStart"
        @touchend="onVoiceEnd"
        @touchcancel="onVoiceCancel"
      >
        <text class="record-icon">{{ isRecording ? '🔴' : '🎤' }}</text>
        <text class="record-label">
          {{ isProcessing ? '识别中...' : (isRecording ? '松开结束' : '长按说话') }}
        </text>
      </view>
    </view>

    <!-- 识别文字 -->
    <view v-if="recognizedText" class="recognized-text">
      <text class="text-label">识别内容：</text>
      <text class="text-content">{{ recognizedText }}</text>
    </view>

    <!-- 账单列表 -->
    <view v-if="billItems.length > 0" class="bill-list" id="billList">
      <view class="list-header">
        <text class="list-title">识别到 {{ billItems.length }} 条账单</text>
        <view class="btn-add" @tap="handleAddItem">
          <text>+ 新增</text>
        </view>
      </view>

      <view
        v-for="(item, index) in billItems"
        :key="index"
        class="bill-card"
      >
        <!-- 删除按钮 -->
        <view class="card-delete" @tap="handleDeleteItem(index)">
          <text>×</text>
        </view>

        <!-- 类型切换 -->
        <view class="card-type">
          <view
            class="type-tag"
            :class="item.type"
            @tap="toggleType(index)"
          >
            <text>{{ item.type === 'income' ? '收入' : '支出' }}</text>
          </view>
          <view class="confidence" :class="item.confidence">
            <text>{{ getConfidenceText(item.confidence) }}</text>
          </view>
        </view>

        <!-- 金额 -->
        <view class="card-row">
          <text class="row-label">金额</text>
          <input
            class="row-input amount-input"
            type="digit"
            :value="item.amount?.toString() || ''"
            placeholder="输入金额"
            @input="onAmountChange($event, index)"
          />
        </view>

        <!-- 分类 -->
        <view class="card-row" @tap="openCategoryPicker(index)">
          <text class="row-label">分类</text>
          <view class="category-value">
            <text class="row-value" :class="{ empty: !item.categoryName }">
              {{ item.categoryName || '点击选择分类' }}
            </text>
            <text class="category-arrow">›</text>
          </view>
        </view>

        <!-- 日期 -->
        <view class="card-row">
          <text class="row-label">日期</text>
          <picker mode="date" :value="item.billDate" @change="onDateChange($event, index)">
            <text class="row-value date-picker">{{ item.billDate }}</text>
          </picker>
        </view>

        <!-- 备注 -->
        <view class="card-row">
          <text class="row-label">备注</text>
          <input
            class="row-input"
            :value="item.remark"
            placeholder="可选备注"
            @input="onRemarkChange($event, index)"
          />
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
          <text>确认记账 ({{ validCount }}条)</text>
        </view>
      </view>
    </view>

    <!-- 分类选择弹窗 -->
    <view v-if="showCategoryPicker" class="picker-mask" @tap="closeCategoryPicker">
      <view class="picker-popup" @tap.stop>
        <view class="picker-header">
          <text class="picker-title">选择分类</text>
          <text class="picker-close" @tap="closeCategoryPicker">关闭</text>
        </view>
        <scroll-view scroll-y class="picker-list">
          <view
            v-for="cat in currentCategories"
            :key="cat._id"
            class="picker-item"
            @tap="selectCategory(cat)"
          >
            <text class="picker-icon">{{ cat.icon }}</text>
            <text class="picker-name">{{ cat.name }}</text>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useUserStore } from '@/store/user'
import { useBillStore } from '@/store/bill'
import { useVoiceRecord } from '@/composables/useVoiceRecord'
import { recognizeVoice } from '@/api/voice'
import type { VoiceItem } from '@/api/voice'

const userStore = useUserStore()
const billStore = useBillStore()

const { isRecording, startRecord, stopRecord, cancelRecord, onResult, onError } = useVoiceRecord()
const isProcessing = ref(false)
const recognizedText = ref('')
const billItems = ref<VoiceItem[]>([])
const showCategoryPicker = ref(false)
const recordStartTime = ref(0)
const editingIndex = ref(-1)

// 当前编辑项的分类列表
const currentCategories = computed(() => {
  if (editingIndex.value < 0) return []
  const item = billItems.value[editingIndex.value]
  const type = item?.type || 'expense'
  return billStore.categories.filter(c => c.type === type)
})

// 状态文本
const statusText = computed(() => {
  if (isProcessing.value) return '正在识别，请稍候...'
  if (isRecording.value) return '正在录音...'
  if (billItems.value.length > 0) return ''
  return '长按按钮开始录音'
})

// 有效记录数（有金额和分类）
const validCount = computed(() => {
  return billItems.value.filter(item => item.amount && item.categoryId).length
})

// 是否可确认
const canConfirm = computed(() => {
  return validCount.value > 0
})

// 录音完成回调
onResult(async (tempFilePath: string) => {
  if (!userStore.userInfo) return

  isProcessing.value = true
  uni.showLoading({ title: 'AI识别中，约需3-10秒...', mask: true })
  try {
    const result = await recognizeVoice(tempFilePath, userStore.userInfo.userId)
    recognizedText.value = result.recognizedText || ''
    billItems.value = result.items || []
    // 等待 DOM 更新后再隐藏 loading
    await nextTick()
    // 滚动到列表位置
    if (billItems.value.length > 0) {
      uni.pageScrollTo({ selector: '#billList', duration: 300 })
    }
  } catch {
    // error handled by callCloud
  } finally {
    uni.hideLoading()
    isProcessing.value = false
  }
})

// 录音错误回调
onError(() => {
  uni.hideLoading()
  isProcessing.value = false
})

function onVoiceStart() {
  billItems.value = []
  uni.authorize({
    scope: 'scope.record',
    success: () => {
      recordStartTime.value = Date.now()
      startRecord()
    },
    fail: () => {
      uni.showModal({
        title: '权限提示',
        content: '需要录音权限才能使用语音记账，请在设置中授权',
        confirmText: '去设置',
        success: (res) => {
          if (res.confirm) {
            uni.openSetting()
          }
        },
      })
    },
  })
}

function onVoiceEnd() {
  // 如果还没开始录音（授权中），直接取消
  if (!isRecording.value) {
    return
  }

  const duration = Date.now() - recordStartTime.value
  if (duration < 2000) {
    uni.showToast({ title: '说话时间太短，请长按录音', icon: 'none' })
    cancelRecord()
    return
  }
  uni.showLoading({ title: 'AI识别中...' })
  stopRecord()
}

function onVoiceCancel() {
  uni.hideLoading()
  cancelRecord()
}

function handleRetry() {
  recognizedText.value = ''
  billItems.value = []
}

// 打开分类选择器
function openCategoryPicker(index: number) {
  editingIndex.value = index
  billStore.loadCategories()
  showCategoryPicker.value = true
}

// 关闭分类选择器
function closeCategoryPicker() {
  showCategoryPicker.value = false
  editingIndex.value = -1
}

// 选择分类
function selectCategory(cat: any) {
  if (editingIndex.value >= 0) {
    billItems.value[editingIndex.value].categoryId = cat._id
    billItems.value[editingIndex.value].categoryName = cat.name
  }
  closeCategoryPicker()
}

// 金额变化
function onAmountChange(e: any, index: number) {
  const val = parseFloat(e.detail.value)
  billItems.value[index].amount = isNaN(val) ? null : val
}

// 日期变化
function onDateChange(e: any, index: number) {
  billItems.value[index].billDate = e.detail.value
}

// 备注变化
function onRemarkChange(e: any, index: number) {
  billItems.value[index].remark = e.detail.value
}

// 切换收支类型
function toggleType(index: number) {
  billItems.value[index].type = billItems.value[index].type === 'income' ? 'expense' : 'income'
}

// 新增一条
function handleAddItem() {
  billItems.value.push({
    amount: null,
    categoryId: null,
    categoryName: null,
    type: 'expense',
    remark: '',
    billDate: new Date().toISOString().split('T')[0],
    confidence: 'low',
  })
}

// 删除一条
function handleDeleteItem(index: number) {
  billItems.value.splice(index, 1)
}

// 置信度文本
function getConfidenceText(confidence: string) {
  switch (confidence) {
    case 'high': return '准确'
    case 'medium': return '核对'
    case 'low': return '补充'
    default: return ''
  }
}

// 确认记账
async function handleConfirm() {
  if (!canConfirm.value) return

  // 只保存有效的记录
  const validItems = billItems.value.filter(item => item.amount && item.categoryId)

  if (validItems.length === 0) return

  uni.showLoading({ title: `保存${validItems.length}条记录...` })
  let successCount = 0

  for (const item of validItems) {
    try {
      await billStore.addBillRecord({
        categoryId: item.categoryId!,
        amount: item.amount!,
        type: item.type,
        remark: item.remark,
        billDate: item.billDate,
      })
      successCount++
    } catch {
      // 单条失败继续下一条
    }
  }

  uni.hideLoading()
  uni.showToast({ title: `成功保存${successCount}条`, icon: 'success' })

  // 延迟返回，让用户看到提示
  setTimeout(() => {
    uni.navigateBack()
  }, 1500)
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 30rpx;
  padding-bottom: 200rpx;
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
  padding: 40rpx 0;
}

.status-text {
  margin-bottom: 30rpx;
  padding: 16rpx 32rpx;
  background-color: #fff;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #667eea;
}

.recognized-text {
  padding: 20rpx;
  background-color: #f8f9ff;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
}

.text-label {
  font-size: 24rpx;
  color: #999;
  display: block;
  margin-bottom: 8rpx;
}

.text-content {
  font-size: 28rpx;
  color: #333;
  line-height: 1.5;
}

.record-btn {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background-color: #fff;
  border: 4rpx solid #667eea;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
}

.record-btn.recording {
  background-color: #667eea;
  animation: pulse 1s infinite;
}

.record-btn.processing {
  opacity: 0.6;
  pointer-events: none;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.record-icon {
  font-size: 48rpx;
}

.record-label {
  font-size: 22rpx;
  color: #667eea;
}

.record-btn.recording .record-label {
  color: #fff;
}

.bill-list {
  margin-top: 20rpx;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.list-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.btn-add {
  padding: 12rpx 24rpx;
  background-color: #667eea;
  border-radius: 8rpx;
  font-size: 24rpx;
  color: #fff;
}

.bill-card {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  position: relative;
}

.card-delete {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  color: #999;
}

.card-type {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.type-tag {
  padding: 8rpx 20rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
}

.type-tag.expense {
  background-color: #fff3e0;
  color: #ef6c00;
}

.type-tag.income {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.confidence {
  padding: 6rpx 12rpx;
  border-radius: 6rpx;
  font-size: 20rpx;
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

.card-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.card-row:last-child {
  border-bottom: none;
}

.row-label {
  font-size: 28rpx;
  color: #666;
  width: 100rpx;
}

.row-value {
  font-size: 28rpx;
  color: #333;
  flex: 1;
  text-align: right;
}

.row-value.empty {
  color: #ff5252;
}

.date-picker {
  color: #667eea;
  text-decoration: underline;
}

.row-input {
  flex: 1;
  text-align: right;
  font-size: 28rpx;
  color: #333;
}

.amount-input {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.btn-group {
  display: flex;
  gap: 20rpx;
  margin-top: 30rpx;
  padding-bottom: 40rpx;
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

.category-value {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.category-arrow {
  font-size: 32rpx;
  color: #ccc;
}

/* 分类选择弹窗 */
.picker-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: flex;
  align-items: flex-end;
}

.picker-popup {
  width: 100%;
  max-height: 70vh;
  background-color: #fff;
  border-radius: 24rpx 24rpx 0 0;
  overflow: hidden;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.picker-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.picker-close {
  font-size: 28rpx;
  color: #999;
}

.picker-list {
  max-height: 60vh;
  padding: 20rpx;
}

.picker-item {
  display: flex;
  align-items: center;
  padding: 24rpx 20rpx;
  border-radius: 12rpx;
  gap: 16rpx;
}

.picker-item:active {
  background-color: #f5f5f5;
}

.picker-icon {
  font-size: 40rpx;
}

.picker-name {
  font-size: 28rpx;
  color: #333;
}
</style>
