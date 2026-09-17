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
