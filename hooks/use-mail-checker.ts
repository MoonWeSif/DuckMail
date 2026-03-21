"use client"

import { useEffect, useRef, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getMessages } from "@/lib/api"
import type { Message } from "@/types"

interface UseMailCheckerOptions {
  onNewMessage?: (message: Message) => void
  onMessagesUpdate?: (messages: Message[]) => void
  interval?: number
  enabled?: boolean
  startImmediately?: boolean
}

export function useMailChecker({
  onNewMessage,
  onMessagesUpdate,
  interval = 10000,
  enabled = true,
  startImmediately = true,
}: UseMailCheckerOptions = {}) {
  const { token, currentAccount, isAuthenticated } = useAuth()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastMessagesRef = useRef<Message[]>([])
  const isCheckingRef = useRef(false)
  const isInitializedRef = useRef(false)
  const onNewMessageRef = useRef(onNewMessage)
  const onMessagesUpdateRef = useRef(onMessagesUpdate)
  const isVisibleRef = useRef(true)

  useEffect(() => {
    onNewMessageRef.current = onNewMessage
    onMessagesUpdateRef.current = onMessagesUpdate
  }, [onNewMessage, onMessagesUpdate])

  const stopChecking = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    isCheckingRef.current = false
    isInitializedRef.current = false
  }, [])

  useEffect(() => {
    let cancelled = false

    if (typeof document !== "undefined") {
      isVisibleRef.current = document.visibilityState === "visible"
    }

    const clearScheduledCheck = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }

    const scheduleNextCheck = (delay = interval) => {
      if (cancelled) {
        return
      }
      clearScheduledCheck()
      if (!enabled || !token || !currentAccount || !isAuthenticated) {
        return
      }
      timeoutRef.current = setTimeout(async () => {
        await checkForNewMessages()
      }, delay)
    }

    const checkForNewMessages = async (force = false) => {
      if (!token || !currentAccount || !isAuthenticated) {
        return
      }
      if (cancelled) {
        return
      }

      if (!force && !isVisibleRef.current) {
        scheduleNextCheck(interval)
        return
      }

      if (isCheckingRef.current) {
        return
      }

      isCheckingRef.current = true

      try {
        const providerId = currentAccount.providerId || "duckmail"
        const { messages } = await getMessages(token, 1, providerId)
        const currentMessages = messages || []

        if (!isInitializedRef.current) {
          lastMessagesRef.current = currentMessages
          isInitializedRef.current = true
          onMessagesUpdateRef.current?.(currentMessages)
          return
        }

        const lastMessages = lastMessagesRef.current
        const lastMessageIDs = new Set(lastMessages.map((message) => message.id))
        const newMessages = currentMessages.filter((message) => !lastMessageIDs.has(message.id))

        if (newMessages.length > 0) {
          newMessages.forEach((message) => {
            onNewMessageRef.current?.(message)
          })
        }

        if (
          currentMessages.length !== lastMessages.length ||
          currentMessages.some((message, index) => message.id !== lastMessages[index]?.id)
        ) {
          onMessagesUpdateRef.current?.(currentMessages)
        }

        lastMessagesRef.current = currentMessages
      } catch (error) {
        console.error("❌ [MailChecker] Failed to check for new messages:", error)
      } finally {
        isCheckingRef.current = false
        scheduleNextCheck(interval)
      }
    }

    const handleVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === "visible"
      if (isVisibleRef.current) {
        void checkForNewMessages(true)
      } else {
        clearScheduledCheck()
      }
    }

    const handleFocus = () => {
      isVisibleRef.current = true
      void checkForNewMessages(true)
    }

    if (enabled && token && currentAccount && isAuthenticated) {
      if (startImmediately) {
        void checkForNewMessages(true)
      } else {
        scheduleNextCheck(interval)
      }
    } else {
      stopChecking()
    }

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange)
      window.addEventListener("focus", handleFocus)
    }

    return () => {
      cancelled = true
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange)
        window.removeEventListener("focus", handleFocus)
      }
      clearScheduledCheck()
      isCheckingRef.current = false
      isInitializedRef.current = false
    }
  }, [enabled, token, currentAccount, isAuthenticated, interval, startImmediately, stopChecking])

  useEffect(() => {
    return () => {
      stopChecking()
    }
  }, [stopChecking])

  return {
    startChecking: () => {},
    stopChecking,
    isChecking: isCheckingRef.current,
  }
}
