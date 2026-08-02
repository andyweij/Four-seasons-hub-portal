export interface ChatSession {
  conversationId: string
  title: string
  selectModel: string
  lastModifyDttm: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
}

export interface CreateStreamRequest {
  conversationId?: string
  userId: string
  parentId?: string
  apiKey?: string
  model: string
  messages: ChatMessage[]
  temperature?: number
  top_p?: number
  top_k?: number
  frequency_penalty?: number
  max_tokens?: number
  stream?: boolean
  thinking?: boolean
  reasoning_effort?: string
}
