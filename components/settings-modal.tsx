"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [offlineMode, setOfflineMode] = useState(false)
  const [falApiKey, setFalApiKey] = useState("")
  const [openrouterApiKey, setOpenrouterApiKey] = useState("")
  const [huggingfaceApiKey, setHuggingfaceApiKey] = useState("")
  const [autoSave, setAutoSave] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      const savedFalKey = localStorage.getItem("fal_api_key") || ""
      const savedOpenrouterKey = localStorage.getItem("openrouter_api_key") || ""
      const savedHuggingfaceKey = localStorage.getItem("huggingface_api_key") || ""
      setFalApiKey(savedFalKey)
      setOpenrouterApiKey(savedOpenrouterKey)
      setHuggingfaceApiKey(savedHuggingfaceKey)
    }
  }, [open])

  const handleSave = () => {
    try {
      if (falApiKey.trim()) {
        localStorage.setItem("fal_api_key", falApiKey.trim())
      }
      if (openrouterApiKey.trim()) {
        localStorage.setItem("openrouter_api_key", openrouterApiKey.trim())
      }
      if (huggingfaceApiKey.trim()) {
        localStorage.setItem("huggingface_api_key", huggingfaceApiKey.trim())
      }

      toast({
        title: "Settings Saved",
        description: "Your API keys have been saved locally",
      })

      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save settings",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <DialogHeader>
            <DialogTitle className="text-xl">Settings</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="api" className="mt-4">
            <TabsList className="grid w-full grid-cols-3 bg-zinc-800">
              <TabsTrigger value="general" className="data-[state=active]:bg-lime-500 data-[state=active]:text-black">
                General
              </TabsTrigger>
              <TabsTrigger value="api" className="data-[state=active]:bg-lime-500 data-[state=active]:text-black">
                API Keys
              </TabsTrigger>
              <TabsTrigger value="advanced" className="data-[state=active]:bg-lime-500 data-[state=active]:text-black">
                Advanced
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Offline Mode</Label>
                  <p className="text-xs text-zinc-400">Route queries to local Ollama models</p>
                </div>
                <Switch
                  checked={offlineMode}
                  onCheckedChange={setOfflineMode}
                  className="data-[state=checked]:bg-lime-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Auto-save Chats</Label>
                  <p className="text-xs text-zinc-400">Automatically save chat history</p>
                </div>
                <Switch
                  checked={autoSave}
                  onCheckedChange={setAutoSave}
                  className="data-[state=checked]:bg-lime-500"
                />
              </div>
            </TabsContent>

            <TabsContent value="api" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="openrouter-api-key" className="text-sm font-medium">
                  OpenRouter API Key
                </Label>
                <Input
                  id="openrouter-api-key"
                  type="password"
                  placeholder="Enter your OpenRouter API key for chat models"
                  value={openrouterApiKey}
                  onChange={(e) => setOpenrouterApiKey(e.target.value)}
                  className="bg-zinc-800 border-zinc-600 text-white placeholder-zinc-400"
                />
                <p className="text-xs text-zinc-400">Required for chat models like Llama, Phi-3, Gemma, etc.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fal-api-key" className="text-sm font-medium">
                  Fal.ai API Key
                </Label>
                <Input
                  id="fal-api-key"
                  type="password"
                  placeholder="Enter your Fal.ai API key for image generation"
                  value={falApiKey}
                  onChange={(e) => setFalApiKey(e.target.value)}
                  className="bg-zinc-800 border-zinc-600 text-white placeholder-zinc-400"
                />
                <p className="text-xs text-zinc-400">
                  Required for image generation with Flux.1 and Stable Diffusion models
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="huggingface-api-key" className="text-sm font-medium">
                  Hugging Face API Key
                </Label>
                <Input
                  id="huggingface-api-key"
                  type="password"
                  placeholder="Enter your Hugging Face API key for free image generation"
                  value={huggingfaceApiKey}
                  onChange={(e) => setHuggingfaceApiKey(e.target.value)}
                  className="bg-zinc-800 border-zinc-600 text-white placeholder-zinc-400"
                />
                <p className="text-xs text-zinc-400">
                  Required for free image generation with Hugging Face hosted models
                </p>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Local Model Path</Label>
                <Input
                  placeholder="/path/to/ollama/models"
                  className="bg-zinc-800 border-zinc-600 text-white placeholder-zinc-400"
                />
                <p className="text-xs text-zinc-400">Path to local Ollama models directory</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">GPU Memory Limit (GB)</Label>
                <Input
                  type="number"
                  placeholder="8"
                  className="bg-zinc-800 border-zinc-600 text-white placeholder-zinc-400"
                />
                <p className="text-xs text-zinc-400">Maximum GPU memory to use for local inference</p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-3 pt-6 border-t border-zinc-700">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-zinc-600 text-zinc-300 hover:bg-zinc-800 bg-transparent"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-lime-500 hover:bg-lime-600 text-black font-medium">
              Save Settings
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
