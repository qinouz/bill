<template>
  <view class="page">
    <!-- 顶部提示 -->
    <view class="tip-area">
      <text class="tip-text">拍摄或选择小票、账单截图</text>
    </view>

    <!-- 图片区域 -->
    <view class="image-area">
      <!-- 已选图片 -->
      <view v-if="imagePath" class="image-preview">
        <image :src="imagePath" mode="aspectFit" class="preview-image" />
        <view class="image-actions">
          <view class="action-btn" @tap="handleRetake">
            <text>重新选择</text>
          </view>
        </view>
      </view>

      <!-- 选择图片按钮 -->
      <view v-else class="image-buttons">
        <view class="img-btn" @tap="handleCamera">
          <text class="btn-icon">📷</text>
          <text class="btn-label">拍照</text>
        </view>
        <view class="img-btn" @tap="handleAlbum">
          <text class="btn-icon">🖼️</text>
          <text class="btn-label">相册</text>
        </view>
      </view>
    </view>

    <!-- 状态提示 -->
    <view v-if="isProcessing" class="status-area">
      <text class="status-text">正在识别，请稍候...</text>
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
          <text>重新选择</text>
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
            :key="cat.id"
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
import { recognizePhoto } from '@/api/photo'
import type { VoiceItem } from '@/api/voice'

const userStore = useUserStore()
const billStore = useBillStore()

const isProcessing = ref(false)
const imagePath = ref('')
const billItems = ref<VoiceItem[]>([])
const showCategoryPicker = ref(false)
const editingIndex = ref(-1)

// 当前编辑项的分类列表
const currentCategories = computed(() => {
  if (editingIndex.value < 0) return []
  const item = billItems.value[editingIndex.value]
  const type = item?.type || 'expense'
  return billStore.categories.filter((c: any) => c.type === type)
})

// 有效记录数
const validCount = computed(() => {
  return billItems.value.filter((item: any) => item.amount && item.categoryId).length
})

// 是否可确认
const canConfirm = computed(() => {
  return validCount.value > 0
})

// 拍照
function handleCamera() {
  uni.authorize({
    scope: 'scope.camera',
    success: () => {
      uni.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['camera'],
        sizeType: ['compressed'],
        success: (res: any) => {
          const tempFilePath = res.tempFiles[0].tempFilePath
          imagePath.value = tempFilePath
          compressAndProcess(tempFilePath)
        },
        fail: (err: any) => {
          console.error('拍照失败:', err)
        },
      })
    },
    fail: () => {
      uni.showModal({
        title: '权限提示',
        content: '需要相机权限才能拍照，请在设置中授权',
        confirmText: '去设置',
        success: (modalRes: any) => {
          if (modalRes.confirm) {
            uni.openSetting()
          }
        },
      })
    },
  })
}

// 从相册选择
function handleAlbum() {
  uni.authorize({
    scope: 'scope.writePhotosAlbum',
    success: () => {
      uni.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album'],
        sizeType: ['compressed'],
        success: (res: any) => {
          const tempFilePath = res.tempFiles[0].tempFilePath
          imagePath.value = tempFilePath
          compressAndProcess(tempFilePath)
        },
        fail: (err: any) => {
          console.error('选择图片失败:', err)
        },
      })
    },
    fail: () => {
      uni.showModal({
        title: '权限提示',
        content: '需要相册权限才能选择图片，请在设置中授权',
        confirmText: '去设置',
        success: (modalRes: any) => {
          if (modalRes.confirm) {
            uni.openSetting()
          }
        },
      })
    },
  })
}

// 压缩图片后处理（限制最长边 1280px，质量 30，大幅减小上传和推理耗时）
function compressAndProcess(filePath: string) {
  uni.getImageInfo({
    src: filePath,
    success: (info) => {
      const maxSide = 1280
      let targetWidth = info.width
      let targetHeight = info.height
      if (info.width > maxSide || info.height > maxSide) {
        if (info.width > info.height) {
          targetWidth = maxSide
          targetHeight = Math.round((info.height * maxSide) / info.width)
        } else {
          targetHeight = maxSide
          targetWidth = Math.round((info.width * maxSide) / info.height)
        }
      }
      uni.compressImage({
        src: filePath,
        quality: 30,
        compressedWidth: targetWidth,
        compressedHeight: targetHeight,
        success: (res) => {
          processImage(res.tempFilePath)
        },
        fail: () => {
          processImage(filePath)
        },
      })
    },
    fail: () => {
      uni.compressImage({
        src: filePath,
        quality: 30,
        success: (res) => {
          processImage(res.tempFilePath)
        },
        fail: () => {
          processImage(filePath)
        },
      })
    },
  })
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
    billItems.value[editingIndex.value].categoryId = cat.id
    billItems.value[editingIndex.value].categoryName = cat.name
  }
  closeCategoryPicker()
}

// 重新选择
function handleRetake() {
  imagePath.value = ''
  billItems.value = []
}

// 处理图片
async function processImage(filePath: string) {
  if (!userStore.userInfo) return

  isProcessing.value = true
  try {
    uni.showLoading({ title: 'AI识别中，约需5-15秒...', mask: true })

    // 调用识别（直接传文件路径，API内部会上传到云存储）
    const result = await recognizePhoto(filePath)
    billItems.value = result.items || []

    if (billItems.value.length === 0) {
      uni.showToast({ title: '未识别到账单', icon: 'none' })
    }

    // 等待 DOM 更新
    await nextTick()
    // 滚动到列表
    if (billItems.value.length > 0) {
      uni.pageScrollTo({ selector: '#billList', duration: 300 })
    }
  } catch (err: any) {
    console.error('识别失败:', err)
    uni.showToast({ title: err.message || '识别失败', icon: 'none' })
  } finally {
    uni.hideLoading()
    isProcessing.value = false
  }
}

// 重置
function handleRetry() {
  imagePath.value = ''
  billItems.value = []
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

  const validItems = billItems.value.filter((item: any) => item.amount && item.categoryId)
  if (validItems.length === 0) return

  uni.showLoading({ title: '保存中...' })

  try {
    const result = await billStore.addBillRecords(validItems as any[])
    uni.hideLoading()
    uni.showToast({ title: `成功保存${result.count}条`, icon: 'success' })
  } catch {
    uni.hideLoading()
    uni.showToast({ title: '保存失败', icon: 'none' })
    return
  }

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

.image-area {
  margin-bottom: 30rpx;
}

.image-buttons {
  display: flex;
  gap: 30rpx;
  justify-content: center;
}

.img-btn {
  width: 200rpx;
  height: 200rpx;
  background-color: #fff;
  border: 4rpx dashed #667eea;
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
}

.btn-icon {
  font-size: 60rpx;
}

.btn-label {
  font-size: 28rpx;
  color: #667eea;
}

.image-preview {
  background-color: #fff;
  border-radius: 16rpx;
  overflow: hidden;
}

.preview-image {
  width: 100%;
  height: 400rpx;
}

.image-actions {
  padding: 20rpx;
  display: flex;
  justify-content: center;
}

.action-btn {
  padding: 16rpx 40rpx;
  background-color: #f5f5f5;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: #666;
}

.status-area {
  text-align: center;
  padding: 40rpx 0;
}

.status-text {
  font-size: 28rpx;
  color: #667eea;
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
