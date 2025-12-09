// Simple Badge implementation inline
import type { DecisionSource } from '@/lib/ai-types'

function Badge({ children, variant }: { children: React.ReactNode; variant?: string }) {
  const base = "inline-flex px-2 py-1 text-xs rounded-full"
  const variantMap = {
    default: "bg-blue-100 text-blue-800",
    secondary: "bg-gray-100 text-gray-800",
    outline: "border border-gray-300 text-gray-700"
  }
  return <span className={`${base} ${variantMap[variant as keyof typeof variantMap] || variantMap.default}`}>{children}</span>
}

interface DecisionSourceBadgeProps {
  source: DecisionSource
  className?: string
}

export function DecisionSourceBadge({ source, className }: DecisionSourceBadgeProps) {
  const config = {
    llm: {
      label: 'AI',
      variant: 'default' as const,
      description: 'Decision made by language model'
    },
    deterministic: {
      label: 'Rule',
      variant: 'secondary' as const,
      description: 'Decision made by deterministic heuristics'
    },
    manual_override: {
      label: 'Manual',
      variant: 'outline' as const,
      description: 'Decision made by human operator'
    }
  }

  const { label, variant, description } = config[source] || config.deterministic

  return (
    <Badge
      variant={variant}
      className={className}
      title={description}
    >
      {label}
    </Badge>
  )
}
