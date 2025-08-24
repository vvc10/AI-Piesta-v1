import { type NextRequest, NextResponse } from "next/server"
import { fal } from "@fal-ai/client"
import { generateImageWithHuggingFace } from "@/lib/huggingface-client"

interface ChatCompletionRequest {
  model: string
  messages: Array<{
    role: "user" | "assistant" | "system"
    content: string
  }>
  stream?: boolean
  temperature?: number
  max_tokens?: number
}

interface ChatCompletionResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  response_time: number
  trust_score?: number
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatCompletionRequest = await request.json()
    const { model, messages, stream = false, temperature = 0.7, max_tokens = 1000 } = body

    const openrouterKey = request.headers.get("X-API-Key-OpenRouter") || process.env.OPENROUTER_API_KEY
    const falKey = request.headers.get("X-API-Key-Fal") || process.env.FAL_KEY
    const huggingfaceKey = request.headers.get("X-API-Key-HuggingFace") || process.env.HUGGINGFACE_API_KEY

    console.log("[AI Piesta] API Request - Model:", model)
    console.log("[AI Piesta] Model starts with 'fal-ai/':", model.startsWith("fal-ai/"))
    console.log("[AI Piesta] Model starts with 'hf-':", model.startsWith("hf-"))
    console.log("[AI Piesta] OpenRouter Key Available:", !!openrouterKey)
    console.log("[AI Piesta] Fal Key Available:", !!falKey)
    console.log("[AI Piesta] Hugging Face Key Available:", !!huggingfaceKey)

    const startTime = Date.now()

    let response: ChatCompletionResponse

    if (model.startsWith("fal-ai/")) {
      // Handle image generation with fal.ai, with fallback to Hugging Face
      response = await handleImageGenerationWithFallback(model, messages, startTime, falKey, huggingfaceKey)
    } else if (model.startsWith("hf-")) {
      // Handle image generation with Hugging Face
      response = await handleHuggingFaceImageGeneration(model, messages, startTime, huggingfaceKey)
    } else {
      // Handle text generation with OpenRouter
      response = await handleTextGeneration(model, messages, temperature, max_tokens, startTime, openrouterKey)
    }

    // Add trust score validation
    if (response.choices[0]?.message?.content) {
      response.trust_score = await calculateTrustScore(response.choices[0].message.content)
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("[AI Piesta] Chat completion error:", error)

    if (error instanceof Error) {
      if (error.message.includes("API key required")) {
        return NextResponse.json(
          {
            error: "API_KEY_REQUIRED",
            message: error.message,
            details: error.message,
          },
          { status: 401 },
        )
      }
    }

    return NextResponse.json(
      { error: "Failed to process chat completion", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

async function handleImageGeneration(
  model: string,
  messages: any[],
  startTime: number,
  apiKey?: string | null,
): Promise<ChatCompletionResponse> {
  const prompt = messages[messages.length - 1]?.content || "A beautiful landscape"

  console.log("[AI Piesta] Image Generation - Model:", model, "API Key Available:", !!apiKey)

  if (!apiKey) {
    throw new Error("Fal.ai API key required")
  }

  try {
    fal.config({
      credentials: apiKey,
      requestMiddleware: (request) => {
        console.log("[AI Piesta] Fal.ai request middleware - URL:", request.url)
        return request
      },
    })

    let falEndpoint = ""

    // Map model IDs to fal.ai endpoints
    switch (model) {
      case "fal-ai/flux-pro/v1.1":
        falEndpoint = "fal-ai/flux-pro/v1.1"
        break
      case "fal-ai/flux-dev":
        falEndpoint = "fal-ai/flux/dev"
        break
      case "fal-ai/stable-diffusion-v3-medium":
        falEndpoint = "fal-ai/stable-diffusion-v3-medium"
        break
      case "fal-ai/playground-v2.5":
        falEndpoint = "fal-ai/playground-v2.5"
        break
      case "fal-ai/recraft-v3":
        falEndpoint = "fal-ai/recraft-v3"
        break
      default:
        falEndpoint = "fal-ai/flux/schnell"
    }

    console.log("[AI Piesta] Calling Fal.ai endpoint:", falEndpoint)

    const input = {
      prompt: prompt,
      image_size: "landscape_4_3",
      num_inference_steps: model.includes("flux") ? 4 : 20,
      num_images: 1,
      enable_safety_checker: false,
    }

    console.log("[AI Piesta] Fal.ai request input:", JSON.stringify(input, null, 2))

    const result = await fal.subscribe(falEndpoint, {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        console.log("[AI Piesta] Fal.ai queue update:", update.status)
        if (update.status === "IN_PROGRESS") {
          update.logs?.map((log) => log.message).forEach((msg) => console.log("[AI Piesta] Fal.ai log:", msg))
        }
      },
    })

    console.log("[AI Piesta] Fal.ai response successful, result:", !!result.data)
    console.log("[AI Piesta] Fal.ai request ID:", result.requestId)
    console.log("[AI Piesta] Fal.ai result data structure:", JSON.stringify(result.data, null, 2))

    const imageUrl = result.data?.images?.[0]?.url || result.data?.image?.url

    if (!imageUrl) {
      console.error("[AI Piesta] No image URL found in fal.ai response:", result.data)
      throw new Error("No image URL returned from fal.ai")
    }

    console.log("[AI Piesta] Generated image URL:", imageUrl)

    return {
      id: `img-${Date.now()}`,
      object: "image.generation",
      created: Math.floor(Date.now() / 1000),
      model: model,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: imageUrl,
          },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: estimateTokens(prompt),
        completion_tokens: 0,
        total_tokens: estimateTokens(prompt),
      },
      response_time: Date.now() - startTime,
    }
  } catch (error) {
    console.error("[AI Piesta] Fal.ai API failed with error:", error)
    console.error("[AI Piesta] Error type:", typeof error)
    console.error("[AI Piesta] Error constructor:", error?.constructor?.name)

    if (error && typeof error === "object" && "status" in error) {
      const apiError = error as any
      console.error("[AI Piesta] ApiError status:", apiError.status)
      console.error("[AI Piesta] ApiError body:", JSON.stringify(apiError.body, null, 2))
      console.error("[AI Piesta] ApiError message:", apiError.message)

      if (apiError.status === 403) {
        if (apiError.body?.detail?.includes?.("Exhausted balance")) {
          throw new Error("Fal.ai account balance exhausted. Please top up at fal.ai/dashboard/billing")
        } else if (apiError.body?.detail?.includes?.("User is locked")) {
          throw new Error("Fal.ai account is locked. Please check your account status at fal.ai/dashboard")
        } else {
          throw new Error("Fal.ai API access forbidden. Please check your API key and account permissions.")
        }
      } else if (apiError.status === 401) {
        throw new Error("Invalid Fal.ai API key. Please check your API key in settings.")
      } else if (apiError.status === 400) {
        throw new Error(`Fal.ai API bad request: ${apiError.body?.detail || "Invalid request parameters"}`)
      }
    }

    if (error instanceof Error) {
      console.error("[AI Piesta] Error message:", error.message)
      console.error("[AI Piesta] Error stack:", error.stack)
      console.error("[AI Piesta] Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)))

      if (error.message.includes("Exhausted balance")) {
        throw new Error("Fal.ai account balance exhausted. Please top up at fal.ai/dashboard/billing")
      }
      if (error.message.includes("User is locked")) {
        throw new Error("Fal.ai account is locked. Please check your account status at fal.ai/dashboard")
      }
      if (error.message.includes("401") || error.message.includes("Unauthorized")) {
        throw new Error("Invalid Fal.ai API key. Please check your API key in settings.")
      }
      if (error.message.includes("403") || error.message.includes("Forbidden")) {
        throw new Error("Fal.ai API access forbidden. Please check your account permissions.")
      }
    }

    throw new Error(`Fal.ai API error: ${error instanceof Error ? error.message : String(error)}`)
  }
}

async function handleImageGenerationWithFallback(
  model: string,
  messages: any[],
  startTime: number,
  falKey?: string | null,
  huggingfaceKey?: string | null,
): Promise<ChatCompletionResponse> {
  const prompt = messages[messages.length - 1]?.content || "A beautiful landscape"

      console.log("[AI Piesta] Image Generation with Fallback - Model:", model)
    console.log("[AI Piesta] Fal.ai Key Available:", !!falKey)
    console.log("[AI Piesta] Hugging Face Key Available:", !!huggingfaceKey)

  // Try Fal.ai first
  if (falKey) {
    try {
      console.log("[AI Piesta] Attempting Fal.ai generation...")
      return await handleImageGeneration(model, messages, startTime, falKey)
    } catch (error) {
              console.error("[AI Piesta] Fal.ai failed, trying Hugging Face fallback:", error)
      
      // Map Fal.ai model to equivalent Hugging Face model
      const fallbackModel = getFallbackModel(model)
      if (fallbackModel && huggingfaceKey) {
        try {
          console.log("[AI Piesta] Using Hugging Face fallback model:", fallbackModel)
          return await handleHuggingFaceImageGeneration(fallbackModel, messages, startTime, huggingfaceKey)
        } catch (hfError) {
                      console.error("[AI Piesta] Hugging Face fallback also failed:", hfError)
          throw new Error(`Both Fal.ai and Hugging Face failed. Fal.ai error: ${error instanceof Error ? error.message : String(error)}. Hugging Face error: ${hfError instanceof Error ? hfError.message : String(hfError)}`)
        }
      } else {
        throw error // Re-throw original Fal.ai error if no fallback available
      }
    }
  } else if (huggingfaceKey) {
    // No Fal.ai key, try Hugging Face directly
    const fallbackModel = getFallbackModel(model)
    if (fallbackModel) {
      console.log("[AI Piesta] No Fal.ai key, using Hugging Face model:", fallbackModel)
      return await handleHuggingFaceImageGeneration(fallbackModel, messages, startTime, huggingfaceKey)
    }
  }

  throw new Error("No valid API keys available for image generation")
}

function getFallbackModel(falModel: string): string | null {
  // Map Fal.ai models to equivalent Hugging Face models
  const fallbackMap: Record<string, string> = {
    "fal-ai/flux-pro/v1.1": "hf-black-forest-labs/flux.1-dev",
    "fal-ai/flux-dev": "hf-black-forest-labs/flux.1-dev",
    "fal-ai/stable-diffusion-v3-medium": "hf-stabilityai/stable-diffusion-xl-base-1.0",
    "fal-ai/playground-v2.5": "hf-runwayml/stable-diffusion-v1-5",
    "fal-ai/recraft-v3": "hf-stabilityai/stable-diffusion-xl-base-1.0",
  }
  
  return fallbackMap[falModel] || null
}

async function handleHuggingFaceImageGeneration(
  model: string,
  messages: any[],
  startTime: number,
  apiKey?: string | null,
): Promise<ChatCompletionResponse> {
  const prompt = messages[messages.length - 1]?.content || "A beautiful landscape"

  console.log("[AI Piesta] Hugging Face Image Generation - Model:", model, "API Key Available:", !!apiKey)

  if (!apiKey) {
    throw new Error("Hugging Face API key required")
  }

  try {
    return await generateImageWithHuggingFace(model, prompt, apiKey, startTime)
  } catch (error) {
    console.error("[AI Piesta] Hugging Face API failed:", error)
    throw error
  }
}

async function handleTextGeneration(
  model: string,
  messages: any[],
  temperature: number,
  max_tokens: number,
  startTime: number,
  apiKey?: string | null,
): Promise<ChatCompletionResponse> {
  console.log("[AI Piesta] Text Generation - Model:", model, "API Key Available:", !!apiKey)

  if (!apiKey) {
    throw new Error("OpenRouter API key required")
  }

  try {
    const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "Ai Piesta",
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature,
        max_tokens,
      }),
    })

    if (openRouterResponse.ok) {
      const data = await openRouterResponse.json()
      console.log("[AI Piesta] OpenRouter response successful")

      return {
        id: data.id || `chatcmpl-${Date.now()}`,
        object: "chat.completion",
        created: data.created || Math.floor(Date.now() / 1000),
        model: model,
        choices: data.choices || [
          {
            index: 0,
            message: {
              role: "assistant",
              content: data.choices?.[0]?.message?.content || "Response generated successfully",
            },
            finish_reason: data.choices?.[0]?.finish_reason || "stop",
          },
        ],
        usage: data.usage || {
          prompt_tokens: estimateTokens(messages.map((m) => m.content).join(" ")),
          completion_tokens: estimateTokens(data.choices?.[0]?.message?.content || ""),
          total_tokens: 0,
        },
        response_time: Date.now() - startTime,
      }
    } else {
      console.log("[AI Piesta] OpenRouter API error:", openRouterResponse.status, await openRouterResponse.text())
      throw new Error(`OpenRouter API error: ${openRouterResponse.status}`)
    }
  } catch (error) {
    console.error("[AI Piesta] OpenRouter API failed:", error)
    throw error
  }
}

