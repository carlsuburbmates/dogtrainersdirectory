import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

type CardTone = 'default' | 'muted' | 'info' | 'danger' | 'warning' | 'success'
type CardPadding = 'none' | 'sm' | 'md' | 'lg'

const cardToneClasses: Record<CardTone, string> = {
  default:
    'border-[hsl(var(--ds-border-subtle))] bg-[hsl(var(--ds-background-surface)/0.96)] text-[hsl(var(--ds-text-primary))]',
  muted:
    'border-[hsl(var(--ds-border-subtle))] bg-[hsl(var(--ds-background-mid)/0.62)] text-[hsl(var(--ds-text-primary))]',
  info:
    'border-[hsl(var(--ds-accent-primary)/0.25)] bg-[hsl(var(--ds-accent-primary)/0.08)] text-[hsl(var(--ds-text-primary))]',
  danger:
    'border-[hsl(var(--ds-accent-warning)/0.32)] bg-[hsl(var(--ds-accent-warning)/0.12)] text-[hsl(var(--ds-text-primary))]',
  warning:
    'border-[hsl(var(--ds-accent-warning)/0.32)] bg-[hsl(var(--ds-accent-warning)/0.12)] text-[hsl(var(--ds-text-primary))]',
  success:
    'border-[hsl(var(--ds-accent-success)/0.3)] bg-[hsl(var(--ds-accent-success)/0.12)] text-[hsl(var(--ds-text-primary))]'
}

const cardPaddingClasses: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-7'
}

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: 'div' | 'section' | 'article'
  tone?: CardTone
  padding?: CardPadding
}

export function Card({
  as = 'div',
  tone = 'default',
  padding = 'md',
  className,
  children,
  ...props
}: CardProps) {
  const Component = as
  return (
    <Component
      className={cn(
        'rounded-[var(--ds-radius-xl)] border shadow-[0_18px_45px_-32px_hsl(var(--ds-shadow-card)/0.45)]',
        cardToneClasses[tone],
        cardPaddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
}

interface FieldProps {
  label: string
  htmlFor?: string
  hint?: string
  required?: boolean
  className?: string
  children: ReactNode
}

export function Field({ label, htmlFor, hint, required = false, className, children }: FieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-[hsl(var(--ds-text-primary))]">
        {label}
        {required ? <span className="ml-1 text-[hsl(var(--ds-accent-warning))]">*</span> : null}
      </label>
      {children}
      {hint ? <p className="text-xs text-[hsl(var(--ds-text-muted))]">{hint}</p> : null}
    </div>
  )
}

type ChipTone = 'neutral' | 'primary' | 'info' | 'warning' | 'success'

const chipToneClasses: Record<ChipTone, string> = {
  neutral:
    'border-[hsl(var(--ds-border-subtle))] bg-[hsl(var(--ds-background-mid)/0.58)] text-[hsl(var(--ds-text-secondary))] hover:border-[hsl(var(--ds-border-strong))]',
  primary:
    'border-[hsl(var(--ds-accent-primary)/0.45)] bg-[hsl(var(--ds-accent-primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--ds-accent-primary)/0.9)]',
  info:
    'border-[hsl(var(--ds-accent-secondary)/0.32)] bg-[hsl(var(--ds-accent-secondary)/0.14)] text-[hsl(var(--ds-text-primary))] hover:bg-[hsl(var(--ds-accent-secondary)/0.2)]',
  warning:
    'border-[hsl(var(--ds-accent-warning)/0.35)] bg-[hsl(var(--ds-accent-warning)/0.14)] text-[hsl(var(--ds-text-primary))] hover:bg-[hsl(var(--ds-accent-warning)/0.2)]',
  success:
    'border-[hsl(var(--ds-accent-success)/0.34)] bg-[hsl(var(--ds-accent-success)/0.14)] text-[hsl(var(--ds-text-primary))] hover:bg-[hsl(var(--ds-accent-success)/0.22)]'
}

interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: ReactNode
  tone?: ChipTone
  selected?: boolean
  asSpan?: boolean
}

export function Chip({
  children,
  tone = 'neutral',
  selected = false,
  asSpan = false,
  className,
  ...props
}: ChipProps) {
  const classes = cn(
    'inline-flex min-h-[44px] items-center rounded-full border px-3 py-2 text-xs font-semibold transition-colors',
    selected ? chipToneClasses.primary : chipToneClasses[tone],
    asSpan && 'pointer-events-none min-h-0 py-1.5 font-medium',
    className
  )

  if (asSpan) {
    return <span className={classes}>{children}</span>
  }

  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  )
}

