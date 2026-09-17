import { useEffect, useState } from 'react'
import {
  chatApi,
  type ChatSession,
  type ChatMessage,
  type CreateStreamRequest,
  type ChatContent,
  type StreamDeltaEvent,
} from '@/core/api'
import { useAuth } from '../../core/auth/useAuth'

export function ChatPage() {
  const { username } = useAuth()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState<string>('') // 使用者輸入的文字
  const [isStreaming, setIsStreaming] = useState<boolean>(false)
  const [runningModels, setRunningModels] = useState<string[]>([])
  // 當前選擇的模型（給予預設值防呆）
  const [selectedModel, setSelectedModel] = useState<string>("無運行中模型")
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  // 點擊切換 session
  const handleSelectSession = async (session: ChatSession) => {
    if (isStreaming) return
    setCurrentSessionId(session.conversationId)
    setSelectedModel(session.selectModel || selectedModel)
    // 載入該對話的歷史訊息
    try {
      // const history = await chatApi.getMessages(session.conversationId)
      // setMessages(history ?? [])
      console.log('get messages', session.conversationId)
    } catch (err) {
      console.error("載入歷史訊息失敗:", err)
    }
  }

  // 建立新對話（重置）
  const handleNewChat = () => {
    if (isStreaming) return
    setCurrentSessionId(null)
    setMessages([])
  }

  useEffect(() => {
    if (!username) return
    // 1. 取得歷史對話
    chatApi.getSessions(username)
      .then((res) => setSessions(res))
      .catch((err) => console.warn('無法取得對話紀錄:', err))
    // 2. 取得目前運行中的模型
    chatApi.getRunningModels(username)
      .then((res: any) => {
        console.log('運行中模型列表:', res)
        // 相容後端回傳 ['modelA', 'modelB'] 或 { models: ['modelA'] } 或物件陣列結構
        const rawList = Array.isArray(res) ? res : res?.models ?? []
        const modelNames = rawList.map((item: any) =>
          typeof item === 'string' ? item : (item.modelName || item.name || '')
        ).filter(Boolean)
        if (modelNames.length > 0) {
          setRunningModels(modelNames)
          setSelectedModel(modelNames[0]) // 自動將第一個運行中的模型設為預設
        }
      })
      .catch((err) => {
        console.warn('無法取得運行中模型清單，使用預設值:', err)
      })
  }, [username])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || !username || isStreaming) return

    const userContent: ChatContent = {
      type: 'text',
      text: inputText,
    }

    // 1. 組裝使用者發送的最新訊息
    const userMsg: ChatMessage = {
      role: 'user',
      content: [userContent],
      timestamp: new Date().toISOString(),
    }

    // 2. 建立一筆空的 assistant 訊息佔位，供串流逐字追加
    const assistantMsg: ChatMessage = {
      role: 'assistant',
      content: [{ type: 'text', text: '' }],
      timestamp: new Date().toISOString(),
    }

    const updatedMessages = [...messages, userMsg]
    setMessages([...updatedMessages, assistantMsg])
    setInputText('')
    setIsStreaming(true)

    // 3. 組裝後端所需的 Request Body (CreateStreamRequest)
    const payload: CreateStreamRequest = {
      model: selectedModel,
      messages: [userMsg],
      stream: true,
      conversationId: "",
    }

    try {
      // 4. 呼叫 createStream API
      const response = await chatApi.createStream(payload)
      if (!response.body) {
        throw new Error('ReadableStream not supported in response')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // 支援 Windows / Java 預設之 \r\n (CRLF) 及 \n (LF) 換行格式
        const lines = buffer.split(/\r?\n/)
        buffer = lines.pop() ?? '' // 尚未結束的一行保留到下一個 chunk

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data:')) continue

          const jsonStr = trimmed.replace(/^data:\s*/, '')
          if (!jsonStr || jsonStr === '[DONE]') continue

          try {
            const event: StreamDeltaEvent = JSON.parse(jsonStr)

            // 依 event.type 更新畫面
            if (event.type === 'thinking_delta' && event.content) {
              setMessages((prev) => {
                const next = [...prev]
                const last = next[next.length - 1]
                if (last && last.role === 'assistant') {
                  const updatedContent = last.content.map((c) => ({ ...c }))
                  let thinkingBlock = updatedContent.find((c) => c.type === 'thinking')
                  if (!thinkingBlock) {
                    thinkingBlock = { type: 'thinking', text: '' }
                    updatedContent.unshift(thinkingBlock)
                  }
                  thinkingBlock.text += event.content
                  next[next.length - 1] = { ...last, content: updatedContent }
                }
                return next
              })
            } else if (event.type === 'delta' && event.content) {
              setMessages((prev) => {
                const next = [...prev]
                const last = next[next.length - 1]
                if (last && last.role === 'assistant') {
                  const updatedContent = last.content.map((c) => ({ ...c }))
                  let textBlock = updatedContent.find((c) => c.type === 'text')
                  if (!textBlock) {
                    textBlock = { type: 'text', text: '' }
                    updatedContent.push(textBlock)
                  }
                  textBlock.text += event.content
                  next[next.length - 1] = { ...last, content: updatedContent }
                }
                return next
              })
            } else if (event.type === 'ack') {
              console.log('SSE Ack Received:', event.conversation_id)
            } else if (event.type === 'done') {
              console.log('SSE Stream Done:', event.usage)
            }
          } catch (parseErr) {
            console.warn('解析 SSE 訊息失敗:', jsonStr, parseErr)
          }
        }
      }

      // 若串流結束時 buffer 還有未結尾的 data: 內容
      if (buffer.trim().startsWith('data:')) {
        const jsonStr = buffer.trim().replace(/^data:\s*/, '')
        if (jsonStr && jsonStr !== '[DONE]') {
          try {
            const event: StreamDeltaEvent = JSON.parse(jsonStr)
            if (event.type === 'delta' && event.content) {
              setMessages((prev) => {
                const next = [...prev]
                const last = next[next.length - 1]
                if (last && last.role === 'assistant') {
                  const updatedContent = last.content.map((c) => ({ ...c }))
                  let textBlock = updatedContent.find((c) => c.type === 'text')
                  if (!textBlock) {
                    textBlock = { type: 'text', text: '' }
                    updatedContent.push(textBlock)
                  }
                  textBlock.text += event.content
                  next[next.length - 1] = { ...last, content: updatedContent }
                }
                return next
              })
            }
          } catch {
            // ignore
          }
        }
      }
    } catch (err) {
      console.error('發送失敗:', err)
      // 若串流傳輸到一半被中斷 (例如 ERR_INCOMPLETE_CHUNKED_ENCODING)，保留已接收的內容並在末尾提示
      setMessages((prev) => {
        const next = [...prev]
        const last = next[next.length - 1]
        if (last && last.role === 'assistant') {
          const updatedContent = last.content.map((c) => ({ ...c }))
          let textBlock = updatedContent.find((c) => c.type === 'text')
          if (!textBlock) {
            textBlock = { type: 'text', text: '' }
            updatedContent.push(textBlock)
          }
          textBlock.text +=
            (textBlock.text ? '\n\n' : '') +
            '⚠️ [串流中斷: 伺服器端提前關閉連線 (net::ERR_INCOMPLETE_CHUNKED_ENCODING)]'
          next[next.length - 1] = { ...last, content: updatedContent }
        }
        return next
      })
    } finally {
      setIsStreaming(false)
    }
  }

  return (
    <section>
      <header className="page-header">
        <p className="eyebrow">CHAT WORKSPACE</p>
        <h1>對話工作台</h1>
        <p>選擇模型與 Agent，透過 Java Gateway 的 SSE 端點取得串流回覆。</p>
      </header>
      <div className="chat-workspace">
        <aside className="chat-panel">
          <strong>工作階段</strong>
          {/* 啟用「建立新對話」按鈕 */}
          <button
            type="button"
            className="secondary-button"
            onClick={handleNewChat}
            disabled={isStreaming}
            style={{ cursor: isStreaming ? 'not-allowed' : 'pointer' }}
          >
            ＋ 建立新對話
          </button>
          {sessions.length === 0 && <p className="text-muted-foreground text-sm">尚無對話紀錄</p>}
          <div className="flex flex-col gap-1 mt-2">
            {sessions.map((session) => {
              const isActive = currentSessionId === session.conversationId
              return (
                <div
                  key={session.conversationId}
                  onClick={() => handleSelectSession(session)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    backgroundColor: isActive ? 'var(--portal-accent-bg, #81abf0ff)' : 'transparent',
                    border: isActive ? '1px solid #0d9488' : '1px solid transparent',
                    transition: 'background-color 0.2s',
                  }}
                  className="hover:bg-slate-800/60"
                >
                  {/* 主標題：對話標題 */}
                  <p style={{ margin: 0, fontWeight: isActive ? 600 : 400, fontSize: '0.9rem' }}>
                    {session.title || '新對話'}
                  </p>
                  {/* 副資訊：模型名稱 */}
                  <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                    {session.selectModel}
                  </span>
                </div>
              )
            })}
          </div>
        </aside>

        <article className="chat-main">
          <div className="chat-config">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>模型：</span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={isStreaming}
                style={{
                  background: 'var(--portal-input-bg, #0f172a)',
                  color: 'inherit',
                  border: '1px solid var(--portal-input-border, #334155)',
                  borderRadius: '6px',
                  padding: '2px 8px',
                  fontSize: '0.82rem',
                  cursor: isStreaming ? 'not-allowed' : 'pointer',
                }}
              >
                {runningModels.length === 0 ? (
                  <option value={selectedModel}>{selectedModel}</option>
                ) : (
                  runningModels.map((modelName) => (
                    <option key={modelName} value={modelName}>
                      {modelName}
                    </option>
                  ))
                )}
              </select>
            </label>
            <span>Agent：尚未選擇</span>
          </div>
          {messages.length === 0 ? (
            <div className="empty-state">
              <strong>開始一段對話</strong>
              <p>串接模型清單與對話 SSE API 後，即可在此輸入提示。</p>
            </div>
          ) : (
            <div
              className="chat-messages-container"
              style={{
                padding: '20px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                minHeight: '300px',
              }}
            >
              {messages.map((msg, idx) => {
                const isUser = msg.role === 'user'
                const thinkingContent = msg.content?.find((c) => c.type === 'thinking')?.text || ''
                const textContent = msg.content?.find((c) => c.type === 'text')?.text || ''
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isUser ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--muted-foreground)',
                        marginBottom: '4px',
                        paddingLeft: '4px',
                        paddingRight: '4px',
                      }}
                    >
                      {isUser ? username || 'You' : 'Assistant'}
                    </div>
                    <div
                      style={{
                        maxWidth: '80%',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        background: isUser ? 'var(--primary, #3b82f6)' : 'var(--portal-card-bg, #1e293b)',
                        color: isUser ? '#fff' : 'inherit',
                        border: isUser ? 'none' : '1px solid var(--portal-card-border, #334155)',
                        wordBreak: 'break-word',
                        lineHeight: 1.6,
                      }}
                    >
                      {/* 思考過程區塊 (如果存在 thinking 內容) */}
                      {thinkingContent && (
                        <details
                          open={!textContent}
                          style={{
                            marginBottom: textContent ? '10px' : '0',
                            padding: '8px 12px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '6px',
                            borderLeft: '3px solid #8b5cf6',
                            fontSize: '0.85rem',
                          }}
                        >
                          <summary style={{ cursor: 'pointer', color: '#c084fc', fontWeight: 500 }}>
                            💭 思考過程 {isStreaming && !textContent ? '（思考中…）' : ''}
                          </summary>
                          <div style={{ marginTop: '6px', whiteSpace: 'pre-wrap', color: 'var(--muted-foreground)' }}>
                            {thinkingContent}
                          </div>
                        </details>
                      )}

                      {/* 正式文字內容 */}
                      {textContent ? (
                        <div style={{ whiteSpace: 'pre-wrap' }}>{textContent}</div>
                      ) : (
                        !thinkingContent && (
                          <div style={{ color: 'var(--muted-foreground)' }}>
                            {isStreaming && !isUser ? '思考中…' : '（無回覆內容）'}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <form className="chat-composer" onSubmit={handleSubmit}>
            <input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isStreaming ? '正在接收回覆中…' : '請輸入訊息…'}
              disabled={isStreaming}
            />
            <button
              type="submit"
              className="primary-button"
              disabled={isStreaming || !inputText.trim()}
            >
              {isStreaming ? '生成中…' : '送出'}
            </button>
          </form>
        </article>
      </div>
    </section>
  )
}

