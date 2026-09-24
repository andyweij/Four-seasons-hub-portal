import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CloudCog, Loader2, RefreshCw } from 'lucide-react'
import { DataTable } from "../../components/ui/data-table"
import { Button } from "../../components/ui/button"
import {
  cloudConnectionsApi,
  modelsApi,
  type CloudConnectionSummary,
  type ModelRecord,
} from "../../core/api"
import { CloudConnectionSheet } from './components/CloudConnectionSheet'
import { CloudModelsTable } from './components/CloudModelsTable'
import {
  ModelSourceTabs,
  type ModelSource,
} from './components/ModelSourceTabs'

export function ModelsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const source: ModelSource = searchParams.get('source') === 'cloud' ? 'cloud' : 'local'
  const [localModels, setLocalModels] = useState<ModelRecord[]>([])
  const [cloudConnections, setCloudConnections] = useState<CloudConnectionSummary[]>([])
  const [localLoading, setLocalLoading] = useState(true)
  const [cloudLoading, setCloudLoading] = useState(false)
  const [cloudLoaded, setCloudLoaded] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [cloudError, setCloudError] = useState<string | null>(null)
  const [createSheetOpen, setCreateSheetOpen] = useState(false)

  const fetchLocalModels = useCallback(async () => {
    setLocalLoading(true)
    setLocalError(null)
    try {
      const data = await modelsApi.getModels()
      setLocalModels(data.models ?? [])
    } catch (error) {
      console.warn('獲取地端模型失敗:', error)
      setLocalError(error instanceof Error ? error.message : '無法取得地端模型')
    } finally {
      setLocalLoading(false)
    }
  }, [])

  const fetchCloudConnections = useCallback(async () => {
    setCloudLoading(true)
    setCloudError(null)
    try {
      // const data = await cloudConnectionsApi.list()
      const mockCloudConnections: CloudConnectionSummary[] = [
        {
          id: "conn_01j8f4k9a1b2c3d4e5f6g7h8",
          name: "Production OpenAI Gateway",
          provider: "openai_compatible", // 必須是 'gemini' 或 'openai_compatible'
          modelName: "gpt-4o",
          enabled: true,
          status: "available", // 必須是 'available' | 'untested' | ...
          credentialConfigured: true,
          apiKeyHint: "sk-...9x2A",
          capabilities: {
            streaming: true,
            toolCalling: true,
            vision: true,
            reasoning: false,
          },
          lastTestedAt: "2026-09-23T09:30:00.000Z",
          lastLatencyMs: 245,
        },
      ];
      // console.log(data)
      setCloudConnections(mockCloudConnections);
    } catch (error) {
      console.warn('獲取雲端模型失敗:', error)
      setCloudError(error instanceof Error ? error.message : '無法取得雲端模型')
    } finally {
      setCloudLoaded(true)
      setCloudLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchLocalModels()
  }, [fetchLocalModels])

  useEffect(() => {
    if (source === 'cloud' && !cloudLoaded && !cloudLoading) {
      void fetchCloudConnections()
    }
  }, [cloudLoaded, cloudLoading, fetchCloudConnections, source])

  const handleSourceChange = (nextSource: ModelSource) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('source', nextSource)
    setSearchParams(nextParams, { replace: true })
  }

  const handleCreated = async () => {
    handleSourceChange('cloud')
    await fetchCloudConnections()
  }

  return (
    <div className="flex flex-col gap-6 w-full min-h-screen">
      <header className="flex flex-col items-start justify-between gap-5 border-b border-border pb-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-primary">MODEL CATALOG</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground m-0">模型管理</h1>
          <p className="mt-2 m-0 text-sm text-muted-foreground">
            管理地端部署，以及可供使用者選擇的雲端模型連線。
          </p>
        </div>

        <Button
          variant="default"
          size="lg"
          className="w-full sm:w-auto"
          onClick={() => setCreateSheetOpen(true)}
        >
          <CloudCog />
          新增雲端模型
        </Button>
      </header>

      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <ModelSourceTabs
          value={source}
          localCount={localModels.length}
          cloudCount={cloudConnections.length}
          onChange={handleSourceChange}
        />
        <p className="m-0 text-sm text-muted-foreground">
          {source === 'local'
            ? '顯示已註冊於此平台的地端模型'
            : '僅顯示由管理員建立的雲端連線'}
        </p>
      </div>

      <main className="w-full min-w-0">
        {source === 'local' && (
          localLoading ? (
            <LoadingState label="正在載入地端模型" />
          ) : localError ? (
            <ErrorState message={localError} onRetry={() => void fetchLocalModels()} />
          ) : localModels.length === 0 ? (
            <div className="w-full rounded-xl border border-dashed bg-card/40 p-12 text-center text-sm text-muted-foreground">
              完成 Gateway 串接後，已註冊的地端模型會顯示於此。
            </div>
          ) : (
            <DataTable data={localModels} onRefresh={() => void fetchLocalModels()} />
          )
        )}

        {source === 'cloud' && (
          cloudLoading && !cloudLoaded ? (
            <LoadingState label="正在載入雲端模型" />
          ) : cloudError ? (
            <ErrorState message={cloudError} onRetry={() => void fetchCloudConnections()} />
          ) : (
            <CloudModelsTable
              data={cloudConnections}
              onRefresh={fetchCloudConnections}
            />
          )
        )}
      </main>

      <CloudConnectionSheet
        open={createSheetOpen}
        onOpenChange={setCreateSheetOpen}
        onCreated={handleCreated}
      />
    </div>
  )
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="grid min-h-48 place-content-center rounded-xl border bg-card/40 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <Loader2 className="size-4 animate-spin" />
        {label}
      </div>
    </div>
  )
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <div className="grid min-h-48 place-content-center rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
      <strong className="text-sm font-medium text-destructive">無法載入模型清單</strong>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{message}</p>
      <Button className="mx-auto mt-4" type="button" variant="outline" onClick={onRetry}>
        <RefreshCw />
        重新載入
      </Button>
    </div>
  )
}
