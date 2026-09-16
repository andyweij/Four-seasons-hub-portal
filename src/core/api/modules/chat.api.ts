import { createApiGroup, apiClient } from '../client'
import { getApiUrl } from '../config'
import type { ChatSession, ChatMessage, CreateStreamRequest } from '../../../types'

const chatReq = createApiGroup('/v1/chat')

export const chatApi = {
  /** 取得對話工作階段列表 (發送 GET /conversations?userId=...) */
  getSessions: (userId: string) => chatReq.get<ChatSession[]>('/conversations', { params: { userId } }),
  /** 建立新對話工作階段 */
  createSession: (data: { title?: string; modelName: string; agentId?: string }) =>
    chatReq.post<ChatSession>('/sessions', data),
  /** 取得特定工作階段的歷史訊息 */
  getMessages: (sessionId: string) => chatReq.get<ChatMessage[]>(`/sessions/${sessionId}/messages`),
  /** 取得 SSE 串流聊天的端點 URL (供 EventSource 或 fetch stream 使用) */
  getStreamUrl: (sessionId: string) => getApiUrl(`/chat/sessions/${sessionId}/stream`),
  /** 送出訊息並建立串流 (POST /v1/chat/stream)，回傳原生 Response 供 ReadableStream 讀取 */
  getRunningModels: (userId?: string) =>
    chatReq.get<string[] | { models: string[] }>('/models', userId ? { params: { userId } } : undefined),
  createStream: async (data: CreateStreamRequest): Promise<Response> => {
    const url = getApiUrl('/v1/chat/stream')
    const token = await apiClient.getToken()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      let errorMessage = `Stream request failed with status ${response.status}`
      try {
        const errorData = await response.json()
        if (errorData?.message || errorData?.error) {
          errorMessage = errorData.message || errorData.error
        }
      } catch {
        // ignore
      }
      throw new Error(errorMessage)
    }

    return response
  },
}
