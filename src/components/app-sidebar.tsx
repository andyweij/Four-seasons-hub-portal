import { NavLink } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/core/auth"
import { navigationItems } from "@/core/layout/navigation"

export function AppSidebar() {
  const groups = ['工作區', '平台管理'] as const
  const { isConfigured, isBypassed, isAuthenticated, username, logout, isAdmin } = useAuth()
  const visibleItems = navigationItems.filter(item => !item.adminOnly || isAdmin)

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="brand px-4 py-2 text-lg font-bold">
          <span>◈</span> LLM Platform
        </div>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group) => {
          const groupItems = visibleItems.filter((item) => item.group === group)
          // 👈 若群組內沒有任何項目，就不顯示該群組
          if (groupItems.length === 0) return null
          return (
            <SidebarGroup key={group}>
              <SidebarGroupLabel>{group}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {groupItems.map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        render={
                          <NavLink to={item.path} end={item.path === '/'} />
                        }
                      >
                        {item.label}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )
        })}
      </SidebarContent>
      <SidebarFooter>
        <div className="flex flex-col gap-3 p-4 border-t border-border">
          <ThemeToggle />
          <div className="user-card text-sm">
            {isBypassed && (
              <>
                <strong className="block">已略過 Keycloak 驗證</strong>
                <span className="text-muted-foreground">僅限本機開發模式</span>
              </>
            )}
            {!isBypassed && !isConfigured && (
              <>
                <strong className="block">尚未設定 Keycloak</strong>
                <span className="text-muted-foreground">請在 .env.local 填入 VITE_KEYCLOAK_* 設定</span>
              </>
            )}
            {!isBypassed && isConfigured && isAuthenticated && (
              <>
                <strong className="block">{username ?? '已登入'}</strong>
                <button type="button" className="text-left text-primary hover:underline" onClick={() => void logout()}>
                  登出
                </button>
              </>
            )}
            {!isBypassed && isConfigured && !isAuthenticated && (
              <>
                <strong className="block">尚未登入</strong>
                <span className="text-muted-foreground">正在等待 Keycloak 驗證</span>
              </>
            )}
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
