import { createApiGroup } from '../client'
import type {
  CloudConnectionAdminDetail,
  CloudConnectionSummary,
  CloudConnectionTestResult,
  CreateCloudConnectionRequest,
  UpdateCloudConnectionRequest,
} from '../../../types'

const cloudConnectionsReq = createApiGroup('/v1/cloud-mgt')

export const cloudConnectionsApi = {
  list: async () => {
    const response = await cloudConnectionsReq.get<
      CloudConnectionSummary[] | { connections: CloudConnectionSummary[] }
    >('')

    return Array.isArray(response) ? response : response.connections ?? []
  },

  get: (id: string) =>
    cloudConnectionsReq.get<CloudConnectionAdminDetail>(`/${id}`),

  create: (data: CreateCloudConnectionRequest) =>
    cloudConnectionsReq.post<
      CloudConnectionAdminDetail,
      CreateCloudConnectionRequest
    >('', data),

  update: (id: string, data: UpdateCloudConnectionRequest) =>
    cloudConnectionsReq.patch<
      CloudConnectionAdminDetail,
      UpdateCloudConnectionRequest
    >(`/${id}`, data),

  test: (id: string) =>
    cloudConnectionsReq.post<CloudConnectionTestResult>(`/${id}/test`),

  remove: (id: string) =>
    cloudConnectionsReq.delete(`/${id}`),
}
