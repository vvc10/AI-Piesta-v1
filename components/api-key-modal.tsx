"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Key, ExternalLink, CheckCircle, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"

interface ApiKeyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "chat" | "image" | "mixed"
}

export function ApiKeyModal({ open, onOpenChange, mode }: ApiKeyModalProps) {
  const [openrouterKey, setOpenrouterKey] = useState("")
  const [falKey, setFalKey] = useState("")

  useEffect(() => {
    if (open) {
      setOpenrouterKey(localStorage.getItem("openrouter_api_key") || "")
      setFalKey(localStorage.getItem("fal_api_key") || "")
    }
  }, [open])

  const handleSave = () => {
    if (mode === "chat" || mode === "mixed") {
      localStorage.setItem("openrouter_api_key", openrouterKey)
    }
    if (mode === "image" || mode === "mixed") {
      localStorage.setItem("fal_api_key", falKey)
    }
    onOpenChange(false)
  }

  const needsOpenRouter = mode === "chat" || mode === "mixed"
  const needsFal = mode === "image" || mode === "mixed"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Key className="h-5 w-5 text-green-400" />
            <span>API Keys Required</span>
          </DialogTitle>
        </DialogHeader>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Alert className="border-yellow-500/50 bg-yellow-500/10">
            <AlertCircle className="h-4 w-4 text-yellow-400" />
            <AlertDescription className="text-yellow-200">
              API keys are required to use the selected models. Keys are stored locally in your browser.
            </AlertDescription>
          </Alert>

          <div className="flex items-center space-x-2 mb-4">
            <Badge variant="outline" className="bg-zinc-800 text-zinc-300 border-zinc-600">
              Current Mode: {mode}
            </Badge>
          </div>

          {needsOpenRouter && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="openrouter-key" className="text-sm font-medium">
                  OpenRouter API Key
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-green-400 hover:text-green-300 p-0 h-auto"
                  onClick={() => window.open("https://openrouter.ai/keys", "_blank")}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Get Key
                </Button>
              </div>
              <Input
                id="openrouter-key"
                type="password"
                placeholder="sk-or-..."
                value={openrouterKey}
                onChange={(e) => setOpenrouterKey(e.target.value)}
                className="bg-zinc-800 border-zinc-600 text-white"
              />
            </div>
          )}

          {needsFal && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="fal-key" className="text-sm font-medium">
                  fal.ai API Key
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-green-400 hover:text-green-300 p-0 h-auto"
                  onClick={() => window.open("https://fal.ai/dashboard/keys", "_blank")}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Get Key
                </Button>
              </div>
              <Input
                id="fal-key"
                type="password"
                placeholder="fal_..."
                value={falKey}
                onChange={(e) => setFalKey(e.target.value)}
                className="bg-zinc-800 border-zinc-600 text-white"
              />
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={(needsOpenRouter && !openrouterKey) || (needsFal && !falKey)}
              className="bg-lime-500 hover:bg-lime-600 text-black"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Save Keys
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
