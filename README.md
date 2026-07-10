# Four Seasons Hub Portal

以 React、Vite 與 React Router v6 建立的企業地端 LLM 平台前端骨架。

## 啟動

```bash
npm install
npm run dev
```

## 目錄分層

- `src/core`：跨功能的 layout、認證、API client 與設定。
- `src/features`：依平台領域切分的功能模組；目前已有 dashboard，其他路由已預留。
- `src/shared`：可被多個功能使用的元件、型別、工具函式。
- `src/styles`：全域樣式與設計 token。

## 後續建議

1. 在 `src/core/auth` 整合 Keycloak OIDC + PKCE。
2. 由 Java Gateway 的 OpenAPI 規格產生 client，放入 `src/core/api`。
3. 各 feature 再依需求新增 `components`、`api`、`hooks`、`types` 與 `pages`。
4. 對話串流應只呼叫 Java Gateway 的 SSE 端點，而不是從瀏覽器直連 Python LLM 服務。
