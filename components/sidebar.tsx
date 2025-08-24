"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  PanelLeft,
  PanelRight,
  Plus,
  Search,
  Trash2,
  Download,
  MoreVertical,
  Calendar,
  MessageSquare,
  ImageIcon,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface Chat {
  id: string
  timestamp: string
  preview: string
  models: string[]
  messageCount: number
  createdAt: Date
  lastUpdated: Date
  mode: "chat" | "image"
  messages: Record<string, any[]>
}

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  currentChatId: string | null
  onChatSelect: (chatId: string | null) => void
  chats: Chat[]
  onChatsChange: (chats: Chat[]) => void
  onLoadChat?: (chat: Chat) => void
  onNewChat?: () => void
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  currentChatId,
  onChatSelect,
  chats,
  onChatsChange,
  onLoadChat,
  onNewChat,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [showClearDialog, setShowClearDialog] = useState(false)

  const filteredChats = chats.filter((chat) => {
    const query = searchQuery.toLowerCase()
    return (
      chat.preview.toLowerCase().includes(query) ||
      chat.models.some((model) => model.toLowerCase().includes(query)) ||
      chat.timestamp.toLowerCase().includes(query)
    )
  })

  const sortedChats = filteredChats.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime())

  // Group chats by date
  const groupChatsByDate = (chats: Chat[]) => {
    const groups: { [key: string]: Chat[] } = {}
    
    chats.forEach(chat => {
      const date = new Date(chat.lastUpdated)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      
      let dateKey: string
      if (date.toDateString() === today.toDateString()) {
        dateKey = 'Today'
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateKey = 'Yesterday'
      } else {
        dateKey = date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        })
      }
      
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(chat)
    })
    
    return groups
  }

  const groupedChats = groupChatsByDate(sortedChats)

  const handleNewChat = () => {
    onChatSelect(null)
    setSearchQuery("")
    
    // Clear any active chat state
    if (currentChatId) {
      onChatSelect(null)
    }
    
    // Call the main page's new chat handler
    if (onNewChat) {
      onNewChat()
    }
  }

  const handleChatClick = (chat: Chat) => {
    onChatSelect(chat.id)
    if (onLoadChat) {
      onLoadChat(chat)
    }
  }

  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updatedChats = chats.filter((chat) => chat.id !== chatId)
    onChatsChange(updatedChats)
    localStorage.setItem("chatHistory", JSON.stringify(updatedChats))

    if (currentChatId === chatId) {
      onChatSelect(null)
    }
  }

  const handleClearHistory = () => {
    onChatsChange([])
    localStorage.removeItem("chatHistory")
    setShowClearDialog(false)
    if (currentChatId) {
      onChatSelect(null)
    }
  }

  const handleExportChats = (format: "json" | "markdown") => {
    if (chats.length === 0) return

    let content: string
    let filename: string
    let mimeType: string

    if (format === "json") {
      content = JSON.stringify(chats, null, 2)
      filename = `ai-piesta-chats-${new Date().toISOString().split("T")[0]}.json`
      mimeType = "application/json"
    } else {
      content = chats
        .map((chat) => {
          const modeIcon = chat.mode === "image" ? "🖼️" : "💬"
          return `# ${modeIcon} Chat: ${chat.preview.substring(0, 50)}...\n\n**Created:** ${chat.timestamp}\n**Mode:** ${chat.mode}\n**Models:** ${chat.models.join(", ")}\n**Messages:** ${chat.messageCount}\n\n---\n\n`
        })
        .join("")
      filename = `ai-piesta-chats-${new Date().toISOString().split("T")[0]}.md`
      mimeType = "text/markdown"
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getModelName = (modelId: string) => {
    const modelNames: Record<string, string> = {
      "meta-llama/llama-3.2-3b-instruct:free": "Llama 3.2 3B",
      "microsoft/phi-3-mini-128k-instruct:free": "Phi-3 Mini",
      "google/gemma-2-9b-it:free": "Gemma 2 9B",
      "qwen/qwen-2-7b-instruct:free": "Qwen 2 7B",
      "mistralai/mistral-7b-instruct:free": "Mistral 7B",
      "fal-ai/flux/schnell": "Flux Schnell",
      "fal-ai/flux/dev": "Flux Dev",
      "fal-ai/stable-diffusion-v3-medium": "SD v3 Medium",
      "fal-ai/aura-flow": "Aura Flow",
      "fal-ai/stable-diffusion-v35-large": "SD v3.5 Large",
    }
    return modelNames[modelId] || modelId.split("/").pop() || modelId
  }

  const createShortHeading = (chat: Chat) => {
    // If preview is already short, use it
    if (chat.preview.length <= 25) {
      return chat.preview
    }

    // Try to extract a meaningful short title from the first user message
    const firstMessage = Object.values(chat.messages)[0]?.[0]
    if (firstMessage?.role === 'user' && firstMessage?.content) {
      const content = firstMessage.content.trim()
      
      // For image generation, look for key descriptive words
      if (chat.mode === 'image') {
        const words = content.split(' ').slice(0, 5).join(' ')
        return words.length > 25 ? words.substring(0, 25) + "..." : words
      }
      
      // For text chats, try to get the main topic
      const shortContent = content.length > 25 ? content.substring(0, 25) + "..." : content
      return shortContent
    }

    // Fallback: create a short preview
    return chat.preview.length > 25 ? chat.preview.substring(0, 25) + "..." : chat.preview
  }

  return (
    <>
      <motion.div
        initial={false}
        animate={{ width: collapsed ? 64 : 280 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="bg-zinc-900 border-r border-zinc-700 flex flex-col shadow-lg"
      >
        {/* Collapsed state - show expand button and new chat button */}
        {collapsed && (
          <div className="flex flex-col h-full">
            {/* Top buttons */}
            <div className="p-3 space-y-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleCollapse}
                className="h-10 w-10 bg-transparent hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all duration-200 rounded-lg"
              >
                <PanelRight className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNewChat}
                className="h-10 w-10 bg-lime-500 hover:bg-lime-600 text-black transition-all duration-200 rounded-lg"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Bottom buttons - fixed at bottom */}
            <div className="mt-auto p-3 space-y-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 bg-transparent hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all duration-200 rounded-lg"
                    disabled={chats.length === 0}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="bg-zinc-800 border-zinc-700">
                  <DropdownMenuItem
                    onClick={() => handleExportChats("json")}
                    className="hover:bg-zinc-700 text-white"
                  >
                    Export as JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleExportChats("markdown")}
                    className="hover:bg-zinc-700 text-white"
                  >
                    Export as Markdown
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowClearDialog(true)}
                className="h-10 w-10 bg-transparent hover:bg-red-500/10 text-red-400 hover:text-red-700 transition-all duration-200 rounded-lg"
                disabled={chats.length === 0}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Expanded state */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex flex-col min-h-0"
            >
              {/* Header section - fixed */}
              <div className="flex-shrink-0">
                <div className="p-3 flex space-x-2 group">
                  <Button
                    onClick={handleNewChat}
                    className="flex-1 bg-lime-500 hover:bg-lime-600 text-black font-medium transition-all duration-200 hover:scale-105"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Chat
                    {/* <kbd className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-black/20 text-black/70 font-mono text-xs rounded border border-black/30">
                      Ctrl+N
                    </kbd> */}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleCollapse}
                    className="h-10 w-10 bg-transparent hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all duration-200 rounded-lg group-hover:bg-zinc-700 group-hover:text-zinc-200"
                  >
                    <PanelLeft className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
                  </Button>
                </div>

                <div className="px-3 pb-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                      placeholder="Search chats, models..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-zinc-800 border-zinc-600 text-white placeholder-zinc-400 focus:border-green-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Scrollable chat list */}
              <ScrollArea className="flex-1 min-h-0 scroll-smooth">
                <div className="px-4 space-y-4 pb-4 w-[90%]">
                  {sortedChats.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{searchQuery ? "No chats found" : "No chat history yet"}</p>
                    </div>
                  ) : (
                    Object.entries(groupedChats).map(([dateKey, chatsInGroup]) => (
                      <div key={dateKey} className="space-y-2">
                        <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider px-1">
                          {dateKey}
                        </div>
                        {chatsInGroup.map((chat, index) => (
                          <motion.div
                            key={chat.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                            onClick={() => handleChatClick(chat)}
                            className={`px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 group ${
                              currentChatId === chat.id
                                ? "bg-zinc-800 border border-zinc-600"
                                : "hover:bg-zinc-800 border border-transparent hover:border-zinc-600"
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center space-x-2 flex-1 min-w-0 pr-2">
                                <Badge
                                  variant="secondary"
                                  className={`text-xs flex-shrink-0 ${
                                    chat.mode === "image"
                                      ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                                      : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                                  }`}
                                >
                                  {chat.mode === "image" ? "img" : "txt"}
                                </Badge>
                                <span className="text-sm text-white truncate flex-1">
                                  {createShortHeading(chat)}
                                </span>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 opacity-0 dark:hover:bg-transparent dark:hover:border-zinc-600 dark:hover:text-zinc-300 cursor-pointer group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreVertical className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-zinc-800 border-zinc-700 cursor-pointer">
                                  {/* <DropdownMenuItem className="hover:bg-zinc-700 text-white dark:hover:bg-transparent dark:hover:text-zinc-300">
                                    Rename Chat
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="hover:bg-zinc-700 text-white">
                                    Duplicate Chat
                                  </DropdownMenuItem> */}
                                  <DropdownMenuItem
                                    className="dark:hover:bg-red-400/10  text-red-400 dark:text-red-400"
                                    onClick={(e) => handleDeleteChat(chat.id, e)}
                                  >
                                    Delete Chat
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              {/* Fixed bottom section */}
              <div className="flex-shrink-0 p-3 border-t border-zinc-700 space-y-2 bg-zinc-900">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-zinc-600 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-200 bg-transparent"
                      disabled={chats.length === 0}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Chats
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="bg-zinc-800 border-zinc-700">
                    <DropdownMenuItem
                      onClick={() => handleExportChats("json")}
                      className="hover:bg-zinc-700 text-white"
                    >
                      Export as JSON
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleExportChats("markdown")}
                      className="hover:bg-zinc-700 text-white"
                    >
                      Export as Markdown
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowClearDialog(true)}
                  className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-700 bg-transparent"
                  disabled={chats.length === 0}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear History
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Trash2 className="h-5 w-5 text-red-400" />
              <span>Clear Chat History</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-zinc-300 mb-2">
              Are you sure you want to delete all chat history? This action cannot be undone.
            </p>
            <div className="bg-zinc-800 p-3 rounded-lg border border-zinc-700">
              <p className="text-sm text-zinc-400">
                <strong>{chats.length}</strong> chats will be permanently deleted
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowClearDialog(false)}
              className="border-zinc-600 text-zinc-300 hover:bg-zinc-800 bg-transparent"
            >
              Cancel
            </Button>
            <Button onClick={handleClearHistory} className="bg-red-500 hover:bg-red-600 text-white">
              Clear All History
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
