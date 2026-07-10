export type NavigationItem = {
  label: string
  path: string
  group: '工作區' | '平台管理'
}

export const navigationItems: NavigationItem[] = [
  { label: '總覽', path: '/', group: '工作區' },
  { label: '對話工作台', path: '/chat', group: '工作區' },
  { label: '模型管理', path: '/models', group: '平台管理' },
  { label: 'Agent 管理', path: '/agents', group: '平台管理' },
  { label: '知識庫', path: '/knowledge-bases', group: '平台管理' },
  { label: 'Gateway 觀測', path: '/observability', group: '平台管理' },
  { label: '稽核紀錄', path: '/audit-logs', group: '平台管理' },
  { label: '系統管理', path: '/admin', group: '平台管理' },
]
