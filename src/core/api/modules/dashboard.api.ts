import { apiClient } from '../client'
import type { DashboardStats } from '../../../types'

export const dashboardApi = {
  /** 取得總覽統計數據 */
  getStats: () => apiClient.get<DashboardStats>('/dashboard/stats'),
}
