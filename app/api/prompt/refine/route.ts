import { type NextRequest, NextResponse } from "next/server"

interface PromptRefineRequest {
  prompt: string
  task_type?: "general" | "coding" | "creative" | "analytical" | "image"
  target_model?: string
}

interface PromptRefineResponse {
  original_prompt: string
  refined_prompt: string
  improvements: string[]
  confidence: number
  fallback_used?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body: PromptRefineRequest = await request.json()
    const { prompt, task_type = "general", target_model } = body

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // In a real implementation, this would use LangChain
    const refinedPrompt = await refinePrompt(prompt, task_type, target_model)

    return NextResponse.json(refinedPrompt)
  } catch (error) {
    console.error("Prompt refine error:", error)
    return NextResponse.json({ error: "Failed to refine prompt" }, { status: 500 })
  }
}

async function refinePrompt(prompt: string, taskType: string, targetModel?: string): Promise<PromptRefineResponse> {
  try {
    // Get API key from environment - same as working chat completions
    const openrouterKey = process.env.OPENROUTER_API_KEY
    
    console.log("[AI Piesta] Prompt Refinement - OpenRouter Key Available:", !!openrouterKey)
    
    if (!openrouterKey) {
      throw new Error("OpenRouter API key not configured")
    }

    // Create system prompt for prompt improvement
    const systemPrompt = `You are an expert at improving prompts to make them more effective and specific.

Task Type: ${taskType}
Target Model: ${targetModel || "general"}

Improve the prompt by:
1. Making it more specific and detailed
2. Adding relevant context
3. Using clear, actionable language
4. Optimizing for the task type
5. Keeping the original intent

For image generation: Add style, lighting, and quality details.
For text generation: Add structure and tone preferences.

Return only the improved prompt.`

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Please improve this prompt: "${prompt}"` }
    ]

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openrouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "AI Piesta",
      },
      body: JSON.stringify({
        model: "microsoft/wizardlm-2-8x22b", // Using cheaper model that works with your credits
        messages,
        max_tokens: 150,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[AI Piesta] OpenRouter API error:", response.status, errorText)
      
      if (response.status === 402) {
        throw new Error("OpenRouter credits exhausted - using local improvement")
      }
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const refinedPrompt = data.choices[0]?.message?.content?.trim()

    if (!refinedPrompt) {
      throw new Error("No refined prompt received")
    }

    // Analyze improvements made
    const improvements: string[] = []
    
    if (refinedPrompt.length > prompt.length) {
      improvements.push("Enhanced with more detail")
    }
    
    if (taskType === "image_generation" && refinedPrompt.toLowerCase().includes("style")) {
      improvements.push("Added style specifications")
    }
    
    if (taskType === "text_generation" && (refinedPrompt.toLowerCase().includes("structure") || refinedPrompt.toLowerCase().includes("format"))) {
      improvements.push("Added structure requirements")
    }
    
    if (refinedPrompt.toLowerCase().includes("detailed") || refinedPrompt.toLowerCase().includes("specific")) {
      improvements.push("Made prompt more specific")
    }

    return {
      original_prompt: prompt,
      refined_prompt: refinedPrompt,
      improvements: improvements.length > 0 ? improvements : ["Enhanced prompt clarity and effectiveness"],
      confidence: Math.min(100, 80 + improvements.length * 5),
    }
  } catch (error) {
    console.error("Prompt refinement failed:", error)
    
    // Enhanced local fallback improvements
    let refinedPrompt = prompt
    const improvements: string[] = []
    
    // Basic prompt enhancement
    if (prompt.length < 50) {
      refinedPrompt = `Please provide a detailed explanation of: ${prompt}`
      improvements.push("Added request for detailed explanation")
    }
    
    // Task-specific improvements
    if (taskType === "image_generation") {
      if (!prompt.toLowerCase().includes("detailed")) {
        refinedPrompt = `Create a detailed, high-quality image with professional lighting and composition: ${prompt}`
        improvements.push("Added detail and quality specifications")
      }
      if (!prompt.toLowerCase().includes("style")) {
        refinedPrompt = `${refinedPrompt}. Style: photorealistic, professional photography.`
        improvements.push("Added style specifications")
      }
      if (!prompt.toLowerCase().includes("lighting")) {
        refinedPrompt = `${refinedPrompt}. Lighting: soft, natural lighting.`
        improvements.push("Added lighting specifications")
      }
    } else if (taskType === "text_generation") {
      if (!prompt.toLowerCase().includes("detailed")) {
        refinedPrompt = `Please provide a comprehensive and detailed response to: ${prompt}`
        improvements.push("Added comprehensive response request")
      }
      if (!prompt.toLowerCase().includes("structure") && prompt.length > 100) {
        refinedPrompt = `${refinedPrompt}. Please structure your response with clear sections and examples.`
        improvements.push("Added structure requirements")
      }
    } else if (taskType === "analytical") {
      if (!prompt.toLowerCase().includes("analyze")) {
        refinedPrompt = `Please analyze and provide a structured breakdown of: ${prompt}`
        improvements.push("Added analytical structure request")
      }
      if (!prompt.toLowerCase().includes("compare") && prompt.toLowerCase().includes("vs")) {
        refinedPrompt = `${refinedPrompt}. Please provide a detailed comparison with pros and cons.`
        improvements.push("Added comparison framework")
      }
    } else if (taskType === "creative") {
      if (!prompt.toLowerCase().includes("creative")) {
        refinedPrompt = `Be creative and imaginative in your response to: ${prompt}`
        improvements.push("Added creative direction")
      }
      if (!prompt.toLowerCase().includes("ideas")) {
        refinedPrompt = `${refinedPrompt}. Generate multiple innovative ideas and approaches.`
        improvements.push("Added idea generation request")
      }
    }
    
    // General improvements
    if (!prompt.toLowerCase().includes("please") && !prompt.toLowerCase().includes("could you")) {
      refinedPrompt = `Please ${refinedPrompt.toLowerCase()}`
      improvements.push("Added polite request format")
    }
    
    // Add context if missing
    if (prompt.length < 30 && !improvements.length) {
      refinedPrompt = `Please provide a detailed explanation about: ${prompt}`
      improvements.push("Added context and detail request")
    }
    
    return {
      original_prompt: prompt,
      refined_prompt: refinedPrompt,
      improvements: improvements.length > 0 ? improvements : ["Enhanced prompt clarity and effectiveness"],
      confidence: Math.min(100, 70 + improvements.length * 10),
      fallback_used: true, // Indicate that local fallback was used
    }
  }
}
