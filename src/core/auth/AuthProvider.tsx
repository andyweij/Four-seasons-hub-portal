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
      isBypassed,
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
  }, [isConfigured, isBypassed, isReady, isAuthenticated, token, username])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
