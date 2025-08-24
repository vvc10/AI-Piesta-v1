"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Settings, ChevronDown } from "lucide-react"
import { ModelSelectionModal } from "./model-selection-modal"
import { SettingsModal } from "./settings-modal"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface HeaderProps {
  selectedModels: string[]
  onModelsChange: (models: string[]) => void
}

export function Header({ selectedModels, onModelsChange }: HeaderProps) {
  const [showModelModal, setShowModelModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)

  return (
    <>
      <header className="h-[60px] bg-zinc-900 border-b border-zinc-700 flex items-center justify-between px-6 sticky top-0 z-50 shadow-lg">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center space-x-2 text-xl font-bold text-white hover:opacity-80 transition-opacity"
          >
            <img 
              src="/logo_brand.png" 
              alt="AI Piesta Logo" 
              className="h-8 w-8 object-contain"
            />
            <span>AI<span className="text-lime-500">Piesta</span></span>
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <Button
            onClick={() => setShowModelModal(true)}
            className="bg-transparent border border-lime-500 text-lime-500 hover:bg-lime-500 hover:text-black font-medium px-4 py-2 transition-all duration-200 hover:scale-105"
          >
            Select Models ({selectedModels.length}/5)
            {/* <kbd className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-black/20 text-black/70 font-mono text-xs rounded border border-black/30">
              Ctrl+M
            </kbd> */}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettingsModal(true)}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <Settings className="h-5 w-5" />
          </Button>

          {/* <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center space-x-2"
              >
                <div className="w-8 h-8 bg-lime-500 rounded-full flex items-center justify-center text-black font-semibold text-sm">
                  U
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-800 border-zinc-700 text-white">
              <DropdownMenuItem className="hover:bg-zinc-700">Profile Settings</DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-zinc-700">API Keys</DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-zinc-700 text-red-400">Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu> */}
        </div>
      </header>

      <ModelSelectionModal
        open={showModelModal}
        onOpenChange={setShowModelModal}
        selectedModels={selectedModels}
        onModelsChange={onModelsChange}
      />

      <SettingsModal open={showSettingsModal} onOpenChange={setShowSettingsModal} />
    </>
  )
}
