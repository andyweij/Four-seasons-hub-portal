import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getKeycloak, initKeycloak, isAuthBypassed, isKeycloakConfigured } from './keycloak'
import type { AuthContextValue } from './types'

export const AuthContext = createContext<AuthContextValue | null>(null)

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const isConfigured = isKeycloakConfigured()
  const isBypassed = isAuthBypassed()
  const [isReady, setIsReady] = useState(isBypassed || !isConfigured)
  const [isAuthenticated, setIsAuthenticated] = useState(isBypassed)
  const [token, setToken] = useState<string | undefined>()
  const [username, setUsername] = useState<string | undefined>(isBypassed ? '本機開發者' : undefined)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (isBypassed || !isConfigured) {
      return
    }

    const keycloak = getKeycloak()
    if (!keycloak) {
      return
    }

    let cancelled = false

    const syncAuthState = (authenticated: boolean) => {
      setIsAuthenticated(authenticated)
      setToken(keycloak.token)
      setUsername(keycloak.tokenParsed?.preferred_username)
    }

    keycloak.onAuthSuccess = () => syncAuthState(true)
    keycloak.onAuthLogout = () => syncAuthState(false)
    keycloak.onAuthRefreshSuccess = () => syncAuthState(true)
    keycloak.onAuthSuccess = () => {
      syncAuthState(true)
      setError(null)
    }

    keycloak.onAuthLogout = () => {
      syncAuthState(false)
    }

    keycloak.onAuthError = () => {
      syncAuthState(false)
      setError('Keycloak 登入驗證失敗')
    }

    keycloak.onAuthRefreshSuccess = () => {
      syncAuthState(true)
    }

    keycloak.onAuthRefreshError = () => {
      keycloak.clearToken()
      syncAuthState(false)
      setError('登入狀態已失效，請重新登入')
    }

    keycloak.onTokenExpired = () => {
      void keycloak.updateToken(30).catch(() => {
        keycloak.clearToken()
        void keycloak.login({
          redirectUri: window.location.href,
        })
      })
    }
    void initKeycloak(keycloak)
      .then((authenticated) => {
        if (cancelled) {
          return
        }

        syncAuthState(authenticated)
        setError(null)
        setIsReady(true)
      })
      .catch((cause: unknown) => {
        if (cancelled) {
          return
        }

        syncAuthState(false)
        setError(
          cause instanceof Error
            ? cause.message
            : '無法連線至登入服務',
        )
        setIsReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [isConfigured])

  const value = useMemo<AuthContextValue>(() => {
    const keycloak = getKeycloak()
    const resourceClientId = import.meta.env.VITE_KEYCLOAK_RESOURCE_CLIENT_ID
    return {
      isConfigured,
      isBypassed,
      isReady,
      isAuthenticated,
      token,
      username,
      error,
      login: async () => {
        if (!keycloak) {
          return
        }

        await keycloak.login()
      },
      logout: async () => {
        if (!keycloak) {
          return
        }

        await keycloak.logout({ redirectUri: window.location.origin })
      },
      retry: () => {
        window.location.reload()
      },
      hasRealmRole: (role: string) => keycloak?.hasRealmRole(role) ?? false,
      hasResourceRole: (role: string) => resourceClientId ? keycloak?.hasResourceRole(role, resourceClientId) ?? false : false,
    }
  }, [isConfigured, isBypassed, isReady, isAuthenticated, token, username])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
