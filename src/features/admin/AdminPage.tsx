const settings = [['使用者與角色', '同步 Keycloak 使用者、角色與權限。'], ['配額設定', '管理團隊、模型與 API 的用量上限。'], ['平台設定', '設定 Gateway、模型服務與系統預設值。']]

export function AdminPage() {
  return (
    <section>
      <header className="page-header"><p className="eyebrow">SYSTEM ADMINISTRATION</p><h1>系統管理</h1><p>管理使用者、角色、配額與平台設定。</p></header>
      <div className="settings-grid">{settings.map(([title, description]) => <article className="setting-card" key={title}><h2>{title}</h2><p>{description}</p><button type="button" className="secondary-button" disabled>設定</button></article>)}</div>
    </section>
  )
}
