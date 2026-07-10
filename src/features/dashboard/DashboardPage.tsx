const cards = [
  ['模型', '0', '已註冊模型'],
  ['Agents', '0', '已發布 Agent'],
  ['知識庫', '0', '可用知識庫'],
  ['今日請求', '—', '等待 Gateway 資料'],
]

export function DashboardPage() {
  return (
    <section>
      <header className="page-header">
        <p className="eyebrow">PLATFORM OVERVIEW</p>
        <h1>LLM 平台總覽</h1>
        <p>集中管理模型、Agent、知識庫與 Gateway 使用情況。</p>
      </header>
      <div className="stat-grid">
        {cards.map(([label, value, detail]) => (
          <article className="stat-card" key={label}>
            <span>{label}</span><strong>{value}</strong><small>{detail}</small>
          </article>
        ))}
      </div>
      <article className="welcome-card">
        <h2>下一步</h2>
        <p>先建立 Java Gateway 的 OpenAPI 規格；前端將依此產生型別安全的 API Client。接著串接 Keycloak，最後實作對話串流與平台管理功能。</p>
      </article>
    </section>
  )
}
