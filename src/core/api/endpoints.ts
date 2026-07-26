import { apiClient, createApiGroup } from './client'
import { getApiUrl } from './config'

// ==========================================
// 1. Models (模型管理 API)
// ==========================================
export interface ModelRecord {
  modelName: string
  modelPath: string
  url: string
  description: string
  reasoning: boolean
  reasoningEffort: boolean
  imagesSupport: number
  maxTokens: number
  version?: string
  status?: string
  updatedAt?: string
}

// 宣告共同的 RequestMapping 前綴，例如 /v1/modelsMgt
const modelsReq = createApiGroup('/v1/modelsMgt')

export const modelsApi = {
  /** 取得所有註冊模型列表 (對應 /v1/modelsMgt/list) */
  getModels: () => modelsReq.get<ModelRecord[]>(''),
  /** 取得單一模型詳細資料 (對應 /v1/modelsMgt/{id}) */
  getModel: (id: string) => modelsReq.get<ModelRecord>(`/${id}`),
  /** 註冊/執行新模型 (對應 /v1/modelsMgt/runModelAPP) */
  createModel: (data: Partial<ModelRecord>) => modelsReq.post<ModelRecord>('/runModelAPP', data),
  /** 更新模型設定 (對應 /v1/modelsMgt/{id}) */
  updateModel: (id: string, data: Partial<ModelRecord>) => modelsReq.put<ModelRecord>(`/${id}`, data),
  /** 刪除模型 (對應 /v1/modelsMgt/{id}) */
  deleteModel: (id: string) => modelsReq.delete(`/${id}`),
  /** 測試模型連線與健康狀態 (對應 /v1/modelsMgt/{id}/health) */
  checkHealth: (id: string) => modelsReq.get<{ status: string; latency?: number }>(`/${id}/health`),
}


// ==========================================
// 2. Chat & Sessions (對話工作台 API)
// ==========================================
export interface ChatSession {
  id: string
  title: string
  modelName: string
  agentId?: string
  createdAt: string
  updatedAt: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
}

export const chatApi = {
  /** 取得對話工作階段列表 */
  getSessions: () => apiClient.get<ChatSession[]>('/chat/sessions'),
  /** 建立新對話工作階段 */
  createSession: (data: { title?: string; modelName: string; agentId?: string }) =>
    apiClient.post<ChatSession>('/chat/sessions', data),
  /** 取得特定工作階段的歷史訊息 */
  getMessages: (sessionId: string) => apiClient.get<ChatMessage[]>(`/chat/sessions/${sessionId}/messages`),
  /** 取得 SSE 串流聊天的端點 URL (供 EventSource 或 fetch stream 使用) */
  getStreamUrl: (sessionId: string) => getApiUrl(`/chat/sessions/${sessionId}/stream`),
}

// ==========================================
// 3. Knowledge Bases (知識庫 API)
// ==========================================
export interface KnowledgeBaseRecord {
  id: string
  name: string
  documentsCount: number
  embeddingModel: string
  status: 'indexing' | 'ready' | 'error'
  createdAt: string
}

export const knowledgeBasesApi = {
  /** 取得知識庫列表 */
  getKnowledgeBases: () => apiClient.get<KnowledgeBaseRecord[]>('/knowledge-bases'),
  /** 建立知識庫 */
  createKnowledgeBase: (data: { name: string; embeddingModel: string; description?: string }) =>
    apiClient.post<KnowledgeBaseRecord>('/knowledge-bases', data),
  /** 刪除知識庫 */
  deleteKnowledgeBase: (id: string) => apiClient.delete(`/knowledge-bases/${id}`),
}

// ==========================================
// 4. Agents (智能體 API)
// ==========================================
export interface AgentRecord {
  id: string
  name: string
  description: string
  modelName: string
  systemPrompt: string
  status: 'draft' | 'published'
}

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

// ==========================================
// 5. Dashboard (總覽統計 API)
// ==========================================
export interface DashboardStats {
  totalModels: number
  totalAgents: number
  totalKnowledgeBases: number
  todayRequests: number
}

export const dashboardApi = {
  /** 取得總覽統計數據 */
  getStats: () => apiClient.get<DashboardStats>('/dashboard/stats'),
}

// ==========================================
// 6. Observability & Audit Logs (觀測與稽核 API)
// ==========================================
export const observabilityApi = {
  getMetrics: () => apiClient.get('/observability/metrics'),
}

export const auditLogsApi = {
  getLogs: (params?: { page?: number; limit?: number }) => apiClient.get('/audit-logs', { params }),
}
