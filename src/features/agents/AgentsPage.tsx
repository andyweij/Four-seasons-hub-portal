import { useCallback, useEffect, useState } from 'react'
import { agentsApi, type AgentRecord, type AgentHealth } from '../../core/api'
import { useAuth } from '../../core/auth/useAuth'

const bindings: Record<AgentRecord['model_binding'], string> = {
  hub_per_run: '每次選擇 Hub 模型', hub_fixed: '固定 Hub 模型',
  agent_managed: 'Agent 自行管理', mixed: '混合設定',
}
const integrations: Record<AgentRecord['integration_type'], string> = {
  hub_native: 'Hub 原生契約', adapter: '第三方 Adapter', registration_only: '僅登記',
}
const healthLabel = (health?: AgentHealth) => !health ? '尚未檢查'
  : health.ready === true ? '服務就緒'
  : health.ready === null ? '此整合未提供健康檢查'
  : health.status === 'unreachable' ? '無法連線' : '服務未就緒'
const errorText = (error: unknown) => error instanceof Error ? error.message : '操作失敗'

export function AgentsPage() {
  const { isAdmin } = useAuth()
  const [agents, setAgents] = useState<AgentRecord[]>([])
  const [health, setHealth] = useState<Record<string, AgentHealth>>({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const entries = await agentsApi.getAgents()
      setAgents(entries)
      if (isAdmin) {
        const results = await Promise.all(entries.filter(item => item.integration_type === 'hub_native').map(async item => {
          try { return [item.id, await agentsApi.getHealth(item.id)] as const }
          catch { return [item.id, { ready: false, status: 'unreachable' }] as const }
        }))
        setHealth(Object.fromEntries(results))
      }
    }
    catch (cause) { setError(errorText(cause)) }
    finally { setLoading(false) }
  }, [isAdmin])

  useEffect(() => { void load() }, [load])

  async function act(agent: AgentRecord, action: 'toggle' | 'health' | 'start' | 'stop') {
    setBusy(agent.id); setError(''); setNotice('')
    try {
      if (action === 'health') {
        const result = await agentsApi.getHealth(agent.id)
        setHealth(previous => ({ ...previous, [agent.id]: result }))
      } else if (action === 'toggle') {
        const updated = await agentsApi.setEnabled(agent.id, !agent.enabled)
        setAgents(previous => previous.map(item => item.id === updated.id ? updated : item))
        setNotice(`${agent.name} 已${updated.enabled ? '啟用，可在對話工作台選擇' : '停用，不再接受新任務'}。`)
      } else {
        if (action === 'start') await agentsApi.start(agent.id)
        else await agentsApi.stop(agent.id)
        // Stop disables task admission, including when draining rejects the stop.
        setAgents(await agentsApi.getAgents())
        setHealth(previous => {
          const next = { ...previous }; delete next[agent.id]; return next
        })
        setNotice(action === 'start' ? '已啟動容器；服務就緒後再啟用 Agent。' : '容器已停止，Agent 已停用。')
      }
    } catch (cause) {
      setError(errorText(cause))
      if (action === 'stop') {
        try {
      const entries = await agentsApi.getAgents()
      setAgents(entries)
      if (isAdmin) {
        const results = await Promise.all(entries.filter(item => item.integration_type === 'hub_native').map(async item => {
          try { return [item.id, await agentsApi.getHealth(item.id)] as const }
          catch { return [item.id, { ready: false, status: 'unreachable' }] as const }
        }))
        setHealth(Object.fromEntries(results))
      }
    } catch { /* Keep the last catalog snapshot. */ }
      }
    } finally { setBusy(null) }
  }

  return <section>
    <header className="page-header page-header-with-action">
      <div><p className="eyebrow">AGENT CATALOG</p><h1>Agent 管理</h1>
        <p>管理已登記 Agent 的啟用狀態、服務健康與容器生命週期。</p></div>
      <button type="button" className="secondary-button" disabled={loading || !!busy}
        onClick={() => void load()}>重新整理</button>
    </header>
    {error && <p role="alert" style={{ color: '#dc2626' }}>{error}</p>}
    {notice && <p role="status">{notice}</p>}
    <article className="data-card">
      {loading ? <div className="empty-state" role="status">載入 Agent…</div>
        : !agents.length ? <div className="empty-state"><strong>{error ? '無法取得 Agent 列表' : '尚未登記 Agent'}</strong>
          <p>{error ? '確認 Hub 連線與登入授權後重新整理。' : '在 Hub 的 Agent 目錄新增定義，重啟 Hub 後重新整理。'}</p></div>
        : <div className="table-scroll"><table>
          <thead><tr><th>名稱／版本</th><th>整合方式</th><th>模型綁定</th><th>接收新任務</th><th>服務健康</th><th>操作</th></tr></thead>
          <tbody>{agents.map(agent => <tr key={agent.id}>
            <td><strong>{agent.name}</strong><small style={{ display: 'block' }}>{agent.id} · {agent.version}</small></td>
            <td>{integrations[agent.integration_type]}<small style={{ display: 'block' }}>
              {agent.runtime_type === 'docker' ? 'Hub 管理 Docker' : '外部服務'}</small></td>
            <td>{bindings[agent.model_binding]}</td>
            <td>{agent.enabled ? '允許' : '已停用'}
              {!agent.capabilities.task_submission && <small style={{ display: 'block' }}>無任務提交能力</small>}</td>
            <td>{healthLabel(health[agent.id])}</td>
            <td>{isAdmin ? <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="secondary-button"
                disabled={!!busy || (!agent.enabled && (!agent.capabilities.task_submission || agent.integration_type === 'registration_only'))}
                onClick={() => void act(agent, 'toggle')}>{agent.enabled ? '停用新任務' : '允許新任務'}</button>
              <button type="button" className="secondary-button" disabled={!!busy}
                onClick={() => void act(agent, 'health')}>健康檢查</button>
              {agent.runtime_type === 'docker' && <>
                <button type="button" className="secondary-button" disabled={!!busy}
                  onClick={() => void act(agent, 'start')}>啟動容器</button>
                <button type="button" className="secondary-button" disabled={!!busy}
                  onClick={() => void act(agent, 'stop')}>停用並停止容器</button>
              </>}
              {busy === agent.id && <span role="status">處理中…</span>}
            </div> : '需要 admin 權限'}</td>
          </tr>)}</tbody>
        </table></div>}
    </article>
    <p style={{ marginTop: 16 }}>新增 Agent 需設定 Hub 的 resources/agents/agents.json 並重啟 Hub。
      外部服務請在 IDE 或部署工具啟動；啟用後可在「對話工作台」建立新對話使用。</p>
    <p>外部服務（IDE）啟動後，仍需按「允許新任務」。停用新任務不會關閉 IDE 程序或取消既有任務。</p>
    <p>停止受管容器會先停用新任務；仍有執行中的任務時，需等待結束後再停止。</p>
  </section>
}
