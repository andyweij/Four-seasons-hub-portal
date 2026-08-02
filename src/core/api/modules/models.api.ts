import { createApiGroup } from '../client'
import type { ModelRecord } from '../../../types'

const modelsReq = createApiGroup('/v1/modelsMgt')

export const modelsApi = {
  /** 取得所有註冊模型列表 (對應 /v1/modelsMgt/list) */
  getModels: () => modelsReq.get<ModelRecord[]>(''),
  /** 取得單一模型詳細資料 (對應 /v1/modelsMgt/{id}) */
  getModel: (id: string) => modelsReq.get<ModelRecord>(`/${id}`),
  /** 註冊/執行新模型 (對應 /v1/modelsMgt/runModelAPP) */
  createModel: (data: Partial<ModelRecord>) => modelsReq.post<ModelRecord>('/runModelAPP', data),
  /** 更新模型設定 (對應 /v1/modelsMgt/{id}) */
  updateModel: (id: string, data: Partial<ModelRecord>) => modelsReq.put<ModelRecord>(`/${id}`, data),
  /** 刪除模型 (對應 /v1/modelsMgt/{id}) */
  deleteModel: (id: string) => modelsReq.delete(`/${id}`),
  /** 測試模型連線與健康狀態 (對應 /v1/modelsMgt/{id}/health) */
  checkHealth: (id: string) => modelsReq.get<{ status: string; latency?: number }>(`/${id}/health`),
}
