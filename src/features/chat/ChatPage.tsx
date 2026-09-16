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

  useEffect(() => {
    if (!username) return
    chatApi
      .getSessions(username)
      .then((res) => {
        console.log(res)
        setSessions(res)
      })
      .catch((err) => {
        console.warn('無法連線至後端 API，改用 Mock 資料展示:', err.message)
        setSessions([
          {
            conversationId: '8a993aa1-a6cb-4f77-a9e2-d7aaff77f912',
            selectModel: 'DeepSeek-R1-Distill-Qwen-1.5B',
            lastModifyDttm: '2022-01-01T00:00:00Z',
            title: 'DeepSeek-R1-Distill-Qwen-1.5B',
          },
        ])
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
      model: 'Qwen3-4B-Thinking-2507',
      messages: updatedMessages,
      stream: true,
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
          <button type="button" className="secondary-button" disabled>
            ＋ 建立新對話
          </button>
          <p>尚無對話紀錄</p>
        </aside>
        <article className="chat-main">
          <div className="chat-config">
            <span>模型：Qwen3-4B-Thinking-2507</span>
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

