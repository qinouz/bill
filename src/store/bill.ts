import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getBillList, addBill as addBillApi, getBillStatistic } from '@/api/bill'
import { getCategoryList } from '@/api/category'
import { useUserStore } from './user'

export interface Bill {
  _id: string
  userId: string
  categoryId: string
  amount: number
  type: 'income' | 'expense'
  remark: string
  billDate: string
  createTime: string
  updateTime: string
  isDeleted: boolean
}

export interface Category {
  _id: string
  userId: string
  name: string
  icon: string
  type: 'income' | 'expense'
  sort: number
  isDefault: boolean
  createTime: string
}

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
    const userStore = useUserStore()
    if (!userStore.userInfo) return
    if (loading.value) return

    if (refresh) {
      pageNo.value = 1
      bills.value = []
    }

    loading.value = true
    try {
      const res = await getBillList({
        userId: userStore.userInfo.userId,
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

  async function loadCategories() {
    const userStore = useUserStore()
    if (!userStore.userInfo) return
    const res = await getCategoryList({ userId: userStore.userInfo.userId })
    categories.value = res.categories
  }

  async function addBillRecord(data: {
    categoryId: string
    amount: number
    type: 'income' | 'expense'
    remark: string
    billDate: string
  }) {
    const userStore = useUserStore()
    if (!userStore.userInfo) return
    await addBillApi({ userId: userStore.userInfo.userId, ...data })
  }

  async function loadStatistic(year: number) {
    const userStore = useUserStore()
    if (!userStore.userInfo) return null
    return await getBillStatistic({ userId: userStore.userInfo.userId, year })
  }

  function getCategoryName(categoryId: string) {
    const cat = categories.value.find((c) => c._id === categoryId)
    return cat?.name || '未分类'
  }

  function getCategoryIcon(categoryId: string) {
    const cat = categories.value.find((c) => c._id === categoryId)
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
    loadStatistic,
    setMonth,
    getCategoryName,
    getCategoryIcon,
  }
})
