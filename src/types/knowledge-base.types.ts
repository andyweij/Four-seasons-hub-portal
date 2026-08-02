export interface KnowledgeBaseRecord {
  id: string
  name: string
  documentsCount: number
  embeddingModel: string
  status: 'indexing' | 'ready' | 'error'
  createdAt: string
}
