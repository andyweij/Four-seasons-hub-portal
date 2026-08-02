import { apiClient } from '../client'
import type { KnowledgeBaseRecord } from '../../../types'

export const knowledgeBasesApi = {
  /** 取得知識庫列表 */
  getKnowledgeBases: () => apiClient.get<KnowledgeBaseRecord[]>('/knowledge-bases'),
  /** 建立知識庫 */
  createKnowledgeBase: (data: { name: string; embeddingModel: string; description?: string }) =>
    apiClient.post<KnowledgeBaseRecord>('/knowledge-bases', data),
  /** 刪除知識庫 */
  deleteKnowledgeBase: (id: string) => apiClient.delete(`/knowledge-bases/${id}`),
}
