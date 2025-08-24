"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { Minimize2, X, Info, Sparkles, ImageIcon, RotateCcw, Zap } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

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

interface ModelPanelProps {
  modelId: string
  modelName: string
  modelType: "text" | "image"
  messages: Message[]
  onMinimize: () => void
  onClose: () => void
  minimized?: boolean
  width?: string
  isGenerating?: boolean
}

function ModelPanel({
  modelId,
  modelName,
  modelType,
  messages,
  onMinimize,
  onClose,
  minimized,
  width = "flex-1",
  isGenerating = false,
}: Omit<ModelPanelProps, "onSendMessage">) {
  const [activeTab, setActiveTab] = useState("chat")
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollElement) {
        // Smooth scroll to bottom
        scrollElement.scrollTo({
          top: scrollElement.scrollHeight,
          behavior: 'smooth'
        })
      }
    }
  }, [messages])

  if (minimized) {
    return (
      <motion.div
        initial={{ width: "auto" }}
        animate={{ width: "50px" }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="bg-zinc-800 border-r border-zinc-700 flex flex-col gap-16 items-center py-2 min-w-[50px] relative overflow-hidden"
      >
        {isGenerating && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"
          />
        )}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onMinimize}
                className="text-zinc-400 hover:text-white mb-2 h-6 w-6"
              >
                <Minimize2 className="h-3 w-3 rotate-180" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Expand {modelName}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="text-xs text-zinc-400 transform rotate-90 whitespace-nowrap w-fit mt-4">{modelName}</div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ width: "50px" }}
      animate={{ width: width }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="bg-zinc-800 border-r border-zinc-700 flex flex-col relative h-full overflow-hidden"
      style={{ width }}
    >
      <div className="h-12 bg-zinc-900 border-b border-zinc-700 flex items-center justify-between px-3 relative">
        {isGenerating && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            className="absolute bottom-0 left-0 h-0.5 bg-green-400 origin-left"
            style={{ width: "100%" }}
          />
        )}

        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-white">{modelName}</span>
          <Badge
            variant="secondary"
            className={`text-xs ${
              modelType === "image" ? "bg-purple-500/20 text-purple-300" : "bg-blue-500/20 text-blue-300"
            }`}
          >
            {modelType}
          </Badge>

          {/* {isGenerating && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center space-x-1"
            >
              <Zap className="h-3 w-3 text-green-400" />
              <span className="text-xs text-green-400">Generating</span>
            </motion.div>
          )} */}
{/* 
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-400 hover:text-white">
                  <Info className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-sm">
                  <p className="font-medium">{modelName}</p>
                  <p className="text-zinc-400">Type: {modelType}</p>
                  <p className="text-zinc-400">Status: {isGenerating ? "Generating" : "Ready"}</p>
                  <p className="text-zinc-400">Messages: {messages.length}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider> */}
        </div>

        <div className="flex items-center space-x-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onMinimize}
                  className="h-6 w-6 text-zinc-400 hover:text-white"
                >
                  <Minimize2 className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Minimize panel</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-6 w-6 text-zinc-400 hover:text-red-400"
                >
                  <X className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Close panel</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* {modelType === "image" ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 bg-zinc-900 rounded-none border-b border-zinc-700 flex-shrink-0">
            <TabsTrigger value="chat" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-green-400">
              Chat
            </TabsTrigger>
            <TabsTrigger value="image" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-green-400">
              <ImageIcon className="h-4 w-4 mr-1" />
              Image
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 flex flex-col m-0 min-h-0 overflow-hidden">
            <ChatInterface messages={messages} isGenerating={isGenerating} scrollAreaRef={scrollAreaRef} />
          </TabsContent>

          <TabsContent value="image" className="flex-1 flex flex-col m-0 min-h-0 overflow-hidden">
            <ImageInterface messages={messages} isGenerating={isGenerating} />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="flex-1 min-h-0 overflow-hidden">
          <ChatInterface messages={messages} isGenerating={isGenerating} scrollAreaRef={scrollAreaRef} />
        </div>
      )} */}

<div className="flex-1 min-h-0 overflow-hidden">
          <ChatInterface messages={messages} isGenerating={isGenerating} scrollAreaRef={scrollAreaRef} />
        </div>
        
    </motion.div>
  )
}

