import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatServiceType(type: string): string {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase())
}

export function formatBehaviorIssue(issue: string): string {
  return issue
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase())
}

export function formatAgeSpecialty(age: string): string {
  const map: Record<string, string> = {
    puppies_0_6m: "Puppies (0-6 months)",
    adolescent_6_18m: "Adolescent (6-18 months)",
    adult_18m_7y: "Adult (18 months - 7 years)",
    senior_7y_plus: "Senior (7+ years)",
    rescue_dogs: "Rescue Dogs",
  }
  return map[age] || age.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
}

export function formatRegion(region: string): string {
  return region
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural || `${singular}s`)
}
