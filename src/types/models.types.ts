export interface ModelRecord {
  modelName: string
  modelType?: string
  size?: number
  maxImages: number
  maxModelLen: number
  isChatModel: boolean
  supportsReasoning: boolean
  supportsReasoningEffort: boolean
  description?: string
  modelPath?: string
  url?: string
  /** 舊版模型目錄欄位，保留於前端過渡期間。 */
  imagesSupport?: number
  /** 舊版模型目錄欄位，保留於前端過渡期間。 */
  reasoning?: boolean
  /** 舊版模型目錄欄位，保留於前端過渡期間。 */
  reasoningEffort?: boolean
  version?: string
  downloadStatus?: string
  status?: string
  updatedAt?: string
}
export type CloudProvider =
  | 'gemini'
  | 'openai_compatible'

export type CloudConnectionStatus =
  | 'untested'
  | 'available'
  | 'authentication_failed'
  | 'model_not_found'
  | 'rate_limited'
  | 'unreachable'
  | 'disabled'

export interface CloudConnectionSummary {
  id: string
  name: string
  provider: CloudProvider
  modelName: string
  enabled: boolean
  status: CloudConnectionStatus
  credentialConfigured: boolean
  apiKeyHint?: string
  capabilities: {
    streaming: boolean
    toolCalling: boolean
    vision: boolean
    reasoning: boolean
  }
  lastTestedAt?: string
  lastLatencyMs?: number
}

export interface CloudConnectionAdminDetail extends CloudConnectionSummary {
  baseUrl?: string | null
}

export interface CreateCloudConnectionRequest {
  name: string
  provider: CloudProvider
  modelName: string
  apiKey: string
  baseUrl?: string
}

export interface UpdateCloudConnectionRequest {
  name?: string
  modelName?: string
  apiKey?: string
  baseUrl?: string
  enabled?: boolean
}

export interface CloudConnectionTestResult {
  status: CloudConnectionStatus
  latencyMs?: number
  capabilities?: CloudConnectionSummary['capabilities']
  message?: string
}
