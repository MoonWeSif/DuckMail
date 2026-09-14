"use client"

import { useCallback, useEffect, useState, type Key } from "react"
import { Avatar } from "@heroui/avatar"
import { Button } from "@heroui/button"
import { Chip } from "@heroui/chip"
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
} from "@heroui/dropdown"
import { Tooltip } from "@heroui/react"
import {
  Check,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Languages,
  LogIn,
  LogOut,
  Moon,
  PauseCircle,
  RefreshCw,
  Settings,
  ShieldAlert,
  Sun,
  Trash2,
  User,
  UserPlus,
  Wifi,
  Zap,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useLocale, useTranslations } from "next-intl"
import { formatDistanceToNow } from "date-fns"
import { enUS, zhCN } from "date-fns/locale"
import { useAuth } from "@/contexts/auth-context"
import { useMailStatus } from "@/contexts/mail-status-context"
import { useHeroUIToast } from "@/hooks/use-heroui-toast"

interface HeaderProps {
  onCreateAccount: () => void
  onQuickCreate: () => void
  onLogin: () => void
  onLocaleChange: () => void
  onOpenSettings: () => void
  onRefresh: () => void
  isMobile?: boolean
}

const PANEL_URL = "https://domain.duckmail.sbs"
const initials = (address: string) => (address ? address.slice(0, 2).toUpperCase() : "?")

