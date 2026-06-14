<template>
  <view class="page">
    <view class="month-row">
      <view class="month-pill">
        <text>{{ year }}年{{ month }}月</text>
      </view>
    </view>

    <view class="hero-card">
      <view class="hero-icon">
        <text>{{ categoryIcon || '📝' }}</text>
      </view>
      <view class="hero-info">
        <text class="hero-name">{{ categoryName }}</text>
        <text class="hero-amount">{{ moneyText(categoryAmountCents) }}</text>
        <text class="hero-meta">共{{ count }}笔 · 占本月{{ typeLabel }}的{{ percentText(percentage) }}</text>
      </view>
    </view>

    <view class="list-card">
      <view class="section-title">账单明细</view>
      <view v-if="loading && bills.length === 0" class="state-text">加载中...</view>
      <view v-else-if="bills.length === 0" class="state-text">暂无账单</view>
      <view v-else>
        <view v-for="bill in bills" :key="bill.id" class="bill-row" @tap="goBillDetail(bill.id)">
          <view class="bill-icon">
            <text>{{ categoryIcon || bill.categoryIcon || '📝' }}</text>
          </view>
          <view class="bill-info">
            <text class="bill-title">{{ billTitle(bill) }}</text>
            <text class="bill-meta">{{ dateText(bill.billDate) }} · {{ bill.remark || categoryName }}</text>
          </view>
          <text class="bill-amount" :class="bill.type">{{ billMoneyText(bill) }}</text>
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
import { getBillList, type Bill } from '@/api/bill'
import { formatCurrencyFromCents } from '@/utils/amount'

type BillType = 'income' | 'expense'

const year = ref(new Date().getFullYear())
const month = ref(new Date().getMonth() + 1)
const type = ref<BillType>('expense')
const categoryId = ref('')
const categoryName = ref('分类')
const categoryIcon = ref('')
const categoryAmountCents = ref(0)
const count = ref(0)
const percentage = ref(0)
const bills = ref<Bill[]>([])
const total = ref(0)
const pageNo = ref(1)
const pageSize = 20
const loading = ref(false)

const typeLabel = computed(() => type.value === 'expense' ? '支出' : '收入')
const monthParam = computed(() => `${year.value}-${String(month.value).padStart(2, '0')}`)
const hasMore = computed(() => bills.value.length < total.value)

function moneyText(value: unknown) {
  return formatCurrencyFromCents(value)
}

function percentText(value: unknown) {
  const percent = Number(value)
  if (!Number.isFinite(percent) || percent <= 0) return '0%'
  if (percent < 0.01) return '<0.01%'
  return `${percent.toFixed(1)}%`
}

function billAmount(bill: any) {
  return Number(bill.amountCents) || 0
}

function billMoneyText(bill: any) {
  const sign = bill.type === 'income' ? '+' : '-'
  return `${sign}${moneyText(billAmount(bill))}`
}

function billTitle(bill: Bill) {
  return bill.remark || bill.categoryName || categoryName.value || '账单'
}

function dateText(date?: string) {
  if (!date) return ''
  const parts = date.split('-')
  if (parts.length < 3) return date
  return `${Number(parts[1])}月${Number(parts[2])}日`
}

async function loadBills(refresh = false) {
  if (loading.value || !categoryId.value) return
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
      categoryId: categoryId.value,
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

function goBillDetail(id: string) {
  uni.navigateTo({ url: `/pages/bill-detail/bill-detail?id=${id}` })
}

onLoad((options: any) => {
  year.value = Number(options?.year) || year.value
  month.value = Number(options?.month) || month.value
  type.value = options?.type === 'income' ? 'income' : 'expense'
  categoryId.value = decodeURIComponent(options?.categoryId || '')
  categoryName.value = decodeURIComponent(options?.categoryName || '分类')
  categoryIcon.value = decodeURIComponent(options?.categoryIcon || '')
  categoryAmountCents.value = Number(options?.amountCents) || 0
  count.value = Number(options?.count) || 0
  percentage.value = Number(options?.percentage) || 0
  uni.setNavigationBarTitle({ title: `${categoryName.value}账单` })
  loadBills(true)
})

onPullDownRefresh(async () => {
  await loadBills(true)
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

.month-row {
  margin-bottom: 24rpx;
}

.month-pill {
  width: 230rpx;
  height: 72rpx;
  border-radius: 36rpx;
  background: #fff;
  box-shadow: 0 8rpx 28rpx rgba(18, 28, 45, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #17202c;
  font-size: 30rpx;
}

.hero-card,
.list-card {
  background: #fff;
  border-radius: 18rpx;
  box-shadow: 0 10rpx 30rpx rgba(18, 28, 45, 0.06);
}

.hero-card {
  display: flex;
  align-items: center;
  padding: 40rpx 34rpx;
  margin-bottom: 24rpx;
}

.hero-icon {
  width: 108rpx;
  height: 108rpx;
  border-radius: 54rpx;
  background: #e4f5f2;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 56rpx;
  flex-shrink: 0;
}

.hero-info {
  flex: 1;
  min-width: 0;
  margin-left: 28rpx;
}

.hero-name {
  display: block;
  color: #111827;
  font-size: 34rpx;
  font-weight: 700;
}

.hero-amount {
  display: block;
  margin-top: 16rpx;
  color: #111827;
  font-size: 56rpx;
  line-height: 1.1;
  font-weight: 700;
}

.hero-meta {
  display: block;
  margin-top: 14rpx;
  color: #7b8490;
  font-size: 25rpx;
}

.list-card {
  padding: 30rpx 28rpx;
}

.section-title {
  color: #111827;
  font-size: 30rpx;
  font-weight: 700;
  margin-bottom: 16rpx;
}

.state-text {
  padding: 70rpx 0;
  text-align: center;
  color: #8b95a1;
  font-size: 26rpx;
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

.bill-amount {
  margin-left: 18rpx;
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
