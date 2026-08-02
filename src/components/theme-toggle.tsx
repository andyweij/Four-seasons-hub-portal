import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // 防止 SSR / Hydration 不一致
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-8 w-28 rounded-lg bg-muted/40 animate-pulse" />
  }

  return (
    <div className="theme-toggle-group flex items-center gap-1 p-1 rounded-lg border border-border bg-card/60 backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={`flex flex-1 items-center justify-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
          theme === 'light'
            ? 'bg-primary text-primary-foreground shadow-xs'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
        }`}
        title="淺色模式"
        aria-label="切換為淺色模式"
      >
        <Sun className="h-3.5 w-3.5" />
        <span>淺色</span>
      </button>
      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={`flex flex-1 items-center justify-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
          theme === 'dark'
            ? 'bg-primary text-primary-foreground shadow-xs'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
        }`}
        title="深色模式"
        aria-label="切換為深色模式"
      >
        <Moon className="h-3.5 w-3.5" />
        <span>深色</span>
      </button>
      <button
        type="button"
        onClick={() => setTheme('system')}
        className={`flex flex-1 items-center justify-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
          theme === 'system'
            ? 'bg-primary text-primary-foreground shadow-xs'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
        }`}
        title="跟隨系統"
        aria-label="跟隨系統主題"
      >
        <Monitor className="h-3.5 w-3.5" />
        <span>系統</span>
      </button>
    </div>
  )
}
