"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardBody } from "@heroui/card"
import { Spinner } from "@heroui/spinner"
import { Avatar } from "@heroui/avatar"
import { getMessages } from "@/lib/api"
import type { Message } from "@/types"
import { useAuth } from "@/contexts/auth-context"
import { useMailChecker } from "@/hooks/use-mail-checker"
import { useHeroUIToast } from "@/hooks/use-heroui-toast"
import { useMailStatus } from "@/contexts/mail-status-context"
import { useIsMobile } from "@/hooks/use-mobile"
import { formatDistanceToNow } from "date-fns"
import { enUS, zhCN } from "date-fns/locale"
import { Mail } from "lucide-react"
import { useTranslations, useLocale } from "next-intl"

interface MessageListProps {
  onSelectMessage: (message: Message) => void
  refreshKey?: number
}

export default function MessageList({ onSelectMessage, refreshKey }: MessageListProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { token, currentAccount } = useAuth()
  const { toast } = useHeroUIToast()
  const { isEnabled } = useMailStatus()
  const isMobile = useIsMobile()
  const t = useTranslations("messageList")
  const locale = useLocale()

  // 处理新消息通知
  const handleNewMessage = useCallback((message: Message) => {
    toast({
      title: t("newEmail"),
      description: `${t("from")}: ${message.from.address}`,
      color: "success",
      variant: "flat",
      icon: <Mail size={16} />,
    })
  }, [t, toast])

  // 处理消息列表更新
  const handleMessagesUpdate = useCallback((newMessages: Message[]) => {
    setMessages(newMessages)
    setError(null)
    if (loading) {
      setLoading(false)
    }
  }, [loading])

  // 手动刷新邮件
  const manualRefresh = useCallback(async () => {
    if (!token || !currentAccount) return

    try {
      setLoading(true)
      const providerId = currentAccount.providerId || "duckmail"
      const { messages: fetchedMessages } = await getMessages(token, 1, providerId)
      setMessages(fetchedMessages || [])
      setError(null)
    } catch (err) {
      console.error("Failed to refresh messages:", err)
      setError(t("refreshError"))
    } finally {
      setLoading(false)
    }
  }, [token, currentAccount, t])

  useMailChecker({
    onNewMessage: handleNewMessage,
    onMessagesUpdate: handleMessagesUpdate,
    interval: 2000,
    enabled: isEnabled,
  })

  // 初始加载
  useEffect(() => {
    const fetchInitialMessages = async () => {
      if (!token || !currentAccount) {
        console.log("📥 [MessageList] No token or account, clearing messages")
        setMessages([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        console.log(`📥 [MessageList] Loading initial messages for account: ${currentAccount.address}`)
        const providerId = currentAccount.providerId || "duckmail"
        const { messages: fetchedMessages } = await getMessages(token, 1, providerId)
        setMessages(fetchedMessages || [])
        setError(null)
        console.log(`📥 [MessageList] Loaded ${fetchedMessages?.length || 0} initial messages`)
      } catch (err) {
        console.error("Failed to fetch messages:", err)
        setError(t("fetchError"))
        setMessages([])
      } finally {
        setLoading(false)
      }
    }

    fetchInitialMessages()
  }, [token, currentAccount?.id, t])

  // 监听手动刷新
  useEffect(() => {
    if (refreshKey && refreshKey > 0) {
      manualRefresh()
    }
  }, [refreshKey, manualRefresh])

  if (loading) {
    return (
      <div className="h-full overflow-y-auto p-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t("inbox")}</h2>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <Spinner size="lg" color="primary" />
            <p className="mt-4 text-gray-500 dark:text-gray-400">{t("loading")}</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full overflow-y-auto p-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t("inbox")}</h2>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-red-500 font-medium">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="h-full overflow-y-auto p-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t("inbox")}</h2>
        </div>
        <div className="flex flex-col justify-center items-center h-64 text-center">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">{t("emptyTitle")}</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md">{t("emptyDesc")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-full w-full overflow-y-auto ${isMobile ? 'p-2' : 'p-4'}`}>
      <div className={`${isMobile ? 'mb-4' : 'mb-6'} w-full`}>
        <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-800 dark:text-gray-100`}>
          {t("inbox")}
        </h2>
        <div className={`flex items-center gap-2 text-xs text-gray-500 ${isMobile ? 'mt-1' : 'mt-2'} ${isMobile ? 'flex-wrap' : ''}`}>
          <div
            className={`w-2 h-2 rounded-full ${
              isEnabled ? "bg-green-500 animate-pulse" : "bg-gray-400"
            }`}
          />
          <span className={isMobile ? 'text-xs' : ''}>
            {isEnabled ? t("pollingActive") : t("pollingPaused")}
          </span>
          <span className="text-xs text-gray-400 ml-2">
            {t("messageCount")}: {messages.length}
          </span>
        </div>
      </div>
      <div className={`${isMobile ? 'space-y-2' : 'space-y-4'} w-full`}>
        {messages.map((message) => (
          <Card
            key={message.id}
            isPressable
            onPress={() => onSelectMessage(message)}
            className={`w-full transition-all duration-300 cursor-pointer ${
              !message.seen
                ? "border-l-4 border-l-primary-500 border-t border-r border-b border-primary-200 dark:border-primary-800 bg-gradient-to-r from-primary-50/80 to-primary-50/40 dark:from-primary-900/30 dark:to-primary-900/10 shadow-lg hover:shadow-xl hover:scale-[1.02]"
                : "border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg hover:scale-[1.01]"
            }`}
          >
            <CardBody className={`${isMobile ? 'p-3' : 'p-5'} w-full`}>
              <div className={`flex items-start ${isMobile ? 'space-x-3' : 'space-x-4'} w-full`}>
                <div className="relative">
                  <Avatar
                    name={message.from.name
                      ? message.from.name.charAt(0).toUpperCase()
                      : message.from.address.charAt(0).toUpperCase()}
                    className={`flex-shrink-0 font-semibold ${
                      !message.seen
                        ? "bg-primary-500 text-white shadow-lg"
                        : "bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200"
                    }`}
                    size={isMobile ? "md" : "lg"}
                  />
                  {!message.seen && (
                    <div className={`absolute -top-1 -right-1 ${isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'} bg-primary-500 border-2 border-white dark:border-gray-800 rounded-full`}></div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className={`flex items-start justify-between ${isMobile ? 'mb-1' : 'mb-2'}`}>
                    <div className="flex-1 min-w-0">
                      <h3 className={`${isMobile ? 'text-sm' : 'text-base'} truncate ${
                        !message.seen
                          ? "font-bold text-gray-900 dark:text-white"
                          : "font-semibold text-gray-700 dark:text-gray-300"
                      }`}>
                        {message.from.name || message.from.address}
                      </h3>
                      <p className={`${isMobile ? 'text-xs' : 'text-sm'} truncate ${isMobile ? 'mt-0.5' : 'mt-1'} ${
                        !message.seen
                          ? "font-semibold text-gray-800 dark:text-gray-200"
                          : "font-medium text-gray-600 dark:text-gray-400"
                      }`}>
                        {message.subject}
                      </p>
                    </div>
                    <div className={`flex flex-col items-end ${isMobile ? 'ml-2' : 'ml-3'}`}>
                      <span className={`${isMobile ? 'text-xs' : 'text-xs'} flex-shrink-0 ${
                        !message.seen
                          ? "text-primary-600 dark:text-primary-400 font-medium"
                          : "text-gray-500 dark:text-gray-400"
                      }`}>
                        {formatDistanceToNow(new Date(message.createdAt), {
                          addSuffix: true,
                          locale: locale === "en" ? enUS : zhCN,
                        })}
                      </span>
                      {!message.seen && (
                        <div className={`${isMobile ? 'mt-0.5 px-1.5 py-0.5' : 'mt-1 px-2 py-0.5'} bg-primary-500 text-white text-xs rounded-full font-medium`}>
                          {t("new")}
                        </div>
                      )}
                    </div>
                  </div>

                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} leading-relaxed line-clamp-2 ${
                    !message.seen
                      ? "text-gray-700 dark:text-gray-300"
                      : "text-gray-500 dark:text-gray-400"
                  }`}>
                    {message.intro}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  )
}
