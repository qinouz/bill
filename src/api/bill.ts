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

export interface BillListSummary {
  incomeCents: number
  expenseCents: number
  balanceCents: number
}

export interface BillListResult {
  bills: Bill[]
  total: number
  pageNo: number
  pageSize: number
  summary?: BillListSummary
}

export function getBillList(data: { pageSize: number; pageNo: number; month?: string }) {
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
