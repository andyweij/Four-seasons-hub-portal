import React from 'react'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import type { ModelRecord } from '@/types/models.types'

export type HealthLevel = 'ready' | 'missing_weights' | 'not_installed' | 'downloading' | 'error'

interface StatusConfig {
    label: string         // 主文字
    subText?: string      // 副文字
    dotColor: string      // 圓點背景色
    pingColor?: string    // 呼吸光暈色（可選）
    animate?: boolean     // 是否有呼吸動畫
}

/**
 * 根據後端回傳的狀態解析出單一健康等級與文案
 */
function resolveModelStatus(model: ModelRecord): StatusConfig {
    const downloadStatus = model.downloadStatus?.toLowerCase()
    const status = model.status?.toLowerCase()

    // 1. 就緒 / 完整且已安裝
    if (downloadStatus === 'complete' && status === 'ready') {
        return {
            label: 'Ready',
            subText: '就緒 · 完整且已安裝',
            dotColor: 'bg-emerald-500 dark:bg-emerald-400',
            pingColor: 'bg-emerald-400',
            animate: false, // 若想強調正在運行也可以設為 true
        }
    }

    // 2. 下載中 / 部署處理中
    if (downloadStatus === 'downloading' || status === 'loading') {
        return {
            label: 'Downloading',
            subText: '權重同步中...',
            dotColor: 'bg-amber-500',
            pingColor: 'bg-amber-400',
            animate: true,
        }
    }

    // 3. 缺少權重 / 下載不完全
    if (downloadStatus === 'missing_weights' || (downloadStatus !== 'complete' && status === 'ready')) {
        return {
            label: 'Missing Weights',
            subText: '缺少權重檔案',
            dotColor: 'bg-rose-500 dark:bg-rose-400',
            animate: false,
        }
    }

    // 4. 未安裝
    if (downloadStatus === 'not_downloaded') {
        return {
            label: 'Not Installed',
            subText: '缺少檔案 · 未安裝',
            dotColor: 'bg-zinc-400 dark:bg-zinc-500',
            animate: false,
        }
    }

    // 預設或異常狀態
    return {
        label: status ?? 'Unknown',
        subText: `下載: ${downloadStatus ?? '無'}`,
        dotColor: 'bg-zinc-500',
        animate: false,
    }
}

interface ModelStatusIndicatorProps {
    model: ModelRecord
}

export function ModelStatusIndicator({ model }: ModelStatusIndicatorProps) {
    const config = resolveModelStatus(model)

    return (
        <TooltipProvider delay={200}>
            <Tooltip>
                <TooltipTrigger className="flex items-center gap-2.5 text-left focus:outline-none">
                    {/* 狀態指示燈圓點 */}
                    <span className="relative flex h-2.5 w-2.5 shrink-0 items-center justify-center">
                        {config.animate && config.pingColor && (
                            <span
                                className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${config.pingColor}`}
                            />
                        )}
                        <span
                            className={`relative inline-flex h-2 w-2 rounded-full ${config.dotColor} shadow-xs`}
                        />
                    </span>

                    {/* 雙層文字排版：主狀態 + 副標題 */}
                    <div className="flex flex-col">
                        <span className="text-sm font-medium leading-tight text-foreground">
                            {config.label}
                        </span>
                        {config.subText && (
                            <span className="text-xs text-muted-foreground mt-0.5">
                                {config.subText}
                            </span>
                        )}
                    </div>
                </TooltipTrigger>

                {/* 懸停 Tooltip：展示詳細底層原始狀態 */}
                <TooltipContent side="top" className="flex flex-col items-start w-auto bg-card text-card-foreground border border-sky-500/40 dark:border-sky-400/30 
                shadow-md [&>*:last-child]:bg-card [&>*:last-child]:border-b [&>*:last-child]:border-r [&>*:last-child]:border-sky-500/40 dark:[&>*:last-child]:border-sky-400/30">
                    <p className="font-semibold text-foreground">詳細資訊</p>
                    <p className="text-muted-foreground">服務狀態: <code className="text-primary">{model.status ?? 'unknown'}</code></p>
                    <p className="text-muted-foreground">檔案下載: <code className="text-primary">{model.downloadStatus ?? 'unknown'}</code></p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}