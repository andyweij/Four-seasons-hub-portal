import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
} from "@tanstack/react-table"
import { MoreHorizontal, Download, Trash2, Play, Square, Settings } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table"
import { Badge } from "./badge"
import { Button } from "./button"
// 引入您之前下載的 DropdownMenu 元件
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ModelRecord {
  modelName: string
  modelPath: string
  url: string
  description: string
  reasoning: boolean
  reasoningEffort: boolean
  imagesSupport: number
  maxTokens: number
  version?: string
  status?: string
  updatedAt?: string
}

interface DataTableProps {
  data: ModelRecord[]
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
    accessorKey: "modelPath",
    header: "部署路徑 / 標識",
    cell: ({ row }) => <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-teal-400">{row.getValue("modelPath")}</code>,
  },
  {
    accessorKey: "maxTokens",
    header: "Context 限制",
    cell: ({ row }) => <span>{row.getValue("maxTokens")} tokens</span>,
  },
  {
    accessorKey: "version",
    header: "版本",
  },
  {
    accessorKey: "status",
    header: "健康狀態",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      let variant: "default" | "secondary" | "destructive" | "outline" = "default"

      if (status === "Healthy") variant = "default"
      else if (status === "downloaded") variant = "secondary"
      else variant = "destructive"

      return (
        <Badge variant={variant}>
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "updatedAt",
    header: "更新時間",
  },
  // 🚀 核心新增：最後一欄的「... 動作選單」
  {
    id: "actions",
    header: "操作",
    cell: ({ row }) => {
      const model = row.original // 取得當前這一列的完整物件資料
      const isDownloaded = model.status === "downloaded"

      // 觸發指令的 Mock 腳本函式
      const handleAction = (actionType: string) => {
        console.log(`觸發模型 [${model.modelName}] 的行為: ${actionType}`)
        // 您可以在這裡呼叫 Axios / Fetch API 發送請求給 Java Backend Gateway
      }

      return (
        <DropdownMenu>
          {/* 在 Base UI 中，Trigger 不需要 asChild，這樣寫完全正確 */}
          <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium hover:bg-slate-800 h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-40 bg-popover text-popover-foreground border">
            {/* 💡 修正：直接移除 DropdownMenuLabel 與 DropdownMenuSeparator */}
            {/* 這樣就能完全繞過 Base UI 的 MenuGroupContext 限制，直接顯示按鈕 */}

            {isDownloaded ? (
              <>
                <DropdownMenuItem onClick={() => handleAction("start")} className="flex items-center gap-2 cursor-pointer text-emerald-400 focus:bg-muted">
                  <Play className="h-3.5 w-3.5" />
                  <span>啟用</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction("stop")} className="flex items-center gap-2 cursor-pointer text-amber-400 focus:bg-muted">
                  <Square className="h-3.5 w-3.5" />
                  <span>停止</span>
                </DropdownMenuItem>
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

export function DataTable({ data }: DataTableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
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