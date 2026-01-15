"use client"


import { useState, useEffect } from "react"
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
import { Languages, CheckCircle, Navigation, RefreshCw, Menu, AlertCircle } from "lucide-react"
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
  const [currentLocale, setCurrentLocale] = useState("zh")
  const [refreshKey, setRefreshKey] = useState(0)
  const { toast } = useHeroUIToast()
  const isMobile = useIsMobile()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [autoAccountHandled, setAutoAccountHandled] = useState(false)
  const [showAccountBanner, setShowAccountBanner] = useState(false)
  const [createdAccountInfo, setCreatedAccountInfo] = useState<{ email: string; password: string } | null>(null)
  const [isUpdateNoticeModalOpen, setIsUpdateNoticeModalOpen] = useState(false)

  // 检测浏览器语言并设置默认语言
  useEffect(() => {
    const detectBrowserLanguage = () => {
      const browserLang = navigator.language || navigator.languages?.[0] || "zh"
      const langCode = browserLang.toLowerCase()

      // 如果是英文相关语言，设置为英文，否则默认中文
      if (langCode.startsWith("en")) {
        return "en"
      }
      return "zh"
    }

    // 从 localStorage 获取保存的语言设置，如果没有则使用浏览器检测
    const savedLocale = localStorage.getItem("duckmail-locale")
    if (savedLocale && (savedLocale === "en" || savedLocale === "zh")) {
      setCurrentLocale(savedLocale)
    } else {
      const detectedLocale = detectBrowserLanguage()
      setCurrentLocale(detectedLocale)
      localStorage.setItem("duckmail-locale", detectedLocale)
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = currentLocale === "en" ? "en" : "zh-CN"
  }, [currentLocale])

  // 检查是否需要显示更新通知（仅显示一次）
  useEffect(() => {
    if (typeof window === "undefined") return

    const noticeShown = localStorage.getItem("duckmail-update-notice-2026-01-16")
    if (!noticeShown) {
      // 延迟显示，避免和其他弹窗冲突
      const timer = setTimeout(() => {
        setIsUpdateNoticeModalOpen(true)
        localStorage.setItem("duckmail-update-notice-2026-01-16", "true")
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [])

  // 首次访问时自动创建临时邮箱并登录
  useEffect(() => {
    if (autoAccountHandled) return
    if (typeof window === "undefined") return

    // 如果本地已经有 auth 记录（说明之前登录/使用过），则不再自动创建
    try {
      const savedAuth = localStorage.getItem("auth")
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth)
        if (parsed?.accounts && Array.isArray(parsed.accounts) && parsed.accounts.length > 0) {
          setAutoAccountHandled(true)
          return
        }
      }
    } catch (error) {
      console.error("Failed to parse saved auth from localStorage:", error)
    }

    // 当前会话里已经有账号或处于登录状态，也不需要自动创建
    if (isAuthenticated || currentAccount || (accounts && accounts.length > 0)) {
      setAutoAccountHandled(true)
      return
    }

    // 如果用户禁用了 DuckMail 提供商，则不自动创建，避免违背用户高级设置
    try {
      const disabledProviders = JSON.parse(localStorage.getItem("disabled-api-providers") || "[]")
      if (Array.isArray(disabledProviders) && disabledProviders.includes("duckmail")) {
        setAutoAccountHandled(true)
        return
      }
    } catch (error) {
      console.error("Failed to read disabled providers from localStorage:", error)
    }

    setAutoAccountHandled(true)

    const createTemporaryAccount = async () => {
      const maxAttempts = 5
      const domain = "duckmail.sbs"

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const username = generateRandomString(10)
        const password = generateRandomString(12)
        const email = `${username}@${domain}`

        try {
          await register(email, password)

          // 显示 Toast 简短提示
          const isZh = currentLocale !== "en"
          toast({
            title: isZh ? "已为你创建临时邮箱" : "Temporary email created",
            description: isZh ? "请在顶部横幅中查看并保存账户信息" : "Check and save your account info in the banner above",
            color: "success",
            variant: "flat",
            icon: <CheckCircle size={16} />
          })

          // 显示顶部 Banner 展示详细信息
          setCreatedAccountInfo({ email, password })
          setShowAccountBanner(true)
          return
        } catch (error: any) {
          const message = error?.message || ""
          const isAddressTaken =
            message.includes("该邮箱地址已被使用") ||
            message.includes("Email address already exists") ||
            message.includes("already used") ||
            message.includes("already exists")

          // 如果只是地址重复，换一个用户名继续重试
          if (isAddressTaken && attempt < maxAttempts - 1) {
            continue
          }

          const isZh = currentLocale !== "en"
          console.error("自动创建临时邮箱失败:", error)
          toast({
            title: isZh ? "自动创建临时邮箱失败" : "Failed to create temporary email",
            description:
              message ||
              (isZh
                ? "请稍后重试，或者手动创建一个邮箱账号。"
                : "Please try again later or create an account manually."),
            color: "danger",
            variant: "flat",
            icon: <AlertCircle size={16} />
          })
          break
        }
      }
    }

    createTemporaryAccount()
  }, [autoAccountHandled, isAuthenticated, currentAccount, accounts, register, toast, currentLocale])

  const handleLocaleChange = (locale: string) => {
    setCurrentLocale(locale)
    localStorage.setItem("duckmail-locale", locale)
    toast({
      title: locale === "en" ? "Switched to English" : "已切换到中文",
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
      title: "Message Deleted",
      description: `Message ID: ${messageId} has been removed.`,
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
      // 手动刷新邮件
      toast({
        title: currentLocale === "en" ? "Refreshing emails..." : "正在刷新邮件...",
        color: "primary",
        variant: "flat",
        icon: <RefreshCw size={16} />
      })
      // 触发 MessageList 组件重新获取邮件
      setRefreshKey(prev => prev + 1)
      return
    }

    if (item === "update-notice") {
      setIsUpdateNoticeModalOpen(true)
      return
    }

    if (item === "github" || item === "faq") {
      // 跳转到GitHub仓库（FAQ也跳转到GitHub）
      window.open("https://github.com/moonwesif/DuckMail", "_blank", "noopener,noreferrer")
      return
    }

    if (item === "api") {
      // 跳转到API文档页面
      window.open("/api-docs", "_blank", "noopener,noreferrer")
      return
    }

    if (item === "privacy") {
      // 跳转到隐私政策页面
      window.open("/privacy", "_blank", "noopener,noreferrer")
      return
    }

    // 其他选项显示敬请期待（虽然现在应该没有其他选项了）
    toast({
      title: item,
      description: currentLocale === "en" ? "Coming soon..." : "敬请期待...",
      color: "warning",
      variant: "flat",
      icon: <Navigation size={16} />
    })
  }

  return (
    <>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
        {/* 桌面端侧边栏 */}
        {!isMobile && (
          <Sidebar activeItem="inbox" onItemClick={handleSidebarItemClick} currentLocale={currentLocale} />
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
                aria-label="打开菜单"
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
              <div className="w-8" /> {/* 占位符保持居中 */}
            </div>
          )}

          <Header
            onCreateAccount={handleCreateAccount}
            onLogin={handleLogin}
            currentLocale={currentLocale}
            onLocaleChange={handleLocaleChange}
            isMobile={isMobile}
          />
          {/* 账户信息横幅 - 自动创建账户后显示 */}
          {showAccountBanner && createdAccountInfo && (
            <AccountInfoBanner
              email={createdAccountInfo.email}
              password={createdAccountInfo.password}
              currentLocale={currentLocale}
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
                    <MessageList onSelectMessage={handleSelectMessage} currentLocale={currentLocale} refreshKey={refreshKey} />
                  )
                ) : (
                  <EmptyState onCreateAccount={handleCreateAccount} isAuthenticated={isAuthenticated} currentLocale={currentLocale} />
                )}
              </div>
              {(!isAuthenticated || !currentAccount) && <FeatureCards currentLocale={currentLocale} />}
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
                currentLocale={currentLocale}
                isMobile={true}
              />
            </div>
          </div>
        )}
      </div>

      <AccountModal isOpen={isAccountModalOpen} onClose={handleCloseModal} currentLocale={currentLocale} />
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={handleCloseLoginModal}
        accountAddress={loginAccountAddress}
        currentLocale={currentLocale}
      />
      <UpdateNoticeModal
        isOpen={isUpdateNoticeModalOpen}
        onClose={() => setIsUpdateNoticeModalOpen(false)}
        currentLocale={currentLocale}
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
