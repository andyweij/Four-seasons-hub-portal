import {  useEffect,useState } from 'react'


export function ChatPage() {


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
          <div className="chat-composer"><input disabled placeholder="請輸入訊息…" /><button type="button" className="primary-button" disabled>送出</button></div>
        </article>
      </div>
    </section>
  )
}
