export type AuthContextValue = {
  isConfigured: boolean
  isBypassed: boolean
  isReady: boolean
  isAuthenticated: boolean
  error: string | null
  username: string | undefined
  roles: string[]          // 👈 新增：存放所有 realm 角色
  isAdmin: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
  retry: () => void

  hasRealmRole: (role: string) => boolean
  hasResourceRole: (role: string) => boolean
  hasRole: (role: string) => boolean
}