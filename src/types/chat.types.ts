export interface ChatSession {
  conversationId: string
  title: string
  selectModel: string
  lastModifyDttm: string
}
export interface ChatContent {
  type: string
  text: string
}
export interface ChatMessage {
  // id: string
  role: 'user' | 'assistant' | 'system'
  content: ChatContent[]
  timestamp: string
}

export interface CreateStreamRequest {
  conversationId?: string
  // userId: string
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

export interface StreamDeltaEvent {
  type: 'ack' | 'delta' | 'done' | string
  conversation_id?: string
  user_message_id?: string | null
  assistant_message_id?: string | null
  content?: string
  finish_reason?: string | null
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  } | null
}
