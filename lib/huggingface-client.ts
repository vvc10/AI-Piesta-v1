interface HuggingFaceImageRequest {
  prompt: string
  model: string
  negative_prompt?: string
  num_inference_steps?: number
  guidance_scale?: number
  width?: number
  height?: number
  num_images?: number
}

interface HuggingFaceImageResponse {
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
}

// Model configurations for different Hugging Face models
const HF_MODELS = {
  "hf-black-forest-labs/flux.1-dev": {
    endpoint: "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev",
    provider: "black-forest-labs",
    maxSteps: 20,
    defaultSteps: 4,
    maxResolution: "1024x1024",
    pricing: "Free tier available",
  },
  "hf-stabilityai/stable-diffusion-xl-base-1.0": {
    endpoint: "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
    provider: "stabilityai",
    maxSteps: 50,
    defaultSteps: 25,
    maxResolution: "1024x1024",
    pricing: "Free tier available",
  },
  "hf-runwayml/stable-diffusion-v1-5": {
    endpoint: "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5",
    provider: "runwayml",
    maxSteps: 50,
    defaultSteps: 25,
    maxResolution: "512x512",
    pricing: "Free tier available",
  },
  "hf-compvis/stable-diffusion-v1-4": {
    endpoint: "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
    provider: "nebius",
    maxSteps: 50,
    defaultSteps: 25,
    maxResolution: "1024x1024",
    pricing: "Free tier available",
  },
}

export async function generateImageWithHuggingFace(
  model: string,
  prompt: string,
  apiKey: string,
  startTime: number,
): Promise<HuggingFaceImageResponse> {
  console.log("[AI Piesta] Hugging Face Image Generation - Model:", model)

  if (!apiKey) {
    throw new Error("Hugging Face API key required")
  }

  const modelConfig = HF_MODELS[model as keyof typeof HF_MODELS]
  if (!modelConfig) {
    throw new Error(`Unsupported Hugging Face model: ${model}`)
  }

  try {
    const requestBody = {
      inputs: prompt,
      parameters: {
        num_inference_steps: modelConfig.defaultSteps,
        guidance_scale: 7.5,
        width: 1024,
        height: 1024,
        negative_prompt: "low quality, blurry, distorted, ugly, bad anatomy",
      },
    }

    console.log("[AI Piesta] Hugging Face request:", JSON.stringify(requestBody, null, 2))

    // Use Nebius provider for specific models
    const useNebius = modelConfig.provider === "nebius"
    const endpoint = useNebius 
      ? "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0"
      : modelConfig.endpoint

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(useNebius && { "X-Provider": "nebius" }),
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[AI Piesta] Hugging Face API error:", response.status, errorText)
      console.error("[AI Piesta] Hugging Face API response headers:", Object.fromEntries(response.headers.entries()))
      
      if (response.status === 401) {
        throw new Error("Invalid Hugging Face API key")
      } else if (response.status === 429) {
        throw new Error("Hugging Face rate limit exceeded. Please try again later.")
      } else if (response.status === 503) {
        throw new Error("Hugging Face model is currently loading. Please try again in a few moments.")
      } else if (response.status === 404) {
        throw new Error("Hugging Face model not found or not available")
      } else {
        throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`)
      }
    }

    const result = await response.arrayBuffer()
    
    // Convert the image data to base64
    const base64Image = Buffer.from(result).toString('base64')
    const dataUrl = `data:image/png;base64,${base64Image}`

    console.log("[AI Piesta] Hugging Face image generated successfully")

    return {
      id: `hf-img-${Date.now()}`,
      object: "image.generation",
      created: Math.floor(Date.now() / 1000),
      model: model,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: dataUrl,
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
    console.error("[AI Piesta] Hugging Face API failed with error:", error)
    throw new Error(`Hugging Face API error: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// Helper function to estimate tokens (same as in main route)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

export { HF_MODELS }
export type { HuggingFaceImageRequest, HuggingFaceImageResponse }
