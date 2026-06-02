import { request } from '@/utils/request'

export interface BillItem {
  categoryId: string
  amount: number
  type: 'income' | 'expense'
  remark?: string
  billDate: string
}

// 获取账单列表（无需传 userId）
export function getBillList(data: { pageSize: number; pageNo: number; month?: string }) {
  return request<{ bills: any[]; total: number }>({
    url: '/bills',
    method: 'GET',
    data,
  })
}

// 单条添加
export function addBill(data: Omit<BillItem, 'userId'>) {
  return request<{ billId: string }>({
    url: '/bills',
    method: 'POST',
    data,
  })
}

// 批量添加
export function addBillBatch(items: Omit<BillItem, 'userId'>[]) {
  return request<{ billIds: string[]; count: number }>({
    url: '/bills/batch',
    method: 'POST',
    data: { items },
  })
}

export function editBill(data: {
  billId: string
  categoryId?: string
  amount?: number
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
  return request<any>({
    url: `/bills/${data.billId}`,
    method: 'GET',
  })
}

// 获取统计数据（无需传 userId）
export function getBillStatistic(data: { year: number }) {
  return request<{
    year: number
    income: number
    expense: number
    balance: number
    monthly: Record<string, { income: number; expense: number }>
  }>({
    url: '/bills/statistic',
    method: 'GET',
    data,
  })
}
