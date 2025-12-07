import { Badge } from '@/components/ui/card'
import type { DecisionSource } from '@/lib/ai-types'

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
