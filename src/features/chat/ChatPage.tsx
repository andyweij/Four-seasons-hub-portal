import { CATALOG_CHANGED, CATALOG_REVISION } from '../../core/api/catalog-sync'
import { useEffect, useRef, useState } from 'react'
import { chatApi, type ChatSession, type ChatMessage, type ModelOption, type AgentOption } from '@/core/api'
import { useAuth } from '../../core/auth/useAuth'
import { readChatEvents } from './streaming'

const modelKey = (model: { source: string; id: string }) => JSON.stringify([model.source, model.id])

export function ChatPage() {
  const { username } = useAuth()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [models, setModels] = useState<ModelOption[]>([])
  const [agents, setAgents] = useState<AgentOption[]>([])
  const [selectedModel, setSelectedModel] = useState('')
  const [selectedAgent, setSelectedAgent] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const abort = useRef<AbortController | null>(null)
  const runId = useRef<string | null>(null)
  const agent = agents.find(item => item.id === selectedAgent)
  const needsModel = !selectedAgent || !agent || agent.model_binding === 'hub_per_run'
  const agentUnavailable = !!selectedAgent && (!agent || !agent.enabled || !agent.capabilities.task_submission)
  const modelUnavailable = needsModel && !models.some(item => modelKey(item) === selectedModel)

  useEffect(() => {
    if (!username) return
    let live = true
    Promise.all([chatApi.getSessions(), chatApi.getModelOptions(), chatApi.getAgents()])
      .then(([history, choices, agentChoices]) => {
        if (!live) return
        setSessions(history); setModels(choices); setAgents(agentChoices)
        setSelectedModel(choices[0] ? modelKey(choices[0]) : '')
      }).catch(err => live && setError(String(err)))
    return () => { live = false; abort.current?.abort() }
  }, [username])

  useEffect(() => {
    if (!username) return
    let live = true
    const refresh = () => {
      Promise.all([chatApi.getModelOptions(), chatApi.getAgents()]).then(([choices, agentChoices]) => {
        if (!live) return
        setModels(choices); setAgents(agentChoices)
        setSelectedModel(previous => previous || (choices[0] ? modelKey(choices[0]) : ''))
      }).catch(cause => live && setError(String(cause)))
    }
    const storage = (event: StorageEvent) => { if (event.key === CATALOG_REVISION) refresh() }
    window.addEventListener(CATALOG_CHANGED, refresh)
    window.addEventListener('focus', refresh)
    window.addEventListener('storage', storage)
    return () => {
      live = false
      window.removeEventListener(CATALOG_CHANGED, refresh)
      window.removeEventListener('focus', refresh)
      window.removeEventListener('storage', storage)
    }
  }, [username])

  async function refreshOptions() {
    try {
      const [choices, agentChoices] = await Promise.all([chatApi.getModelOptions(), chatApi.getAgents()])
      setModels(choices); setAgents(agentChoices); setError('')
    } catch (cause) { setError(String(cause)) }
  }

  function sessionModelName(session: ChatSession) {
    const ref = session.model_ref || (session.selectModel.startsWith('cloud:')
      ? { source: 'cloud', id: session.selectModel.slice(6) } : { source: 'local', id: session.selectModel })
    const model = models.find(item => item.source === ref.source && item.id === ref.id)
    return model ? (ref.source === 'cloud' ? '雲端 · ' : '本地 · ') + model.name
      : ref.source === 'cloud' ? '雲端模型（未啟用或已移除）' : ref.id
  }

  async function selectSession(session: ChatSession) {
    if (streaming) return
    setError('')
    try {
      const history = await chatApi.getMessages(session.conversationId)
      setMessages(history.map(message => ({
        ...message, content: [{ type: 'text', text: message.content }],
        timestamp: new Date().toISOString(),
      })))
      setSessionId(session.conversationId); setSelectedAgent(session.agent_id || '')
      setSelectedModel(modelKey(session.model_ref || (session.selectModel.startsWith('cloud:')
        ? { source: 'cloud', id: session.selectModel.slice(6) } : { source: 'local', id: session.selectModel })))
    } catch (err) { setError(String(err)) }
  }

  function updateAssistant(update: (message: ChatMessage) => ChatMessage) {
    setMessages(previous => previous.map((message, index) =>
      index === previous.length - 1 && message.role === 'assistant' ? update(message) : message))
  }

  function append(type: string, text: string) {
    updateAssistant(message => {
      const content = message.content.map(part => ({ ...part }))
      const existing = content.find(part => part.type === type)
      if (existing) existing.text += text
      else content.push({ type, text })
      return { ...message, content }
    })
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (streaming || !input.trim()) return
    if (agentUnavailable) { setError('此 Agent 已停用或不接受新任務，請至 Agent 管理啟用或建立新對話。'); return }
    const model = models.find(item => modelKey(item) === selectedModel)
    if (needsModel && !model) { setError('請選擇可用模型'); return }
    const text = input.trim()
    setMessages(previous => [...previous,
      { role: 'user', content: [{ type: 'text', text }], timestamp: new Date().toISOString() },
      { role: 'assistant', content: [], timestamp: new Date().toISOString(), status: 'running' },
    ])
    setInput(''); setStreaming(true); setError(''); setProgress('')
    runId.current = null
    abort.current = new AbortController()
    let terminal = false
    try {
      const response = await chatApi.createStream({
        conversationId: sessionId || '',
        ...(needsModel && model ? { modelRef: { source: model.source, id: model.id } } : {}),
        ...(selectedAgent ? { agentId: selectedAgent } : {}),
        messages: [{ role: 'user', content: [{ type: 'text', text }] }], stream: true,
      }, abort.current.signal)
      if (!response.body) throw new Error('瀏覽器不支援串流')
      for await (const item of readChatEvents(response.body)) {
        if (item.type === 'ack') {
          if (item.conversation_id) setSessionId(item.conversation_id)
          runId.current = item.run_id || null
          updateAssistant(message => ({ ...message, run_id: item.run_id }))
        } else if (item.type === 'delta' && item.content) append('text', item.content)
        else if (item.type === 'thinking_delta' && item.content) append('thinking', item.content)
        else if (item.type === 'agent_progress') setProgress(item.content || '')
        else if (item.type === 'sources') updateAssistant(message => ({ ...message, sources: item.sources || [] }))
        else if (item.type === 'done') {
          terminal = true; updateAssistant(message => ({ ...message, status: 'complete' }))
        } else if (item.type === 'cancelled') {
          terminal = true; updateAssistant(message => ({ ...message, status: 'cancelled' })); setProgress('已取消')
        } else if (item.type === 'error') {
          terminal = true; updateAssistant(message => ({ ...message, status: 'error' }))
          setError(item.content || '執行失敗')
        }
      }
      if (!terminal) throw new Error('串流中斷，未收到完成確認')
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) setError(String(err))
      updateAssistant(message => ({ ...message, status: 'error' }))
    } finally {
      setStreaming(false); setCancelling(false); abort.current = null; runId.current = null
      chatApi.getSessions().then(setSessions).catch(() => undefined)
    }
  }

  async function stop() {
    setError('')
    if (runId.current) {
      if (!agent?.capabilities.cancellation) {
        abort.current?.abort(); setProgress('已停止觀看；遠端工作可能仍在執行'); return
      }
      setCancelling(true)
      try {
        const result = await chatApi.cancelRun(runId.current)
        if (result.status === 'cancel_requested') setProgress('已提出取消要求，等待停止確認')
        else { setProgress(result.status === 'unsupported' ? '遠端不支援取消' : '工作已結束'); setCancelling(false) }
      } catch (err) { setError(String(err)); setCancelling(false) }
    } else abort.current?.abort()
  }

  return <section>
    <header className="page-header"><p className="eyebrow">CHAT WORKSPACE</p>
      <h1>對話工作台</h1><p>選擇模型與 Agent，查看執行進度及參考來源。</p></header>
    {error && <p role="alert" style={{ color: '#dc2626' }}>{error}</p>}
    <div className="chat-workspace">
      <aside className="chat-panel"><strong>工作階段</strong>
        <button type="button" className="secondary-button" disabled={streaming}
          onClick={() => { setSessionId(null); setMessages([]); setError(''); setProgress('') }}>＋ 建立新對話</button>
        {!sessions.length && <p>尚無對話紀錄</p>}
        {sessions.map(session => <button key={session.conversationId} className="chat-session" type="button" disabled={streaming}
          onClick={() => selectSession(session)} style={{ display: 'block', width: '100%', padding: 10, textAlign: 'left' }}>
          <span>{session.title || '新對話'}</span><small>{sessionModelName(session)}</small>
        </button>)}
      </aside>
      <article className="chat-main">
        <div className="chat-config">
          <label>模型：<select value={selectedModel} disabled={streaming || !!sessionId || !needsModel}
            onChange={event => setSelectedModel(event.target.value)}>
            {!models.length && <option value="">無可用模型</option>}
            {models.map(model => <option key={modelKey(model)} value={modelKey(model)}>
              {model.source === 'cloud' ? '雲端' : '本地'} · {model.name}</option>)}
          </select></label>
          <label>Agent：<select value={selectedAgent} disabled={streaming || !!sessionId}
            onChange={event => setSelectedAgent(event.target.value)}>
            <option value="">一般聊天</option>
            {!!selectedAgent && !agent && <option value={selectedAgent} disabled>Agent 已移除</option>}
            {agents.filter(item => item.capabilities.task_submission || item.id === selectedAgent).map(item =>
              <option key={item.id} value={item.id} disabled={!item.enabled || !item.capabilities.task_submission}>
                {item.name}{!item.enabled ? '（已停用）' : ''}</option>)}
          </select></label>
          {!needsModel && <small>模型由 Agent 實例設定</small>}
          <button type="button" className="secondary-button" disabled={streaming} onClick={() => void refreshOptions()}>更新模型與 Agent</button>
        </div>
        {agentUnavailable && <p className="chat-status" role="status">此 Agent 已停用。請至 Agent 管理允許新任務，或建立新對話改選 Agent。</p>}
        {modelUnavailable && <p className="chat-status" role="status">目前模型未啟用或已移除。請啟用模型或建立新對話改選模型。</p>}
        {progress && <p className="chat-status" role="status">{progress}</p>}
        <div className="chat-messages-container" style={{ padding: 20, minHeight: 300, overflowY: 'auto' }}>
          {!messages.length && <p>輸入訊息開始對話。</p>}
          {messages.map((message, index) => <div key={index} style={{ marginBottom: 20 }}>
            <strong>{message.role === 'user' ? username || 'You' : 'Assistant'}</strong>
            {message.content.filter(part => part.type === 'thinking').map((part, i) =>
              <details key={i}><summary>思考過程</summary><p style={{ whiteSpace: 'pre-wrap' }}>{part.text}</p></details>)}
            {message.content.filter(part => part.type === 'text').map((part, i) =>
              <p key={i} style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{part.text}</p>)}
            {!!message.sources?.length && <details><summary>搜尋來源（{message.sources.length}）</summary>
              <ol>{message.sources.filter(source => /^https?:\/\//i.test(source.url)).map(source =>
                <li key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title || source.url}</a></li>)}</ol>
            </details>}
            {message.status === 'cancelled' && <small>已取消，保留部分回答</small>}
            {message.status === 'error' && <small>未完成，保留已接收內容</small>}
          </div>)}
        </div>
        <form className="chat-composer" onSubmit={submit}>
          <input value={input} onChange={event => setInput(event.target.value)} disabled={streaming} placeholder="請輸入訊息…" />
          {streaming ? <button type="button" onClick={stop} disabled={cancelling}>{cancelling ? '取消中…' : '停止'}</button>
            : <button type="submit" className="primary-button" disabled={!input.trim() || modelUnavailable || agentUnavailable}>送出</button>}
        </form>
      </article>
    </div>
  </section>
}
