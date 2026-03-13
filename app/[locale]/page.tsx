"use client"

import { useState, useEffect, useTransition } from "react"
import Header from "@/components/header"
import Sidebar from "@/components/sidebar"
import EmptyState from "@/components/empty-state"
import FeatureCards from "@/components/feature-cards"
import AccountModal from "@/components/account-modal"
import LoginModal from "@/components/login-modal"
import AccountInfoBanner from "@/components/account-info-banner"
import UpdateNoticeModal from "@/components/update-notice-modal"
import MessageList from "@/components/message-list"
import MessageDetail from "@/components/message-detail"
import { AuthProvider, useAuth } from "@/contexts/auth-context"
import { MailStatusProvider } from "@/contexts/mail-status-context"
import type { Message } from "@/types"
import { useHeroUIToast } from "@/hooks/use-heroui-toast"
import { useIsMobile } from "@/hooks/use-mobile"
import { useTranslations, useLocale } from "next-intl"
import { useRouter, usePathname } from "@/i18n/navigation"
import { CheckCircle, Navigation, RefreshCw, Menu, AlertCircle, Languages } from "lucide-react"
import { Button } from "@heroui/button"

// 生成随机字符串，用于用户名和密码
function generateRandomString(length: number) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"
  const charsLength = chars.length

  if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint32Array(length)
    window.crypto.getRandomValues(array)
    return Array.from(array, (value) => chars[value % charsLength]).join("")
  }

  let result = ""
  for (let i = 0; i < length; i++) {
    const index = Math.floor(Math.random() * charsLength)
    result += chars[index]
  }
  return result
}

