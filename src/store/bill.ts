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
  const monthSummary = ref<BillListSummary>({
    incomeCents: 0,
    expenseCents: 0,
    balanceCents: 0,
  })

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
      monthSummary.value = res.summary || {
        incomeCents: 0,
        expenseCents: 0,
        balanceCents: 0,
      }
      if (refresh) {
        bills.value = res.bills
      } else {
        bills.value.push(...res.bills)
      }
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
