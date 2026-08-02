import { createApiGroup } from '../client'
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
  /** 送出訊息並建立串流 (POST /v1/chat/completions) */
  createStream: (data: CreateStreamRequest) => chatReq.post('/completions', data),
}
