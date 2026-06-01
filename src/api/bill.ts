import { callCloud } from '@/utils/cloud'

export interface BillItem {
  categoryId: string
  amount: number
  type: 'income' | 'expense'
  remark?: string
  billDate: string
}

export function getBillList(data: { userId: string; pageSize: number; pageNo: number; month?: string }) {
  return callCloud<{ bills: any[]; total: number }>('getBillList', data)
}

// 单条添加
export function addBill(data: Omit<BillItem, 'userId'>) {
  return callCloud<{ billId: string }>('addBill', data)
}

// 批量添加
export function addBillBatch(items: Omit<BillItem, 'userId'>[]) {
  return callCloud<{ billIds: string[]; count: number }>('addBill', { items })
}

export function editBill(data: {
  billId: string
  categoryId?: string
  amount?: number
  remark?: string
  billDate?: string
}) {
  return callCloud('editBill', data)
}

export function deleteBill(data: { billId: string }) {
  return callCloud('deleteBill', data)
}

export function getBillDetail(data: { billId: string }) {
  return callCloud<any>('getBillDetail', data)
}

export function getBillStatistic(data: { userId: string; year: number }) {
  return callCloud<{ year: number; income: number; expense: number; balance: number; monthly: Record<string, { income: number; expense: number }> }>('getBillStatistic', data)
}
