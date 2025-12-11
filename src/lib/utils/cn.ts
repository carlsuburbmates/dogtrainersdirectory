import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility to combine Tailwind classes with clsx precedence and deduplication via twMerge.
 * Required for variant composability in the design system.
 */
export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs))
}