"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, ImageIcon, Zap, Brain, Globe } from "lucide-react"

const CHAT_MODELS = [
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    type: "text",
    description: "OpenAI's latest efficient model with strong reasoning capabilities",
    provider: "OpenAI",
    parameters: "Unknown",
    context: "128K",
    pricing: "$0.15/1M tokens",
    features: ["Fast", "Efficient", "Reasoning"],
  },
  {
    id: "deepseek-ai/deepseek-coder-33b-instruct",
    name: "DeepSeek Coder 33B",
    type: "text",
    description: "Specialized coding model with excellent programming capabilities",
    provider: "DeepSeek",
    parameters: "33B",
    context: "16K",
    pricing: "$0.14/1M tokens",
    features: ["Code", "Programming", "Debugging"],
  },
  {
    id: "anthropic/claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    type: "text",
    description: "Anthropic's balanced model with strong reasoning and safety",
    provider: "Anthropic",
    parameters: "Unknown",
    context: "200K",
    pricing: "$3/1M tokens",
    features: ["Reasoning", "Safety", "Analysis"],
  },
  {
    id: "meta-llama/llama-3.2-90b-vision-instruct",
    name: "Llama 3.2 90B Vision",
    type: "text",
    description: "Meta's latest multimodal model with vision capabilities",
    provider: "Meta",
    parameters: "90B",
    context: "128K",
    pricing: "$0.9/1M tokens",
    features: ["Vision", "Code", "Reasoning"],
  },
  {
    id: "microsoft/wizardlm-2-8x22b",
    name: "WizardLM-2 8x22B",
    type: "text",
    description: "Microsoft's advanced reasoning model with MoE architecture",
    provider: "Microsoft",
    parameters: "8x22B",
    context: "64K",
    pricing: "$0.63/1M tokens",
    features: ["Reasoning", "Code", "Math"],
  },
  {
    id: "google/gemma-2-27b-it",
    name: "Gemma 2 27B",
    type: "text",
    description: "Google's efficient open-source instruction-tuned model",
    provider: "Google",
    parameters: "27B",
    context: "8K",
    pricing: "$0.27/1M tokens",
    features: ["Fast", "Efficient", "General"],
  },
  {
    id: "qwen/qwen-2.5-72b-instruct",
    name: "Qwen 2.5 72B",
    type: "text",
    description: "Alibaba's multilingual model with strong coding abilities",
    provider: "Alibaba",
    parameters: "72B",
    context: "32K",
    pricing: "$0.4/1M tokens",
    features: ["Multilingual", "Code", "Math"],
  },
  {
    id: "mistralai/mixtral-8x22b-instruct",
    name: "Mixtral 8x22B",
    type: "text",
    description: "Mistral's sparse mixture of experts model",
    provider: "Mistral AI",
    parameters: "8x22B",
    context: "64K",
    pricing: "$0.65/1M tokens",
    features: ["MoE", "Multilingual", "Code"],
  },
]

