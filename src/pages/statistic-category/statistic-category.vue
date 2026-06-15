<template>
  <view class="page">
    <view class="list-card">
      <view class="section-title">账单明细</view>
      <view v-if="initialLoading" class="state-text">加载中...</view>
      <view v-else-if="monthGroups.length === 0" class="state-text">暂无账单</view>
      <view v-else>
        <view v-for="group in monthGroups" :key="group.month" class="month-group">
          <view class="month-header">
            <text>{{ group.year }}年{{ group.monthNumber }}月</text>
            <text>{{ monthSummaryText(group) }}</text>
          </view>
          <view v-for="bill in group.bills" :key="bill.id" class="bill-row" @tap="goBillDetail(bill.id)">
            <view class="bill-icon">
              <text>{{ categoryIcon || bill.categoryIcon || '📝' }}</text>
            </view>
            <view class="bill-info">
              <text class="bill-title">{{ billTitle(bill) }}</text>
              <text class="bill-meta">{{ dateText(bill.billDate) }} {{ timeText(bill.createdAt) }}</text>
            </view>
            <text class="bill-amount" :class="bill.type">{{ billMoneyText(bill) }}</text>
          </view>
        </view>
      </view>
    </view>

    <view v-if="monthGroups.length > 0" class="bottom-state">
      <text>{{ olderHasMore ? (olderLoading ? '加载中...' : '上拉加载更早账单') : '已显示更早账单' }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { getBillList, type Bill, type BillMonthGroup } from '@/api/bill'
import { formatMoneyFromCents } from '@/utils/amount'

type BillType = 'income' | 'expense'

const year = ref(new Date().getFullYear())
const month = ref(new Date().getMonth() + 1)
const type = ref<BillType>('expense')
const categoryId = ref('')
const categoryName = ref('分类')
const categoryIcon = ref('')
const monthGroups = ref<BillMonthGroup[]>([])
const pageSize = 20
const initialLoading = ref(false)
const olderLoading = ref(false)
const newerLoading = ref(false)
const olderPageNo = ref(1)
const newerPageNo = ref(1)
const olderHasMore = ref(true)
const newerHasMore = ref(true)

const typeLabel = computed(() => type.value === 'expense' ? '支出' : '收入')
const monthParam = computed(() => `${year.value}-${String(month.value).padStart(2, '0')}`)

function billAmount(bill: any) {
  return Number(bill.amountCents) || 0
}

function billMoneyText(bill: any) {
  const sign = bill.type === 'income' ? '+' : '-'
  return `${sign}${formatMoneyFromCents(billAmount(bill))}`
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

function timeText(createdAt?: number) {
  if (!createdAt) return ''
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return ''
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

function monthSummaryText(group: BillMonthGroup) {
  const label = type.value === 'expense' ? '支出' : '收入'
  const count = group.summary.currentTypeCount || 0
  const amountCents = group.summary.currentTypeAmountCents || 0
  return `共${label}${count}笔，总计¥${formatMoneyFromCents(amountCents)}`
}

// 后端按月份返回分组数据，newer 和 older 两个方向可能都包含锚点月。
// 这里按 month 合并分组、按 bill.id 去重，最后统一按月份倒序展示。
function mergeMonthGroups(incoming: BillMonthGroup[] = []) {
  const groupMap = new Map<string, BillMonthGroup>()

  monthGroups.value.concat(incoming).forEach((group) => {
    const existing = groupMap.get(group.month)
    if (!existing) {
      groupMap.set(group.month, {
        ...group,
        bills: [...(group.bills || [])],
      })
      return
    }

    const billMap = new Map(existing.bills.map((bill) => [bill.id, bill]))
    ;(group.bills || []).forEach((bill) => billMap.set(bill.id, bill))
    existing.bills = Array.from(billMap.values()).sort((a, b) => {
      const dateResult = b.billDate.localeCompare(a.billDate)
      if (dateResult !== 0) return dateResult
      return (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0)
    })
    existing.summary = group.summary || existing.summary
  })

  monthGroups.value = Array.from(groupMap.values()).sort((a, b) => b.month.localeCompare(a.month))
}

// 分类明细页有两个独立分页方向：
// older 用于触底继续加载更早月份，newer 用于下拉补锚点月之后到当前月的数据。
// 两个方向必须分别维护 pageNo 和 hasMore，否则会出现漏页或重复加载。
async function loadMonthGroups(direction: 'older' | 'newer', refresh = false) {
  if (!categoryId.value) return

  const loadingRef = direction === 'older' ? olderLoading : newerLoading
  const pageRef = direction === 'older' ? olderPageNo : newerPageNo
  const hasMoreRef = direction === 'older' ? olderHasMore : newerHasMore

  if (loadingRef.value || (!refresh && !hasMoreRef.value)) return

  if (refresh) {
    pageRef.value = 1
    hasMoreRef.value = true
  }

  loadingRef.value = true
  try {
    const data = await getBillList({
      month: monthParam.value,
      type: type.value,
      categoryId: categoryId.value,
      pageNo: pageRef.value,
      pageSize,
      // 开启新的按月分组列表结构；不传时后端仍保持旧的扁平 bills 返回。
      groupByMonth: true,
      monthDirection: direction,
    })

    mergeMonthGroups(data.months || [])
    hasMoreRef.value = !!data.hasMore
    pageRef.value += 1
  } catch {
    uni.showToast({ title: direction === 'older' ? '更早账单加载失败' : '最新账单加载失败', icon: 'none' })
  } finally {
    loadingRef.value = false
  }
}

// 初次进入用点击的月份作为锚点，只加载 older：
// 例如点 2 月分类进入时，首屏从 2 月开始；下拉时再用 newer 补 3/4/5/6 月。
async function loadInitialBills() {
  if (!categoryId.value) return

  initialLoading.value = true
  monthGroups.value = []
  olderPageNo.value = 1
  newerPageNo.value = 1
  olderHasMore.value = true
  newerHasMore.value = true

  try {
    await loadMonthGroups('older', true)
  } finally {
    initialLoading.value = false
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
  uni.setNavigationBarTitle({ title: `${categoryName.value}账单` })
  loadInitialBills()
})

onPullDownRefresh(async () => {
  await loadMonthGroups('newer')
  uni.stopPullDownRefresh()
})

onReachBottom(() => {
  loadMonthGroups('older')
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f6f7f8;
  padding: 24rpx 30rpx 56rpx;
  box-sizing: border-box;
}

.list-card {
  background: #fff;
  border-radius: 18rpx;
  box-shadow: 0 10rpx 30rpx rgba(18, 28, 45, 0.06);
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

.month-group + .month-group {
  margin-top: 18rpx;
}

.month-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  padding: 18rpx 20rpx;
  margin: 10rpx -8rpx 6rpx;
  border-radius: 10rpx;
  background: #f3f4f6;
  color: #737c89;
  font-size: 24rpx;
}

.month-header text {
  white-space: nowrap;
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
