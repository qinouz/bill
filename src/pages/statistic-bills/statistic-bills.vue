<template>
  <view class="page">
    <view class="filter-row">
      <view class="filter-pill">
        <text>{{ year }}年{{ month }}月</text>
      </view>
      <view class="filter-pill">
        <text>{{ typeLabel }}</text>
      </view>
    </view>

    <view class="summary-card">
      <view class="summary-item">
        <text class="summary-label">本月{{ typeLabel }}</text>
        <text class="summary-value">{{ moneyText(summaryAmount) }}</text>
        <text class="summary-sub">共{{ summaryCount }}笔</text>
      </view>
      <view class="summary-item">
        <text class="summary-label">当前已加载</text>
        <text class="summary-value small">{{ bills.length }}笔</text>
        <text class="summary-sub">共{{ total }}笔</text>
      </view>
    </view>

    <view v-if="loading && bills.length === 0" class="state-text">加载中...</view>
    <view v-else-if="bills.length === 0" class="state-text">本月还没有{{ typeLabel }}记录</view>
    <view v-else class="group-list">
      <view v-for="group in groupedBills" :key="group.date" class="date-group">
        <view class="date-title">
          <text>{{ group.title }}</text>
        </view>
        <view class="group-card">
          <view v-for="bill in group.bills" :key="bill.id" class="bill-row" @tap="goBillDetail(bill.id)">
            <view class="bill-icon">
              <text>{{ bill.categoryIcon || '📝' }}</text>
            </view>
            <view class="bill-info">
              <text class="bill-title">{{ billTitle(bill) }}</text>
              <text class="bill-meta">{{ bill.categoryName || '未分类' }}{{ bill.remark ? ` · ${bill.remark}` : '' }}</text>
            </view>
            <view class="bill-right">
              <text class="bill-time">{{ timeText(bill) }}</text>
              <text class="bill-amount" :class="bill.type">{{ billMoneyText(bill) }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view v-if="bills.length > 0" class="bottom-state">
      <text>{{ hasMore ? (loading ? '加载中...' : '上拉加载更多') : '已显示全部账单' }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { getBillList, getMonthlyStatistics, type Bill } from '@/api/bill'
import { formatCurrencyFromCents } from '@/utils/amount'

type BillType = 'income' | 'expense'

const year = ref(new Date().getFullYear())
const month = ref(new Date().getMonth() + 1)
const type = ref<BillType>('expense')
const bills = ref<Bill[]>([])
const total = ref(0)
const pageNo = ref(1)
const pageSize = 30
const loading = ref(false)
const summaryAmount = ref(0)
const summaryCount = ref(0)

const typeLabel = computed(() => type.value === 'expense' ? '支出' : '收入')
const monthParam = computed(() => `${year.value}-${String(month.value).padStart(2, '0')}`)
const hasMore = computed(() => bills.value.length < total.value)

const groupedBills = computed(() => {
  const groups: Record<string, Bill[]> = {}
  bills.value.forEach((bill) => {
    const key = bill.billDate || ''
    if (!groups[key]) groups[key] = []
    groups[key].push(bill)
  })

  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({
      date,
      title: dateTitle(date),
      bills: items,
    }))
})

function moneyText(value: unknown) {
  return formatCurrencyFromCents(value)
}

function billAmount(bill: any) {
  return Number(bill.amountCents) || 0
}

function billMoneyText(bill: any) {
  const sign = bill.type === 'income' ? '+' : '-'
  return `${sign}${moneyText(billAmount(bill))}`
}

function billTitle(bill: Bill) {
  return bill.remark || bill.categoryName || '账单'
}

function dateTitle(date: string) {
  const parts = date.split('-').map(Number)
  if (parts.length < 3 || !parts[0] || !parts[1] || !parts[2]) return date
  const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][new Date(parts[0], parts[1] - 1, parts[2]).getDay()]
  return `${parts[1]}月${parts[2]}日 ${weekday}`
}