const IMAGE_MODELS = [
  {
    id: "fal-ai/flux-pro/v1.1",
    name: "FLUX.1 [pro]",
    type: "image",
    description: "State-of-the-art image generation with exceptional prompt adherence",
    provider: "Black Forest Labs",
    parameters: "12B",
    resolution: "Up to 2048x2048",
    pricing: "$0.055/image",
    features: ["High Quality", "Fast", "Prompt Adherence"],
  },
  {
    id: "fal-ai/flux-dev",
    name: "FLUX.1 [dev]",
    type: "image",
    description: "Open-source image generation model with excellent quality",
    provider: "Black Forest Labs",
    parameters: "12B",
    resolution: "Up to 1440x1440",
    pricing: "$0.025/image",
    features: ["Open Source", "Quality", "Versatile"],
  },
  {
    id: "fal-ai/stable-diffusion-v3-medium",
    name: "Stable Diffusion 3 Medium",
    type: "image",
    description: "Stability AI's latest diffusion model with improved text rendering",
    provider: "Stability AI",
    parameters: "2B",
    resolution: "Up to 1024x1024",
    pricing: "$0.035/image",
    features: ["Text Rendering", "Stable", "Efficient"],
  },
  {
    id: "fal-ai/playground-v2.5",
    name: "Playground v2.5",
    type: "image",
    description: "High-quality aesthetic image generation model",
    provider: "Playground AI",
    parameters: "1.3B",
    resolution: "Up to 1024x1024",
    pricing: "$0.02/image",
    features: ["Aesthetic", "Artistic", "Creative"],
  },
  {
    id: "fal-ai/recraft-v3",
    name: "Recraft V3",
    type: "image",
    description: "Advanced image generation with style control and text integration",
    provider: "Recraft",
    parameters: "20B",
    resolution: "Up to 1024x1024",
    pricing: "$0.04/image",
    features: ["Style Control", "Text Integration", "Brand Safe"],
  },
  // Hugging Face Models
  {
    id: "hf-black-forest-labs/flux.1-dev",
    name: "FLUX.1 [HF]",
    type: "image",
    description: "Hugging Face hosted FLUX.1 model with free tier access",
    provider: "Hugging Face",
    parameters: "12B",
    resolution: "Up to 1024x1024",
    pricing: "Free tier available",
    features: ["Free Tier", "High Quality", "Fast"],
  },
  {
    id: "hf-stabilityai/stable-diffusion-xl-base-1.0",
    name: "SDXL Base 1.0 [HF]",
    type: "image",
    description: "Stability AI's SDXL model hosted on Hugging Face",
    provider: "Hugging Face",
    parameters: "2.6B",
    resolution: "Up to 1024x1024",
    pricing: "Free tier available",
    features: ["Free Tier", "High Quality", "Versatile"],
  },
  {
    id: "hf-runwayml/stable-diffusion-v1-5",
    name: "SD v1.5 [HF]",
    type: "image",
    description: "Runway's Stable Diffusion v1.5 model on Hugging Face",
    provider: "Hugging Face",
    parameters: "1.3B",
    resolution: "Up to 512x512",
    pricing: "Free tier available",
    features: ["Free Tier", "Stable", "Efficient"],
  },
  {
    id: "hf-compvis/stable-diffusion-v1-4",
    name: "SDXL Base 1.0 [HF]",
    type: "image",
    description: "Stability AI's SDXL model via Nebius provider on Hugging Face",
    provider: "Nebius",
    parameters: "2.6B",
    resolution: "Up to 1024x1024",
    pricing: "Free tier available",
    features: ["Free Tier", "High Quality", "SDXL"],
  },
]

interface ModelSelectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedModels: string[]
  onModelsChange: (models: string[]) => void
  onModeChange?: (mode: "chat" | "image") => void
}