function createMockTextResponse(model: string, messages: any[], startTime: number): ChatCompletionResponse {
  const lastMessage = messages[messages.length - 1]?.content || ""
  const mockResponses = [
    "I understand your question about " + lastMessage.substring(0, 50) + "... Let me provide a comprehensive answer.",
    "That's an interesting topic. Based on my knowledge, I can explain this concept in detail.",
    "Great question! This is a complex subject that involves several key principles and considerations.",
    "I'd be happy to help you with that. Let me break this down into manageable parts for better understanding.",
  ]

  const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)]

  return {
    id: `chatcmpl-${Date.now()}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: model,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: randomResponse,
        },
        finish_reason: "stop",
      },
    ],
    usage: {
      prompt_tokens: estimateTokens(lastMessage),
      completion_tokens: estimateTokens(randomResponse),
      total_tokens: estimateTokens(lastMessage + randomResponse),
    },
    response_time: Date.now() - startTime,
  }
}

function createMockImageResponse(model: string, prompt: string, startTime: number): ChatCompletionResponse {
  return {
    id: `img-${Date.now()}`,
    object: "image.generation",
    created: Math.floor(Date.now() / 1000),
    model: model,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: `Generated image for: "${prompt}"`,
        },
        finish_reason: "stop",
      },
    ],
    usage: {
      prompt_tokens: estimateTokens(prompt),
      completion_tokens: 0,
      total_tokens: estimateTokens(prompt),
    },
    response_time: Date.now() - startTime,
  }
}

function estimateTokens(text: string): number {
  // Rough estimation: ~4 characters per token
  return Math.ceil(text.length / 4)
}

async function calculateTrustScore(content: string): Promise<number> {
  // Mock trust score calculation
  // In a real implementation, this would use Guardrails AI
  const length = content.length
  const hasNumbers = /\d/.test(content)
  const hasReferences = /\b(according to|research shows|studies indicate)\b/i.test(content)

  let score = 70 // Base score
  if (length > 100) score += 10
  if (hasNumbers) score += 10
  if (hasReferences) score += 10

  return Math.min(100, score + Math.floor(Math.random() * 10))
}
