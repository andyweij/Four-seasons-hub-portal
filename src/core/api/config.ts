/**
 * 後端 API 基礎設定
 * 
 * 透過環境變數 VITE_BACKEND_BASE_URL 取得後端 Gateway 地址。
 * 若未設定，預設指向 http://localhost:8080/api
 */
export const backend_base_url = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:8080'

// 為了相容大寫命名習慣，一併匯出 BACKEND_BASE_URL
export const BACKEND_BASE_URL = backend_base_url

/**
 * 輔助函式：用來拼接完整的 API URL
 * @param endpoint 相对路徑，例如 '/models' 或 'models'
 * @returns 完整的 API 路徑，例如 'http://localhost:8080/api/models'
 */
export function getApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  const cleanBase = backend_base_url.endsWith('/')
    ? backend_base_url.slice(0, -1)
    : backend_base_url

  return `${cleanBase}/${cleanEndpoint}`
}