function MainContent() {
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [loginAccountAddress, setLoginAccountAddress] = useState<string>("")
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const { isAuthenticated, currentAccount, accounts, register } = useAuth()
  const [refreshKey, setRefreshKey] = useState(0)
  const { toast } = useHeroUIToast()
  const isMobile = useIsMobile()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)
  const [showAccountBanner, setShowAccountBanner] = useState(false)
  const [createdAccountInfo, setCreatedAccountInfo] = useState<{ email: string; password: string } | null>(null)
  const [isUpdateNoticeModalOpen, setIsUpdateNoticeModalOpen] = useState(false)

  const t = useTranslations("mainPage")
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  // 检查是否需要显示更新通知（仅显示一次）
  useEffect(() => {
    if (typeof window === "undefined") return

    const noticeShown = localStorage.getItem("duckmail-update-notice-2026-01-16")
    if (!noticeShown) {
      const timer = setTimeout(() => {
        setIsUpdateNoticeModalOpen(true)
        localStorage.setItem("duckmail-update-notice-2026-01-16", "true")
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [])

  // 一键创建临时邮箱（用户手动触发）
  const handleQuickCreate = async () => {
    if (isCreatingAccount) return
    setIsCreatingAccount(true)

    const maxAttempts = 5
    const domain = "duckmail.sbs"

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const username = generateRandomString(10)
      const password = generateRandomString(12)
      const email = `${username}@${domain}`

      try {
        await register(email, password)

        toast({
          title: t("tempMailCreated"),
          description: t("checkBanner"),
          color: "success",
          variant: "flat",
          icon: <CheckCircle size={16} />
        })

        setCreatedAccountInfo({ email, password })
        setShowAccountBanner(true)
        setIsCreatingAccount(false)
        return
      } catch (error: any) {
        const message = error?.message || ""
        const isAddressTaken =
          message.includes("该邮箱地址已被使用") ||
          message.includes("Email address already exists") ||
          message.includes("already used") ||
          message.includes("already exists")

        // 仅地址已被占用时换用户名重试（极低概率）
        if (isAddressTaken && attempt < maxAttempts - 1) {
          continue
        }

        // 其他错误直接展示给用户
        console.error("一键创建临时邮箱失败:", error)
        toast({
          title: t("createFailed"),
          description: message || t("createFailedDesc"),
          color: "danger",
          variant: "flat",
          icon: <AlertCircle size={16} />
        })
        break
      }
    }

    setIsCreatingAccount(false)
  }

  const [isPending, startTransition] = useTransition()

  const handleLocaleChange = () => {
    const newLocale = locale === "en" ? "zh" : "en"
    startTransition(() => {
      router.replace(pathname, { locale: newLocale })
    })
    toast({
      title: newLocale === "en" ? t("switchedToEn") : t("switchedToZh"),
      color: "primary",
      variant: "flat",
      icon: <Languages size={16} />
    })
  }

  const handleCreateAccount = () => {
    setIsAccountModalOpen(true)
  }

  const handleLogin = () => {
    setIsLoginModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsAccountModalOpen(false)
  }

  const handleCloseLoginModal = () => {
    setIsLoginModalOpen(false)
    setLoginAccountAddress("")
  }

  const handleSelectMessage = (message: Message) => {
    setSelectedMessage(message)
  }

  const handleBackToList = () => {
    setSelectedMessage(null)
  }

  const handleDeleteMessageInDetail = (messageId: string) => {
    setSelectedMessage(null)
    toast({
      title: t("messageDeleted"),
      description: t("messageDeletedDesc", { id: messageId }),
      color: "success",
      variant: "flat",
      icon: <CheckCircle size={16} />
    })
  }

  const handleSidebarItemClick = (item: string) => {
    console.log("Sidebar item clicked:", item)

    if (item === "inbox") {
      setSelectedMessage(null)
      return
    }

    if (item === "refresh") {
      toast({
        title: t("refreshing"),
        color: "primary",
        variant: "flat",
        icon: <RefreshCw size={16} />
      })
      setRefreshKey(prev => prev + 1)
      return
    }

    if (item === "update-notice") {
      setIsUpdateNoticeModalOpen(true)
      return
    }

    if (item === "github") {
      window.open("https://github.com/moonwesif/DuckMail", "_blank", "noopener,noreferrer")
      return
    }

    if (item === "faq") {
      window.open(`/${locale}/faq`, "_blank", "noopener,noreferrer")
      return
    }

    if (item === "api") {
      window.open(`/${locale}/api-docs`, "_blank", "noopener,noreferrer")
      return
    }

    if (item === "privacy") {
      window.open(`/${locale}/privacy`, "_blank", "noopener,noreferrer")
      return
    }

    toast({
      title: item,
      description: t("comingSoon"),
      color: "warning",
      variant: "flat",
      icon: <Navigation size={16} />
    })
  }

  return (
    <>
      <div className={`flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 transition-opacity duration-200 ${isPending ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
        {/* 桌面端侧边栏 */}
        {!isMobile && (
          <Sidebar activeItem="inbox" onItemClick={handleSidebarItemClick} />
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 移动端顶部栏包含菜单按钮 */}
          {isMobile && (
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <Button
                isIconOnly
                variant="light"
                size="sm"
                onPress={() => setIsSidebarOpen(true)}
                className="text-gray-600 dark:text-gray-300"
                aria-label={t("openMenu")}
              >
                <Menu size={20} />
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center overflow-hidden">
                  <img
                    src="https://img.116119.xyz/img/2025/06/08/547d9cd9739b8e15a51e510342af3fb0.png"
                    alt="DuckMail Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="font-semibold text-lg text-gray-800 dark:text-white">duckmail.sbs</span>
              </div>
              <div className="w-8" />
            </div>
          )}

          <Header
            onCreateAccount={handleCreateAccount}
            onLocaleChange={handleLocaleChange}
            onLogin={handleLogin}
            isMobile={isMobile}
          />
          {/* 账户信息横幅 */}
          {showAccountBanner && createdAccountInfo && (
            <AccountInfoBanner
              email={createdAccountInfo.email}
              password={createdAccountInfo.password}
              onClose={() => {
                setShowAccountBanner(false)
                setCreatedAccountInfo(null)
              }}
            />
          )}
          <main className="flex-1 overflow-y-auto">
            <div className="h-full flex flex-col">
              <div className="flex-1">
                {isAuthenticated && currentAccount ? (
                  selectedMessage ? (
                    <MessageDetail
                      message={selectedMessage}
                      onBack={handleBackToList}
                      onDelete={handleDeleteMessageInDetail}
                    />
                  ) : (
                    <MessageList onSelectMessage={handleSelectMessage} refreshKey={refreshKey} />
                  )
                ) : (
                  <EmptyState onCreateAccount={handleQuickCreate} isAuthenticated={isAuthenticated} isCreating={isCreatingAccount} />
                )}
              </div>
              {/* 未登录落地页：功能卡片 + 广告（有内容支撑，符合 AdSense 要求） */}
              {(!isAuthenticated || !currentAccount) && (
                <FeatureCards />
              )}
            </div>
          </main>
        </div>

        {/* 移动端侧边栏抽屉 */}
        {isMobile && isSidebarOpen && (
          <div className="fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
              onClick={() => setIsSidebarOpen(false)}
            />
            <div className={`absolute left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 shadow-lg transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
              <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center overflow-hidden">
                      <img
                        src="https://img.116119.xyz/img/2025/06/08/547d9cd9739b8e15a51e510342af3fb0.png"
                        alt="DuckMail Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="font-semibold text-lg text-gray-800 dark:text-white">duckmail.sbs</span>
                  </div>
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    onPress={() => setIsSidebarOpen(false)}
                    className="text-gray-600 dark:text-gray-300"
                  >
                    ×
                  </Button>
                </div>
              </div>
              <Sidebar
                activeItem="inbox"
                onItemClick={(item) => {
                  handleSidebarItemClick(item)
                  setIsSidebarOpen(false)
                }}
                isMobile={true}
              />
            </div>
          </div>
        )}
      </div>

      <AccountModal isOpen={isAccountModalOpen} onClose={handleCloseModal} />
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={handleCloseLoginModal}
        accountAddress={loginAccountAddress}
      />
      <UpdateNoticeModal
        isOpen={isUpdateNoticeModalOpen}
        onClose={() => setIsUpdateNoticeModalOpen(false)}
      />
    </>
  )
}

export default function Home() {
  return (
    <AuthProvider>
      <MailStatusProvider>
        <MainContent />
      </MailStatusProvider>
    </AuthProvider>
  )
}
