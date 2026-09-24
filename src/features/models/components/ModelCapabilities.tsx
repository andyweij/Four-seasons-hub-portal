import { Badge } from '@/components/ui/badge'

interface ModelCapabilitiesProps {
  capabilities: string[]
}

export function ModelCapabilities({ capabilities }: ModelCapabilitiesProps) {
  if (capabilities.length === 0) {
    return <span className="text-sm text-muted-foreground">—</span>
  }

  return (
    <div className="flex min-w-48 flex-wrap gap-1.5">
      {capabilities.map((capability) => (
        <Badge key={capability} variant="outline">
          {capability}
        </Badge>
      ))}
    </div>
  )
}
