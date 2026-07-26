const metrics = [['請求總量', '—', '等待 Gateway 資料'], ['P95 延遲', '—', '等待 Gateway 資料'], ['錯誤率', '—', '等待 Gateway 資料']]

export function ObservabilityPage() {
  return (
    <section>
      <header className="page-header"><p className="eyebrow">GATEWAY OBSERVABILITY</p><h1>Gateway 觀測</h1><p>查看請求量、延遲、錯誤與模型使用情況。</p></header>
      <div className="stat-grid stat-grid-three">{metrics.map(([label, value, detail]) => <article className="stat-card" key={label}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>)}</div>
      <article className="data-card"><div className="empty-state"><strong>尚無監測資料</strong><p>串接 Gateway metrics API 後，這裡將顯示趨勢圖、端點健康狀態與錯誤明細。</p></div></article>
    </section>
  )
}
