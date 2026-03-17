"use client"

import { Button } from "@heroui/button"
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, DropdownSection } from "@heroui/dropdown"
import { Avatar } from "@heroui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Sun, Moon, Languages, User, UserPlus, LogOut, Trash2, Copy, Check, Wifi, Settings, Eye, EyeOff, KeyRound } from "lucide-react"
import { useTheme } from "next-themes"
import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useHeroUIToast } from "@/hooks/use-heroui-toast"
import { useMailStatus } from "@/contexts/mail-status-context"
import { SettingsPanel } from "@/components/settings-panel"
import { useTranslations, useLocale } from "next-intl"

interface HeaderProps {
  onCreateAccount: () => void
  onLocaleChange: () => void
  onLogin?: () => void
  isMobile?: boolean
}

export default function Header({ onCreateAccount, onLocaleChange, onLogin, isMobile = false }: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const { isAuthenticated, currentAccount, accounts, logout, switchAccount, deleteAccount } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [copiedPassword, setCopiedPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const { toast } = useHeroUIToast()
  const { isEnabled, setIsEnabled } = useMailStatus()
  const t = useTranslations("header")
  const tc = useTranslations("common")
  const locale = useLocale()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleCopyToClipboard = useCallback(
    async (text: string, type: string) => {
      try {
        await navigator.clipboard.writeText(text)
        if (type === "email") setCopiedEmail(true)
        toast({ title: type === "email" ? tc("emailCopied") : tc("contentCopied"), description: text })
        setTimeout(() => {
          if (type === "email") setCopiedEmail(false)
        }, 2000)
      } catch (err) {
        toast({ title: tc("copyFailed"), description: tc("clipboardError"), color: "danger", variant: "flat" })
        console.error("Failed to copy: ", err)
      }
    },
    [toast, tc],
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

  const toggleMailChecker = () => {
    const newState = !isEnabled
    setIsEnabled(newState)

    toast({
      title: newState ? t("mailCheckEnabled") : t("mailCheckDisabled"),
      description: newState ? t("mailCheckEnabledDesc") : t("mailCheckDisabledDesc"),
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
                <p>{copiedEmail ? tc("copied") : tc("copyEmailTooltip")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <div className="w-px h-6" />
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
                  aria-label={isEnabled ? t("disableMailCheck") : t("enableMailCheck")}
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
                    {isEnabled ? t("mailAutoCheckOn") : t("mailAutoCheckOff")}
                  </p>
                  <p className="text-xs text-gray-600">
                    {isEnabled ? t("mailAutoCheckOnDesc") : t("mailAutoCheckOffDesc")}
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
          aria-label={theme === "dark" ? t("switchToLight") : t("switchToDark")}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </Button>

        <Button
          isIconOnly
          variant="light"
          size="sm"
          onPress={onLocaleChange}
          className="text-gray-600 dark:text-gray-300"
          aria-label={locale === "en" ? t("switchToChinese") : t("switchToEnglish")}
        >
          <Languages size={18} />
        </Button>

        <Button
          isIconOnly
          variant="light"
          size="sm"
          onPress={() => setIsSettingsOpen(true)}
          className="text-gray-600 dark:text-gray-300"
          aria-label={t("settings")}
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
                <DropdownSection key="current-account" title={t("currentAccount")} showDivider>
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
                  {currentAccount.password ? (
                    <DropdownItem
                      key="current-password"
                      textValue="password"
                      isReadOnly
                      className="py-2 cursor-default"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <KeyRound size={14} className="text-gray-400 flex-shrink-0" />
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">
                            {showPassword ? currentAccount.password : "••••••••••••"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowPassword(!showPassword)
                            }}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            {showPassword ? (
                              <EyeOff size={14} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
                            ) : (
                              <Eye size={14} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              navigator.clipboard.writeText(currentAccount.password!)
                              setCopiedPassword(true)
                              toast({ title: t("passwordCopied") })
                              setTimeout(() => setCopiedPassword(false), 2000)
                            }}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            {copiedPassword ? (
                              <Check size={14} className="text-green-500" />
                            ) : (
                              <Copy size={14} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
                            )}
                          </button>
                        </div>
                      </div>
                    </DropdownItem>
                  ) : null}
                </DropdownSection>
              ] : []),

              ...(isAuthenticated && accounts.length > 1 ? [
                <DropdownSection key="switch-accounts" title={t("switchAccount")} showDivider>
                  {(() => {
                    const accountsByProvider = accounts.reduce((acc, account) => {
                      const providerId = account.providerId || "duckmail"
                      if (!acc[providerId]) {
                        acc[providerId] = []
                      }
                      acc[providerId].push(account)
                      return acc
                    }, {} as Record<string, typeof accounts>)

                    const getProviderName = (providerId: string) => {
                      switch (providerId) {
                        case "duckmail": return "DuckMail"
                        case "mailtm": return "Mail.tm"
                        default: return providerId
                      }
                    }

                    return Object.entries(accountsByProvider).flatMap(([providerId, providerAccounts]) => [
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
                                  title: t("accountSwitchFailed"),
                                  description: t("accountSwitchFailedDesc"),
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
                      {t("loginAnother")}
                    </DropdownItem>
                    <DropdownItem key="create_another" startContent={<UserPlus size={16} />} onPress={onCreateAccount}>
                      {t("createNew")}
                    </DropdownItem>
                    <DropdownItem
                      key="delete"
                      className="text-danger"
                      color="danger"
                      startContent={<Trash2 size={16} />}
                      onPress={() => currentAccount && deleteAccount(currentAccount.id)}
                    >
                      {t("deleteCurrent")}
                    </DropdownItem>
                  </>
                ) : (
                  <>
                    <DropdownItem key="login" startContent={<User size={16} />} onPress={onLogin || (() => {})}>
                      {t("loginExisting")}
                    </DropdownItem>
                    <DropdownItem key="create" startContent={<UserPlus size={16} />} onPress={onCreateAccount}>
                      {t("createNew")}
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
            aria-label={t("logout")}
          >
            <LogOut size={18} />
          </Button>
        )}
      </div>

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </header>
  )
}
