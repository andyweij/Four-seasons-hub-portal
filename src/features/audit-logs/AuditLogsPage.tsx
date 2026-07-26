import { ResourceListPage } from '../../shared/components/ResourceListPage'

export function AuditLogsPage() {
  return <ResourceListPage eyebrow="AUDIT LOGS" title="稽核紀錄" description="查詢使用者與系統的重要操作事件。" primaryAction="匯出紀錄" emptyMessage="Gateway 開始寫入稽核事件後，紀錄會顯示於此。" columns={[{ key: 'time', label: '時間' }, { key: 'actor', label: '操作者' }, { key: 'action', label: '事件' }, { key: 'target', label: '目標' }]} records={[]} />
}
