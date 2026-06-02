<template>
  <view class="page">
    <!-- 月份选择 -->
    <view class="month-bar">
      <view class="month-btn" @tap="changeMonth(-1)">
        <text>上月</text>
      </view>
      <picker mode="date" fields="month" :value="currentMonth" @change="onMonthChange">
        <text class="month-title">{{ currentMonth }}</text>
      </picker>
      <view class="month-btn" @tap="changeMonth(1)">
        <text>下月</text>
      </view>
    </view>

    <!-- 本月汇总 -->
    <view class="summary">
      <view class="summary-item">
        <view class="label">本月收入</view>
        <view class="amount income">{{ monthIncome }}</view>
      </view>
      <view class="summary-item">
        <view class="label">本月支出</view>
        <view class="amount expense">{{ monthExpense }}</view>
      </view>
    </view>

    <!-- 账单列表 -->
    <view class="bills-list">
      <view v-if="groupedBills.length === 0 && !billStore.loading" class="empty">
        <text>暂无账单，去记账吧</text>
      </view>

      <view v-for="group in groupedBills" :key="group.date" class="bill-group">
        <view class="group-header">
          <text class="group-date">{{ group.date }}</text>
          <text class="group-total">{{ groupExpense(group.bills) }}</text>
        </view>
        <view
          v-for="bill in group.bills"
          :key="bill.id"
          class="bill-item"
        >
          <view class="bill-left" @tap="goDetail(bill.id)">
            <text class="bill-icon">{{ billStore.getCategoryIcon(bill.categoryId) }}</text>
            <view class="bill-info">
              <text class="bill-category">{{ billStore.getCategoryName(bill.categoryId) }}</text>
              <text v-if="bill.remark" class="bill-remark">{{ bill.remark }}</text>
            </view>
          </view>
          <view class="bill-right">
            <text class="bill-date-tag">{{ formatDate(bill.billDate) }}</text>
            <text class="bill-amount" :class="bill.type">
              {{ bill.type === 'income' ? '+' : '-' }}{{ bill.amount.toFixed(2) }}
            </text>
            <view class="delete-btn" @tap="handleDelete(bill.id)">
              <text>删除</text>
            </view>
          </view>
        </view>
      </view>

      <view v-if="billStore.loading" class="loading">
        <text>加载中...</text>
      </view>
      <view v-if="!billStore.hasMore && groupedBills.length > 0" class="no-more">
        <text>没有更多了</text>
      </view>
    </view>
    <CustomTabbar />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { onPullDownRefresh, onReachBottom, onShow } from '@dcloudio/uni-app'
import { useBillStore } from '@/store/bill'
import { useUserStore } from '@/store/user'
import { deleteBill as deleteBillApi } from '@/api/bill'
import CustomTabbar from '@/components/custom-tabbar/custom-tabbar.vue'

const billStore = useBillStore()

function getCurrentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const currentMonth = ref(getCurrentMonth())

function changeMonth(delta: number) {
  const [year, month] = currentMonth.value.split('-').map(Number)
  const date = new Date(year, month - 1 + delta, 1)
  currentMonth.value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  billStore.setMonth(currentMonth.value)
  billStore.loadBills(true)
}

function onMonthChange(e: any) {
  currentMonth.value = e.detail.value
  billStore.setMonth(currentMonth.value)
  billStore.loadBills(true)
}

const monthIncome = computed(() => {
  return billStore.bills
    .filter((b) => b.type === 'income')
    .reduce((sum, b) => sum + b.amount, 0)
    .toFixed(2)
})

const monthExpense = computed(() => {
  return billStore.bills
    .filter((b) => b.type === 'expense')
    .reduce((sum, b) => sum + b.amount, 0)
    .toFixed(2)
})

const groupedBills = computed(() => {
  const groups: Record<string, typeof billStore.bills> = {}
  billStore.bills.forEach((bill) => {
    if (!groups[bill.billDate]) groups[bill.billDate] = []
    groups[bill.billDate].push(bill)
  })
  return Object.entries(groups)
    .map(([date, bills]) => ({ date, bills }))
    .sort((a, b) => b.date.localeCompare(a.date))
})

