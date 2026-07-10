type FeaturePageProps = { title: string; description: string }

export function FeaturePage({ title, description }: FeaturePageProps) {
  return (
    <section>
      <header className="page-header">
        <p className="eyebrow">COMING SOON</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
      <article className="placeholder-card">
        <h2>功能骨架已就緒</h2>
        <p>後續可在 <code>src/features</code> 對應模組中新增 API hooks、畫面元件與權限規則。</p>
      </article>
    </section>
  )
}