function ChatInterface({
  messages,
  isGenerating,
  scrollAreaRef,
}: {
  messages: Message[]
  isGenerating: boolean
  scrollAreaRef: React.RefObject<HTMLDivElement>
}) {
  // Helper function to check if content is a base64 image
  const isBase64Image = (content: string): boolean => {
    return content.startsWith('data:image/') && content.includes('base64,')
  }

  // Helper function to get image source
  const getImageSource = (message: Message): string | null => {
    if (message.imageUrl) return message.imageUrl
    if (isBase64Image(message.content)) return message.content
    return null
  }

  // Helper function to download image
  const downloadImage = (imageSource: string, prompt: string) => {
    const link = document.createElement('a')
    link.href = imageSource
    link.download = `generated-image-${prompt.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30)}-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <ScrollArea className="flex-1 p-4 pb-4 h-full scroll-smooth" ref={scrollAreaRef}>
      <AnimatePresence>
        <div className="space-y-4">
          {messages.map((message, index) => {
            const imageSource = getImageSource(message)
            const isImageMessage = imageSource !== null

            return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                  className={`max-w-[80%] p-4 shadow-sm ${
                    message.type === "user" 
                      ? "bg-lime-500/10 border border-lime-500/50 text-white backdrop-blur-sm rounded-2xl rounded-br-none" 
                      : "bg-zinc-800/80 border border-zinc-600/50 text-white backdrop-blur-sm rounded-2xl rounded-bl-none"
                  }`}
                >
                  {isImageMessage ? (
                    <div className="space-y-3">
                      {/* Show the prompt if it's an image generation */}
                      {message.type === "assistant" && (
                        <div className="text-sm text-zinc-300 italic">
                          Generated image for: "{messages[index - 1]?.content || 'your prompt'}"
                        </div>
                      )}
                      
                      {/* Display the image */}
                      <div className="relative group">
                        <img
                          src={imageSource}
                          alt="Generated image"
                          className="w-full max-w-md rounded-lg border border-zinc-600 shadow-lg"
                          style={{ maxHeight: '400px', objectFit: 'contain' }}
                        />
                        
                        {/* Hover overlay for download */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={() => downloadImage(imageSource, messages[index - 1]?.content || 'generated-image')}
                            className="bg-zinc-800 hover:bg-zinc-700 text-white"
                          >
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  )}
                  
                <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                  <span>{message.timestamp}</span>
                  {message.type === "assistant" && (
                    <div className="flex items-center space-x-2">
                      {message.trustScore && (
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            message.trustScore >= 80
                                ? "bg-lime-500/20 text-lime-400"
                              : message.trustScore >= 60
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          Trust: {message.trustScore}%
                        </Badge>
                      )}
                      {message.responseTime && <span>{message.responseTime}ms</span>}
                        {message.model && (
                          <Badge variant="outline" className="text-xs border-zinc-600 text-zinc-400">
                            {message.model}
                          </Badge>
                        )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
            )
          })}

          {isGenerating && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-zinc-800/80 border border-zinc-600/50 text-white p-4 rounded-2xl rounded-bl-none shadow-sm backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-green-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-green-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <span className="text-sm text-zinc-400">Generating response...</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </AnimatePresence>
    </ScrollArea>
  )
}

function ImageInterface({
  messages,
  isGenerating,
}: {
  messages: Message[]
  isGenerating: boolean
}) {
  // Helper function to check if content is a base64 image
  const isBase64Image = (content: string): boolean => {
    return content.startsWith('data:image/') && content.includes('base64,')
  }

  // Helper function to get image source
  const getImageSource = (message: Message): string | null => {
    if (message.imageUrl) return message.imageUrl
    if (isBase64Image(message.content)) return message.content
    return null
  }

  // Helper function to download image
  const downloadImage = (imageSource: string, prompt: string) => {
    const link = document.createElement('a')
    link.href = imageSource
    link.download = `generated-image-${prompt.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30)}-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Filter only assistant messages with images
  const imageMessages = messages.filter(message => 
    message.type === "assistant" && getImageSource(message) !== null
  )

  return (
    <ScrollArea className="flex-1 p-4 pb-4 h-full scroll-smooth">
      {imageMessages.length === 0 && !isGenerating ? (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <ImageIcon className="h-16 w-16 text-zinc-600 mb-4" />
          <h3 className="text-lg font-medium text-zinc-300 mb-2">No Images Generated Yet</h3>
          <p className="text-sm text-zinc-500">
            Generate your first image by typing a prompt in the chat tab
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {imageMessages.map((message, index) => {
            const imageSource = getImageSource(message)
            const userPrompt = messages[index - 1]?.content || 'Unknown prompt'
            
            return (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="relative group cursor-pointer bg-zinc-800 rounded-lg p-3 border border-zinc-700 hover:border-zinc-600 transition-colors"
          >
                {/* Image */}
                <div className="relative mb-3">
              <img
                    src={imageSource}
                alt="Generated image"
                    className="w-full h-48 object-cover rounded-lg border border-zinc-600"
              />
                  
                  {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={() => downloadImage(imageSource, userPrompt)}
                      className="bg-zinc-800 hover:bg-zinc-700 text-white"
                    >
                      Download
              </Button>
                  </div>
                </div>

                {/* Image details */}
                <div className="space-y-2">
                  <p className="text-sm text-zinc-300 line-clamp-2" title={userPrompt}>
                    "{userPrompt}"
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>{message.timestamp}</span>
                    {message.model && (
                      <Badge variant="outline" className="text-xs border-zinc-600 text-zinc-400">
                        {message.model.replace('fal-ai/', '').replace('hf-', '')}
                      </Badge>
                    )}
                  </div>
                  
                  {message.responseTime && (
                    <div className="text-xs text-zinc-500">
                      Generated in {message.responseTime}ms
                    </div>
                  )}
            </div>
          </motion.div>
            )
          })}

        {isGenerating && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full h-48 bg-zinc-800 rounded-lg border border-zinc-600 flex items-center justify-center"
            >
            <div className="text-center">
                <RotateCcw className="h-8 w-8 animate-spin text-green-400 mx-auto mb-3" />
                <p className="text-sm text-zinc-400 font-medium">Generating image...</p>
                <p className="text-xs text-zinc-500 mt-1">This may take a few moments</p>
            </div>
            </motion.div>
          )}
          </div>
        )}
    </ScrollArea>
  )
}

