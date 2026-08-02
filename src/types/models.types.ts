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
