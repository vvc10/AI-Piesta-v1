export class ApiClient {
  private baseUrl: string

  constructor(baseUrl = "/api") {
    this.baseUrl = baseUrl
  }

  async chatCompletion(model: string, messages: any[], options: any = {}) {
    console.log("[AI Piesta] API Client - Model:", model)
    console.log("[AI Piesta] API Client - Model starts with 'hf-':", model.startsWith("hf-"))
    
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    
    // Add API keys based on model type
    if (model.startsWith("fal-ai/")) {
      const falKey = localStorage.getItem("fal_api_key")
      if (falKey) headers["X-API-Key-Fal"] = falKey
    } else if (model.startsWith("hf-")) {
      const hfKey = localStorage.getItem("huggingface_api_key")
      if (hfKey) headers["X-API-Key-HuggingFace"] = hfKey
    } else {
      const openrouterKey = localStorage.getItem("openrouter_api_key")
      if (openrouterKey) headers["X-API-Key-OpenRouter"] = openrouterKey
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages,
        ...options,
      }),
    })

    if (!response.ok) {
      throw new Error(`Chat completion failed: ${response.statusText}`)
    }

    return response.json()
  }

  async streamChatCompletion(model: string, messages: any[], options: any = {}, onChunk?: (chunk: any) => void) {
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    
    // Add API keys based on model type
    if (model.startsWith("fal-ai/")) {
      const falKey = localStorage.getItem("fal_api_key")
      if (falKey) headers["X-API-Key-Fal"] = falKey
    } else if (model.startsWith("hf-")) {
      const hfKey = localStorage.getItem("huggingface_api_key")
      if (hfKey) headers["X-API-Key-HuggingFace"] = hfKey
    } else {
      const openrouterKey = localStorage.getItem("openrouter_api_key")
      if (openrouterKey) headers["X-API-Key-OpenRouter"] = openrouterKey
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        ...options,
      }),
    })

    if (!response.ok) {
      throw new Error(`Streaming chat completion failed: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error("No response body reader available")
    }

    const decoder = new TextDecoder()
    let buffer = ""

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === "[DONE]") return

            try {
              const chunk = JSON.parse(data)
              onChunk?.(chunk)
            } catch (e) {
              console.warn("Failed to parse chunk:", data)
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  async generateImage(model: string, prompt: string, options: any = {}) {
    return this.chatCompletion(model, [{ role: "user", content: prompt }], options)
  }

  async getChatHistory(chatId?: string) {
    const url = chatId ? `${this.baseUrl}/chat/history?id=${chatId}` : `${this.baseUrl}/chat/history`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to get chat history: ${response.statusText}`)
    }

    return response.json()
  }

  async saveChatHistory(action: string, chatData: any) {
    const response = await fetch(`${this.baseUrl}/chat/history`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, chatData }),
    })

    if (!response.ok) {
      throw new Error(`Failed to save chat history: ${response.statusText}`)
    }

    return response.json()
  }

  async deleteChatHistory(chatId: string) {
    const response = await fetch(`${this.baseUrl}/chat/history?id=${chatId}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      throw new Error(`Failed to delete chat history: ${response.statusText}`)
    }

    return response.json()
  }

  async checkTrust(content: string, model?: string, context?: string) {
    const response = await fetch(`${this.baseUrl}/trust/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, model, context }),
    })

    if (!response.ok) {
      throw new Error(`Trust check failed: ${response.statusText}`)
    }

    return response.json()
  }

  async refinePrompt(prompt: string, taskType?: string, targetModel?: string) {
    const response = await fetch(`${this.baseUrl}/prompt/refine`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        task_type: taskType,
        target_model: targetModel,
      }),
    })

    if (!response.ok) {
      throw new Error(`Prompt refinement failed: ${response.statusText}`)
    }

    return response.json()
  }
}

export const apiClient = new ApiClient()
