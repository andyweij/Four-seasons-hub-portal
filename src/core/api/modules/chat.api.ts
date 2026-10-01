import { createApiGroup, apiClient } from '../client'
import { getApiUrl } from '../config'
import type { ChatSession, CreateStreamRequest, ModelOption, AgentOption, ChatMessage } from '../../../types'

const chatReq = createApiGroup('/v1/chat')
export interface HistoryMessage {
  role: ChatMessage['role']; content: string; sources?: ChatMessage['sources']
  run_id?: string | null; status?: string
}
export const chatApi = {
  getSessions: (_userId?: string) => chatReq.get<ChatSession[]>('/conversations'),
  getMessages: (sessionId: string) => chatReq.get<HistoryMessage[]>(`/sessions/${sessionId}/messages`),
  getRunningModels: (_userId?: string) => chatReq.get<string[]>('/models'),
  getModelOptions: () => chatReq.get<ModelOption[]>('/model-options'),
  getAgents: () => apiClient.get<AgentOption[]>('/v1/agents'),
  cancelRun: (runId: string) => apiClient.post<{ status: string }>(`/v1/agent-runs/${runId}/cancel`),
  createStream: async (data: CreateStreamRequest, signal?: AbortSignal): Promise<Response> => {
    const token = await apiClient.getToken()
    const response = await fetch(getApiUrl('/v1/chat/stream'), {
      method: 'POST', signal,
      headers: {
        'Content-Type': 'application/json', Accept: 'text/event-stream',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.detail || error.message || `HTTP ${response.status}`)
    }
    return response
  },
}
