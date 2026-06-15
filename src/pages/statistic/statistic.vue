<template>
  <view class="page">
    <view class="top-bar">
      <picker mode="date" fields="month" :value="monthValue" :end="maxMonthValue" @change="onMonthChange">
        <view class="month-pill">
          <text>{{ selectedYear }}年{{ selectedMonth }}月</text>
          <text class="pill-arrow">⌄</text>
        </view>
      </picker>
    </view>

    <view class="type-tabs">
      <view
        v-for="item in typeOptions"
        :key="item.value"
        class="type-tab"
        :class="{ active: currentType === item.value }"
        @tap="switchType(item.value)"
      >
        <text>{{ item.label }}</text>
      </view>
    </view>

    <view v-if="error" class="state-card">
      <text class="state-title">月账单加载失败</text>
      <text class="state-desc">请稍后重试</text>
      <button class="state-button" @tap="loadStatistics">重新加载</button>
    </view>

    <view v-else>
      <view class="summary-card">
        <view class="summary-main">
          <text class="summary-label">本月{{ currentTypeLabel }}</text>
          <text class="summary-amount">{{ currentAmountText }}</text>
          <text class="summary-count">共{{ currentCount }}笔</text>
        </view>
        <view class="summary-side">
          <text class="side-label">本月{{ otherTypeLabel }}</text>
          <text class="side-amount">{{ otherAmountText }}</text>
        </view>
      </view>

      <view class="section-card">
        <view class="section-header">
          <text class="section-title">最近六个月</text>
        </view>
        <view class="trend-wrap">
          <scroll-view
            class="trend-scroll"
            scroll-x
            enable-flex
            show-scrollbar="false"
            :scroll-into-view="trendScrollIntoView"
          >
            <view class="trend-chart">
              <view
                v-for="item in trendItems"
                :key="`${item.year}-${item.month}`"
                :id="trendItemId(item.year, item.month)"
                class="trend-item"
                @tap="selectTrendMonth(item.year, item.month)"
              >
                <text class="trend-value" :class="{ active: isSelectedMonth(item.year, item.month) }">
                  {{ item.amountCents > 0 ? shortAmount(item.amountCents) : '' }}
                </text>
                <view class="bar-track">
                  <view
                    class="bar"
                    :class="{ active: isSelectedMonth(item.year, item.month) }"
                    :style="{ height: `${item.height}rpx` }"
                  />
                </view>
                <text class="trend-month" :class="{ active: isSelectedMonth(item.year, item.month) }">
                  {{ item.month }}月
                </text>
              </view>
            </view>
          </scroll-view>
          <view v-if="loading" class="loading-mask">加载中...</view>
        </view>
      </view>

      <view class="section-card">
        <view class="section-header">
          <text class="section-title">分类统计</text>
        </view>
        <view v-if="loading" class="loading-line">加载中...</view>
        <view v-else-if="categoryItems.length === 0" class="empty-block">
          <text>暂无分类统计</text>
        </view>
        <view v-else class="category-list">
          <view
            v-for="category in categoryItems"
            :key="category.categoryId"
            class="category-row"
            @tap="goCategoryDetail(category)"
          >
            <view class="category-icon-wrap">
              <text class="category-icon">{{ category.categoryIcon || '…' }}</text>
            </view>
            <view class="category-main">
              <view class="category-line">
                <text class="category-name">{{ category.categoryName }}</text>
                <view class="category-action">
                  <text class="category-money">{{ moneyText(category.amountCents) }}</text>
                  <text class="category-arrow">›</text>
                </view>
              </view>
              <view class="progress-line">
                <view class="progress-track">
                  <view class="progress-fill" :style="{ width: `${category.barPercent}%` }" />
                </view>
                <text class="category-percent">{{ percentText(category.percentage) }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view class="section-card recent-card">
        <view class="section-header">
          <text class="section-title">最近账单</text>
        </view>
        <view v-if="loading" class="loading-line">加载中...</view>
        <view v-else-if="recentBills.length === 0" class="empty-block">
          <text>{{ emptyBillText }}</text>
        </view>
        <view v-else class="recent-list">
          <view v-for="bill in recentBills" :key="bill.id" class="bill-row" @tap="goBillDetail(bill.id)">
            <view class="bill-icon-wrap">
              <text class="bill-icon">{{ bill.categoryIcon || '📝' }}</text>
            </view>
            <view class="bill-info">
              <text class="bill-title">{{ billTitle(bill) }}</text>
              <text class="bill-meta">{{ bill.categoryName || '未分类' }} · {{ dateText(bill.billDate || bill.occurredAt) }}</text>
            </view>
            <text class="bill-amount" :class="bill.type">{{ billMoneyText(bill) }}</text>
          </view>
          <view class="all-link" @tap="goAllBills">
            <text>查看全部账单</text>
            <text class="link-arrow">›</text>
          </view>
        </view>
      </view>
    </view>

    <view v-if="!error && !loading && currentCount === 0" class="empty-tip">
      <text class="empty-title">{{ allEmptyText }}</text>
      <text class="empty-desc">记一笔后，这里会生成月度统计</text>
      <button class="empty-button" @tap="goAddBill">去记一笔</button>
    </view>

    <CustomTabbar />
  </view>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getMonthlyStatistics, type MonthlyStatistics } from '@/api/bill'
