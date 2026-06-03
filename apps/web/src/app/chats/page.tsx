"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { MessageSquareDashed, Plus, MoreHorizontal, Pencil, Trash2, MessageSquare } from "lucide-react"
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@beta-epic/ui"

interface Chat {
  id: string
  title: string
  model: string
  createdAt: string
  updatedAt: string
}

const MODEL_LABELS: Record<string, string> = {
  "gpt-5.4": "GPT-5.4",
  "gpt-5.2": "GPT-5.2",
  "gpt-5.1": "GPT-5.1",
  "gpt-5": "GPT-5",
  "gpt-5-mini": "GPT-5 mini",
  "gpt-4.1": "GPT-4.1",
  "gpt-4.1-mini": "GPT-4.1 mini",
  "gpt-4o": "GPT-4o",
  "gpt-4o-mini": "GPT-4o mini",
  o3: "o3",
  "o4-mini": "o4-mini",
}

export default function ChatsPage() {
  const router = useRouter()
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  // Inline rename state
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const renameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch("/api/chats")
      .then((r) => r.json())
      .then((data) => setChats(Array.isArray(data) ? data : []))
      .catch(() => setChats([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (renamingId) renameInputRef.current?.focus()
  }, [renamingId])

  async function createChat() {
    setCreating(true)
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "gpt-5.4" }),
      })
      const { id } = await res.json()
      router.push(`/chat/${id}`)
    } catch {
      setCreating(false)
    }
  }

  async function deleteChat(id: string) {
    await fetch(`/api/chats/${id}`, { method: "DELETE" })
    setChats((prev) => prev.filter((c) => c.id !== id))
  }

  function startRename(chat: Chat) {
    setRenamingId(chat.id)
    setRenameValue(chat.title)
  }

  async function commitRename(id: string) {
    const title = renameValue.trim()
    setRenamingId(null)
    if (!title) return
    await fetch(`/api/chats/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    })
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)))
  }

  function handleRenameKey(e: React.KeyboardEvent, id: string) {
    if (e.key === "Enter") commitRename(id)
    if (e.key === "Escape") setRenamingId(null)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-12">
        {/* Header */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Chats</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your AI conversations
            </p>
          </div>
          <Button onClick={createChat} disabled={creating} size="sm">
            <Plus className="size-3.5" />
            New chat
          </Button>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-[58px] animate-pulse rounded-xl bg-muted"
                style={{ opacity: 1 - i * 0.15 }}
              />
            ))}
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-28 text-center">
            <div className="rounded-2xl border bg-muted/30 p-5">
              <MessageSquareDashed className="size-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">No conversations yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Start chatting with your AI assistant
              </p>
            </div>
            <Button onClick={createChat} disabled={creating}>
              <Plus className="size-4" />
              Start your first chat
            </Button>
          </div>
        ) : (
          <div className="space-y-1.5">
            {chats.map((chat) => (
              <div key={chat.id} className="group relative flex items-center gap-3 rounded-xl border bg-card px-4 py-3.5 text-sm transition-colors hover:bg-muted/40">
                <MessageSquare className="size-4 shrink-0 text-muted-foreground" />

                {renamingId === chat.id ? (
                  <input
                    ref={renameInputRef}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => commitRename(chat.id)}
                    onKeyDown={(e) => handleRenameKey(e, chat.id)}
                    className="flex-1 truncate bg-transparent font-medium outline-none ring-0"
                  />
                ) : (
                  <Link
                    href={`/chat/${chat.id}`}
                    className="flex-1 truncate font-medium"
                  >
                    {chat.title}
                  </Link>
                )}

                <Badge variant="secondary" className="shrink-0 text-xs font-normal">
                  {MODEL_LABELS[chat.model] ?? chat.model}
                </Badge>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: true })}
                </span>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="ml-1 shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-all hover:bg-muted hover:text-foreground group-hover:opacity-100 data-[state=open]:opacity-100">
                      <MoreHorizontal className="size-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => startRename(chat)}>
                      <Pencil className="size-3.5" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => deleteChat(chat.id)}
                    >
                      <Trash2 className="size-3.5" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
