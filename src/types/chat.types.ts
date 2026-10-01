export interface ModelRef { source: 'local' | 'cloud'; id: string }
export interface ModelOption extends ModelRef { name: string }
export interface MessageSource { id: string; title: string; url: string; summary: string }
export interface ChatSession {
  conversationId: string; title: string; selectModel: string; lastModifyDttm: string
  agent_id?: string | null; model_ref?: ModelRef | null
}
export interface ChatContent { type: string; text: string }
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'; content: ChatContent[]; timestamp: string
  sources?: MessageSource[]; run_id?: string | null; status?: string
}
export interface CreateStreamRequest {
  conversationId?: string; model?: string; modelRef?: ModelRef; agentId?: string
  agentOptions?: Record<string, unknown>
  messages: Array<{ role: ChatMessage['role']; content: ChatContent[] }>
  parameters?: { temperature?: number; top_p?: number; max_tokens?: number }
  stream?: boolean; thinking?: boolean; reasoning_effort?: boolean
}
export interface StreamDeltaEvent {
  type: string; conversation_id?: string; user_message_id?: string | null
  assistant_message_id?: string | null; run_id?: string | null; content?: string
  stage?: string; sources?: MessageSource[]; finish_reason?: string | null
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null
}
export interface AgentOption {
  id: string; name: string; version: string; enabled: boolean; integration_type: string
  model_binding: 'hub_per_run' | 'hub_fixed' | 'agent_managed' | 'mixed'
  capabilities: { task_submission: boolean; cancellation: boolean; streaming: boolean }
}
