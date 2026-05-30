<template>
  <view class="page">
    <!-- 年份选择 -->
    <view class="year-bar">
      <view class="year-btn" @tap="changeYear(-1)">
        <text>上一年</text>
      </view>
      <text class="year-title">{{ selectedYear }}年统计</text>
      <view class="year-btn" @tap="changeYear(1)">
        <text>下一年</text>
      </view>
    </view>

    <!-- 年度卡片 -->
    <view class="cards">
      <view class="card income-card">
        <text class="card-label">年收入</text>
        <text class="card-amount">{{ yearIncome }}</text>
      </view>
      <view class="card expense-card">
        <text class="card-label">年支出</text>
        <text class="card-amount">{{ yearExpense }}</text>
      </view>
      <view class="card balance-card">
        <text class="card-label">年结余</text>
        <text class="card-amount" :class="parseFloat(yearBalance) >= 0 ? 'positive' : 'negative'">
          {{ yearBalance }}
        </text>
      </view>
    </view>

    <!-- 月份列表 -->
    <view class="month-section">
      <text class="section-title">月份统计</text>
      <view v-for="m in monthlyData" :key="m.month" class="month-row">
        <text class="month-name">{{ m.month }}月</text>
        <view class="month-data">
          <view class="data-item">
            <text class="data-label">收入</text>
            <text class="data-value income">{{ m.income }}</text>
          </view>
          <view class="data-item">
            <text class="data-label">支出</text>
            <text class="data-value expense">{{ m.expense }}</text>
          </view>
        </view>
      </view>
    </view>
    <CustomTabbar />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useBillStore } from '@/store/bill'
import CustomTabbar from '@/components/custom-tabbar/custom-tabbar.vue'

const billStore = useBillStore()
const selectedYear = ref(new Date().getFullYear())

const yearIncome = ref('0.00')
const yearExpense = ref('0.00')
const yearBalance = ref('0.00')
const monthlyData = ref<{ month: number; income: string; expense: string }[]>([])

function changeYear(delta: number) {
  selectedYear.value += delta
  loadStatistic()
}

async function loadStatistic() {
  try {
    const data = await billStore.loadStatistic(selectedYear.value)
    if (data) {
      yearIncome.value = data.income.toFixed(2)
      yearExpense.value = data.expense.toFixed(2)
      yearBalance.value = data.balance.toFixed(2)
      // 构造月度数据
      const monthly = data.monthly || {}
      const result = []
      for (let i = 1; i <= 12; i++) {
        const m = monthly[String(i)] || { income: 0, expense: 0 }
        result.push({ month: i, income: m.income.toFixed(2), expense: m.expense.toFixed(2) })
      }
      monthlyData.value = result
    }
  } catch {}
}

onShow(() => {
  loadStatistic()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20rpx 30rpx 180rpx;
}

.year-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  padding: 24rpx;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  gap: 40rpx;
}

.year-btn {
  padding: 16rpx 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #667eea;
  border-radius: 12rpx;
  color: #fff;
  font-size: 28rpx;
  white-space: nowrap;
}

.year-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.cards {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-bottom: 30rpx;
}

.card {
  padding: 28rpx;
  border-radius: 12rpx;
  color: #fff;
}

.income-card {
  background: linear-gradient(135deg, #00b26a 0%, #00d4aa 100%);
}

.expense-card {
  background: linear-gradient(135deg, #ff5252 0%, #ff8a80 100%);
}

.balance-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.card-label {
  font-size: 24rpx;
  opacity: 0.8;
  display: block;
  margin-bottom: 8rpx;
}

.card-amount {
  font-size: 48rpx;
  font-weight: bold;
}

.card-amount.positive {
  color: #fff;
}

.card-amount.negative {
  color: #ffcccc;
}

.month-section {
  margin-top: 20rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 16rpx;
}

.month-row {
  background-color: #fff;
  padding: 24rpx;
  border-radius: 12rpx;
  margin-bottom: 12rpx;
}

.month-name {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  display: block;
  margin-bottom: 12rpx;
}

.month-data {
  display: flex;
  justify-content: space-between;
}

.data-item {
  display: flex;
  gap: 8rpx;
  align-items: center;
}

.data-label {
  font-size: 24rpx;
  color: #999;
}

.data-value {
  font-size: 26rpx;
  font-weight: 500;
}

.data-value.income {
  color: #00b26a;
}

.data-value.expense {
  color: #ff5252;
}
</style>
