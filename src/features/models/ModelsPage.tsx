import { useEffect, useState } from 'react'
import { DataTable } from "../../components/ui/data-table"
import { Button } from "../../components/ui/button"
import { modelsApi, type ModelRecord } from "../../core/api"

export function ModelsPage() {
  // 正確初始化狀態為陣列型別
  const [models, setModels] = useState<ModelRecord[]>([])

  useEffect(() => {
    // 透過集中管理的 modelsApi 呼叫後端 API
    // 若後端 Gateway 尚未啟動或連線失敗，則 catch 降級使用 Mock 資料，確保開發測試無縫進行
    modelsApi.getModels()
      .then((data) => {
        console.log(data)
        setModels(data.models ?? [])
      })
      .catch((err) => {
        console.warn("無法連線至後端 API，改用 Mock 資料展示:", err.message)
        setModels([
          {
            modelName: "Llama-3-8B-Instruct",
            modelPath: "/models/llama3",
            url: "http://localhost:8000",
            description: "地端推論主模型 (vLLM 部署)",
            reasoning: false,
            reasoningEffort: false,
            imagesSupport: 0,
            maxModelLen: 8192,
            version: "v1.0.0",
            downloadStatus: "Healthy",
            updatedAt: "2026-07-12"
          }
        ])
      })
  }, [])

  return (
    // 使用與專案風格一致的原生容器，並加入 Tailwind 的 flex 縱向排版
    <div className="flex flex-col gap-6 w-full min-h-screen">

      {/* 頂部標頭區域：結合 Flexbox 讓按鈕與標題完美分開兩側 */}
      <header className="flex items-end justify-between border-b border-gray-800 pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-teal-400 mb-1">MODEL CATALOG</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground m-0">模型管理</h1>
          <p className="text-sm text-gray-400 mt-2 m-0">管理地端模型、版本、部署與健康狀態。</p>
        </div>

        {/* 主要操作按鈕 */}
        <Button
          variant="default"
          className="bg-teal-600 hover:bg-teal-500 text-white font-medium px-4 py-2 rounded-md shadow-sm"
          onClick={() => console.log("新增模型彈窗")}
        >
          ＋ 新增模型
        </Button>
      </header>

      {/* 資料表格主區塊：寬度完全填滿，不受限擠壓 */}
      <main className="w-full overflow-hidden mt-2">
        {models.length === 0 ? (
          <div className="w-full p-12 border rounded-xl border-dashed border-gray-700 text-center text-sm text-gray-400 bg-gray-900/30">
            完成 Gateway 串接後，已註冊模型會顯示於此。
          </div>
        ) : (
          <DataTable data={models} />
        )}
      </main>
    </div>
  )
}