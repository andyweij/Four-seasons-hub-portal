import { apiClient } from '../client'

export const observabilityApi = {
  getMetrics: () => apiClient.get('/observability/metrics'),
}

export const auditLogsApi = {
  getLogs: (params?: { page?: number; limit?: number }) => apiClient.get('/audit-logs', { params }),
}
