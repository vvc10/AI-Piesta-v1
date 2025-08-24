import { type NextRequest, NextResponse } from "next/server"

interface ChatHistory {
  id: string
  timestamp: string
  preview: string
  models: string[]
  messages: Array<{
    id: string
    type: "user" | "assistant"
    content: string
    timestamp: string
    model?: string
  }>
  messageCount: number
  createdAt: string
  lastUpdated: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chatId = searchParams.get("id")

    if (chatId) {
      // Get specific chat
      const chat = await getChatById(chatId)
      if (!chat) {
        return NextResponse.json({ error: "Chat not found" }, { status: 404 })
      }
      return NextResponse.json(chat)
    } else {
      // Get all chats
      const chats = await getAllChats()
      return NextResponse.json(chats)
    }
  } catch (error) {
    console.error("Get chat history error:", error)
    return NextResponse.json({ error: "Failed to retrieve chat history" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, chatData } = body

    switch (action) {
      case "create":
        const newChat = await createChat(chatData)
        return NextResponse.json(newChat)

      case "update":
        const updatedChat = await updateChat(chatData.id, chatData)
        return NextResponse.json(updatedChat)

      case "addMessage":
        const chatWithMessage = await addMessageToChat(chatData.chatId, chatData.message)
        return NextResponse.json(chatWithMessage)

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Post chat history error:", error)
    return NextResponse.json({ error: "Failed to save chat history" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chatId = searchParams.get("id")

    if (chatId === "all") {
      // Clear all chat history
      await clearAllChats()
      return NextResponse.json({ message: "All chats cleared successfully" })
    } else if (chatId) {
      // Delete specific chat
      await deleteChat(chatId)
      return NextResponse.json({ message: "Chat deleted successfully" })
    } else {
      return NextResponse.json({ error: "Chat ID required" }, { status: 400 })
    }
  } catch (error) {
    console.error("Delete chat history error:", error)
    return NextResponse.json({ error: "Failed to delete chat history" }, { status: 500 })
  }
}

// Mock database functions (in a real app, these would use a proper database)
async function getAllChats(): Promise<ChatHistory[]> {
  // In a real implementation, this would query a database
  return []
}

async function getChatById(id: string): Promise<ChatHistory | null> {
  // In a real implementation, this would query a database
  return null
}

async function createChat(chatData: Partial<ChatHistory>): Promise<ChatHistory> {
  const newChat: ChatHistory = {
    id: `chat-${Date.now()}`,
    timestamp: new Date().toLocaleString(),
    preview: chatData.preview || "New chat",
    models: chatData.models || [],
    messages: chatData.messages || [],
    messageCount: chatData.messages?.length || 0,
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  }

  // In a real implementation, this would save to a database
  return newChat
}

async function updateChat(id: string, chatData: Partial<ChatHistory>): Promise<ChatHistory> {
  // In a real implementation, this would update the database
  return {
    ...chatData,
    id,
    lastUpdated: new Date().toISOString(),
  } as ChatHistory
}

async function addMessageToChat(chatId: string, message: any): Promise<ChatHistory> {
  // In a real implementation, this would add the message to the database
  return {
    id: chatId,
    timestamp: new Date().toLocaleString(),
    preview: message.content.substring(0, 100),
    models: [],
    messages: [message],
    messageCount: 1,
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  }
}

async function deleteChat(id: string): Promise<void> {
  // In a real implementation, this would delete from the database
}

async function clearAllChats(): Promise<void> {
  // In a real implementation, this would clear all chats from the database
}