export function ModelSelectionModal({
  open,
  onOpenChange,
  selectedModels,
  onModelsChange,
  onModeChange,
}: ModelSelectionModalProps) {
  const [tempSelected, setTempSelected] = useState<string[]>(selectedModels)
  const [activeTab, setActiveTab] = useState<"chat" | "image">("chat")

  const getCurrentMode = (): "chat" | "image" => {
    const chatModels = tempSelected.filter((id) => CHAT_MODELS.some((m) => m.id === id))
    const imageModels = tempSelected.filter((id) => IMAGE_MODELS.some((m) => m.id === id))

    if (imageModels.length > 0 && chatModels.length === 0) return "image"
    if (chatModels.length > 0 && imageModels.length === 0) return "chat"
    return "chat" // Default to chat if mixed or empty
  }

  useEffect(() => {
    if (open) {
      setTempSelected(selectedModels)
      const currentMode = getCurrentMode()
      setActiveTab(currentMode)
    }
  }, [open, selectedModels])

  const handleModelToggle = (modelId: string) => {
    setTempSelected((prev) => {
      if (prev.includes(modelId)) {
        return prev.filter((id) => id !== modelId)
      } else {
        const isImageModel = IMAGE_MODELS.some((m) => m.id === modelId)
        const isChatModel = CHAT_MODELS.some((m) => m.id === modelId)

        // Check limits based on model type
        const currentImageModels = prev.filter((id) => IMAGE_MODELS.some((m) => m.id === id))
        const currentChatModels = prev.filter((id) => CHAT_MODELS.some((m) => m.id === id))

        if (isImageModel && currentImageModels.length >= 3) {
          return prev // Don't add if already at limit
        }
        if (isChatModel && currentChatModels.length >= 5) {
          return prev // Don't add if already at limit
        }

        let newSelection = [...prev, modelId]

        if (isImageModel) {
          newSelection = newSelection.filter((id) => !CHAT_MODELS.some((m) => m.id === id))
          setActiveTab("image")
        }

        if (isChatModel) {
          newSelection = newSelection.filter((id) => !IMAGE_MODELS.some((m) => m.id === id))
          setActiveTab("chat")
        }

        return newSelection
      }
    })
  }

  const handleConfirm = () => {
    onModelsChange(tempSelected)
    localStorage.setItem("selectedModels", JSON.stringify(tempSelected))

    const currentMode = getCurrentMode()
    onModeChange?.(currentMode)

    onOpenChange(false)
  }

  const handleCancel = () => {
    setTempSelected(selectedModels)
    onOpenChange(false)
  }

  const getFeatureIcon = (feature: string) => {
    switch (feature.toLowerCase()) {
      case "vision":
        return <Brain className="w-3 h-3" />
      case "fast":
        return <Zap className="w-3 h-3" />
      case "multilingual":
        return <Globe className="w-3 h-3" />
      default:
        return null
    }
  }

  const renderModelCard = (model: any) => (
    <motion.div
      key={model.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex items-start space-x-3 p-3 min-h-[110px] rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-lg ${
        tempSelected.includes(model.id)
                      ? "border-lime-500 bg-lime-500/10 shadow-lime-500/20"
          : "border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/50"
      }`}
      onClick={() => handleModelToggle(model.id)}
    >
      <Checkbox
        id={model.id}
        checked={tempSelected.includes(model.id)}
        onCheckedChange={() => handleModelToggle(model.id)}
        disabled={
          !tempSelected.includes(model.id) && 
          ((model.type === "image" && tempSelected.filter(id => IMAGE_MODELS.some(m => m.id === id)).length >= 3) ||
           (model.type === "text" && tempSelected.filter(id => CHAT_MODELS.some(m => m.id === id)).length >= 5))
        }
        className="mt-1 flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-2 flex-wrap">
          <span className="font-medium text-lg text-white">{model.name}</span>
          <Badge
            variant="secondary"
            className={`text-xs flex-shrink-0 ${
              model.type === "image" ? "bg-purple-500/20 text-purple-300 border-purple-500/30" : "bg-blue-500/20 text-blue-300 border-blue-500/30"
            }`}
          >
            {model.type === "image" ? (
              <ImageIcon className="w-3 h-3 mr-1" />
            ) : (
              <MessageSquare className="w-3 h-3 mr-1" />
            )}
            {model.type}
          </Badge>
          <Badge variant="outline" className="text-xs border-zinc-600 text-zinc-400 flex-shrink-0">
            {model.parameters}
          </Badge>
        </div>
        <p className="text-sm text-zinc-400 mb-3 leading-relaxed">{model.description}</p>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex flex-wrap gap-1">
            {model.features.slice(0, 3).map((feature: string) => (
              <Badge
                key={feature}
                variant="secondary"
                className="text-xs bg-zinc-800 text-zinc-300 flex items-center gap-1 border border-zinc-700"
              >
                {getFeatureIcon(feature)}
                {feature}
              </Badge>
            ))}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-zinc-500">by {model.provider}</p>
            <p className="text-xs text-green-400 font-mono font-medium">{model.pricing}</p>
          </div>
        </div>
        {(model.type === "text" || model.type === "image") && (
          <p className="text-xs text-zinc-500 mt-2">
            {model.type === "text" ? `Context: ${model.context}` : `Max Resolution: ${model.resolution}`}
          </p>
        )}
      </div>
    </motion.div>
  )

  const currentMode = getCurrentMode()
  const modeText = currentMode === "image" ? "Image Generation Mode" : "Chat Mode"
  const modeColor = currentMode === "image" ? "text-purple-400" : "text-blue-400"

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-6xl w-[98vw] md:w-[95vw] max-h-[90vh] flex flex-col overflow-hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex flex-col h-full"
            >
              <DialogHeader className="flex-shrink-0 pb-4">
                <DialogTitle className="text-xl flex items-center justify-between flex-wrap gap-2">
                  <span className="text-white font-semibold">Select AI Models</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className={`${modeColor} bg-zinc-800 border border-zinc-700`}>
                      {modeText}
                    </Badge>
                    <Badge variant="secondary" className="bg-lime-500/20 text-lime-400 border border-lime-500/30">
                      {tempSelected.length}/{currentMode === "image" ? "3" : "5"} selected
                    </Badge>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="flex-1 flex flex-col min-h-0">
                <Tabs
                  value={activeTab}
                  onValueChange={(value) => setActiveTab(value as "chat" | "image")}
                  className="flex flex-col h-[60vh]"
                >
                  <TabsList className="grid w-full grid-cols-2 bg-zinc-800 border border-zinc-700 flex-shrink-0">
                    <TabsTrigger
                      value="chat"
                      className="flex items-center gap-2 data-[state=active]:bg-lime-500 data-[state=active]:text-black data-[state=active]:font-medium transition-all duration-200"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Chat Models ({CHAT_MODELS.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="image"
                      className="flex items-center gap-2 data-[state=active]:bg-lime-500 data-[state=active]:text-black data-[state=active]:font-medium transition-all duration-200"
                    >
                      <ImageIcon className="w-4 h-4" />
                      Image Models ({IMAGE_MODELS.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="chat" className="flex-1 mt-4 min-h-0 overflow-hidden">
                    <ScrollArea className="h-full max-h-[55vh] md:max-h-[60vh] pr-4 scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-zinc-800">
                      <div className="space-y-3 pb-4">{CHAT_MODELS.map(renderModelCard)}</div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="image" className="flex-1 mt-4 min-h-0 overflow-hidden">
                    <ScrollArea className="h-full max-h-[55vh] md:max-h-[60vh] pr-4 scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-zinc-800">
                      <div className="space-y-3 pb-4">{IMAGE_MODELS.map(renderModelCard)}</div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-zinc-700 flex-shrink-0 z-50">
                <div className="text-sm text-zinc-400 max-w-md">
                  {/* {(() => {
                    const imageModels = tempSelected.filter(id => IMAGE_MODELS.some(m => m.id === id))
                    const chatModels = tempSelected.filter(id => CHAT_MODELS.some(m => m.id === id))
                    const maxImage = 3
                    const maxChat = 5
                    
                    if (imageModels.length > 0 && chatModels.length === 0) {
                      return imageModels.length === maxImage 
                        ? "Maximum image models selected (3)"
                        : `Select up to ${maxImage - imageModels.length} more image models`
                    } else if (chatModels.length > 0 && imageModels.length === 0) {
                      return chatModels.length === maxChat
                        ? "Maximum chat models selected (5)"
                        : `Select up to ${maxChat - chatModels.length} more chat models`
                    } else {
                      return "Select models to compare outputs"
                    }
                  })()} */}
                  {tempSelected.length > 0 && (
                    <div className="text-xs text-zinc-500 mt-1">
                      Image models: max 3, Chat models: max 5
                    </div>
                  )}
                </div>
                <div className="flex space-x-3 flex-shrink-0">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="border-zinc-600 text-zinc-300 hover:bg-zinc-800 bg-transparent hover:border-zinc-500 transition-all duration-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    className="bg-lime-500 hover:bg-lime-600 text-black font-medium transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-lime-500/25"
                    disabled={tempSelected.length === 0}
                  >
                    Confirm Selection
                  </Button>
                </div>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  )
}
