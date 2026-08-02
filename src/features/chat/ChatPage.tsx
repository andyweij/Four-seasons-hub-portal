import { useEffect, useState } from 'react'
import { chatApi, type ChatSession, type ChatMessage, type CreateStreamRequest } from '@/core/api'
import { useAuth } from '../../core/auth/useAuth'

export function ChatPage() {
  const { username } = useAuth()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState<string>('') // 使用者輸入的文字

  useEffect(() => {
    if (!username) return
    chatApi.getSessions(username).then((res) => {
      console.log(res)
      setSessions(res)
    }).catch((err) => {
      console.warn("無法連線至後端 API，改用 Mock 資料展示:", err.message)
      setSessions([
        {
          conversationId: "8a993aa1-a6cb-4f77-a9e2-d7aaff77f912",
          selectModel: "DeepSeek-R1-Distill-Qwen-1.5B",
          lastModifyDttm: "2022-01-01T00:00:00Z",
          title: "DeepSeek-R1-Distill-Qwen-1.5B"
        }
      ])
    })
  }, [username])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || !username) return


    // 1. 組裝使用者發送的最新訊息
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: inputText,
      timestamp: new Date().toISOString(),
    }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInputText('')
    // 2. 組裝後端所需的 Request Body (CreateStreamRequest)
    const payload: CreateStreamRequest = {
      userId: username,
      model: 'DeepSeek-R1-Distill-Qwen-1.5B', // 填入當前選擇的模型
      messages: updatedMessages,
      temperature: 0.5,
      top_p: 1.0,
      top_k: 50,
      frequency_penalty: 1.0,
      stream: true,
      reasoning_effort: 'medium',
    }
    try {
      // 3. 呼叫 createStream API
      const res = await chatApi.createStream(payload)
      console.log('Stream Response:', res)
    } catch (err) {
      console.error('發送失敗:', err)
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
          <button type="button" className="secondary-button" disabled>＋ 建立新對話</button>
          <p>尚無對話紀錄</p>
        </aside>
        <article className="chat-main">
          <div className="chat-config"><span>模型：尚未選擇</span><span>Agent：尚未選擇</span></div>
          <div className="empty-state"><strong>開始一段對話</strong><p>串接模型清單與對話 SSE API 後，即可在此輸入提示。</p></div>
          <div className="chat-composer"><input value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="請輸入訊息…" /><button type="button" className="primary-button" onClick={handleSubmit}>送出</button></div>
        </article>
      </div>
    </section>
  )
}
