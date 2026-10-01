import { notifyCatalogChanged } from '../catalog-sync'
import { createApiGroup } from '../client'
import type {
  CloudConnectionAdminDetail,
  CloudConnectionSummary,
  CloudConnectionTestResult,
  CreateCloudConnectionRequest,
  UpdateCloudConnectionRequest,
  CloudProvider,
  CloudConnectionStatus
} from '../../../types'

const cloudConnectionsReq = createApiGroup('/v1/admin/llm-connections')

export interface RawCloudConnection {
  id: string
  name: string
  provider: CloudProvider
  model_name?: string
  modelName?: string
  base_url?: string | null
  baseUrl?: string | null
  enabled?: boolean
  status?: CloudConnectionStatus
  credential_configured?: boolean
  credentialConfigured?: boolean
  api_key_hint?: string | null
  apiKeyHint?: string | null
  capabilities?: {
    streaming?: boolean
    tool_calling?: boolean
    toolCalling?: boolean
    vision?: boolean
    reasoning?: boolean
  } | null
  last_tested_at?: string | null
  lastTestedAt?: string | null
  last_latency_ms?: number | null
  lastLatencyMs?: number | null
}

export function normalizeCloudConnection(
  raw: RawCloudConnection,
): CloudConnectionSummary {
  return {
    id: raw.id,
    name: raw.name,
    provider: raw.provider,
    modelName: raw.modelName ?? raw.model_name ?? '',
    enabled: raw.enabled ?? true,
    status: raw.status ?? 'untested',
    credentialConfigured:
      raw.credentialConfigured ?? raw.credential_configured ?? false,
    apiKeyHint: raw.apiKeyHint ?? raw.api_key_hint ?? undefined,
    capabilities: {
      streaming: Boolean(raw.capabilities?.streaming),
      toolCalling: Boolean(
        raw.capabilities?.toolCalling ?? raw.capabilities?.tool_calling,
      ),
      vision: Boolean(raw.capabilities?.vision),
      reasoning: Boolean(raw.capabilities?.reasoning),
    },
    lastTestedAt: raw.lastTestedAt ?? raw.last_tested_at ?? undefined,
    lastLatencyMs: raw.lastLatencyMs ?? raw.last_latency_ms ?? undefined,
  }
}

export const cloudConnectionsApi = {
  list: async (): Promise<CloudConnectionSummary[]> => {
    const response = await cloudConnectionsReq.get<
      RawCloudConnection[] | { connections: RawCloudConnection[] }
    >('')

    const list = Array.isArray(response) ? response : response.connections ?? []
    return list.map(normalizeCloudConnection)
  },

  get: async (id: string): Promise<CloudConnectionAdminDetail> => {
    const raw = await cloudConnectionsReq.get<RawCloudConnection>(`/${id}`)
    return {
      ...normalizeCloudConnection(raw),
      baseUrl: raw.baseUrl ?? raw.base_url ?? null,
    }
  },

  create: async (
    data: CreateCloudConnectionRequest,
  ): Promise<CloudConnectionAdminDetail> => {
    const payload = {
      name: data.name,
      provider: data.provider,
      model_name: data.modelName,
      api_key: data.apiKey,
      base_url: data.baseUrl,
    }
    const raw = await cloudConnectionsReq.post<
      RawCloudConnection,
      typeof payload
    >('', payload)
    notifyCatalogChanged()
    return {
      ...normalizeCloudConnection(raw),
      baseUrl: raw.baseUrl ?? raw.base_url ?? null,
    }
  },

  update: async (
    id: string,
    data: UpdateCloudConnectionRequest,
  ): Promise<CloudConnectionAdminDetail> => {
    const payload = {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.enabled !== undefined ? { enabled: data.enabled } : {}),
      ...(data.modelName ? { model_name: data.modelName } : {}),
      ...(data.apiKey ? { api_key: data.apiKey } : {}),
      ...(data.baseUrl !== undefined ? { base_url: data.baseUrl } : {}),
    }
    const raw = await cloudConnectionsReq.patch<
      RawCloudConnection,
      typeof payload
    >(`/${id}`, payload)
    notifyCatalogChanged()
    return {
      ...normalizeCloudConnection(raw),
      baseUrl: raw.baseUrl ?? raw.base_url ?? null,
    }
  },

  test: (id: string) =>
    cloudConnectionsReq.post<CloudConnectionTestResult>(`/${id}/test`),

  remove: async (id: string) => {
    await cloudConnectionsReq.delete("/" + encodeURIComponent(id))
    notifyCatalogChanged()
  },
}
