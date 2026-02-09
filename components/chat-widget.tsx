"use client"

import { useState, useRef, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import type { UIMessage } from "ai"
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  PawPrint,
  Sparkles,
  User,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

function getMessageText(msg: UIMessage): string {
  if (!msg.parts || !Array.isArray(msg.parts)) return ""
  return msg.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("")
}

const suggestedQuestions = [
  "Find a puppy trainer near Carlton",
  "Help with separation anxiety",
  "Who handles dog aggression?",
  "Emergency vet info",
]

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState("")

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  })

  const isStreaming = status === "streaming" || status === "submitted"

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || isStreaming) return
    sendMessage({ text: input.trim() })
    setInput("")
  }

  function handleQuickQuestion(q: string) {
    sendMessage({ text: q })
  }

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105",
          "bottom-20 right-4 md:bottom-6 md:right-6",
          open
            ? "bg-muted text-muted-foreground"
            : "bg-primary text-primary-foreground"
        )}
        aria-label={open ? "Close chat" : "Open AI assistant"}
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>

      {/* Chat Panel */}
      {open && (
        <div className="fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl bottom-36 right-4 left-4 top-20 md:bottom-20 md:left-auto md:right-6 md:top-auto md:h-[560px] md:w-[400px]">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-border bg-primary px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20">
              <PawPrint className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-primary-foreground">
                Dog Training Assistant
              </h3>
              <p className="text-xs text-primary-foreground/70">
                AI-powered help finding trainers
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-primary-foreground/70" />
              <span className="text-xs font-medium text-primary-foreground/70">
                AI
              </span>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-4 scrollbar-none"
          >
            {messages.length === 0 ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <PawPrint className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="rounded-xl rounded-tl-none bg-muted px-3 py-2 text-sm text-foreground">
                    {"Hi! I'm your Dog Training Assistant. I can help you find the perfect trainer in Melbourne. What are you looking for?"}
                  </div>
                </div>

                <div className="flex flex-col gap-2 pl-10">
                  <p className="text-xs font-medium text-muted-foreground">
                    Try asking:
                  </p>
                  {suggestedQuestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleQuickQuestion(q)}
                      className="rounded-lg border border-border bg-card px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {messages.map((msg) => {
                  const text = getMessageText(msg)
                  if (!text) return null

                  const isUser = msg.role === "user"
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex items-start gap-3",
                        isUser && "flex-row-reverse"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                          isUser
                            ? "bg-secondary/20"
                            : "bg-primary/10"
                        )}
                      >
                        {isUser ? (
                          <User className="h-3.5 w-3.5 text-secondary-foreground" />
                        ) : (
                          <PawPrint className="h-3.5 w-3.5 text-primary" />
                        )}
                      </div>
                      <div
                        className={cn(
                          "max-w-[80%] rounded-xl px-3 py-2 text-sm",
                          isUser
                            ? "rounded-tr-none bg-primary text-primary-foreground"
                            : "rounded-tl-none bg-muted text-foreground"
                        )}
                      >
                        {text.split("\n").map((line, i) => {
                          // Detect trainer links in format [Name](/trainers/slug)
                          const linkRegex = /\[([^\]]+)\]\(\/trainers\/([^)]+)\)/g
                          const parts = []
                          let lastIndex = 0
                          let match

                          while ((match = linkRegex.exec(line)) !== null) {
                            if (match.index > lastIndex) {
                              parts.push(line.slice(lastIndex, match.index))
                            }
                            parts.push(
                              <Link
                                key={match[2]}
                                href={`/trainers/${match[2]}`}
                                className="font-semibold underline"
                                onClick={() => setOpen(false)}
                              >
                                {match[1]}
                              </Link>
                            )
                            lastIndex = match.index + match[0].length
                          }
                          if (lastIndex < line.length) {
                            parts.push(line.slice(lastIndex))
                          }

                          return (
                            <span key={i}>
                              {parts.length > 0 ? parts : line}
                              {i < text.split("\n").length - 1 && <br />}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}

                {isStreaming && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <PawPrint className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="rounded-xl rounded-tl-none bg-muted px-3 py-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-border bg-card px-3 py-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about dog training..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              disabled={isStreaming}
            />
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
            >
              {isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
        </div>
      )}
    </>
  )
}
