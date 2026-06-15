import { request } from '@/utils/request'

export interface BillItem {
  categoryId: string
  amountCents: number
  type: 'income' | 'expense'
  remark?: string
  billDate: string
}

export interface Bill extends BillItem {
  id: string
  userId?: string
  categoryName?: string
  categoryIcon?: string
  createdAt: number
  updatedAt: number
  isDeleted?: boolean
}

export interface BillStatistic {
  year: number
  incomeCents: number
  expenseCents: number
  balanceCents: number
  monthly: Record<string, { incomeCents: number; expenseCents: number }>
}

export interface MonthlyStatistics {
  year: number
  month: number
  type: 'income' | 'expense'
  summary: {
    currentTypeAmountCents: number
    currentTypeCount: number
    expenseAmountCents: number
    expenseCount: number
    incomeAmountCents: number
    incomeCount: number
  }
  trend: Array<{
    year: number
    month: number
    amountCents: number
    count: number
  }>
  categories: Array<{
    categoryId: string
    categoryName: string
    categoryIcon: string
    categoryColor?: string
    amountCents: number
    count: number
    percentage: number
  }>
  recentBills: Array<Bill & {
    title?: string
    occurredAt?: string
  }>
}

export interface BillListSummary {
  incomeCents?: number
  expenseCents?: number
  balanceCents?: number
  incomeAmountCents?: number
  expenseAmountCents?: number
  balanceAmountCents?: number
  incomeCount?: number
  expenseCount?: number
  currentTypeAmountCents?: number
  currentTypeCount?: number
}

export interface BillMonthGroup {
  month: string
  year: number
  monthNumber: number
  summary: BillListSummary
  bills: Bill[]
}

export interface BillListResult {
  bills?: Bill[]
  months?: BillMonthGroup[]
  total: number
  pageNo: number
  pageSize: number
  hasMore?: boolean
  summary?: BillListSummary
  range?: {
    startMonth: string
    endMonth: string
    maxMonths: number
    direction: 'older' | 'newer'
  }
}

export function getBillList(data: {
  pageSize: number
  pageNo: number
  month?: string
  type?: 'income' | 'expense'
  categoryId?: string
  groupByMonth?: boolean
  monthDirection?: 'older' | 'newer'
}) {
  return request<BillListResult>({
    url: '/bills',
    method: 'GET',
    data,
  })
}

export function addBill(data: BillItem) {
  return request<{ billId: string }>({
    url: '/bills',
    method: 'POST',
    data,
  })
}

export function addBillBatch(items: BillItem[]) {
  return request<{ billIds: string[]; count: number }>({
    url: '/bills/batch',
    method: 'POST',
    data: { items },
  })
}

export function editBill(data: {
  billId: string
  categoryId?: string
  amountCents?: number
  remark?: string
  billDate?: string
}) {
  return request({
    url: `/bills/${data.billId}`,
    method: 'PUT',
    data,
  })
}

export function deleteBill(data: { billId: string }) {
  return request({
    url: `/bills/${data.billId}`,
    method: 'DELETE',
  })
}

export function getBillDetail(data: { billId: string }) {
  return request<Bill>({
    url: `/bills/${data.billId}`,
    method: 'GET',
  })
}

export function getBillStatistic(data: { year: number }) {
  return request<BillStatistic>({
    url: '/bills/statistic',
    method: 'GET',
    data,
  })
}

export function getMonthlyStatistics(data: {
  year: number
  month: number
  type: 'income' | 'expense'
}) {
  return request<MonthlyStatistics>({
    url: '/statistics/monthly',
    method: 'GET',
    data,
  })
}
