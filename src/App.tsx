import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './core/auth'
import { AppLayout } from './core/layout/AppLayout'
import { AdminPage } from './features/admin/AdminPage'
import { AgentsPage } from './features/agents/AgentsPage'
import { AuditLogsPage } from './features/audit-logs/AuditLogsPage'
import { ChatPage } from './features/chat/ChatPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { KnowledgeBasesPage } from './features/knowledge-bases/KnowledgeBasesPage'
import { ModelsPage } from './features/models/ModelsPage'
import { ObservabilityPage } from './features/observability/ObservabilityPage'
import { AdminRoute } from './core/auth/AdminRoute'

export default function App() {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* ✅ 所有登入使用者（包含普通 User）皆可進入 */}
          <Route path="chat" element={<ChatPage />} />
          <Route path="agents" element={<AgentsPage />} />

          {/* 🔒 僅限 Admin 存取的頁面 */}
          <Route element={<AdminRoute />}>
            <Route index element={<DashboardPage />} />
            <Route path="models" element={<ModelsPage />} />
            <Route path="knowledge-bases" element={<KnowledgeBasesPage />} />
            <Route path="observability" element={<ObservabilityPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
            <Route path="admin" element={<AdminPage />} />
          </Route>
        </Route>
      </Route>
      {/* 預設非 admin 導向至 chat */}
      <Route path="*" element={<Navigate to="/chat" replace />} />
    </Routes>
  )
}

