import { request } from '@/utils/request'

export interface Category {
  id: string
  userId: string | null
  name: string
  icon: string
  type: 'income' | 'expense'
  sortOrder: number
  isSystem: boolean
  createdAt: string
}

// 查询分类列表
export function getCategories(type?: 'income' | 'expense') {
  return request<Category[]>({
    url: '/categories',
    method: 'GET',
    data: type ? { type } : {},
  })
}

// 添加分类
export function addCategory(data: {
  name: string
  icon?: string
  type: 'income' | 'expense'
  sortOrder?: number
}) {
  return request<{ categoryId: string }>({
    url: '/categories',
    method: 'POST',
    data: {
      name: data.name,
      icon: data.icon || '',
      type: data.type,
      sortOrder: data.sortOrder || 0,
    },
  })
}

// 初始化系统分类（如果后端有这个接口）
export function initCategories() {
  return request({
    url: '/categories/init',
    method: 'POST',
  })
}

// 删除分类（如果后端支持）
export function deleteCategory(data: { categoryId: string }) {
  return request({
    url: `/categories/${data.categoryId}`,
    method: 'DELETE',
  })
}
