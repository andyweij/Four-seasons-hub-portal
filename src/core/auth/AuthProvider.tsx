import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getKeycloak, initKeycloak, isKeycloakConfigured } from './keycloak'
import type { AuthContextValue } from './types'

export const AuthContext = createContext<AuthContextValue | null>(null)

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const isConfigured = isKeycloakConfigured()
  const [isReady, setIsReady] = useState(!isConfigured)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [token, setToken] = useState<string | undefined>()
  const [username, setUsername] = useState<string | undefined>()

  useEffect(() => {
    if (!isConfigured) {
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

    void initKeycloak(keycloak)
      .then((authenticated) => {
        if (cancelled) {
          return
        }

        syncAuthState(authenticated)
        setIsReady(true)
      })
      .catch(() => {
        if (cancelled) {
          return
        }

        syncAuthState(false)
        setIsReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [isConfigured])

  const value = useMemo<AuthContextValue>(() => {
    const keycloak = getKeycloak()

    return {
      isConfigured,
      isReady,
      isAuthenticated,
      token,
      username,
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
      hasRealmRole: (role: string) => keycloak?.hasRealmRole(role) ?? false,
    }
  }, [isConfigured, isReady, isAuthenticated, token, username])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
