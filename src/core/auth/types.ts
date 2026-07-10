export type AuthContextValue = {
  isConfigured: boolean
  isReady: boolean
  isAuthenticated: boolean
  token: string | undefined
  username: string | undefined
  login: () => Promise<void>
  logout: () => Promise<void>
  hasRealmRole: (role: string) => boolean
}
