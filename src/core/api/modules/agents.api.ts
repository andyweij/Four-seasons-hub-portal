import { apiClient } from '../client'
import type { AgentRecord } from '../../../types'

export const agentsApi = {
  /** 取得 Agents 列表 */
  getAgents: () => apiClient.get<AgentRecord[]>('/agents'),
  /** 取得單一 Agent 詳細設定 */
  getAgent: (id: string) => apiClient.get<AgentRecord>(`/agents/${id}`),
  /** 建立 Agent */
  createAgent: (data: Partial<AgentRecord>) => apiClient.post<AgentRecord>('/agents', data),
  /** 更新 Agent */
  updateAgent: (id: string, data: Partial<AgentRecord>) => apiClient.put<AgentRecord>(`/agents/${id}`, data),
}
