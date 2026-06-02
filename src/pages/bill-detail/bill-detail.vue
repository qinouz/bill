<template>
  <view class="page">
    <view v-if="bill" class="detail-card">
      <!-- 金额 -->
      <view class="amount-area">
        <text class="amount" :class="bill.type">
          {{ bill.type === 'income' ? '+' : '-' }}{{ bill.amount.toFixed(2) }}
        </text>
        <text class="type-label">{{ bill.type === 'income' ? '收入' : '支出' }}</text>
      </view>

      <!-- 详情列表 -->
      <view class="info-list">
        <view class="info-item">
          <text class="info-label">分类</text>
          <text class="info-value">{{ billStore.getCategoryIcon(bill.categoryId) }} {{ billStore.getCategoryName(bill.categoryId) }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">日期</text>
          <text class="info-value">{{ bill.billDate }}</text>
        </view>
        <view v-if="bill.remark" class="info-item">
          <text class="info-label">备注</text>
          <text class="info-value">{{ bill.remark }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">创建时间</text>
          <text class="info-value">{{ formatDateTime(bill.createTime) }}</text>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="actions">
        <button class="btn btn-delete" @tap="handleDelete">删除</button>
      </view>
    </view>

    <view v-else class="loading">
      <text>加载中...</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useBillStore } from '@/store/bill'
import { useUserStore } from '@/store/user'
import { getBillDetail, deleteBill as deleteBillApi } from '@/api/bill'

const billStore = useBillStore()
const userStore = useUserStore()
const bill = ref<any>(null)

onLoad((options) => {
  if (options?.id) {
    loadDetail(options.id)
  }

  if (userStore.userInfo) {
    billStore.loadCategories()
  } else {
    const stopWatch = watch(() => userStore.userInfo, (val: any) => {
      if (val) {
        billStore.loadCategories()
        stopWatch()
      }
    })
  }
})

async function loadDetail(id: string) {
  try {
    bill.value = await getBillDetail({ billId: id })
  } catch {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

function formatDateTime(dateStr: string) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

function handleDelete() {
  uni.showModal({
    title: '确认删除',
    content: '删除后无法恢复，确认删除这条账单？',
    success: async (res) => {
      if (res.confirm && bill.value) {
        try {
          await deleteBillApi({ billId: bill.value.id })
          uni.showToast({ title: '已删除', icon: 'success' })
          setTimeout(() => uni.navigateBack(), 1000)
        } catch {}
      }
    },
  })
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 30rpx;
}

.detail-card {
  background-color: #fff;
  border-radius: 16rpx;
  overflow: hidden;
}

.amount-area {
  padding: 60rpx 30rpx;
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.amount {
  font-size: 72rpx;
  font-weight: bold;
  display: block;
}

.type-label {
  font-size: 24rpx;
  opacity: 0.7;
  display: block;
  margin-top: 8rpx;
}

.info-list {
  padding: 20rpx 30rpx;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 28rpx;
  color: #999;
}

.info-value {
  font-size: 28rpx;
  color: #333;
}

.actions {
  padding: 30rpx;
}

.btn-delete {
  width: 100%;
  padding: 24rpx;
  background-color: #fff;
  color: #ff5252;
  border: 2rpx solid #ff5252;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.loading {
  text-align: center;
  padding: 100rpx 0;
  color: #999;
}
</style>
