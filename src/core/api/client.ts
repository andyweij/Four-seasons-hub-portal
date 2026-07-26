import { getApiUrl } from './config'
import { getKeycloak, isAuthBypassed } from '../auth/keycloak'

export interface ApiRequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>
}

/**
 * 統一 API 請求客戶端
 * 1. 自動拼接 backend_base_url
 * 2. 自動附帶 Keycloak Bearer Token (JWT)，並在發送前檢查更新 Token
 * 3. 處理 JSON 序列化與錯誤檢查
 */
async function request<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
  const { params, headers: customHeaders, ...customConfig } = options

  // 1. 產生完整 URL 並加上 Query Parameters（如果有）
  let url = getApiUrl(endpoint)
  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value))
      }
    })
    const queryString = searchParams.toString()
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString
    }
  }

  // 2. 準備 Headers，自動注入 Keycloak Auth Token (JWT)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  }

  const keycloak = getKeycloak()
  if (keycloak) {
    if (keycloak.authenticated) {
      try {
        // 在打後端 API 前，檢查 JWT 是否將於 30 秒內過期；若即將過期則自動重新換發 Token
        await keycloak.updateToken(30)
      } catch (err) {
        console.warn('Keycloak JWT Token 重新換發失敗，可能需要重新登入:', err)
      }
    }
    if (keycloak.token) {
      headers['Authorization'] = `Bearer ${keycloak.token}`
    }
  } else if (isAuthBypassed()) {
    // 當本機開啟 VITE_AUTH_BYPASS=true 時，可在此自訂測試用 Mock JWT 讓後端驗證通過
    // headers['Authorization'] = 'Bearer dev-mock-jwt-token'
  }

  // 3. 發送 Fetch 請求
  const response = await fetch(url, {
    ...customConfig,
    headers,
  })

  // 4. 錯誤處理
  if (!response.ok) {
    let errorMessage = `API Request failed with status ${response.status}`
    try {
      const errorData = await response.json()
      if (errorData && (errorData.message || errorData.error)) {
        errorMessage = errorData.message || errorData.error
      }
    } catch {
      // 忽略 JSON 解析失敗，使用預設的 HTTP status message
    }
    throw new Error(errorMessage)
  }

  // 5. 若為 204 No Content，直接返回空物件或 undefined
  if (response.status === 204) {
    return {} as T
  }

  return response.json() as Promise<T>
}

export const apiClient = {
  get: <T>(endpoint: string, options?: ApiRequestOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T, B = unknown>(endpoint: string, body?: B, options?: ApiRequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  put: <T, B = unknown>(endpoint: string, body?: B, options?: ApiRequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T, B = unknown>(endpoint: string, body?: B, options?: ApiRequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T = void>(endpoint: string, options?: ApiRequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),

  /** 取得當前最新且經過自動換發檢查的 Keycloak JWT 字串 (供 SSE 串流、WebSocket 等特殊場景使用) */
  getToken: async (): Promise<string | undefined> => {
    const keycloak = getKeycloak()
    if (keycloak && keycloak.authenticated) {
      try {
        await keycloak.updateToken(30)
      } catch {
        // 忽略更新失敗
      }
      return keycloak.token
    }
    return undefined
  },
}

/**
 * 建立綁定特定 RequestMapping / 前綴路徑的 API 群組 (對齊 Java Spring Boot @RequestMapping 概念)
 * @param prefix 共同的 RequestMapping 前綴，例如 '/v1/modelsMgt'
 * @example
 * const modelsReq = createApiGroup('/v1/modelsMgt')
 * modelsReq.post('/runModelAPP', data) // -> 發送到 /v1/modelsMgt/runModelAPP
 */
export function createApiGroup(prefix: string) {
  const cleanPrefix = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix
  const joinPath = (path: string = '') => {
    if (!path || path === '/') return cleanPrefix
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    return `${cleanPrefix}${cleanPath}`
  }

  return {
    get: <T>(endpoint: string = '', options?: ApiRequestOptions) =>
      apiClient.get<T>(joinPath(endpoint), options),

    post: <T, B = unknown>(endpoint: string = '', body?: B, options?: ApiRequestOptions) =>
      apiClient.post<T, B>(joinPath(endpoint), body, options),

    put: <T, B = unknown>(endpoint: string = '', body?: B, options?: ApiRequestOptions) =>
      apiClient.put<T, B>(joinPath(endpoint), body, options),

    patch: <T, B = unknown>(endpoint: string = '', body?: B, options?: ApiRequestOptions) =>
      apiClient.patch<T, B>(joinPath(endpoint), body, options),

    delete: <T = void>(endpoint: string = '', options?: ApiRequestOptions) =>
      apiClient.delete<T>(joinPath(endpoint), options),

    /** 取得該 Prefix 下特定 endpoint 的完整網址 (供 SSE 串流等特殊用途使用) */
    url: (endpoint: string = '') => getApiUrl(joinPath(endpoint)),

    /** 取得最新 JWT Bearer Token (供 SSE / WebSocket 或自訂請求調用) */
    getToken: () => apiClient.getToken(),
  }
}

