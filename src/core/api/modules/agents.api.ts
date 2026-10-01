import { notifyCatalogChanged } from '../catalog-sync'
import { apiClient } from '../client'
import type { AgentRecord, AgentHealth } from '../../../types'

const adminPath = (id: string) => `/v1/admin/agents/${encodeURIComponent(id)}`

/** Matches the Hub catalog and lifecycle API; definitions are configured in its catalog. */
export const agentsApi = {
  getAgents: () => apiClient.get<AgentRecord[]>('/v1/agents'),
  setEnabled: async (id: string, enabled: boolean) => {
    const result = await apiClient.patch<AgentRecord>(adminPath(id), { enabled })
    notifyCatalogChanged(); return result
  },
  getHealth: (id: string) => apiClient.get<AgentHealth>(`${adminPath(id)}/health`),
  start: (id: string) => apiClient.post<{ container_id: string }>(`${adminPath(id)}/start`),
  stop: async (id: string) => {
    try { return await apiClient.post<{ status: string }>(adminPath(id) + "/stop") }
    finally { notifyCatalogChanged() }
  },
}
