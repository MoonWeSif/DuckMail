"use client"

import { useState } from "react"
import { Button } from "@heroui/button"
import { Copy, Check, X, Key, Mail } from "lucide-react"

interface AccountInfoBannerProps {
  email: string
  password: string
  onClose: () => void
  currentLocale: string
}

export default function AccountInfoBanner({
  email,
  password,
  onClose,
  currentLocale
}: AccountInfoBannerProps) {
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [copiedPassword, setCopiedPassword] = useState(false)

  const isZh = currentLocale !== "en"

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email)
      setCopiedEmail(true)
      setTimeout(() => setCopiedEmail(false), 2000)
    } catch (err) {
      console.error("Failed to copy email:", err)
    }
  }

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(password)
      setCopiedPassword(true)
      setTimeout(() => setCopiedPassword(false), 2000)
    } catch (err) {
      console.error("Failed to copy password:", err)
    }
  }

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-b border-green-200 dark:border-green-800 px-4 py-3">
      <div className="flex items-center justify-between gap-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-1 text-green-700 dark:text-green-300 flex-shrink-0">
            <Check size={16} className="text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium hidden sm:inline">
              {isZh ? "临时邮箱已创建" : "Email Created"}
            </span>
          </div>

          <div className="flex items-center gap-3 flex-1 min-w-0 flex-wrap sm:flex-nowrap">
            {/* 邮箱 */}
            <div className="flex items-center gap-1.5 bg-white/60 dark:bg-gray-800/60 rounded-lg px-2.5 py-1.5 border border-green-200 dark:border-green-700">
              <Mail size={14} className="text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="text-sm font-mono text-gray-800 dark:text-gray-200 truncate max-w-[180px] sm:max-w-none">
                {email}
              </span>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                className="w-6 h-6 min-w-6"
                onPress={handleCopyEmail}
              >
                {copiedEmail ? (
                  <Check size={12} className="text-green-600" />
                ) : (
                  <Copy size={12} className="text-gray-500" />
                )}
              </Button>
            </div>

            {/* 密码 */}
            <div className="flex items-center gap-1.5 bg-white/60 dark:bg-gray-800/60 rounded-lg px-2.5 py-1.5 border border-green-200 dark:border-green-700">
              <Key size={14} className="text-purple-600 dark:text-purple-400 flex-shrink-0" />
              <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                {isZh ? "密码" : "PWD"}:
              </span>
              <span className="text-sm font-mono text-gray-800 dark:text-gray-200">
                {password}
              </span>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                className="w-6 h-6 min-w-6"
                onPress={handleCopyPassword}
              >
                {copiedPassword ? (
                  <Check size={12} className="text-green-600" />
                ) : (
                  <Copy size={12} className="text-gray-500" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* 提示文字 */}
        <span className="text-xs text-green-600 dark:text-green-400 hidden md:inline flex-shrink-0">
          {isZh ? "请妥善保存，密码无法找回" : "Save it, password can't be recovered"}
        </span>

        {/* 关闭按钮 */}
        <Button
          isIconOnly
          size="sm"
          variant="light"
          className="w-7 h-7 min-w-7 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex-shrink-0"
          onPress={onClose}
        >
          <X size={16} />
        </Button>
      </div>
    </div>
  )
}
