import { useEffect, useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cloudConnectionsApi } from '@/core/api'
import type { CloudProvider, CreateCloudConnectionRequest, CloudConnectionSummary } from '@/types'

interface CloudConnectionSheetProps {
  open: boolean
  connection?: CloudConnectionSummary | null
  onOpenChange: (open: boolean) => void
  onCreated: () => Promise<void> | void
}

const initialForm: CreateCloudConnectionRequest = {
  name: '',
  provider: 'gemini',
  modelName: '',
  apiKey: '',
  baseUrl: '',
}

export function CloudConnectionSheet({
  open,
  connection,
  onOpenChange,
  onCreated,
}: CloudConnectionSheetProps) {
  const [form, setForm] = useState<CreateCloudConnectionRequest>(initialForm)
  const [fetching, setFetching] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let live = true
    setError(null)
    setForm(connection ? {
      name: connection.name, provider: connection.provider, modelName: connection.modelName,
      apiKey: '', baseUrl: '',
    } : initialForm)
    setFetching(!!connection)
    if (connection) cloudConnectionsApi.get(connection.id).then(detail => {
      if (live) setForm(current => ({ ...current, baseUrl: detail.baseUrl || '' }))
    }).catch(cause => {
      if (live) setError(cause instanceof Error ? cause.message : '載入連線設定失敗')
    }).finally(() => { if (live) setFetching(false) })
    return () => { live = false }
  }, [open, connection])

  const updateField = <K extends keyof CreateCloudConnectionRequest>(
    field: K,
    value: CreateCloudConnectionRequest[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleProviderChange = (provider: CloudProvider) => {
    setForm((current) => ({
      ...current,
      provider,
      baseUrl: provider === 'gemini' ? '' : current.baseUrl,
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const name = form.name.trim()
    const modelName = form.modelName.trim()
    const apiKey = form.apiKey.trim()
    const baseUrl = form.baseUrl?.trim()

    if (!name || !modelName || (!connection && !apiKey)) {
      setError(connection ? '請填寫顯示名稱與模型名稱。' : '請完整填寫顯示名稱、模型名稱與 API Key。')
      return
    }

    if (form.provider === 'openai_compatible' && !baseUrl) {
      setError('OpenAI-compatible Provider 必須填寫 Endpoint。')
      return
    }

    setSubmitting(true)
    try {
      if (connection) {
        await cloudConnectionsApi.update(connection.id, {
          name, modelName, ...(apiKey ? { apiKey } : {}),
          ...(form.provider === 'openai_compatible' ? { baseUrl } : {}),
        })
      } else {
        await cloudConnectionsApi.create({
          name, provider: form.provider, modelName, apiKey,
          ...(form.provider === 'openai_compatible' && baseUrl ? { baseUrl } : {}),
        })
      }
      await onCreated()
      onOpenChange(false)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '建立雲端模型失敗')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle className="text-lg">{connection ? '編輯雲端模型' : '新增雲端模型'}</SheetTitle>
          <SheetDescription>
            {connection ? '修改模型名稱或更新 API Key；金鑰留空會保留原設定。' : '建立 Gemini 或 OpenAI-compatible 連線。API Key 儲存後不會再次顯示。'}
          </SheetDescription>
        </SheetHeader>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <fieldset disabled={fetching || submitting} className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-foreground">Provider</legend>
              <div className="grid grid-cols-2 gap-2">
                {([
                  ['gemini', 'Gemini'],
                  ['openai_compatible', 'OpenAI-compatible'],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    disabled={!!connection}
                    aria-pressed={form.provider === value}
                    className={form.provider === value
                      ? 'rounded-lg border border-primary bg-primary/10 px-3 py-2.5 text-sm font-medium text-primary'
                      : 'rounded-lg border bg-background px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted'}
                    onClick={() => handleProviderChange(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">顯示名稱</span>
              <Input
                value={form.name}
                maxLength={100}
                placeholder="例如：Gemini 3.1 Flash Lite"
                onChange={(event) => updateField('name', event.target.value)}
              />
            </label>

            {form.provider === 'gemini' && <p className="text-xs text-muted-foreground">Gemini 使用官方預設 Endpoint，不需要另外填寫。</p>}
            {form.provider === 'openai_compatible' && (
              <label className="block space-y-2">
                <span className="text-sm font-medium text-foreground">Endpoint</span>
                <Input
                  type="url"
                  value={form.baseUrl ?? ''}
                  placeholder="https://openrouter.ai/api/v1"
                  onChange={(event) => updateField('baseUrl', event.target.value)}
                />
                <span className="block text-xs leading-5 text-muted-foreground">
                  請填寫 API 根路徑；送出後完整 Endpoint 不會顯示在一般模型清單。
                </span>
              </label>
            )}

            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">模型名稱</span>
              <Input
                value={form.modelName}
                maxLength={200}
                placeholder={form.provider === 'gemini'
                  ? 'gemini-3.1-flash-lite'
                  : 'openai/gpt-5'}
                onChange={(event) => updateField('modelName', event.target.value)}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">API Key</span>
              <Input
                type="password"
                value={form.apiKey}
                autoComplete="new-password"
                placeholder={connection ? '留空保留原金鑰；輸入以更新' : '輸入供應商 API Key'}
                onChange={(event) => updateField('apiKey', event.target.value)}
              />
              <span className="block text-xs leading-5 text-muted-foreground">
                API Key 只會在送出時傳送給後端，不會保存在瀏覽器中。
              </span>
            </label>

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
                {error}
              </div>
            )}
          </fieldset>

          <SheetFooter className="flex-row justify-end border-t px-6 py-4">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit" disabled={submitting || fetching}>
              {submitting && <Loader2 className="animate-spin" />}
              {fetching ? '載入中' : submitting ? '儲存中' : connection ? '儲存修改' : '建立連線'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