import { useUserStore } from '@/store/user'
import { formatCurrencyFromCents } from '@/utils/amount'
import CustomTabbar from '@/components/custom-tabbar/custom-tabbar.vue'

type BillType = 'income' | 'expense'

const userStore = useUserStore()
const now = new Date()
const selectedYear = ref(now.getFullYear())
const selectedMonth = ref(now.getMonth() + 1)
const currentType = ref<BillType>('expense')
const statistics = ref<MonthlyStatistics | null>(null)
const trend = ref<MonthlyStatistics['trend']>([])
const loading = ref(false)
const error = ref('')
const trendScrollIntoView = ref('')
let hasReleasedInitialTrendScroll = false
let requestId = 0

const typeOptions = [
  { value: 'expense' as const, label: '支出' },
  { value: 'income' as const, label: '收入' },
]

const maxMonthValue = computed(() => {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
})

const monthValue = computed(() => {
  return `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}`
})

const currentTypeLabel = computed(() => currentType.value === 'expense' ? '支出' : '收入')
const otherTypeLabel = computed(() => currentType.value === 'expense' ? '收入' : '支出')

const currentAmount = computed(() => statistics.value?.summary.currentTypeAmountCents || 0)
const currentCount = computed(() => statistics.value?.summary.currentTypeCount || 0)
const monthBillCount = computed(() => {
  const summary = statistics.value?.summary
  return (summary?.expenseCount || 0) + (summary?.incomeCount || 0)
})
const currentAmountText = computed(() => moneyText(currentAmount.value))
const otherAmountText = computed(() => {
  const summary = statistics.value?.summary
  const amountCents = currentType.value === 'expense' ? summary?.incomeAmountCents : summary?.expenseAmountCents
  return moneyText(amountCents || 0)
})

const trendItems = computed(() => {
  const maxAmountCents = Math.max(...trend.value.map((item) => Number(item.amountCents) || 0), 0)
  return trend.value.map((item) => {
    const amountCents = Number(item.amountCents) || 0
    return {
      ...item,
      height: amountCents === 0 ? 8 : Math.max(24, Math.round((amountCents / maxAmountCents) * 150)),
    }
  })
})

const categoryItems = computed(() => {
  const categories = statistics.value?.categories || []
  const maxAmountCents = Math.max(...categories.map((item) => Number(item.amountCents) || 0), 1)
  return categories.map((item) => ({
    ...item,
    barPercent: Math.max(4, Math.round(((Number(item.amountCents) || 0) / maxAmountCents) * 100)),
  }))
})

const recentBills = computed(() => statistics.value?.recentBills || [])
const emptyBillText = computed(() => `本月还没有${currentTypeLabel.value}记录`)
const allEmptyText = computed(() => monthBillCount.value === 0 ? '本月还没有账单' : emptyBillText.value)

function moneyText(amountCents: unknown) {
  return formatCurrencyFromCents(amountCents)
}

function percentText(value: unknown) {
  const percent = Number(value)
  if (!Number.isFinite(percent) || percent <= 0) return '0%'
  if (percent < 0.01) return '<0.01%'
  return `${percent.toFixed(1)}%`
}

function shortAmount(amountCents: number) {
  const yuan = Math.round(amountCents / 100)
  if (yuan >= 10000) return `${(yuan / 10000).toFixed(1)}万`
  return String(yuan)
}

function isSelectedMonth(year: number, month: number) {
  return selectedYear.value === year && selectedMonth.value === month
}

function trendItemId(year: number, month: number) {
  return `trend-${year}-${month}`
}

function selectTrendMonth(year: number, month: number) {
  if (isSelectedMonth(year, month) || loading.value) return

  selectedYear.value = year
  selectedMonth.value = month
  // 点击柱状图只切换下方月度数据；柱状图本身不重排、不重新设置 scroll-left。
  loadStatistics({ updateTrend: false })
}

function onMonthChange(e: any) {
  const value = e.detail.value || ''
  const [year, month] = value.split('-').map(Number)
  if (!year || !month) return

  const maxYear = now.getFullYear()
  const maxMonth = now.getMonth() + 1
  if (year > maxYear || (year === maxYear && month > maxMonth)) {
    uni.showToast({ title: '不能选择未来月份', icon: 'none' })
    return
  }

  selectedYear.value = year
  selectedMonth.value = month
  loadStatistics()
}

