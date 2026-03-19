"use client"

import { useState } from "react"
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal"
import { Button } from "@heroui/button"
import { Input } from "@heroui/input"

import { useAuth } from "@/contexts/auth-context"
import { DomainSelector } from "@/components/domain-selector"
import { Select, SelectItem } from "@heroui/select"
import { Eye, EyeOff, User, AlertCircle } from "lucide-react"
import { Card, CardBody } from "@heroui/card"
import { useTranslations } from "next-intl"

interface AccountModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AccountModal({ isOpen, onClose }: AccountModalProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [selectedDomain, setSelectedDomain] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [showLoginOption, setShowLoginOption] = useState(false)
  const [expiresIn, setExpiresIn] = useState<string>("0") // 默认不过期
  const { register, login } = useAuth()
  const t = useTranslations("accountModal")
  const tc = useTranslations("common")

  const handleSubmit = async () => {
    if (!username || !selectedDomain || !password) {
      setError(t("fillAllFields"))
      return
    }

    setIsLoading(true)
    setError(null)
    setShowLoginOption(false)

    const email = `${username}@${selectedDomain}`

    try {
      await register(email, password, Number(expiresIn))
      onClose()
      setUsername("")
      setPassword("")
      setExpiresIn("0")
      setError(null)
      setShowLoginOption(false)
    } catch (error: any) {
      console.error("Registration failed:", error)
      const errorMessage = error.message || ""

      if (errorMessage.includes("该邮箱地址已被使用") ||
          errorMessage.includes("Email address already exists") ||
          errorMessage.includes("already used") ||
          errorMessage.includes("already exists")) {
        setError(t("emailTaken"))
        setShowLoginOption(true)
      } else if (errorMessage.includes("请求过于频繁") ||
                 errorMessage.includes("rate limit") ||
                 errorMessage.includes("Too many requests")) {
        setError(t("rateLimited"))
        setShowLoginOption(false)
      } else {
        setError(errorMessage || t("createFailed"))
        setShowLoginOption(false)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleTryLogin = async () => {
    if (!username || !selectedDomain || !password) return

    setIsLoading(true)
    setError(null)
    setShowLoginOption(false)

    const email = `${username}@${selectedDomain}`

    try {
      await login(email, password)
      onClose()
      setUsername("")
      setPassword("")
      setError(null)
      setShowLoginOption(false)
    } catch (error: any) {
      console.error("Login failed:", error)
      setError(t("loginFailed"))
      setShowLoginOption(false)
    } finally {
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = () => setIsPasswordVisible(!isPasswordVisible)

  return (
    <Modal isOpen={isOpen} onClose={onClose} placement="center" backdrop="blur">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User size={24} className="text-blue-600" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-center">{t("title")}</h2>
          <p className="text-sm text-gray-500 text-center">{t("subtitle")}</p>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("emailLabel")}
              </label>
              <div className="space-y-3">
                <Input
                  label={t("usernameLabel")}
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  isDisabled={isLoading}
                />
                <DomainSelector
                  value={selectedDomain}
                  onSelectionChange={setSelectedDomain}
                  isDisabled={isLoading}
                />
              </div>
              {!username && <p className="text-xs text-red-500 mt-1">{tc("required")}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("passwordLabel")}
              </label>
              <Input
                type={isPasswordVisible ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                isDisabled={isLoading}
                endContent={
                  <button type="button" onClick={togglePasswordVisibility} className="focus:outline-none">
                    {isPasswordVisible ? (
                      <EyeOff size={16} className="text-gray-400" />
                    ) : (
                      <Eye size={16} className="text-gray-400" />
                    )}
                  </button>
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("expiresLabel")}
              </label>
              <Select
                selectedKeys={[expiresIn]}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string
                  if (value) setExpiresIn(value)
                }}
                isDisabled={isLoading}
                aria-label={t("expiresLabel")}
              >
                <SelectItem key="0">{t("expiresNever")}</SelectItem>
                <SelectItem key="3600">{t("expires1h")}</SelectItem>
                <SelectItem key="21600">{t("expires6h")}</SelectItem>
                <SelectItem key="86400">{t("expires24h")}</SelectItem>
                <SelectItem key="259200">{t("expires3d")}</SelectItem>
                <SelectItem key="604800">{t("expires7d")}</SelectItem>
              </Select>
            </div>

            <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
              <CardBody className="p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">{t("importantNotice")}</p>
                    <p className="text-yellow-700 dark:text-yellow-300">{t("noPasswordRecovery")}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {error && (
              <Card className="border-0 shadow-sm">
                <CardBody className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <svg className="w-3 h-3 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">{t("creationFailed")}</p>
                      <p className="text-sm text-red-600 dark:text-red-300 leading-relaxed">{error}</p>
                      {showLoginOption && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="flat"
                            color="primary"
                            onPress={handleTryLogin}
                            isLoading={isLoading}
                            startContent={<User size={14} />}
                            className="font-medium"
                          >
                            {t("tryLogin")}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="bordered" onPress={onClose} isDisabled={isLoading}>
            {tc("cancel")}
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isLoading={isLoading}
            isDisabled={!username || !selectedDomain || !password}
          >
            {tc("create")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
