import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
} from "@tanstack/react-table"
import { MoreHorizontal, Download, Trash2, Play, Square } from "lucide-react"
import { ModelStatusIndicator } from '@/features/models/components/ModelStatusIndicator'
import { ModelCapabilities } from '@/features/models/components/ModelCapabilities'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table"
// 引入您之前下載的 DropdownMenu 元件
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { modelsApi, type ModelRecord } from "../../core/api"
import { useState } from 'react'

interface DataTableProps {
  data: ModelRecord[]
  onRefresh?: () => void // 提供外層回調
}


// 在此定義您的顯示欄位，並加入最後一欄的動作操作
const columns: ColumnDef<ModelRecord>[] = [
  {
    accessorKey: "modelName",
    header: "模型名稱",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium text-foreground">{row.getValue("modelName")}</span>
        <span className="text-xs text-muted-foreground">{row.original.description}</span>
      </div>
    ),
  },
  {
    accessorKey: "maxModelLen",
    header: "Context 限制",
    cell: ({ row }) => {
      const maxModelLen = row.original.maxModelLen
      if (maxModelLen == -1)
        return <span>無限制</span>
      else
        return <span>{maxModelLen} tokens</span>
    },
  },
  {
    id: "capabilities",
    header: "能力",
    cell: ({ row }) => {
      const model = row.original
      const capabilities: string[] = []

      if (model.isChatModel) capabilities.push("聊天")
      if ((model.maxImages ?? model.imagesSupport ?? 0) > 0) capabilities.push("圖片")
      if (model.supportsReasoning ?? model.reasoning ?? false) capabilities.push("思考")
      if (model.supportsReasoningEffort ?? model.reasoningEffort ?? false) {
        capabilities.push("思考強度")
      }

      return <ModelCapabilities capabilities={capabilities} />
    },
  },
  // 在 columns 定義中修改「健康狀態」這一欄：
  {
    accessorKey: "downloadStatus",
    header: "健康狀態",
    cell: ({ row }) => <ModelStatusIndicator model={row.original} />,
  },
  {
    id: "actions",
    header: "操作",
    cell: ({ row, table }) => {
      const model = row.original // 取得當前這一列的完整物件資料
      const isDownloaded = model.downloadStatus === "complete"
      const isActived = model.status == "ready"
      const [loading, setLoading] = useState(false)
      // 觸發指令的 Mock 腳本函式
      const handleAction = async (actionType: string) => {
        try {
          setLoading(true)
          if (actionType === "start") {
            await modelsApi.createModel({ model_name: model.modelName })
          } else if (actionType === "stop") {
            await modelsApi.deleteModel(model.modelName)
          }
          // 呼叫父層傳進來的 refresh，重新拉取最新狀態觸發重新渲染
          (table.options.meta as any)?.onRefresh?.()
        } catch (err) {
          console.error(`模型操作 [${actionType}] 失敗:`, err)
        } finally {
          setLoading(false)
        }
      }

      return (
        <DropdownMenu>
          {/* 在 Base UI 中，Trigger 不需要 asChild，這樣寫完全正確 */}
          <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-40 bg-popover text-popover-foreground border">
            {/* 💡 修正：直接移除 DropdownMenuLabel 與 DropdownMenuSeparator */}
            {/* 這樣就能完全繞過 Base UI 的 MenuGroupContext 限制，直接顯示按鈕 */}

            {isDownloaded ? (
              <>
                {isActived ? (
                  <DropdownMenuItem onClick={() => handleAction("stop")} className="text-amber-400 ...">
                    <Square className="h-3.5 w-3.5" />
                    <span>停止</span>
                  </DropdownMenuItem>
                ) : (
                  <>
                    <DropdownMenuItem onClick={() => handleAction("start")} className="text-emerald-400 ...">
                      <Play className="h-3.5 w-3.5" />
                      <span>啟用</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAction("delete")} className="text-destructive ...">
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>刪除模型</span>
                    </DropdownMenuItem>
                  </>
                )}
              </>
            ) : (
              <>
                <DropdownMenuItem onClick={() => handleAction("download")} className="flex items-center gap-2 cursor-pointer focus:bg-muted">
                  <Download className="h-3.5 w-3.5" />
                  <span>下載</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction("delete")} className="flex items-center gap-2 cursor-pointer text-destructive focus:bg-destructive/10">
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>刪除</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export function DataTable({ data, onRefresh }: DataTableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    // 透過 meta 將函式傳遞給所有 cell 使用
    meta: {
      onRefresh,
    },
  })

  return (
    <div className="w-full">
      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  暫無模型資料
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