function switchType(type: BillType) {
  if (currentType.value === type) return
  currentType.value = type
  loadStatistics()
}

function releaseInitialTrendScroll() {
  if (hasReleasedInitialTrendScroll) return
  hasReleasedInitialTrendScroll = true

  nextTick(() => {
    const lastItem = trend.value[trend.value.length - 1]
    if (!lastItem) return

    trendScrollIntoView.value = trendItemId(lastItem.year, lastItem.month)
    setTimeout(() => {
      trendScrollIntoView.value = ''
    }, 300)
  })
}

async function loadStatistics(options: { updateTrend?: boolean } = {}) {
  const updateTrend = options.updateTrend !== false
  const currentRequest = ++requestId
  loading.value = true
  error.value = ''

  try {
    const data = await getMonthlyStatistics({
      year: selectedYear.value,
      month: selectedMonth.value,
      type: currentType.value,
    })
    if (currentRequest !== requestId) return
    statistics.value = data
    if (updateTrend) {
      trend.value = data.trend || []
      releaseInitialTrendScroll()
    }
  } catch (err: any) {
    if (currentRequest !== requestId) return
    error.value = err?.message || '月账单加载失败'
  } finally {
    if (currentRequest === requestId) {
      loading.value = false
    }
  }
}

function billTitle(bill: any) {
  return bill.remark || bill.title || bill.categoryName || '账单'
}

function billAmount(bill: any) {
  return Number(bill.amountCents) || 0
}

function billMoneyText(bill: any) {
  const sign = bill.type === 'income' ? '+' : '-'
  return `${sign}${moneyText(billAmount(bill))}`
}

function dateText(date?: string) {
  if (!date) return ''
  const parts = date.split('-')
  if (parts.length < 3) return date
  const month = Number(parts[1])
  const day = Number(parts[2])
  return `${month}月${day}日`
}

function goCategoryDetail(category: any) {
  if (category.categoryId === 'other') {
    uni.showToast({ title: '其他分类明细暂不支持', icon: 'none' })
    return
  }

  const query = [
    `year=${selectedYear.value}`,
    `month=${selectedMonth.value}`,
    `type=${currentType.value}`,
    `categoryId=${encodeURIComponent(category.categoryId)}`,
    `categoryName=${encodeURIComponent(category.categoryName || '')}`,
    `categoryIcon=${encodeURIComponent(category.categoryIcon || '')}`,
    `amountCents=${category.amountCents || 0}`,
    `count=${category.count || 0}`,
    `percentage=${category.percentage || 0}`,
  ].join('&')

  uni.navigateTo({ url: `/pages/statistic-category/statistic-category?${query}` })
}

function goAllBills() {
  uni.navigateTo({
    url: `/pages/statistic-bills/statistic-bills?year=${selectedYear.value}&month=${selectedMonth.value}&type=${currentType.value}`,
  })
}

function goBillDetail(id: string) {
  uni.navigateTo({ url: `/pages/bill-detail/bill-detail?id=${id}` })
}

function goAddBill() {
  uni.switchTab({ url: '/pages/bills/bills' })
}

