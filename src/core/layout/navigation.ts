export type NavigationItem = {
  label: string
  path: string
  group: '工作區' | '平台管理'
  adminOnly?: boolean // 👈 新增：標註是否僅 admin 可見
}

export const navigationItems: NavigationItem[] = [
  { label: '總覽', path: '/', group: '工作區', adminOnly: true },
  { label: '對話工作台', path: '/chat', group: '工作區' },            // User 可見
  { label: 'Agent 管理', path: '/agents', group: '平台管理', adminOnly: true },        // User 可見
  { label: '模型管理', path: '/models', group: '平台管理', adminOnly: true },
  { label: '知識庫', path: '/knowledge-bases', group: '平台管理', adminOnly: true },
  { label: 'Gateway 觀測', path: '/observability', group: '平台管理', adminOnly: true },
  { label: '稽核紀錄', path: '/audit-logs', group: '平台管理', adminOnly: true },
  { label: '系統管理', path: '/admin', group: '平台管理', adminOnly: true },
]
