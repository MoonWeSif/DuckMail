import { rejectNonBrowserRequest } from "@/lib/browser-request";
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const rejected = rejectNonBrowserRequest(request);
  if (rejected) return rejected;

  const encoder = new TextEncoder()
  const authHeader = request.headers.get("Authorization")

  if (!authHeader) {
    return new Response("Unauthorized", { status: 401 })
  }

  const token = authHeader.replace("Bearer ", "")
  const accountId = request.nextUrl.searchParams.get("accountId")

  if (!accountId) {
    return new Response("Account ID is required", { status: 400 })
  }

  const customReadable = new ReadableStream({
    start(controller) {
      // 发送初始连接消息
      const data = `data: ${JSON.stringify({ type: "connected", message: "SSE connection established" })}\n\n`
      controller.enqueue(encoder.encode(data))

      // 发送心跳包保持连接活跃
      const heartbeatInterval = setInterval(() => {
        try {
          const heartbeatData = `data: ${JSON.stringify({
            type: "heartbeat",
            timestamp: new Date().toISOString(),
          })}\n\n`
          controller.enqueue(encoder.encode(heartbeatData))
        } catch (error) {
          console.error("Error sending heartbeat:", error)
        }
      }, 60000) // 每分钟发送一次心跳包

      // 清理函数
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeatInterval)
        controller.close()
      })
    },
  })

  return new Response(customReadable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
