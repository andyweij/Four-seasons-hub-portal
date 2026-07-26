import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth'
import { navigationItems } from './navigation'

export function AppLayout() {
  const groups = ['工作區', '平台管理'] as const
  const { isConfigured, isBypassed, isAuthenticated, username, logout } = useAuth()

  return (
    <div className="app-shell dark">
      <aside className="sidebar">
        <div className="brand"><span>◈</span> LLM Platform</div>
        <nav aria-label="主要導覽">
          {groups.map((group) => (
            <section className="nav-group" key={group}>
              <p>{group}</p>
              {navigationItems.filter((item) => item.group === group).map((item) => (
                <NavLink key={item.path} to={item.path} end={item.path === '/'}>
                  {item.label}
                </NavLink>
              ))}
            </section>
          ))}
        </nav>
        <div className="user-card">
          {isBypassed && (
            <>
              <strong>已略過 Keycloak 驗證</strong>
              <span>僅限本機開發模式</span>
            </>
          )}
          {!isBypassed && !isConfigured && (
            <>
              <strong>尚未設定 Keycloak</strong>
              <span>請在 .env.local 填入 VITE_KEYCLOAK_* 設定</span>
            </>
          )}
          {!isBypassed && isConfigured && isAuthenticated && (
            <>
              <strong>{username ?? '已登入'}</strong>
              <button type="button" className="auth-button" onClick={() => void logout()}>
                登出
              </button>
            </>
          )}
          {!isBypassed && isConfigured && !isAuthenticated && (
            <>
              <strong>尚未登入</strong>
              <span>正在等待 Keycloak 驗證</span>
            </>
          )}
        </div>
      </aside>
      <main className="content"><Outlet /></main>
    </div>
  )
}
