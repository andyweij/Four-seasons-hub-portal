export interface ModelRecord {
  modelName: string
  modelPath: string
  url: string
  description: string
  reasoning: boolean
  reasoningEffort: boolean
  imagesSupport: number
  maxModelLen: number
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