interface SplitScreenProps {
  models: string[]
  chatId: string | null
  onModelsChange?: (models: string[]) => void
  messagesMap: Record<string, Message[]>
  generatingModels: Set<string>
  mode: "chat" | "image" | "mixed"
}

export function SplitScreen({ models, chatId, onModelsChange, messagesMap, generatingModels, mode }: SplitScreenProps) {
  const [minimizedPanels, setMinimizedPanels] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const CHAT_MODELS = [
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
  ]

  const handleMinimize = (modelId: string) => {
    setMinimizedPanels((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(modelId)) {
        newSet.delete(modelId)
      } else {
        newSet.add(modelId)
      }
      return newSet
    })
  }

  const handleClose = (modelId: string) => {
    if (onModelsChange) {
      const updatedModels = models.filter((id) => id !== modelId)
      onModelsChange(updatedModels)

      toast({
        title: "Model Removed",
        description: `${getModelName(modelId)} panel closed`,
      })
    }
  }

  const getModelName = (modelId: string) => {
    const modelNames: Record<string, string> = {
      "meta-llama/llama-3.2-90b-vision-instruct": "Llama 3.2 90B Vision",
      "microsoft/wizardlm-2-8x22b": "WizardLM-2 8x22B",
      "google/gemma-2-27b-it": "Gemma 2 27B",
      "qwen/qwen-2.5-72b-instruct": "Qwen 2.5 72B",
      "mistralai/mixtral-8x22b-instruct": "Mixtral 8x22B",
      "fal-ai/flux-pro/v1.1": "FLUX.1 [pro]",
      "fal-ai/flux-dev": "FLUX.1 [dev]",
      "fal-ai/stable-diffusion-v3-medium": "Stable Diffusion 3 Medium",
      "fal-ai/playground-v2.5": "Playground v2.5",
      "fal-ai/recraft-v3": "Recraft V3",
    }
    return modelNames[modelId] || modelId
  }

  const getModelType = (modelId: string): "text" | "image" => {
            console.log("[AI Piesta] Split-Screen - Checking model type for:", modelId)
        console.log("[AI Piesta] Split-Screen - Is in IMAGE_MODELS:", IMAGE_MODELS.includes(modelId))
        console.log("[AI Piesta] Split-Screen - Is in CHAT_MODELS:", CHAT_MODELS.includes(modelId))

    if (IMAGE_MODELS.includes(modelId)) return "image"
    if (CHAT_MODELS.includes(modelId)) return "text"
    return "text" // Default fallback
  }

  const visibleModels = models.filter((modelId) => !minimizedPanels.has(modelId))
  const minimizedCount = minimizedPanels.size
  const totalMinimizedWidth = minimizedCount * 50
  const availableWidth = `calc(100% - ${totalMinimizedWidth}px)`
  const panelWidth = visibleModels.length > 0 ? `calc(${availableWidth} / ${visibleModels.length})` : "100%"

  if (models.length === 0) {
    return (
      <div className="h-full bg-zinc-800 flex items-center justify-center overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-zinc-400 max-w-md"
        >
          <div className="w-16 h-16 bg-zinc-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-8 w-8 text-zinc-500" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No Models Selected</h2>
          <p className="mb-4">
            Select AI models from the header to start comparing responses. Choose either chat models OR image models for
            fair comparison.
          </p>
          <div className="text-sm text-zinc-500">
            <p>
              💡 Current Mode: <span className="capitalize">{mode}</span>
            </p>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="h-full flex overflow-hidden">
      <AnimatePresence>
        {models.map((modelId) => (
          <ModelPanel
            key={modelId}
            modelId={modelId}
            modelName={getModelName(modelId)}
            modelType={getModelType(modelId)}
            messages={messagesMap[modelId] || []}
            onMinimize={() => handleMinimize(modelId)}
            onClose={() => handleClose(modelId)}
            minimized={minimizedPanels.has(modelId)}
            width={minimizedPanels.has(modelId) ? "50px" : panelWidth}
            isGenerating={generatingModels.has(modelId)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
