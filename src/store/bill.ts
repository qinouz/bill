import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getBillList, addBill as addBillApi, addBillBatch, getBillStatistic, type Bill, type BillItem, type BillListSummary } from '@/api/bill'
import { getCategories, type Category } from '@/api/category'

export type { Bill, Category }

export const useBillStore = defineStore('bill', () => {
  const bills = ref<Bill[]>([])
  const categories = ref<Category[]>([])
  const pageNo = ref(1)
  const pageSize = 20
  const total = ref(0)
  const loading = ref(false)
  const hasMore = computed(() => bills.value.length < total.value)
  const currentMonth = ref('')
  type NormalizedBillListSummary = Required<Pick<BillListSummary, 'incomeCents' | 'expenseCents' | 'balanceCents'>>

  const monthSummary = ref<NormalizedBillListSummary>({
    incomeCents: 0,
    expenseCents: 0,
    balanceCents: 0,
  })

  function emptySummary(): NormalizedBillListSummary {
    return {
      incomeCents: 0,
      expenseCents: 0,
      balanceCents: 0,
    }
  }

  function buildSummary(incomeCents: number, expenseCents: number): NormalizedBillListSummary {
    return {
      incomeCents,
      expenseCents,
      balanceCents: incomeCents - expenseCents,
    }
  }

  // 后端账单列表接口目前返回的是 incomeAmountCents / expenseAmountCents。
  // 明细页历史上读取 incomeCents / expenseCents，这里统一转成页面使用的字段名。
  function normalizeBillListSummary(summary?: BillListSummary): NormalizedBillListSummary | null {
    if (!summary) return null

    const incomeCents = summary.incomeCents ?? summary.incomeAmountCents
    const expenseCents = summary.expenseCents ?? summary.expenseAmountCents
    const balanceCents = summary.balanceCents ?? summary.balanceAmountCents

    if (incomeCents === undefined || expenseCents === undefined) return null

    return {
      incomeCents,
      expenseCents,
      balanceCents: balanceCents ?? incomeCents - expenseCents,
    }
  }

  function getSummaryFromBills(data: Bill[]): NormalizedBillListSummary {
    return data.reduce(
      (summary, bill) => {
        if (bill.type === 'income') {
          summary.incomeCents += bill.amountCents
        } else {
          summary.expenseCents += bill.amountCents
        }
        summary.balanceCents = summary.incomeCents - summary.expenseCents
        return summary
      },
      emptySummary(),
    )
  }

  async function getFallbackMonthSummary(month: string, loadedBills: Bill[]): Promise<NormalizedBillListSummary> {
    const [yearText, monthText] = month.split('-')
    const year = Number(yearText)
    const monthNumber = Number(monthText)

    if (year && monthNumber) {
      try {
        const statistic = await getBillStatistic({ year })
        const monthKeys = [
          monthText,
          String(monthNumber),
          `${yearText}-${monthText}`,
        ]
        const monthData = monthKeys
          .map((key) => statistic.monthly?.[key])
          .find(Boolean)

        if (monthData) {
          return buildSummary(monthData.incomeCents || 0, monthData.expenseCents || 0)
        }
      } catch {
        // Keep the detail page usable even when the old statistic endpoint is unavailable.
      }
    }

    return getSummaryFromBills(loadedBills)
  }

  async function loadBills(refresh = false) {
    if (loading.value) return

    if (refresh) {
      pageNo.value = 1
      bills.value = []
    }

    loading.value = true
    try {
      const res = await getBillList({
        pageSize,
        pageNo: pageNo.value,
        month: currentMonth.value || undefined,
      })
      if (refresh) {
        bills.value = res.bills
      } else {
        bills.value.push(...res.bills)
      }
      // 优先使用 /bills 返回的整月汇总；旧后端没有 summary 时，再走统计接口或已加载列表兜底。
      monthSummary.value = normalizeBillListSummary(res.summary) || await getFallbackMonthSummary(currentMonth.value, bills.value)
      total.value = res.total
      pageNo.value++
    } finally {
      loading.value = false
    }
  }

  function setMonth(month: string) {
    currentMonth.value = month
  }

  async function loadCategories(type?: 'income' | 'expense') {
    const data = await getCategories(type)
    categories.value = data
  }

  async function addBillRecord(data: BillItem) {
    return await addBillApi(data)
  }

  async function addBillRecords(items: BillItem[]) {
    return await addBillBatch(items)
  }

  async function loadStatistic(year: number) {
    return await getBillStatistic({ year })
  }

  function removeBillRecord(billId: string, fallbackBill?: Bill) {
    const index = bills.value.findIndex((bill) => bill.id === billId)
    const removed = index > -1 ? bills.value.splice(index, 1)[0] : fallbackBill

    if (!removed) return

    const isCurrentMonthBill = !currentMonth.value || removed.billDate.startsWith(currentMonth.value)
    if (!isCurrentMonthBill) return

    if (index > -1) {
      total.value = Math.max(0, total.value - 1)
    }

    if (removed.type === 'income') {
      monthSummary.value.incomeCents = Math.max(0, monthSummary.value.incomeCents - removed.amountCents)
    } else {
      monthSummary.value.expenseCents = Math.max(0, monthSummary.value.expenseCents - removed.amountCents)
    }
    monthSummary.value.balanceCents = monthSummary.value.incomeCents - monthSummary.value.expenseCents
  }

  function getCategoryName(categoryId: string) {
    const cat = categories.value.find((c) => c.id === categoryId)
    return cat?.name || '未分类'
  }

  function getCategoryIcon(categoryId: string) {
    const cat = categories.value.find((c) => c.id === categoryId)
    return cat?.icon || '📝'
  }

  return {
    bills,
    categories,
    loading,
    hasMore,
    total,
    currentMonth,
    monthSummary,
    loadBills,
    loadCategories,
    addBillRecord,
    addBillRecords,
    removeBillRecord,
    loadStatistic,
    setMonth,
    getCategoryName,
    getCategoryIcon,
  }
})
