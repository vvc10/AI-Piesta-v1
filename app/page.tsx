"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { SplitScreen } from "@/components/split-screen"
import { ChatInput } from "@/components/chat-input"
import { ApiKeyModal } from "@/components/api-key-modal"
import { motion } from "framer-motion"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"

interface Message {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: string
  trustScore?: number
  responseTime?: number
  tokenCount?: number
  imageUrl?: string
  model?: string
}

interface Chat {
  id: string
  timestamp: string
  preview: string
  models: string[]
  messageCount: number
  createdAt: Date
  lastUpdated: Date
  mode: "chat" | "image"
  messages: Record<string, Message[]>
}

const CHAT_MODELS = [
  "openai/gpt-4o-mini",
  "deepseek-ai/deepseek-coder-33b-instruct",
  "anthropic/claude-3-5-sonnet",
  "meta-llama/llama-3.2-90b-vision-instruct",
  "microsoft/wizardlm-2-8x22b",
  "google/gemma-2-27b-it",
  "qwen/qwen-2.5-72b-instruct",
  "mistralai/mixtral-8x22b-instruct",
]

const IMAGE_MODELS = [
  "fal-ai/flux-pro/v1.1",
  "fal-ai/flux-dev",
  "fal-ai/stable-diffusion-v3-medium",
  "fal-ai/playground-v2.5",
  "fal-ai/recraft-v3",
  // Hugging Face Models
  "hf-black-forest-labs/flux.1-dev",
  "hf-stabilityai/stable-diffusion-xl-base-1.0",
  "hf-runwayml/stable-diffusion-v1-5",
  "hf-compvis/stable-diffusion-v1-4",
]

