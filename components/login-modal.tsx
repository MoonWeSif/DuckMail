"use client"

import { useEffect, useState } from "react"
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal"
import { Button } from "@heroui/button"
import { Input } from "@heroui/input"
import { useAuth } from "@/contexts/auth-context"
import { Eye, EyeOff, LogIn, AlertCircle } from "lucide-react"
import { Card, CardBody } from "@heroui/card"
import { DomainSelector } from "@/components/domain-selector"
import { useTranslations } from "next-intl"

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  accountAddress?: string
}

export default function LoginModal({ isOpen, onClose, accountAddress }: LoginModalProps) {
  const [address, setAddress] = useState(accountAddress || "")
  const [username, setUsername] = useState("")
  const [selectedDomain, setSelectedDomain] = useState<string>("")
  const [loginMode, setLoginMode] = useState<"split" | "full">("split")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const { login } = useAuth()
  const t = useTranslations("loginModal")
  const tc = useTranslations("common")

  useEffect(() => {
    if (!isOpen) return

    if (accountAddress) {
      setAddress(accountAddress)
      const parts = accountAddress.split("@")
      if (parts.length === 2) {
        setUsername(parts[0])
        setSelectedDomain(parts[1])
      } else {
        setUsername(accountAddress)
        setSelectedDomain("")
      }
      setLoginMode("split")
    } else {
      setLoginMode("split")
    }
  }, [isOpen, accountAddress])

  const canSubmit =
    !!password &&
    (loginMode === "full"
      ? !!address
      : !!username && !!selectedDomain)

  const togglePasswordVisibility = () => setIsPasswordVisible(!isPasswordVisible)

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    let loginAddress = address

    if (loginMode === "split") {
      if (!username || !selectedDomain) {
        setIsLoading(false)
        setError(t("fillUsernameAndDomain"))
        return
      }
      loginAddress = `${username}@${selectedDomain}`
    } else {
      if (!address) {
        setIsLoading(false)
        setError(t("fillEmailAndPassword"))
        return
      }
    }

    try {
      await login(loginAddress, password)
      onClose()
      setAddress("")
      setUsername("")
      setSelectedDomain("")
      setPassword("")
      setError(null)
    } catch (error: any) {
      console.error("Login failed:", error)
      setError(error.message || t("loginFailed"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    onClose()
    setError(null)
    setPassword("")
    if (!accountAddress) {
      setAddress("")
      setUsername("")
      setSelectedDomain("")
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} placement="center" backdrop="blur">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <LogIn size={24} className="text-green-600" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-center">{t("title")}</h2>
          <p className="text-sm text-gray-500 text-center">{t("subtitle")}</p>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <span>{t("loginMode")}</span>
              <button
                type="button"
                className={`px-2 py-1 rounded ${
                  loginMode === "split"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                onClick={() => setLoginMode("split")}
                disabled={isLoading}
              >
                {t("splitMode")}
              </button>
              <span>/</span>
              <button
                type="button"
                className={`px-2 py-1 rounded ${
                  loginMode === "full"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                onClick={() => setLoginMode("full")}
                disabled={isLoading}
              >
                {t("fullMode")}
              </button>
            </div>

            {loginMode === "full" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("emailLabel")}
                </label>
                <Input
                  type="email"
                  placeholder="example@duckmail.sbs"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  isDisabled={isLoading || !!accountAddress}
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("usernameLabel")}
                  </label>
                  <Input
                    type="text"
                    placeholder={t("usernamePlaceholder")}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    isDisabled={isLoading || !!accountAddress}
                  />
                </div>

                <div className="space-y-2">
                  <DomainSelector
                    value={selectedDomain}
                    onSelectionChange={(domain) => {
                      setSelectedDomain(domain)
                    }}
                    isDisabled={isLoading}
                  />
                </div>
              </>
            )}

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
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="bordered" onPress={handleClose} isDisabled={isLoading}>
            {tc("cancel")}
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isLoading={isLoading}
            isDisabled={!canSubmit}
          >
            {tc("login")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
