export interface AgentRecord {
  id: string
  name: string
  description: string
  modelName: string
  systemPrompt: string
  status: 'draft' | 'published'
}
