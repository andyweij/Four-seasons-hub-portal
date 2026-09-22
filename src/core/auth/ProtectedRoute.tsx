import { Outlet } from 'react-router-dom'
import { useAuth } from './useAuth'

export function ProtectedRoute() {
  const { isConfigured, isReady, isAuthenticated, isBypassed } = useAuth()

  if (isBypassed) {
    return <Outlet />
  }

  if (!isReady) {
    return <div className="auth-loading">正在驗證登入狀態…</div>
  }

  if (!isAuthenticated) {
    return <div className="auth-loading">正在導向登入頁…</div>
  }

  return <Outlet />
}
