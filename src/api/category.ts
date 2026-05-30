import { callCloud } from '@/utils/cloud'
import type { Category } from '@/store/bill'

export function getCategoryList(data: { userId: string }) {
  return callCloud<{ categories: Category[] }>('categoryList', data)
}

export function saveCategory(data: {
  userId: string
  categoryId?: string
  name: string
  icon: string
  type: 'income' | 'expense'
  sort: number
}) {
  return callCloud<{ categoryId: string }>('categorySave', data)
}

export function initCategories(data: { userId: string }) {
  return callCloud('initCategories', data)
}

export function deleteCategory(data: { categoryId: string }) {
  return callCloud('categoryDelete', data)
}
