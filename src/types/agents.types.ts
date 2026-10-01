/** Public Agent catalog returned by the Hub; contains no credentials. */
export interface AgentRecord {
  id: string
  name: string
  version: string
  enabled: boolean
  integration_type: 'hub_native' | 'adapter' | 'registration_only'
  runtime_type: 'external' | 'docker'
  model_binding: 'hub_per_run' | 'hub_fixed' | 'agent_managed' | 'mixed'
  capabilities: {
    task_submission: boolean
    streaming: boolean
    cancellation: boolean
    status_query: boolean
    structured_sources: boolean
    generation_parameters: boolean
  }
}
export interface AgentHealth { ready: boolean | null; status: string }
