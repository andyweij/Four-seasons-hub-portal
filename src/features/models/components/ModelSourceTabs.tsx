import { Cloud, Server } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ModelSource = 'local' | 'cloud'

interface ModelSourceTabsProps {
  value: ModelSource
  localCount: number
  cloudCount: number
  onChange: (value: ModelSource) => void
}

const tabs: Array<{
  value: ModelSource
  label: string
  icon: typeof Server
}> = [
  { value: 'local', label: '地端模型', icon: Server },
  { value: 'cloud', label: '雲端模型', icon: Cloud },
]

export function ModelSourceTabs({
  value,
  localCount,
  cloudCount,
  onChange,
}: ModelSourceTabsProps) {
  const counts: Record<ModelSource, number> = {
    local: localCount,
    cloud: cloudCount,
  }

  return (
    <div
      className="inline-flex w-fit items-center gap-1 rounded-lg border bg-muted/50 p-1"
      role="tablist"
      aria-label="模型來源"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon
        const selected = value === tab.value

        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={selected}
            className={cn(
              'inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors',
              selected
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-background/60 hover:text-foreground',
            )}
            onClick={() => onChange(tab.value)}
          >
            <Icon className="size-4" />
            {tab.label}
            <span
              className={cn(
                'inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-xs',
                selected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
              )}
            >
              {counts[tab.value]}
            </span>
          </button>
        )
      })}
    </div>
  )
}
