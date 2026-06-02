import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getBillList, addBill as addBillApi, addBillBatch, getBillStatistic, type BillItem } from '@/api/bill'
import { getCategories, type Category } from '@/api/category'

export interface Bill {
  id: string
  userId: string
  categoryId: string
  amount: number
  type: 'income' | 'expense'
  remark: string
  billDate: string
  createdAt: string
  updatedAt: string
  isDeleted: boolean
}

export type { Category }

export const useBillStore = defineStore('bill', () => {
  const bills = ref<Bill[]>([])
  const categories = ref<Category[]>([])
  const pageNo = ref(1)
  const pageSize = 20
  const total = ref(0)
  const loading = ref(false)
  const hasMore = computed(() => bills.value.length < total.value)
  const currentMonth = ref('')

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
    await addBillApi(data as any)
  }

  async function addBillRecords(items: BillItem[]) {
    return await addBillBatch(items)
  }

  async function loadStatistic(year: number) {
    return await getBillStatistic({ year })
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
    loadBills,
    loadCategories,
    addBillRecord,
    addBillRecords,
    loadStatistic,
    setMonth,
    getCategoryName,
    getCategoryIcon,
  }
})
