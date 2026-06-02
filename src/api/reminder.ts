import { request } from '@/utils/request'

export interface ReminderSettings {
  enabled: boolean
  time: string
}

// 获取提醒设置
export function getReminder() {
  return request<ReminderSettings>({
    url: '/reminders',
    method: 'GET',
  })
}

// 保存提醒设置（无需传 userId）
export function saveReminder(data: { enabled: boolean; time: string }) {
  return request({
    url: '/reminders',
    method: 'POST',
    data,
  })
}

// 测试发送提醒
export function testReminder() {
  return request({
    url: '/reminders/test',
    method: 'POST',
  })
}
