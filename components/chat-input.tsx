"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Send, Sparkles, ImageIcon, MessageSquare, Zap, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

interface ChatInputProps {
  onSendMessage: (message: string) => void
  disabled?: boolean
  mode: "chat" | "image" | "mixed"
  modelCount: number
}

export function ChatInput({ onSendMessage, disabled, mode, modelCount }: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [isImproving, setIsImproving] = useState(false)
  const { toast } = useToast()

  const handleSend = () => {
    if (!message.trim() || disabled) return
    onSendMessage(message)
    setMessage("")
  }

  const handleImprovePrompt = async () => {
    if (!message.trim() || disabled || isImproving) return
    
    setIsImproving(true)
    try {
      const improvedPrompt = await apiClient.refinePrompt(
        message,
        mode === "image" ? "image_generation" : "text_generation",
        "openai/gpt-4"
      )
      
      if (improvedPrompt.refined_prompt) {
        setMessage(improvedPrompt.refined_prompt)
        toast({
          title: improvedPrompt.fallback_used ? "Prompt Enhanced (Local)" : "Prompt Improved!",
          description: improvedPrompt.fallback_used 
            ? "Your prompt has been enhanced using local improvements."
            : "Your prompt has been enhanced for better results.",
        })
      }
    } catch (error) {
      console.error("Failed to improve prompt:", error)
      toast({
        title: "Improvement Failed",
        description: "Could not improve your prompt. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsImproving(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const getPlaceholder = () => {
    if (modelCount === 0) return "Select models to start comparing..."
    if (mode === "image") return "Describe the image you want to generate..."
    return "Type your message to compare responses..."
  }

  const getModeIcon = () => {
    if (mode === "image") return <ImageIcon className="h-4 w-4" />
    return <MessageSquare className="h-4 w-4" />
  }

  const getModeColor = () => {
    if (mode === "image") return "bg-purple-500/20 text-purple-300 border-purple-500/30"
    return "bg-blue-500/20 text-blue-300 border-blue-500/30"
  }

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="border-t border-zinc-700 bg-zinc-900 p-6"
    >
      <div className="max-w-4xl mx-auto">
        {/* Modern Input Box */}
        <div className="relative mb-6">
          <div className="relative bg-zinc-800/50 border border-zinc-600/50 rounded-2xl p-4 shadow-lg backdrop-blur-sm">
            <Textarea
              placeholder={getPlaceholder()}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={disabled}
              className="min-h-[80px] max-h-[200px] bg-transparent border-none text-white placeholder-zinc-400 resize-none pr-20 focus:outline-none focus:ring-0 text-base leading-relaxed"
            />
            
            {/* Left-side Icons */}
            <div className="absolute bottom-4 left-4 flex items-center space-x-3">
              {/* <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded-lg transition-all duration-200"
                disabled={disabled}
              >
                <ImageIcon className="h-4 w-4" />
              </Button> */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleImprovePrompt}
                disabled={disabled || !message.trim() || isImproving}
                className="h-8 w-8 text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-500/20 rounded-lg transition-all duration-200 disabled:opacity-50"
                title="Improve prompt"
              >
                {isImproving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Right-side Controls */}
            <div className="absolute bottom-4 right-4 flex items-center space-x-3">
              {/* <div className="flex items-center space-x-2 text-zinc-400 text-sm">
                <span className="font-medium">AI Piesta</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-zinc-400 hover:text-white"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Button>
              </div> */}
              
              <Button
                onClick={handleSend}
                disabled={!message.trim() || disabled}
                className="h-10 w-10 bg-lime-500 hover:bg-lime-600 text-black rounded-full transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-lg"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>



        {/* Status Info */}
        <div className="flex items-center justify-between mt-4 text-xs text-zinc-500">
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className={`${getModeColor()} border-zinc-600/50`}>
              {getModeIcon()}
              <span className="ml-1 capitalize">{mode} Mode</span>
            </Badge>
            {modelCount > 0 && (
              <Badge variant="secondary" className="bg-zinc-700/50 text-zinc-300 border-zinc-600/50">
                {modelCount} model{modelCount > 1 ? "s" : ""} active
              </Badge>
            )}
          </div>

          {disabled && modelCount > 0 && (
            <div className="flex items-center space-x-1 text-green-400 text-sm">
              <Zap className="h-3 w-3" />
              <span>Generating responses...</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
