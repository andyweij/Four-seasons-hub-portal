import { ResourceListPage } from '../../shared/components/ResourceListPage'

export function KnowledgeBasesPage() {
  return <ResourceListPage eyebrow="KNOWLEDGE BASES" title="知識庫" description="管理 RAG 文件、索引狀態與檢索設定。" primaryAction="建立知識庫" emptyMessage="建立知識庫並上傳文件後，可在這裡追蹤索引狀態。" columns={[{ key: 'name', label: '名稱' }, { key: 'documents', label: '文件數' }, { key: 'embeddingModel', label: '嵌入模型' }, { key: 'status', label: '索引狀態' }]} records={[]} />
}