type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning'

const badgeToneClasses: Record<BadgeTone, string> = {
  neutral:
    'border-[hsl(var(--ds-border-subtle))] bg-[hsl(var(--ds-background-mid)/0.62)] text-[hsl(var(--ds-text-secondary))]',
  primary:
    'border-[hsl(var(--ds-accent-primary)/0.28)] bg-[hsl(var(--ds-accent-primary)/0.14)] text-[hsl(var(--ds-text-primary))]',
  success:
    'border-[hsl(var(--ds-accent-success)/0.3)] bg-[hsl(var(--ds-accent-success)/0.15)] text-[hsl(var(--ds-text-primary))]',
  warning:
    'border-[hsl(var(--ds-accent-warning)/0.35)] bg-[hsl(var(--ds-accent-warning)/0.16)] text-[hsl(var(--ds-text-primary))]'
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
}

export function Badge({ tone = 'neutral', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]',
        badgeToneClasses[tone],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export function Divider({ className, ...props }: HTMLAttributes<HTMLHRElement>) {
  return (
    <hr
      className={cn('border-0 border-t border-[hsl(var(--ds-border-subtle))]', className)}
      {...props}
    />
  )
}

interface SheetProps extends HTMLAttributes<HTMLElement> {
  open: boolean
}

export function Sheet({ open, className, children, ...props }: SheetProps) {
  return (
    <section
      className={cn(
        'absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-[var(--ds-radius-xl)] border border-[hsl(var(--ds-border-subtle))] bg-[hsl(var(--ds-background-surface))] p-5 shadow-[0_-20px_50px_-30px_hsl(var(--ds-shadow-overlay)/0.6)] transition-transform duration-200 md:inset-y-0 md:right-0 md:left-auto md:h-full md:max-h-none md:w-[440px] md:rounded-none md:rounded-l-[var(--ds-radius-xl)] md:border-l',
        open ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-y-0 md:translate-x-full',
        className
      )}
      {...props}
    >
      {children}
    </section>
  )
}

interface CapsuleProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  kicker?: string
  actions?: ReactNode
}

export function Capsule({ title, kicker, actions, className, children, ...props }: CapsuleProps) {
  return (
    <Card className={cn('p-5', className)} {...props}>
      <div className="flex items-start justify-between gap-3">
        <div>
          {kicker ? (
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--ds-text-muted))]">
              {kicker}
            </p>
          ) : null}
          <h2 className="mt-1 text-lg font-bold text-[hsl(var(--ds-text-primary))]">{title}</h2>
        </div>
        {actions}
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </Card>
  )
}

type StateTone = 'neutral' | 'error' | 'success' | 'warning'

const stateToneClasses: Record<StateTone, string> = {
  neutral: '',
  error: 'border-[hsl(var(--ds-accent-warning)/0.35)] bg-[hsl(var(--ds-accent-warning)/0.1)]',
  success: 'border-[hsl(var(--ds-accent-success)/0.34)] bg-[hsl(var(--ds-accent-success)/0.1)]',
  warning: 'border-[hsl(var(--ds-accent-warning)/0.35)] bg-[hsl(var(--ds-accent-warning)/0.1)]'
}

interface StateCardProps {
  title: string
  description: string
  tone?: StateTone
  align?: 'left' | 'center'
  actions?: ReactNode
  className?: string
}

export function StateCard({
  title,
  description,
  tone = 'neutral',
  align = 'center',
  actions,
  className
}: StateCardProps) {
  return (
    <Card
      className={cn(
        align === 'center' ? 'text-center' : '',
        stateToneClasses[tone],
        className
      )}
      padding="lg"
    >
      <h3 className="text-xl font-bold text-[hsl(var(--ds-text-primary))]">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-[hsl(var(--ds-text-secondary))]">{description}</p>
      {actions ? <div className="mt-5 flex flex-wrap gap-3 justify-center">{actions}</div> : null}
    </Card>
  )
}
