import { ResourceListPage } from '../../shared/components/ResourceListPage'

export function AgentsPage() {
  return <ResourceListPage eyebrow="AGENT CATALOG" title="Agent 管理" description="設定 Prompt、模型、工具與 Agent 版本。" primaryAction="建立 Agent" emptyMessage="建立第一個 Agent 後，可以在這裡管理其版本與發布狀態。" columns={[{ key: 'name', label: '名稱' }, { key: 'model', label: '模型' }, { key: 'version', label: '版本' }, { key: 'status', label: '狀態' }]} records={[]} />
}