function groupExpense(bills: typeof billStore.bills) {
  const expense = bills
    .filter((b) => b.type === 'expense')
    .reduce((sum, b) => sum + b.amount, 0)
  return expense > 0 ? `-${expense.toFixed(2)}` : ''
}

function formatDate(billDate: string) {
  if (!billDate) return ''
  const parts = billDate.split('-')
  if (parts.length >= 3) {
    return `${parts[1]}-${parts[2]}`
  }
  return billDate
}

function goDetail(billId: string) {
  uni.navigateTo({ url: `/pages/bill-detail/bill-detail?id=${billId}` })
}

async function handleDelete(billId: string) {
  uni.showModal({
    title: '确认删除',
    content: '删除后无法恢复，确认删除这条账单？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await deleteBillApi({ billId })
          uni.showToast({ title: '已删除', icon: 'success' })
          // 本地移除，不刷新
          const index = billStore.bills.findIndex(b => b._id === billId)
          if (index > -1) {
            billStore.bills.splice(index, 1)
            billStore.total--
          }
        } catch {
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    },
  })
}

onShow(() => {
  billStore.setMonth(currentMonth.value)

  // 等待登录完成后再加载数据
  const userStore = useUserStore()
  if (userStore.userInfo) {
    billStore.loadBills(true)
    billStore.loadCategories()
  } else {
    // 监听 userInfo 变化
    const stopWatch = watch(() => userStore.userInfo, (val: any) => {
      if (val) {
        billStore.loadBills(true)
        billStore.loadCategories()
        stopWatch()
      }
    })
  }
})

onPullDownRefresh(async () => {
  await billStore.loadBills(true)
  uni.stopPullDownRefresh()
})

onReachBottom(() => {
  if (billStore.hasMore) billStore.loadBills()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 180rpx;
}

.month-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  padding: 20rpx 30rpx;
  gap: 30rpx;
}

.month-btn {
  padding: 12rpx 24rpx;
  background-color: #667eea;
  border-radius: 8rpx;
  color: #fff;
  font-size: 26rpx;
}

.month-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.summary {
  display: flex;
  padding: 30rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  gap: 20rpx;
}

.summary-item {
  flex: 1;
  background-color: rgba(255, 255, 255, 0.15);
  padding: 30rpx;
  border-radius: 16rpx;
  text-align: center;
}

.label {
  color: #fff;
  font-size: 24rpx;
  opacity: 0.8;
  margin-bottom: 12rpx;
}

.amount {
  font-size: 44rpx;
  font-weight: bold;
  color: #fff;
}

.bills-list {
  padding: 20rpx 30rpx;
}

.empty {
  text-align: center;
  padding: 100rpx 0;
  color: #999;
  font-size: 28rpx;
}

.bill-group {
  margin-bottom: 30rpx;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
}

.group-date {
  font-size: 24rpx;
  color: #999;
}

.group-total {
  font-size: 24rpx;
  color: #999;
}

.bill-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  padding: 24rpx;
  margin-bottom: 12rpx;
  border-radius: 12rpx;
}

.bill-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.bill-icon {
  font-size: 44rpx;
  margin-right: 20rpx;
}

.bill-info {
  flex: 1;
}

.bill-category {
  font-size: 28rpx;
  color: #333;
  display: block;
}

.bill-remark {
  font-size: 22rpx;
  color: #999;
  margin-top: 6rpx;
  display: block;
}

.bill-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.bill-date-tag {
  font-size: 22rpx;
  color: #999;
  margin-bottom: 4rpx;
}

.bill-amount {
  font-size: 28rpx;
  font-weight: 600;
}

.bill-amount.income {
  color: #00b26a;
}

.bill-amount.expense {
  color: #333;
}

.delete-btn {
  margin-top: 8rpx;
  padding: 4rpx 16rpx;
  background-color: #fff3f3;
  color: #ff5252;
  font-size: 22rpx;
  border-radius: 6rpx;
}

.loading,
.no-more {
  text-align: center;
  padding: 30rpx;
  color: #999;
  font-size: 24rpx;
}
</style>
