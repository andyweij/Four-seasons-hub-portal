import Keycloak from 'keycloak-js'

export const keycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL ?? '',
  realm: import.meta.env.VITE_KEYCLOAK_REALM ?? '',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? '',
}

export function isKeycloakConfigured(): boolean {
  return Boolean(keycloakConfig.url && keycloakConfig.realm && keycloakConfig.clientId)
}

/** 僅供本機開發暫時略過 Keycloak；production build 一律不允許略過。 */
export function isAuthBypassed(): boolean {
  return import.meta.env.DEV && import.meta.env.VITE_AUTH_BYPASS === 'true'
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

  initPromise = keycloak.init({
    onLoad: 'login-required',
    flow: 'standard',
    pkceMethod: 'S256',
    checkLoginIframe: false,
    redirectUri: window.location.href,
  })

  return initPromise
}