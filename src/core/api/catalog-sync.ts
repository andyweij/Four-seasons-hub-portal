export const CATALOG_CHANGED = 'hub-catalog-changed'
export const CATALOG_REVISION = 'hub-catalog-revision'
/** Non-secret notification for catalog changes across pages and tabs. */
export function notifyCatalogChanged() {
  window.dispatchEvent(new Event(CATALOG_CHANGED))
  try { localStorage.setItem(CATALOG_REVISION, String(Date.now()) + Math.random()) } catch { /* Storage may be disabled. */ }
}
