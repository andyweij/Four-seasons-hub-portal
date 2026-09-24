import { useState } from 'react'
import { Cloud, FlaskConical, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cloudConnectionsApi } from '@/core/api'
import type {
  CloudConnectionStatus,
  CloudConnectionSummary,
  CloudProvider,
} from '@/types'
import { ModelCapabilities } from './ModelCapabilities'

interface CloudModelsTableProps {
  data: CloudConnectionSummary[]
  onRefresh: () => Promise<void> | void
}

const providerLabels: Record<CloudProvider, string> = {
  gemini: 'Gemini',
  openai_compatible: 'OpenAI-compatible',
}

const statusLabels: Record<CloudConnectionStatus, string> = {
  untested: '尚未測試',
  available: '可使用',
  authentication_failed: '驗證失敗',
  model_not_found: '找不到模型',
  rate_limited: '已達速率限制',
  unreachable: '無法連線',
  disabled: '已停用',
}

function statusClassName(status: CloudConnectionStatus) {
  if (status === 'available') return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
  if (status === 'untested') return 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
  if (status === 'disabled') return 'bg-muted text-muted-foreground'
  return 'bg-destructive/10 text-destructive'
}

function formatLastTested(connection: CloudConnectionSummary) {
  if (!connection.lastTestedAt) return '尚未測試'

  const date = new Date(connection.lastTestedAt)
  const formatted = Number.isNaN(date.getTime())
    ? connection.lastTestedAt
    : new Intl.DateTimeFormat('zh-TW', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)

  return connection.lastLatencyMs
    ? `${formatted} · ${connection.lastLatencyMs} ms`
    : formatted
}

function capabilityLabels(connection: CloudConnectionSummary) {
  const labels: string[] = []
  if (connection.capabilities.streaming) labels.push('聊天')
  if (connection.capabilities.vision) labels.push('圖片')
  if (connection.capabilities.toolCalling) labels.push('Agent')
  if (connection.capabilities.reasoning) labels.push('推理')
  return labels
}

export function CloudModelsTable({ data, onRefresh }: CloudModelsTableProps) {
  const [testingId, setTestingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const handleTest = async (id: string) => {
    setTestingId(id)
    setActionError(null)
    try {
      await cloudConnectionsApi.test(id)
      await onRefresh()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : '連線測試失敗')
    } finally {
      setTestingId(null)
    }
  }

  if (data.length === 0) {
    return (
      <div className="grid min-h-56 place-content-center rounded-xl border border-dashed bg-card/40 p-8 text-center">
        <Cloud className="mx-auto mb-4 size-9 text-muted-foreground" />
        <strong className="text-base font-medium text-foreground">尚未建立雲端模型</strong>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          使用右上角的「新增雲端模型」，建立 Gemini 或 OpenAI-compatible 連線。
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {actionError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
          {actionError}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead>顯示名稱</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead>能力</TableHead>
                <TableHead>上次測試</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((connection) => {
                const capabilities = capabilityLabels(connection)
                const isTesting = testingId === connection.id

                return (
                  <TableRow key={connection.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-foreground">{connection.name}</span>
                        <span className="text-xs text-muted-foreground">{connection.modelName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{providerLabels[connection.provider]}</TableCell>
                    <TableCell>
                      <Badge className={statusClassName(connection.status)} variant="secondary">
                        {statusLabels[connection.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {capabilities.length > 0 ? (
                        <ModelCapabilities capabilities={capabilities} />
                      ) : (
                        <span className="text-sm text-muted-foreground">待測試</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatLastTested(connection)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isTesting}
                        onClick={() => void handleTest(connection.id)}
                      >
                        {isTesting ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <FlaskConical />
                        )}
                        {isTesting ? '測試中' : '測試'}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        API Key 與完整 Endpoint 不會顯示在模型清單中。
      </p>
    </div>
  )
}
