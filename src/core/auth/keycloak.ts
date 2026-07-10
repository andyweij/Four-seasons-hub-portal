import Keycloak from 'keycloak-js'

export const keycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL ?? '',
  realm: import.meta.env.VITE_KEYCLOAK_REALM ?? '',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? '',
}

export function isKeycloakConfigured(): boolean {
  return Boolean(keycloakConfig.url && keycloakConfig.realm && keycloakConfig.clientId)
}

let keycloakInstance: Keycloak | null = null
let initPromise: Promise<boolean> | null = null

export function getKeycloak(): Keycloak | null {
  if (!isKeycloakConfigured()) {
    return null
  }

  if (!keycloakInstance) {
    keycloakInstance = new Keycloak(keycloakConfig)
  }

  return keycloakInstance
}

export function initKeycloak(keycloak: Keycloak): Promise<boolean> {
  if (initPromise) {
    return initPromise
  }

  keycloak.onTokenExpired = () => {
    keycloak.updateToken(30).catch(() => {
      void keycloak.login()
    })
  }

  initPromise = keycloak.init({
    onLoad: 'login-required',
    pkceMethod: 'S256',
    checkLoginIframe: false,
  })

  return initPromise
}
