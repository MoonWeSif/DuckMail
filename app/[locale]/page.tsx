"use client"

import { useState, useEffect, useRef, useTransition } from "react"
import Header from "@/components/header"
import Sidebar, { type SidebarNavItem } from "@/components/sidebar"
import { SettingsPanel } from "@/components/settings-panel"
import EmptyState from "@/components/empty-state"
import CreatingState from "@/components/creating-state"
import InboxIntro from "@/components/inbox-intro"
import AccountModal from "@/components/account-modal"
import LoginModal from "@/components/login-modal"
import UpdateNoticeModal from "@/components/update-notice-modal"
import HostedMessageList from "@/components/hosted-message-list"
import MessageList from "@/components/message-list"
import MessageDetail from "@/components/message-detail"
import { AuthProvider, useAuth } from "@/contexts/auth-context"
import { useApiProvider } from "@/contexts/api-provider-context"
import { MailStatusProvider } from "@/contexts/mail-status-context"
import type { Message } from "@/types"
import { HOSTED_AUTH_REQUIRED } from "@/lib/hosting-session"
import { useHeroUIToast } from "@/hooks/use-heroui-toast"
import { useIsMobile } from "@/hooks/use-mobile"
import { useTranslations, useLocale } from "next-intl"
import { useRouter, usePathname } from "@/i18n/navigation"
import { CheckCircle, Navigation, RefreshCw, Menu, AlertCircle, Languages } from "lucide-react"
import { Button } from "@heroui/button"
import { DUCKMAIL_LOGO_PATH } from "@/lib/brand"

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
  const { isAuthenticated, currentAccount, accounts, register, isReady: authReady } = useAuth()
  const { apiKey, isReady: providerReady } = useApiProvider()
  // First-run: nothing to list yet, so the sidebar stays out of the way while
  // a mailbox is being provisioned automatically.
  const hasMailboxes = accounts.length > 0 || !!apiKey
  useEffect(()=>{setSelectedMessage(null)},[currentAccount?.id])
  const [refreshKey, setRefreshKey] = useState(0)
  const { toast } = useHeroUIToast()
  const isMobile = useIsMobile()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)
  const autoCreateTriedRef = useRef(false)
  const [isUpdateNoticeModalOpen, setIsUpdateNoticeModalOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

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

  useEffect(() => {
    const onNeed = (event: Event) => {
      const address = (event as CustomEvent<{ address?: string }>).detail?.address || ""
      setLoginAccountAddress(address)
      setIsLoginModalOpen(true)
    }
    window.addEventListener(HOSTED_AUTH_REQUIRED, onNeed)
    return () => window.removeEventListener(HOSTED_AUTH_REQUIRED, onNeed)
  }, [])

  // 一键创建临时邮箱（首次进入自动触发，或用户手动触发）
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
        // 一键创建的临时邮箱默认不过期
        await register(email, password, 0)

        // 账号/密码可随时在右上角头像菜单查看，这里只做一次轻量提示
        toast({
          title: t("mailboxReady"),
          description: t("mailboxReadyDesc"),
          color: "success",
          variant: "flat",
          timeout: 8000,
          icon: <CheckCircle size={16} />
        })

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

  // 首次进入（本地没有任何邮箱、也没配置 API Key）时自动创建一个临时邮箱，
  // 用户无需点击即可直接停留在主界面等待收件。仅在本次会话尝试一次。
  useEffect(() => {
    if (!authReady || !providerReady || autoCreateTriedRef.current) return
    autoCreateTriedRef.current = true
    if (accounts.length === 0 && !apiKey) {
      void handleQuickCreate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, providerReady])

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
    setLoginAccountAddress("")
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

  const handleRefresh = () => {
    toast({
      title: t("refreshing"),
      color: "primary",
      variant: "flat",
      icon: <RefreshCw size={16} />
    })
    setRefreshKey(prev => prev + 1)
  }

  const handleSidebarItemClick = (item: SidebarNavItem) => {
    if (item === "inbox") {
      setSelectedMessage(null)
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

  const sidebarProps = {
    onItemClick: handleSidebarItemClick,
    onQuickCreate: handleQuickCreate,
    onCreateAccount: handleCreateAccount,
    onLogin: handleLogin,
    onOpenSettings: () => setIsSettingsOpen(true),
    isCreating: isCreatingAccount,
  }

  return (
    <>
      <div className={`flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 transition-opacity duration-200 ${isPending ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
        {/* 桌面端侧边栏 */}
        {!isMobile && hasMailboxes && <Sidebar {...sidebarProps} />}

        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* 移动端顶部栏包含菜单按钮 */}
          {isMobile && (
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              {hasMailboxes ? (
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
              ) : (
                <div className="w-8" />
              )}
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center overflow-hidden bg-white p-0.5">
                  <img
                    src={DUCKMAIL_LOGO_PATH}
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
            onQuickCreate={handleQuickCreate}
            onLocaleChange={handleLocaleChange}
            onLogin={handleLogin}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onRefresh={handleRefresh}
            isMobile={isMobile}
          />
          <main className="flex-1 overflow-y-auto">
            {isAuthenticated && currentAccount ? (
              selectedMessage ? (
                <MessageDetail key={currentAccount.id + selectedMessage.id}
                  message={selectedMessage}
                  onBack={handleBackToList}
                  onDelete={handleDeleteMessageInDetail}
                />
              ) : (
                currentAccount.source === "microsoft" ? <HostedMessageList key={currentAccount.id} onSelectMessage={handleSelectMessage} refreshKey={refreshKey} /> : <MessageList onSelectMessage={handleSelectMessage} refreshKey={refreshKey} />
              )
            ) : !authReady || !providerReady || isCreatingAccount ? (
              // 本地状态尚未恢复 / 正在自动创建：用同一个轻量动画占位，避免落地页闪烁
              <CreatingState />
            ) : apiKey ? (
              <EmptyState
                mode="hosted"
                onCreateAccount={handleQuickCreate}
                isAuthenticated={isAuthenticated}
                isCreating={isCreatingAccount}
              />
            ) : (
              // 自动创建失败或用户删光了邮箱：保留手动入口，并继续展示系统说明
              <div className="flex flex-col">
                <EmptyState onCreateAccount={handleQuickCreate} isAuthenticated={isAuthenticated} isCreating={isCreatingAccount} />
                <InboxIntro />
              </div>
            )}
          </main>
        </div>

        {/* 移动端侧边栏抽屉 */}
        {isMobile && hasMailboxes && (
          <div hidden={!isSidebarOpen} className="fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/50 transition-opacity duration-300"
              onClick={() => setIsSidebarOpen(false)}
            />
            <div className={`absolute left-0 top-0 h-full shadow-lg transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
              <Sidebar
                {...sidebarProps}
                isMobile
                onClose={() => setIsSidebarOpen(false)}
                onItemClick={(item) => {
                  handleSidebarItemClick(item)
                  setIsSidebarOpen(false)
                }}
                onQuickCreate={() => {
                  setIsSidebarOpen(false)
                  handleQuickCreate()
                }}
                onCreateAccount={() => {
                  setIsSidebarOpen(false)
                  handleCreateAccount()
                }}
                onLogin={() => {
                  setIsSidebarOpen(false)
                  handleLogin()
                }}
                onOpenSettings={() => {
                  setIsSidebarOpen(false)
                  setIsSettingsOpen(true)
                }}
              />
            </div>
          </div>
        )}
      </div>

      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
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
