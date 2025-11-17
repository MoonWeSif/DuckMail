"use client"

import { Button } from "@heroui/button"
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, DropdownSection } from "@heroui/dropdown"
import { Avatar } from "@heroui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Sun, Moon, Languages, User, UserPlus, LogOut, Trash2, Copy, Check, Wifi, Settings } from "lucide-react"
import { useTheme } from "next-themes"
import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useHeroUIToast } from "@/hooks/use-heroui-toast"
import { useMailStatus } from "@/contexts/mail-status-context"
import { SettingsPanel } from "@/components/settings-panel"

interface HeaderProps {
  onCreateAccount: () => void
  currentLocale: string
  onLocaleChange: (locale: string) => void
  onLogin?: () => void
  isMobile?: boolean
}

export default function Header({ onCreateAccount, currentLocale, onLocaleChange, onLogin, isMobile = false }: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const { isAuthenticated, currentAccount, accounts, logout, switchAccount, deleteAccount } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const { toast } = useHeroUIToast()
  const { isEnabled, setIsEnabled } = useMailStatus()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleCopyToClipboard = useCallback(
    async (text: string, type: string) => {
      try {
        await navigator.clipboard.writeText(text)
        if (type === "email") setCopiedEmail(true)
        toast({ title: `${type === "email" ? "邮箱地址" : "内容"}已复制`, description: text })
        setTimeout(() => {
          if (type === "email") setCopiedEmail(false)
        }, 2000)
      } catch (err) {
        toast({ title: "复制失败", description: "无法访问剪贴板", color: "danger", variant: "flat" })
        console.error("Failed to copy: ", err)
      }
    },
    [toast],
  )

  if (!mounted) return null

  const getInitials = (email: string) => {
    return email ? email.substring(0, 2).toUpperCase() : "NA"
  }

  const getRandomColor = (email: string) => {
    if (!email) return "default"
    const colors = ["primary", "secondary", "success", "warning", "danger"]
    const hash = email.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  const toggleLocale = () => {
    onLocaleChange(currentLocale === "en" ? "zh" : "en")
  }

  const toggleMailChecker = () => {
    const newState = !isEnabled
    setIsEnabled(newState)

    toast({
      title: newState ? "已开启邮件自动检查" : "已关闭邮件自动检查",
      description: newState ? "每 1 秒自动刷新收件箱" : "不再自动刷新收件箱，可手动点击刷新",
      color: newState ? "success" : "warning",
      variant: "flat",
      icon: <Wifi size={16} />,
    })
  }

  return (
    <header className={`h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 ${isMobile ? 'px-4' : 'px-6'} flex items-center justify-between`}>
      <div className="flex items-center space-x-2 flex-1 min-w-0">
        {isAuthenticated && currentAccount ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="light"
                  className={`text-sm font-medium text-gray-800 dark:text-white p-2 h-auto bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 ${isMobile ? 'max-w-[200px] truncate' : ''}`}
                  onPress={() => handleCopyToClipboard(currentAccount.address, "email")}
                  endContent={
                    copiedEmail ? (
                      <Check size={16} className="text-green-500" />
                    ) : (
                      <Copy size={16} className="text-gray-500 dark:text-gray-300" />
                    )
                  }
                >
                  <span className={isMobile ? 'truncate' : ''}>{currentAccount.address}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{copiedEmail ? "已复制!" : "点击复制邮箱地址"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <div className="w-px h-6" /> // Placeholder for spacing if not authenticated
        )}
      </div>

      <div className={`flex items-center ${isMobile ? 'space-x-1' : 'space-x-2'}`}>
        {/* 邮件检查切换按钮 */}
        {isAuthenticated && currentAccount && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  onPress={toggleMailChecker}
                  className="text-gray-600 dark:text-gray-300"
                  aria-label={
                    isEnabled ? "关闭邮件自动检查" : "开启邮件自动检查"
                  }
                >
                  <Wifi
                    size={16}
                    className={isEnabled ? "text-green-500" : "text-gray-400"}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-medium text-sm">
                    {isEnabled ? "邮件自动检查已开启" : "邮件自动检查已关闭"}
                  </p>
                  <p className="text-xs text-gray-600">
                    {isEnabled ? "当前每 2 秒轮询一次收件箱" : "不会自动轮询，可手动点击刷新按钮查看新邮件"}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <Button
          isIconOnly
          variant="light"
          size="sm"
          onPress={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="text-gray-600 dark:text-gray-300"
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </Button>

        <Button
          isIconOnly
          variant="light"
          size="sm"
          onPress={toggleLocale}
          className="text-gray-600 dark:text-gray-300"
          aria-label={`Switch to ${currentLocale === "en" ? "Chinese" : "English"}`}
        >
          <Languages size={18} />
        </Button>

        <Button
          isIconOnly
          variant="light"
          size="sm"
          onPress={() => setIsSettingsOpen(true)}
          className="text-gray-600 dark:text-gray-300"
          aria-label={currentLocale === "en" ? "Settings" : "设置"}
        >
          <Settings size={18} />
        </Button>

        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <Button isIconOnly variant="light" size="sm" className="text-gray-600 dark:text-gray-300">
              {isAuthenticated && currentAccount ? (
                <Avatar
                  name={getInitials(currentAccount.address)}
                  color={getRandomColor(currentAccount.address) as any}
                  size="sm"
                />
              ) : (
                <User size={18} />
              )}
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="User actions">
            {[
              ...(isAuthenticated && currentAccount ? [
                <DropdownSection key="current-account" title={currentLocale === "en" ? "Current Account" : "当前账户"} showDivider>
                  <DropdownItem
                    key="current-email"
                    textValue={currentAccount.address}
                    onPress={() => handleCopyToClipboard(currentAccount.address, "email")}
                    endContent={
                      copiedEmail ? (
                        <Check size={16} className="text-green-500" />
                      ) : (
                        <Copy size={16} className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white" />
                      )
                    }
                    className="py-3 cursor-pointer"
                  >
                    <div className="font-semibold text-gray-800 dark:text-white text-sm">
                      {currentAccount.address}
                    </div>
                  </DropdownItem>
                </DropdownSection>
              ] : []),

              ...(isAuthenticated && accounts.length > 1 ? [
                <DropdownSection key="switch-accounts" title={currentLocale === "en" ? "Switch Account" : "切换账户"} showDivider>
                  {(() => {
                    // 按提供商分组账户
                    const accountsByProvider = accounts.reduce((acc, account) => {
                      const providerId = account.providerId || "duckmail"
                      if (!acc[providerId]) {
                        acc[providerId] = []
                      }
                      acc[providerId].push(account)
                      return acc
                    }, {} as Record<string, typeof accounts>)

                    // 获取提供商名称
                    const getProviderName = (providerId: string) => {
                      switch (providerId) {
                        case "duckmail": return "DuckMail"
                        case "mailtm": return "Mail.tm"
                        default: return providerId
                      }
                    }

                    return Object.entries(accountsByProvider).flatMap(([providerId, providerAccounts]) => [
                      // 如果有多个提供商，显示提供商分组标题
                      ...(Object.keys(accountsByProvider).length > 1 ? [
                        <DropdownItem key={`provider-${providerId}`} className="opacity-60 cursor-default pointer-events-none">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              providerId === 'duckmail' ? 'bg-blue-500' :
                              providerId === 'mailtm' ? 'bg-green-500' : 'bg-purple-500'
                            }`} />
                            <span className="text-xs font-medium text-gray-600">
                              {getProviderName(providerId)}
                            </span>
                          </div>
                        </DropdownItem>
                      ] : []),
                      // 该提供商的账户
                      ...providerAccounts
                        .filter((account) => account.address !== currentAccount?.address)
                        .map((account) => (
                          <DropdownItem
                            key={account.id}
                            startContent={
                              <Avatar
                                name={getInitials(account.address)}
                                color={getRandomColor(account.address) as any}
                                size="sm"
                              />
                            }
                            onPress={async () => {
                              try {
                                await switchAccount(account)
                              } catch (error) {
                                toast({
                                  title: currentLocale === "en" ? "Account Switch Failed" : "切换账户失败",
                                  description: currentLocale === "en" ? "Please try logging in to this account again" : "请尝试重新登录该账户",
                                  color: "danger",
                                  variant: "flat"
                                })
                              }
                            }}
                            textValue={account.address}
                            className={`py-2 ${Object.keys(accountsByProvider).length > 1 ? "pl-6" : ""}`}
                          >
                            <div className="text-gray-800 dark:text-white text-sm">
                              {account.address}
                            </div>
                          </DropdownItem>
                        ))
                    ])
                  })()}
                </DropdownSection>
              ] : []),

              <DropdownSection key="account-actions" aria-label="Account Actions">
                {isAuthenticated && currentAccount ? (
                  <>
                    <DropdownItem key="login_another" startContent={<User size={16} />} onPress={onLogin || (() => {})}>
                      {currentLocale === "en" ? "Login Another Account" : "登录其他账户"}
                    </DropdownItem>
                    <DropdownItem key="create_another" startContent={<UserPlus size={16} />} onPress={onCreateAccount}>
                      {currentLocale === "en" ? "Create New Account" : "创建新账户"}
                    </DropdownItem>
                    <DropdownItem
                      key="delete"
                      className="text-danger"
                      color="danger"
                      startContent={<Trash2 size={16} />}
                      onPress={() => currentAccount && deleteAccount(currentAccount.id)}
                    >
                      {currentLocale === "en" ? "Delete Current Account" : "删除当前账户"}
                    </DropdownItem>
                  </>
                ) : (
                  <>
                    <DropdownItem key="login" startContent={<User size={16} />} onPress={onLogin || (() => {})}>
                      {currentLocale === "en" ? "Login Existing Account" : "登录现有账户"}
                    </DropdownItem>
                    <DropdownItem key="create" startContent={<UserPlus size={16} />} onPress={onCreateAccount}>
                      {currentLocale === "en" ? "Create New Account" : "创建新账户"}
                    </DropdownItem>
                  </>
                )}
              </DropdownSection>
            ]}
          </DropdownMenu>
        </Dropdown>

        {isAuthenticated && (
          <Button
            isIconOnly
            variant="light"
            size="sm"
            onPress={logout}
            className="text-gray-600 dark:text-gray-300"
            aria-label="Logout"
          >
            <LogOut size={18} />
          </Button>
        )}
      </div>

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentLocale={currentLocale}
      />
    </header>
  )
}