export default function HomePage() {
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [chats, setChats] = useState<Chat[]>([])
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>({})
  const [generatingModels, setGeneratingModels] = useState<Set<string>>(new Set())
  const [currentMode, setCurrentMode] = useState<"chat" | "image">("chat")
  const { toast } = useToast()

  const getCurrentMode = (): "chat" | "image" => {
    if (selectedModels.length === 0) return "chat"

    const hasImageModels = selectedModels.some((model) => IMAGE_MODELS.includes(model))
    const hasChatModels = selectedModels.some((model) => CHAT_MODELS.includes(model))

    console.log("[AI Piesta] Mode Detection - Selected Models:", selectedModels)
    console.log("[AI Piesta] Has Image Models:", hasImageModels)
    console.log("[AI Piesta] Has Chat Models:", hasChatModels)

    if (hasImageModels && !hasChatModels) return "image"
    if (hasChatModels && !hasImageModels) return "chat"

    // If mixed, return current mode to prevent switching
    return currentMode
  }

  const checkApiKeys = (): boolean => {
    const openrouterKey = localStorage.getItem("openrouter_api_key")
    const falKey = localStorage.getItem("fal_api_key")
    const huggingfaceKey = localStorage.getItem("huggingface_api_key")

    const mode = getCurrentMode()
    if (mode === "image" && !falKey && !huggingfaceKey) return false
    if (mode === "chat" && !openrouterKey) return false

    return true
  }

  const handleLoadChat = (chat: Chat) => {
    setCurrentChatId(chat.id)
    setSelectedModels(chat.models)
    setCurrentMode(chat.mode)
    setMessagesMap(chat.messages || {})

    // Save the loaded models to localStorage
    localStorage.setItem("selectedModels", JSON.stringify(chat.models))

    toast({
      title: "Chat Loaded",
      description: `Loaded ${chat.mode} conversation with ${chat.models.length} model${chat.models.length > 1 ? "s" : ""}`,
    })
  }

  const handleNewChat = () => {
    setCurrentChatId(null)
    setMessagesMap({})
    setGeneratingModels(new Set())
    
    // Keep the same models active - don't clear them
    // This allows starting a new conversation with the same models

    toast({
      title: "New Chat",
      description: "Started a new conversation with the same models.",
    })
  }

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const savedModels = localStorage.getItem("selectedModels")
        if (savedModels) {
          const models = JSON.parse(savedModels)
          setSelectedModels(models)
          setCurrentMode(getCurrentMode())
        } else {
          // Default to first two chat models
          const defaultModels = [CHAT_MODELS[0], CHAT_MODELS[1]]
          setSelectedModels(defaultModels)
          setCurrentMode("chat")
        }

        const sidebarState = localStorage.getItem("sidebarCollapsed")
        if (sidebarState) {
          setSidebarCollapsed(JSON.parse(sidebarState))
        }

        const savedChats = localStorage.getItem("chatHistory")
        if (savedChats) {
          try {
            const parsedChats = JSON.parse(savedChats).map((chat: any) => ({
              ...chat,
              createdAt: new Date(chat.createdAt),
              lastUpdated: new Date(chat.lastUpdated),
              mode: chat.mode || "chat", // Ensure mode is set for existing chats
            }))
            setChats(parsedChats)
          } catch (error) {
            console.error("Failed to load chat history:", error)
            setChats([])
          }
        }
      } catch (error) {
        console.error("Failed to initialize app:", error)
        toast({
          title: "Initialization Error",
          description: "Failed to load saved preferences",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    initializeApp()
  }, [toast])

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(sidebarCollapsed))
  }, [sidebarCollapsed])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + N for new chat
      if ((event.ctrlKey || event.metaKey) && event.key === "n") {
        event.preventDefault()
        handleNewChat() // Use the new handleNewChat function
      }

      // Ctrl/Cmd + B to toggle sidebar
      if ((event.ctrlKey || event.metaKey) && event.key === "b") {
        event.preventDefault()
        setSidebarCollapsed(!sidebarCollapsed)
      }

      if ((event.ctrlKey || event.metaKey) && event.key === "m") {
        event.preventDefault()
        // This will be handled by the Header component
        document.dispatchEvent(new CustomEvent("openModelModal"))
      }

      // Escape to close modals (handled by individual components)
      if (event.key === "Escape") {
        // Let individual components handle this
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [sidebarCollapsed, toast])

  const handleModelsChange = (models: string[]) => {
    const newMode = getCurrentMode()

    setSelectedModels(models)
    setCurrentMode(newMode)
    localStorage.setItem("selectedModels", JSON.stringify(models))

    if (models.length > 0) {
      toast({
        title: "Models Updated",
        description: `Switched to ${newMode} mode with ${models.length} model${models.length > 1 ? "s" : ""} selected`,
      })
    }
  }

  const handleModeChange = (mode: "chat" | "image") => {
    setCurrentMode(mode)
  }

  const handleSendMessage = async (message: string) => {
    const openrouterKey = localStorage.getItem("openrouter_api_key")
    const falKey = localStorage.getItem("fal_api_key")
    const mode = getCurrentMode()

    console.log("[AI Piesta] Send Message - Mode:", mode)
    console.log("[AI Piesta] Selected Models:", selectedModels)
    console.log("[AI Piesta] OpenRouter Key Available:", !!openrouterKey)
    console.log("[AI Piesta] Fal Key Available:", !!falKey)

    if (!checkApiKeys()) {
              console.log("[AI Piesta] API keys missing, showing modal")
      setShowApiKeyModal(true)
      toast({
        title: "API Key Required",
        description: `Please add your ${mode === "image" ? "Fal.ai" : "OpenRouter"} API key to continue`,
        variant: "destructive",
      })
      return
    }

    if (selectedModels.length === 0) {
      toast({
        title: "No Models Selected",
        description: "Please select models to compare responses",
        variant: "destructive",
      })
      return
    }

    const chatId = currentChatId || `chat-${Date.now()}`
    setCurrentChatId(chatId)

    // Create new chat only if we don't have a current one
    if (!currentChatId) {
      const newChat: Chat = {
        id: chatId,
        timestamp: new Date().toLocaleString(),
        preview: message.substring(0, 100) + (message.length > 100 ? "..." : ""),
        models: selectedModels,
        messageCount: 1,
        createdAt: new Date(),
        lastUpdated: new Date(),
        mode: mode,
        messages: {},
      }

      setChats((prev) => {
        const updated = [newChat, ...prev]
        localStorage.setItem("chatHistory", JSON.stringify(updated))
        return updated
      })
    }

    // Add user message to all models
    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      type: "user",
      content: message,
      timestamp: new Date().toLocaleTimeString(),
    }

    const newMessagesMap = { ...messagesMap }
    selectedModels.forEach((modelId) => {
      if (!newMessagesMap[modelId]) newMessagesMap[modelId] = []
      newMessagesMap[modelId] = [...newMessagesMap[modelId], userMessage]
    })
    setMessagesMap(newMessagesMap)

    // Start generating for all models
    setGeneratingModels(new Set(selectedModels))

    // Send to all models simultaneously with real API calls
    const promises = selectedModels.map(async (modelId) => {
      try {
        const conversationHistory = newMessagesMap[modelId] || []
        const apiMessages = conversationHistory.map((msg) => ({
          role: msg.type === "user" ? "user" : "assistant",
          content: msg.content,
        }))

        const response = await fetch("/api/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key-OpenRouter": localStorage.getItem("openrouter_api_key") || "",
            "X-API-Key-Fal": localStorage.getItem("fal_api_key") || "",
            "X-API-Key-HuggingFace": localStorage.getItem("huggingface_api_key") || "",
          },
          body: JSON.stringify({
            model: modelId,
            messages: apiMessages,
            temperature: 0.7,
            max_tokens: mode === "image" ? 1 : 1000,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.log("[AI Piesta] API Error Response:", errorData)

          if (response.status === 401 && errorData.error === "API_KEY_REQUIRED") {
            setShowApiKeyModal(true)
            toast({
              title: "API Key Required",
              description: errorData.message || "Please add your API key to continue",
              variant: "destructive",
            })
            return
          }

          throw new Error(`API request failed: ${response.status} - ${errorData.message || errorData.error}`)
        }

        const result = await response.json()

        const assistantMessage: Message = {
          id: `msg-${Date.now()}-assistant-${modelId}`,
          type: "assistant",
          content: result.choices?.[0]?.message?.content || "No response generated",
          timestamp: new Date().toLocaleTimeString(),
          trustScore: result.trust_score,
          responseTime: result.response_time,
          tokenCount: result.usage?.total_tokens,
          imageUrl: mode === "image" ? result.choices?.[0]?.message?.content : undefined,
          model: modelId,
        }

        setMessagesMap((prev) => ({
          ...prev,
          [modelId]: [...(prev[modelId] || []), assistantMessage],
        }))

        setChats((prev) => {
          const updated = prev.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  lastUpdated: new Date(),
                  messageCount: (chat.messages[modelId]?.length || 0) + 2, // +2 for user and assistant message
                  preview: message.substring(0, 100) + (message.length > 100 ? "..." : ""), // Update preview with latest message
                  messages: {
                    ...chat.messages,
                    [modelId]: [...(chat.messages[modelId] || []), userMessage, assistantMessage],
                  },
                }
              : chat,
          )
          localStorage.setItem("chatHistory", JSON.stringify(updated))
          return updated
        })
      } catch (error) {
        console.error(`[AI Piesta] Failed to get response from ${modelId}:`, error)

        const errorMessage: Message = {
          id: `msg-${Date.now()}-error-${modelId}`,
          type: "assistant",
          content: `Error: Failed to get response. Please check your API keys and try again.`,
          timestamp: new Date().toLocaleTimeString(),
          model: modelId,
        }

        setMessagesMap((prev) => ({
          ...prev,
          [modelId]: [...(prev[modelId] || []), errorMessage],
        }))

        toast({
          title: "Response Failed",
          description: `Failed to get response from ${modelId}. Check API keys.`,
          variant: "destructive",
        })
      } finally {
        setGeneratingModels((prev) => {
          const newSet = new Set(prev)
          newSet.delete(modelId)
          return newSet
        })
      }
    })

    await Promise.all(promises)
  }

  if (isLoading) {
    return (
      <div className="h-screen bg-zinc-800 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center"
        >
          <motion.div
            className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-6"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          />
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold text-white mb-2"
          >
            AI<span className="text-green-400">Piesta</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-zinc-400"
          >
            Loading your AI workspace...
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-4 flex justify-center space-x-1"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-lime-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Number.POSITIVE_INFINITY, delay: i * 0.2 }}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="h-screen bg-zinc-800 text-white flex flex-col overflow-hidden"
    >
      <Header selectedModels={selectedModels} onModelsChange={handleModelsChange} onModeChange={handleModeChange} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          currentChatId={currentChatId}
          onChatSelect={setCurrentChatId}
          chats={chats}
          onChatsChange={setChats}
          onLoadChat={handleLoadChat}
          onNewChat={handleNewChat}
        />

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex-1 flex flex-col min-h-0"
        >
          <div className="flex-1 overflow-hidden pb-0">
            <SplitScreen
              models={selectedModels}
              chatId={currentChatId}
              onModelsChange={handleModelsChange}
              messagesMap={messagesMap}
              generatingModels={generatingModels}
              mode={getCurrentMode()}
            />
          </div>

          <div className="flex-shrink-0">
            <ChatInput
              onSendMessage={handleSendMessage}
              disabled={selectedModels.length === 0 || generatingModels.size > 0}
              mode={getCurrentMode()}
              modelCount={selectedModels.length}
            />
          </div>
        </motion.div>
      </div>

      <Toaster />

      <ApiKeyModal open={showApiKeyModal} onOpenChange={setShowApiKeyModal} mode={getCurrentMode()} />




    </motion.div>
  )
}
