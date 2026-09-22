export type AuthContextValue = {
  isConfigured: boolean
  isBypassed: boolean
  isReady: boolean
  isAuthenticated: boolean
  error: string | null
  username: string | undefined

  login: () => Promise<void>
  logout: () => Promise<void>
  retry: () => void

  hasRealmRole: (role: string) => boolean
  hasResourceRole: (role: string) => boolean
}