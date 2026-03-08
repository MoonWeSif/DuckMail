"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@heroui/button"
import { Card, CardBody } from "@heroui/card"
import { Spinner } from "@heroui/spinner"
import { Avatar } from "@heroui/avatar"
import { ArrowLeft, Trash2, Download, CheckCircle, XCircle } from "lucide-react"
import { getMessage, markMessageAsRead, deleteMessage as apiDeleteMessage } from "@/lib/api"
import type { Message, MessageDetail as MessageDetailType } from "@/types"
import { useAuth } from "@/contexts/auth-context"
import { useIsMobile } from "@/hooks/use-mobile"
import { format } from "date-fns"
import { enUS, zhCN } from "date-fns/locale"
import { useHeroUIToast } from "@/hooks/use-heroui-toast"
import { useTranslations, useLocale } from "next-intl"

// 邮件内容渲染组件 - 使用 iframe 隔离样式
function EmailContent({ html, text, isMobile }: { html?: string[]; text?: string; isMobile: boolean }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [iframeHeight, setIframeHeight] = useState(200)

  const adjustIframeHeight = useCallback(() => {
    const iframe = iframeRef.current
    if (iframe?.contentWindow?.document?.body) {
      const body = iframe.contentWindow.document.body
      const height = Math.max(body.scrollHeight, body.offsetHeight)
      if (height > 0) {
        setIframeHeight(height + 20)
      }
    }
  }, [])

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const hasHtml = html && html.length > 0 && html.join("").trim()
    const content = hasHtml ? html.join("") : `<pre style="white-space: pre-wrap; font-family: sans-serif; margin: 0;">${text || ""}</pre>`
    const isDarkMode = document.documentElement.classList.contains("dark")

    const wrappedContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            margin: 0;
            padding: 8px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            font-size: ${isMobile ? '14px' : '15px'};
            line-height: 1.5;
            word-wrap: break-word;
            overflow-wrap: break-word;
            ${isDarkMode ? 'background-color: #1a1a2e; color: #e0e0e0;' : 'background-color: #ffffff; color: #333333;'}
          }
          img { max-width: 100%; height: auto; }
          table { max-width: 100%; }
          a { color: ${isDarkMode ? '#6366f1' : '#4f46e5'}; }
          pre { white-space: pre-wrap; word-wrap: break-word; }
        </style>
      </head>
      <body>${content}</body>
      </html>
    `

    const doc = iframe.contentWindow?.document
    if (doc) {
      doc.open()
      doc.write(wrappedContent)
      doc.close()
      iframe.onload = adjustIframeHeight
      setTimeout(adjustIframeHeight, 100)
      setTimeout(adjustIframeHeight, 500)
      setTimeout(adjustIframeHeight, 1000)
    }
  }, [html, text, isMobile, adjustIframeHeight])

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const iframe = iframeRef.current
      if (iframe?.contentWindow?.document?.body) {
        const isDarkMode = document.documentElement.classList.contains("dark")
        const body = iframe.contentWindow.document.body
        body.style.backgroundColor = isDarkMode ? '#1a1a2e' : '#ffffff'
        body.style.color = isDarkMode ? '#e0e0e0' : '#333333'
      }
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => observer.disconnect()
  }, [])

  return (
    <iframe
      ref={iframeRef}
      title="Email Content"
      sandbox="allow-same-origin"
      style={{
        width: '100%',
        height: `${iframeHeight}px`,
        border: 'none',
        display: 'block',
      }}
    />
  )
}

interface MessageDetailProps {
  message: Message
  onBack: () => void
  onDelete: (messageId: string) => void
}

export default function MessageDetail({ message, onBack, onDelete }: MessageDetailProps) {
  const [messageDetail, setMessageDetail] = useState<MessageDetailType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { token, currentAccount } = useAuth()
  const { toast } = useHeroUIToast()
  const isMobile = useIsMobile()
  const t = useTranslations("messageDetail")
  const locale = useLocale()

  const localeDate = locale === "en" ? enUS : zhCN

  useEffect(() => {
    const fetchMessageDetail = async () => {
      if (!token) {
        setError(t("authError"))
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const providerId = currentAccount?.providerId || "duckmail"
        const detail = await getMessage(token, message.id, providerId)
        setMessageDetail(detail)

        if (!message.seen) {
          await markMessageAsRead(token, message.id, providerId)
        }
        setError(null)
      } catch (err) {
        console.error("Failed to fetch message detail:", err)
        setError(t("fetchError"))
      } finally {
        setLoading(false)
      }
    }

    fetchMessageDetail()
  }, [token, message.id, message.seen, t])

  const handleDelete = async () => {
    if (!token || !messageDetail) return

    try {
      const providerId = currentAccount?.providerId || "duckmail"
      await apiDeleteMessage(token, messageDetail.id, providerId)
      toast({
        title: t("messageDeleted"),
        color: "success",
        variant: "flat",
        icon: <CheckCircle size={16} />
      })
      onDelete(messageDetail.id)
    } catch (err) {
      console.error("Failed to delete message:", err)
      toast({
        title: t("deleteFailed"),
        color: "danger",
        variant: "flat",
        icon: <XCircle size={16} />
      })
      setError(t("deleteError"))
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner size="lg" color="primary" />
      </div>
    )
  }

  if (error || !messageDetail) {
    return (
      <div className="flex flex-col justify-center items-center h-full p-4 text-center">
        <p className="text-red-500">
          {error || t("loadError")}
        </p>
        <Button variant="light" onPress={onBack} className="mt-4">
          {t("backToInbox")}
        </Button>
      </div>
    )
  }

  const fromName = messageDetail.from.name || messageDetail.from.address
  const fromInitials = fromName.charAt(0).toUpperCase()

  return (
    <div className={`h-full overflow-y-auto ${isMobile ? 'p-2' : 'p-4 md:p-6'} bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100`}>
      <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'justify-between items-center'} ${isMobile ? 'mb-3' : 'mb-4'}`}>
        <Button
          variant="light"
          startContent={<ArrowLeft size={18} />}
          onPress={onBack}
          size={isMobile ? "sm" : "md"}
          className={isMobile ? "self-start" : ""}
        >
          {t("back")}
        </Button>
        <div className={`flex ${isMobile ? 'gap-1' : 'gap-2'} ${isMobile ? 'self-end' : ''}`}>
          <Button
            variant="light"
            color="danger"
            startContent={<Trash2 size={18} />}
            onPress={handleDelete}
            size={isMobile ? "sm" : "md"}
          >
            {isMobile ? t("deleteMobile") : t("delete")}
          </Button>
          {messageDetail.downloadUrl && (
            <Button
              variant="light"
              color="primary"
              startContent={<Download size={18} />}
              as="a"
              href={messageDetail.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              size={isMobile ? "sm" : "md"}
            >
              {isMobile ? t("downloadMobile") : t("download")} (.eml)
            </Button>
          )}
        </div>
      </div>

      <Card className={`${isMobile ? 'mb-3' : 'mb-4'} shadow-lg border border-gray-200 dark:border-gray-700`}>
        <CardBody className={isMobile ? "p-3" : "p-6"}>
          <div className={`${isMobile ? 'mb-4 pb-3' : 'mb-6 pb-4'} border-b border-gray-200 dark:border-gray-700`}>
            <h1 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-gray-900 dark:text-white ${isMobile ? 'mb-2' : 'mb-3'}`}>{messageDetail.subject}</h1>
            <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'justify-between items-center'}`}>
              <div className="flex items-center">
                <Avatar name={fromInitials} size={isMobile ? "sm" : "md"} className={isMobile ? "mr-2" : "mr-3"} />
                <div>
                  <p className={`font-semibold text-gray-800 dark:text-gray-200 ${isMobile ? 'text-sm' : ''}`}>{fromName}</p>
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 dark:text-gray-400`}>{messageDetail.from.address}</p>
                </div>
              </div>
              <div className={`${isMobile ? 'text-xs self-start ml-8' : 'text-sm'} text-gray-500 dark:text-gray-400`}>
                {format(new Date(messageDetail.createdAt), "yyyy年MM月dd日 HH:mm", { locale: localeDate })}
              </div>
            </div>
          </div>

          <div className={`${isMobile ? 'mb-3' : 'mb-4'} ${isMobile ? 'text-xs' : 'text-sm'}`}>
            <div className={`grid grid-cols-[auto,1fr] ${isMobile ? 'gap-x-1 gap-y-1' : 'gap-x-2'}`}>
              <strong className="text-gray-600 dark:text-gray-400">{t("from")}</strong>
              <span className="text-gray-700 dark:text-gray-300 break-all">
                {messageDetail.from.name
                  ? `${messageDetail.from.name} <${messageDetail.from.address}>`
                  : messageDetail.from.address}
              </span>

              <strong className="text-gray-600 dark:text-gray-400">{t("to")}</strong>
              <span className="text-gray-700 dark:text-gray-300 break-all">
                {messageDetail.to.map((recipient) => recipient.address).join(", ")}
              </span>

              {messageDetail.cc && messageDetail.cc.length > 0 && (
                <>
                  <strong className="text-gray-600 dark:text-gray-400">{t("cc")}</strong>
                  <span className="text-gray-700 dark:text-gray-300 break-all">{messageDetail.cc.join(", ")}</span>
                </>
              )}
              {messageDetail.bcc && messageDetail.bcc.length > 0 && (
                <>
                  <strong className="text-gray-600 dark:text-gray-400">{t("bcc")}</strong>
                  <span className="text-gray-700 dark:text-gray-300 break-all">{messageDetail.bcc.join(", ")}</span>
                </>
              )}
            </div>
          </div>

          <div className={`${isMobile ? 'mt-4' : 'mt-6'} border-t border-gray-200 dark:border-gray-700 ${isMobile ? 'pt-4' : 'pt-6'}`}>
            <EmailContent
              html={messageDetail.html}
              text={messageDetail.text}
              isMobile={isMobile}
            />
          </div>

          {messageDetail.hasAttachments && messageDetail.attachments && messageDetail.attachments.length > 0 && (
            <div className={`${isMobile ? 'mt-6' : 'mt-8'} border-t border-gray-200 dark:border-gray-700 ${isMobile ? 'pt-4' : 'pt-6'}`}>
              <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-800 dark:text-gray-200 ${isMobile ? 'mb-3' : 'mb-4'}`}>
                {t("attachments")} ({messageDetail.attachments.length})
              </h3>
              <div className={`grid grid-cols-1 ${isMobile ? 'gap-2' : 'sm:grid-cols-2 lg:grid-cols-3 gap-4'}`}>
                {messageDetail.attachments.map((attachment) => (
                  <Card
                    key={attachment.id}
                    className="border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                  >
                    <CardBody className={isMobile ? "p-2" : "p-3"}>
                      <div className={`flex items-center justify-between ${isMobile ? 'space-x-1' : 'space-x-2'}`}>
                        <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-3'} overflow-hidden`}>
                          <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center flex-shrink-0`}>
                            <span className={`${isMobile ? 'text-xs' : 'text-xs'} font-medium text-gray-500 dark:text-gray-400`}>
                              {attachment.filename.split(".").pop()?.slice(0, 3).toUpperCase() || "FILE"}
                            </span>
                          </div>
                          <div className="truncate">
                            <p
                              className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-700 dark:text-gray-300 truncate`}
                              title={attachment.filename}
                            >
                              {attachment.filename}
                            </p>
                            <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500 dark:text-gray-400`}>
                              {Math.round(attachment.size / 1024)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          size={isMobile ? "sm" : "sm"}
                          variant="light"
                          isIconOnly
                          as="a"
                          href={attachment.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Download ${attachment.filename}`}
                          className="text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary-light"
                        >
                          <Download size={isMobile ? 16 : 18} />
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