function timeText(bill: any) {
  const raw = bill.createdAt || bill.createTime || ''
  if (!raw) return ''
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return ''
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

async function loadSummary() {
  try {
    const data = await getMonthlyStatistics({
      year: year.value,
      month: month.value,
      type: type.value,
    })
    summaryAmount.value = data.summary.currentTypeAmountCents || 0
    summaryCount.value = data.summary.currentTypeCount || 0
  } catch {
    summaryAmount.value = 0
    summaryCount.value = 0
  }
}

async function loadBills(refresh = false) {
  if (loading.value) return
  if (refresh) {
    pageNo.value = 1
    bills.value = []
    total.value = 0
  }

  loading.value = true
  try {
    const data = await getBillList({
      month: monthParam.value,
      type: type.value,
      pageNo: pageNo.value,
      pageSize,
    })
    bills.value = refresh ? data.bills : bills.value.concat(data.bills)
    total.value = data.total
    pageNo.value += 1
  } catch {
    uni.showToast({ title: '账单加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function refresh() {
  await Promise.all([loadSummary(), loadBills(true)])
}

function goBillDetail(id: string) {
  uni.navigateTo({ url: `/pages/bill-detail/bill-detail?id=${id}` })
}

onLoad((options: any) => {
  year.value = Number(options?.year) || year.value
  month.value = Number(options?.month) || month.value
  type.value = options?.type === 'income' ? 'income' : 'expense'
  uni.setNavigationBarTitle({ title: '全部账单' })
  refresh()
})

onPullDownRefresh(async () => {
  await refresh()
  uni.stopPullDownRefresh()
})

onReachBottom(() => {
  if (hasMore.value) loadBills()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f6f7f8;
  padding: 24rpx 30rpx 56rpx;
  box-sizing: border-box;
}

.filter-row {
  display: flex;
  gap: 20rpx;
  margin-bottom: 24rpx;
}

.filter-pill {
  min-width: 200rpx;
  height: 72rpx;
  padding: 0 24rpx;
  border-radius: 36rpx;
  background: #fff;
  box-shadow: 0 8rpx 28rpx rgba(18, 28, 45, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #17202c;
  font-size: 30rpx;
}

.summary-card {
  display: flex;
  background: #fff;
  border-radius: 18rpx;
  box-shadow: 0 10rpx 30rpx rgba(18, 28, 45, 0.06);
  padding: 32rpx 0;
  margin-bottom: 34rpx;
}

.summary-item {
  flex: 1;
  min-width: 0;
  padding: 0 30rpx;
}

.summary-item + .summary-item {
  border-left: 1rpx solid #edf0f2;
}

.summary-label {
  display: block;
  color: #737c89;
  font-size: 26rpx;
}

.summary-value {
  display: block;
  margin-top: 14rpx;
  color: #111827;
  font-size: 42rpx;
  font-weight: 700;
  line-height: 1.2;
}

.summary-value.small {
  font-size: 38rpx;
}

.summary-sub {
  display: block;
  margin-top: 8rpx;
  color: #8a929d;
  font-size: 24rpx;
}

.state-text {
  padding: 100rpx 0;
  text-align: center;
  color: #8b95a1;
  font-size: 26rpx;
}

.date-group {
  margin-bottom: 30rpx;
}

.date-title {
  margin: 0 0 16rpx 18rpx;
  color: #111827;
  font-size: 30rpx;
  font-weight: 700;
}

.group-card {
  background: #fff;
  border-radius: 18rpx;
  box-shadow: 0 10rpx 30rpx rgba(18, 28, 45, 0.06);
  padding: 8rpx 26rpx;
}

.bill-row {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #eef1f3;
}

.bill-row:last-child {
  border-bottom: none;
}

.bill-icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: #e4f5f2;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34rpx;
  flex-shrink: 0;
}

.bill-info {
  flex: 1;
  min-width: 0;
  margin-left: 20rpx;
}

.bill-title {
  display: block;
  color: #17202c;
  font-size: 30rpx;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bill-meta {
  display: block;
  margin-top: 8rpx;
  color: #87909b;
  font-size: 24rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bill-right {
  margin-left: 18rpx;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6rpx;
}

.bill-time {
  color: #9aa2ad;
  font-size: 23rpx;
}

.bill-amount {
  color: #17202c;
  font-size: 30rpx;
  font-weight: 700;
  white-space: nowrap;
}

.bill-amount.income {
  color: #0aa368;
}

.bottom-state {
  padding: 34rpx 0;
  text-align: center;
  color: #9aa2ad;
  font-size: 24rpx;
}
</style>
