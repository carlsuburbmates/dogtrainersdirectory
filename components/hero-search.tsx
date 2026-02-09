"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, MapPin, Sparkles } from "lucide-react"

const quickSearches = [
  "Puppy training in Carlton",
  "Separation anxiety help",
  "Rescue dog specialist",
  "Group classes near me",
  "Dog aggression Fitzroy",
  "Leash reactivity",
]

export function HeroSearch() {
  const [query, setQuery] = useState("")
  const router = useRouter()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  function handleQuickSearch(q: string) {
    router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <form
        onSubmit={handleSearch}
        className="relative w-full max-w-2xl"
      >
        <div className="flex items-center overflow-hidden rounded-2xl border-2 border-border bg-card shadow-lg transition-all focus-within:border-primary focus-within:shadow-xl">
          <div className="flex items-center gap-2 pl-5">
            <Sparkles className="h-5 w-5 text-secondary" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try &quot;puppy trainer near Carlton&quot; or &quot;help with barking&quot;"
            className="flex-1 bg-transparent px-3 py-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            type="submit"
            className="m-2 flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search</span>
          </button>
        </div>
      </form>

      {/* Quick search chips */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        {quickSearches.map((q) => (
          <button
            key={q}
            onClick={() => handleQuickSearch(q)}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}