export default function Header({
  onCreateAccount,
  onQuickCreate,
  onLogin,
  onLocaleChange,
  onOpenSettings,
  onRefresh,
  isMobile = false,
}: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const { isAuthenticated, currentAccount, logout, deleteAccount } = useAuth()
  const { isEnabled, setIsEnabled } = useMailStatus()
  const { toast } = useHeroUIToast()
  const t = useTranslations("header")
  const tc = useTranslations("common")
  const locale = useLocale()

  const [mounted, setMounted] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [copiedPassword, setCopiedPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setShowPassword(false)
  }, [currentAccount?.id])

  const copy = useCallback(
    async (text: string, kind: "email" | "password") => {
      try {
        await navigator.clipboard.writeText(text)
        if (kind === "email") {
          setCopiedEmail(true)
          setTimeout(() => setCopiedEmail(false), 2000)
          toast({ title: tc("emailCopied"), description: text })
        } else {
          setCopiedPassword(true)
          setTimeout(() => setCopiedPassword(false), 2000)
          toast({ title: t("passwordCopied") })
        }
      } catch (err) {
        toast({ title: tc("copyFailed"), description: tc("clipboardError"), color: "danger", variant: "flat" })
        console.error("Failed to copy: ", err)
      }
    },
    [toast, t, tc],
  )

  const toggleMailChecker = () => {
    const next = !isEnabled
    setIsEnabled(next)
    toast({
      title: next ? t("mailCheckEnabled") : t("mailCheckDisabled"),
      description: next ? t("mailCheckEnabledDesc") : t("mailCheckDisabledDesc"),
      color: next ? "success" : "warning",
      variant: "flat",
      icon: <Wifi size={16} />,
    })
  }

  if (!mounted) return null

  const signedIn = isAuthenticated && !!currentAccount
  const hosted = currentAccount?.source === "microsoft"
  const sync = currentAccount?.hosting
  const syncState = hosted
    ? sync?.status === "needs_reauth"
      ? { icon: <ShieldAlert size={14} className="text-warning" />, text: t("needsReauth") }
      : sync?.paused
        ? { icon: <PauseCircle size={14} className="text-default-400" />, text: t("syncPaused") }
        : sync?.lastSuccessAt
          ? {
              icon: <RefreshCw size={14} className="text-success" />,
              text: t("lastSync", {
                time: formatDistanceToNow(new Date(sync.lastSuccessAt), {
                  addSuffix: true,
                  locale: locale === "en" ? enUS : zhCN,
                }),
              }),
            }
          : { icon: <RefreshCw size={14} className="text-default-400" />, text: t("notSynced") }
    : null

  const handleMenuAction = (key: Key) => {
    switch (key) {
      case "copy-address":
        if (currentAccount) copy(currentAccount.address, "email")
        break
      case "panel":
        window.open(PANEL_URL, "_blank", "noopener,noreferrer")
        break
      case "login":
        onLogin()
        break
      case "quick":
        onQuickCreate()
        break
      case "create":
        onCreateAccount()
        break
      case "remove":
        logout()
        break
      case "delete":
        if (currentAccount) deleteAccount(currentAccount.id)
        break
    }
  }

  const iconButton = "text-default-500"

  return (
    <header
      className={`flex h-16 items-center justify-between gap-3 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 ${isMobile ? "px-3" : "px-6"}`}
    >
      {/* Current mailbox address */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {signedIn && currentAccount ? (
          <>
            <Tooltip content={copiedEmail ? tc("copied") : tc("copyEmailTooltip")} size="sm" closeDelay={0}>
              <Button
                variant="flat"
                size="sm"
                className="h-9 min-w-0 max-w-full gap-2 px-3 font-medium"
                onPress={() => copy(currentAccount.address, "email")}
                endContent={
                  copiedEmail ? (
                    <Check size={15} className="shrink-0 text-success" />
                  ) : (
                    <Copy size={15} className="shrink-0 text-default-400" />
                  )
                }
              >
                <span className="truncate">{currentAccount.address}</span>
              </Button>
            </Tooltip>
            {!isMobile && (
              <Chip size="sm" variant="flat" color={hosted ? "secondary" : "primary"} className="hidden sm:flex">
                {hosted ? t("hostedMailbox") : t("tempMailbox")}
              </Chip>
            )}
          </>
        ) : null}
      </div>

      {/* Actions */}
      <div className={`flex shrink-0 items-center ${isMobile ? "gap-0" : "gap-1"}`}>
        {signedIn && (
          <>
            <Tooltip content={t("refresh")} size="sm" closeDelay={0}>
              <Button isIconOnly variant="light" size="sm" className={iconButton} aria-label={t("refresh")} onPress={onRefresh}>
                <RefreshCw size={17} />
              </Button>
            </Tooltip>
            <Tooltip
              size="sm"
              closeDelay={0}
              content={
                <div className="max-w-56 py-0.5">
                  <p className="text-tiny font-medium">{isEnabled ? t("mailAutoCheckOn") : t("mailAutoCheckOff")}</p>
                  <p className="text-tiny text-default-500">
                    {isEnabled ? t("mailAutoCheckOnDesc") : t("mailAutoCheckOffDesc")}
                  </p>
                </div>
              }
            >
              <Button
                isIconOnly
                variant="light"
                size="sm"
                className={iconButton}
                aria-label={isEnabled ? t("disableMailCheck") : t("enableMailCheck")}
                onPress={toggleMailChecker}
              >
                <Wifi size={17} className={isEnabled ? "text-success" : "text-default-400"} />
              </Button>
            </Tooltip>
          </>
        )}

        <Tooltip content={theme === "dark" ? t("switchToLight") : t("switchToDark")} size="sm" closeDelay={0}>
          <Button
            isIconOnly
            variant="light"
            size="sm"
            className={iconButton}
            aria-label={theme === "dark" ? t("switchToLight") : t("switchToDark")}
            onPress={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </Button>
        </Tooltip>

        <Tooltip content={locale === "en" ? t("switchToChinese") : t("switchToEnglish")} size="sm" closeDelay={0}>
          <Button
            isIconOnly
            variant="light"
            size="sm"
            className={iconButton}
            aria-label={locale === "en" ? t("switchToChinese") : t("switchToEnglish")}
            onPress={onLocaleChange}
          >
            <Languages size={17} />
          </Button>
        </Tooltip>

        <Tooltip content={t("settings")} size="sm" closeDelay={0}>
          <Button isIconOnly variant="light" size="sm" className={iconButton} aria-label={t("settings")} onPress={onOpenSettings}>
            <Settings size={17} />
          </Button>
        </Tooltip>

        <Dropdown placement="bottom-end" classNames={{ content: "min-w-[280px] p-1" }}>
          <DropdownTrigger>
            <Button isIconOnly variant="light" size="sm" aria-label={t("currentAccount")} className={`ml-1 ${iconButton}`}>
              {signedIn && currentAccount ? (
                <Avatar
                  size="sm"
                  name={initials(currentAccount.address)}
                  classNames={{
                    base: "h-7 w-7 bg-primary",
                    name: "text-tiny font-semibold text-primary-foreground",
                  }}
                />
              ) : (
                <User size={18} />
              )}
            </Button>
          </DropdownTrigger>

          <DropdownMenu
            aria-label={t("currentAccount")}
            variant="flat"
            onAction={handleMenuAction}
            itemClasses={{ description: "text-tiny" }}
          >
            {signedIn && currentAccount
              ? [
                  <DropdownSection key="current" showDivider aria-label={t("currentAccount")}>
                    <DropdownItem
                      key="profile"
                      isReadOnly
                      textValue={currentAccount.address}
                      className="cursor-default opacity-100 data-[hover=true]:bg-transparent"
                    >
                      <div className="flex items-center gap-3 py-0.5">
                        <Avatar
                          size="sm"
                          name={initials(currentAccount.address)}
                          classNames={{
                            base: "h-9 w-9 shrink-0 bg-primary",
                            name: "text-small font-semibold text-primary-foreground",
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-small font-medium text-foreground">{currentAccount.address}</p>
                          <div className="mt-1 flex items-center gap-1.5">
                            <Chip size="sm" variant="flat" color={hosted ? "secondary" : "primary"} className="h-5">
                              {hosted ? t("hostedMailbox") : t("tempMailbox")}
                            </Chip>
                            {currentAccount.label && (
                              <span className="truncate text-tiny text-default-500">{currentAccount.label}</span>
                            )}
                          </div>
                        </div>
                        <Tooltip content={copiedEmail ? tc("copied") : t("copyAddress")} size="sm" closeDelay={0}>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            aria-label={t("copyAddress")}
                            className="h-7 w-7 min-w-7 text-default-500"
                            onPress={() => copy(currentAccount.address, "email")}
                          >
                            {copiedEmail ? <Check size={15} className="text-success" /> : <Copy size={15} />}
                          </Button>
                        </Tooltip>
                      </div>
                    </DropdownItem>

                    {!hosted && currentAccount.password ? (
                      <DropdownItem
                        key="password"
                        isReadOnly
                        textValue={t("accessPassword")}
                        className="cursor-default opacity-100 data-[hover=true]:bg-transparent"
                      >
                        <div className="flex items-center gap-2">
                          <KeyRound size={14} className="shrink-0 text-default-400" />
                          <span className="min-w-0 flex-1 truncate font-mono text-tiny text-default-500">
                            {showPassword ? currentAccount.password : "••••••••••••"}
                          </span>
                          <Tooltip content={showPassword ? t("hidePassword") : t("showPassword")} size="sm" closeDelay={0}>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                              className="h-6 w-6 min-w-6 text-default-500"
                              onPress={() => setShowPassword((v) => !v)}
                            >
                              {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                            </Button>
                          </Tooltip>
                          <Tooltip content={t("copyPassword")} size="sm" closeDelay={0}>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              aria-label={t("copyPassword")}
                              className="h-6 w-6 min-w-6 text-default-500"
                              onPress={() => copy(currentAccount.password!, "password")}
                            >
                              {copiedPassword ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                            </Button>
                          </Tooltip>
                        </div>
                      </DropdownItem>
                    ) : null}

                    {syncState ? (
                      <DropdownItem
                        key="sync"
                        isReadOnly
                        textValue={syncState.text}
                        className="cursor-default opacity-100 data-[hover=true]:bg-transparent"
                      >
                        <div className="flex items-center gap-2 text-tiny text-default-500">
                          <span className="shrink-0">{syncState.icon}</span>
                          <span className="truncate">{syncState.text}</span>
                        </div>
                      </DropdownItem>
                    ) : null}
                  </DropdownSection>,

                  <DropdownSection key="actions" showDivider aria-label="actions">
                    {hosted ? (
                      <DropdownItem key="panel" startContent={<ExternalLink size={16} className="text-default-500" />}>
                        {t("openPanel")}
                      </DropdownItem>
                    ) : null}
                    <DropdownItem key="login" startContent={<LogIn size={16} className="text-default-500" />}>
                      {t("loginAnother")}
                    </DropdownItem>
                    <DropdownItem key="create" startContent={<UserPlus size={16} className="text-default-500" />}>
                      {t("createNew")}
                    </DropdownItem>
                  </DropdownSection>,

                  <DropdownSection key="danger" aria-label="danger">
                    <DropdownItem
                      key="remove"
                      startContent={<LogOut size={16} className="text-default-500" />}
                      description={t("removeFromDeviceDesc")}
                    >
                      {t("removeFromDevice")}
                    </DropdownItem>
                    {!hosted ? (
                      <DropdownItem
                        key="delete"
                        color="danger"
                        className="text-danger"
                        startContent={<Trash2 size={16} />}
                        description={t("deleteForeverDesc")}
                      >
                        {t("deleteForever")}
                      </DropdownItem>
                    ) : null}
                  </DropdownSection>,
                ]
              : [
                  <DropdownSection key="signed-out-section" showDivider aria-label={t("notSignedIn")}>
                    <DropdownItem
                      key="signed-out"
                      isReadOnly
                      textValue={t("notSignedIn")}
                      className="cursor-default opacity-100 data-[hover=true]:bg-transparent"
                    >
                      <div className="flex items-center gap-3 py-0.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-default-100">
                          <User size={16} className="text-default-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-small font-medium text-foreground">{t("notSignedIn")}</p>
                          <p className="text-tiny text-default-500">{t("notSignedInDesc")}</p>
                        </div>
                      </div>
                    </DropdownItem>
                  </DropdownSection>,
                  <DropdownSection key="signed-out-actions" aria-label="actions">
                    <DropdownItem key="quick" startContent={<Zap size={16} className="text-warning" />}>
                      {t("quickCreate")}
                    </DropdownItem>
                    <DropdownItem key="create" startContent={<UserPlus size={16} className="text-default-500" />}>
                      {t("customCreate")}
                    </DropdownItem>
                    <DropdownItem key="login" startContent={<LogIn size={16} className="text-default-500" />}>
                      {t("loginExisting")}
                    </DropdownItem>
                  </DropdownSection>,
                ]}
          </DropdownMenu>
        </Dropdown>
      </div>
    </header>
  )
}
