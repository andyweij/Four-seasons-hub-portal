import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './core/auth'
import { AppLayout } from './core/layout/AppLayout'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { FeaturePage } from './shared/components/FeaturePage'

export default function App() {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="chat" element={<FeaturePage title="對話工作台" description="選擇模型與 Agent，並以串流方式顯示回覆。" />} />
          <Route path="models" element={<FeaturePage title="模型管理" description="管理地端模型、版本、部署與健康狀態。" />} />
          <Route path="agents" element={<FeaturePage title="Agent 管理" description="設定 Prompt、模型、工具與 Agent 版本。" />} />
          <Route path="knowledge-bases" element={<FeaturePage title="知識庫" description="管理 RAG 文件、索引狀態與檢索設定。" />} />
          <Route path="observability" element={<FeaturePage title="Gateway 觀測" description="查看請求量、延遲、錯誤與模型使用情況。" />} />
          <Route path="audit-logs" element={<FeaturePage title="稽核紀錄" description="查詢使用者與系統的重要操作事件。" />} />
          <Route path="admin" element={<FeaturePage title="系統管理" description="管理使用者、角色、配額與平台設定。" />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