onShow(() => {
  if (userStore.userInfo) {
    loadStatistics()
  } else {
    const stopWatch = watch(() => userStore.userInfo, (val: any) => {
      if (val) {
        loadStatistics()
        stopWatch()
      }
    })
  }
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f6f7f8;
  padding: 20rpx 30rpx 180rpx;
  box-sizing: border-box;
}

.top-bar {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 20rpx;
}

.month-pill {
  min-width: 230rpx;
  height: 72rpx;
  padding: 0 28rpx;
  border-radius: 36rpx;
  background: #fff;
  box-shadow: 0 8rpx 28rpx rgba(18, 28, 45, 0.06);
  color: #17202c;
  font-size: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}

.pill-arrow {
  color: #78818f;
  transform: translateY(-4rpx);
}

.type-tabs {
  display: flex;
  padding: 8rpx;
  border-radius: 18rpx;
  background: #fff;
  box-shadow: 0 8rpx 28rpx rgba(18, 28, 45, 0.06);
  margin-bottom: 22rpx;
}

.type-tab {
  flex: 1;
  height: 76rpx;
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #566171;
  font-size: 30rpx;
}

.type-tab.active {
  background: #0aa394;
  color: #fff;
  font-weight: 600;
}

.summary-card,
.section-card,
.state-card,
.empty-tip {
  background: #fff;
  border-radius: 18rpx;
  box-shadow: 0 10rpx 30rpx rgba(18, 28, 45, 0.06);
}

.summary-card {
  display: flex;
  align-items: stretch;
  padding: 34rpx 32rpx;
  margin-bottom: 22rpx;
}

.summary-main {
  flex: 1;
  min-width: 0;
}

.summary-label,
.side-label {
  display: block;
  color: #737c89;
  font-size: 28rpx;
}

.summary-amount {
  display: block;
  margin-top: 14rpx;
  color: #111827;
  font-size: 58rpx;
  line-height: 1.08;
  font-weight: 700;
}

.summary-count {
  display: block;
  margin-top: 16rpx;
  color: #7d8793;
  font-size: 26rpx;
}

.summary-side {
  width: 220rpx;
  padding-left: 28rpx;
  margin-left: 28rpx;
  border-left: 1rpx solid #edf0f2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12rpx;
}

.side-amount {
  color: #17202c;
  font-size: 30rpx;
  font-weight: 700;
}

.section-card {
  padding: 28rpx 26rpx;
  margin-bottom: 22rpx;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 22rpx;
}

.section-title {
  color: #111827;
  font-size: 30rpx;
  font-weight: 700;
}

.loading-line,
.empty-block {
  padding: 50rpx 0;
  text-align: center;
  color: #8b95a1;
  font-size: 26rpx;
}

.trend-wrap {
  position: relative;
  min-height: 260rpx;
}

.trend-scroll {
  width: 100%;
}

.trend-chart {
  width: 820rpx;
  height: 260rpx;
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  gap: 20rpx;
}

.trend-item {
  width: 116rpx;
  flex: 0 0 116rpx;
  height: 250rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
}

.trend-value {
  height: 34rpx;
  color: #6f7783;
  font-size: 22rpx;
  white-space: nowrap;
}

.trend-value.active {
  color: #0a9b8c;
  font-weight: 700;
}

.bar-track {
  height: 160rpx;
  display: flex;
  align-items: flex-end;
}

.bar {
  width: 46rpx;
  min-height: 8rpx;
  border-radius: 12rpx 12rpx 4rpx 4rpx;
  background: #d7efec;
}

.bar.active {
  background: #0aa394;
}

.trend-month {
  margin-top: 12rpx;
  color: #737c89;
  font-size: 24rpx;
}

.trend-month.active {
  color: #111827;
  font-weight: 700;
}

.loading-mask {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.78);
  color: #667085;
  font-size: 26rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.category-row,
.bill-row {
  display: flex;
  align-items: center;
}

.category-row {
  padding: 18rpx 0;
}

.category-icon-wrap,
.bill-icon-wrap {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: #e4f5f2;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.category-icon,
.bill-icon {
  font-size: 34rpx;
}

.category-main {
  flex: 1;
  min-width: 0;
  margin-left: 20rpx;
}

.category-line,
.progress-line {
  display: flex;
  align-items: center;
}

.category-line {
  justify-content: space-between;
}

.category-name {
  color: #17202c;
  font-size: 28rpx;
  font-weight: 600;
  max-width: 270rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-money {
  color: #17202c;
  font-size: 27rpx;
  font-weight: 600;
}

.category-action {
  display: flex;
  align-items: center;
  gap: 10rpx;
  flex-shrink: 0;
  margin-left: 16rpx;
}

.category-arrow {
  color: #b0b8c2;
  font-size: 34rpx;
  line-height: 1;
}

.progress-line {
  margin-top: 12rpx;
  gap: 18rpx;
}

.progress-track {
  flex: 1;
  height: 12rpx;
  border-radius: 8rpx;
  background: #eef1f3;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 8rpx;
  background: #0aa394;
}

.category-percent {
  width: 86rpx;
  color: #8a929d;
  font-size: 24rpx;
  text-align: right;
}

.bill-row {
  padding: 22rpx 0;
  border-bottom: 1rpx solid #eef1f3;
}

.bill-row:last-child {
  border-bottom: none;
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
  margin-left: 16rpx;
  color: #17202c;
  font-size: 30rpx;
  font-weight: 700;
  white-space: nowrap;
}

.bill-amount.income {
  color: #0aa368;
}

.all-link {
  height: 76rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14rpx;
  color: #0a9b8c;
  font-size: 28rpx;
  font-weight: 600;
}

.link-arrow {
  font-size: 42rpx;
  line-height: 1;
}

.state-card,
.empty-tip {
  padding: 44rpx 30rpx;
  text-align: center;
}

.state-title,
.empty-title {
  display: block;
  color: #17202c;
  font-size: 30rpx;
  font-weight: 700;
}

.state-desc,
.empty-desc {
  display: block;
  margin-top: 12rpx;
  color: #7b8490;
  font-size: 25rpx;
}

.state-button,
.empty-button {
  width: 220rpx;
  height: 70rpx;
  line-height: 70rpx;
  margin-top: 28rpx;
  border-radius: 35rpx;
  background: #0aa394;
  color: #fff;
  font-size: 26rpx;
}

.empty-tip {
  margin-bottom: 22rpx;
}
</style>
