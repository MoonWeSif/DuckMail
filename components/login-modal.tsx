"use client"

import { useEffect, useState } from "react"
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal"
import { Button } from "@heroui/button"
import { Input } from "@heroui/input"
import { useAuth } from "@/contexts/auth-context"
import { Eye, EyeOff, LogIn, AlertCircle } from "lucide-react"
import { Card, CardBody } from "@heroui/card"
import { DomainSelector } from "@/components/domain-selector"

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  accountAddress?: string
  currentLocale: string
}

export default function LoginModal({ isOpen, onClose, accountAddress, currentLocale }: LoginModalProps) {
  // 完整邮箱登录模式使用的地址
  const [address, setAddress] = useState(accountAddress || "")
  // 拆分模式使用的用户名和域名
  const [username, setUsername] = useState("")
  const [selectedDomain, setSelectedDomain] = useState<string>("")
  const [loginMode, setLoginMode] = useState<"split" | "full">("split")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const { login } = useAuth()

  // 根据传入的 accountAddress 预填用户名/域名
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
      // 从现有账号进入时，默认采用“用户名 + 域名”模式
      setLoginMode("split")
    } else {
      // 新打开时重置为拆分模式，方便选择域名
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
        setError(
          currentLocale === "en"
            ? "Please fill in username and select a domain"
            : "请填写用户名并选择域名"
        )
        return
      }
      loginAddress = `${username}@${selectedDomain}`
    } else {
      if (!address) {
        setIsLoading(false)
        setError(
          currentLocale === "en"
            ? "Please fill in email address and password"
            : "请填写邮箱地址和密码"
        )
        return
      }
    }

    try {
      await login(loginAddress, password)
      onClose()
      // 重置表单
      setAddress("")
      setUsername("")
      setSelectedDomain("")
      setPassword("")
      setError(null)
    } catch (error: any) {
      console.error("Login failed:", error)
      setError(error.message || (currentLocale === "en" ? "Login failed, please check email address and password" : "登录失败，请检查邮箱地址和密码"))
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
          <h2 className="text-xl font-semibold text-center">
            {currentLocale === "en" ? "Login Account" : "登录账户"}
          </h2>
          <p className="text-sm text-gray-500 text-center">
            {currentLocale === "en"
              ? "Please enter your email address and password to login"
              : "请输入您的邮箱地址和密码来登录"
            }
          </p>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {/* 登录方式切换：完整邮箱 / 用户名 + 域名 */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <span>{currentLocale === "en" ? "Login mode:" : "登录方式："}</span>
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
                {currentLocale === "en" ? "Username + Domain" : "用户名 + 域名"}
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
                {currentLocale === "en" ? "Full Email" : "完整邮箱"}
              </button>
            </div>

            {loginMode === "full" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {currentLocale === "en" ? "Email Address" : "邮箱地址"}
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
                    {currentLocale === "en" ? "Username" : "用户名"}
                  </label>
                  <Input
                    type="text"
                    placeholder={currentLocale === "en" ? "your_name" : "你的用户名"}
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
                    currentLocale={currentLocale}
                    isDisabled={isLoading}
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {currentLocale === "en" ? "Password" : "密码"}
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
                    <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                      {currentLocale === "en" ? "Important Notice" : "重要提醒"}
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-300">
                      {currentLocale === "en"
                        ? "duckmail.sbs does not provide password recovery. Please make sure you remember the correct password."
                        : "duckmail.sbs 不提供密码找回功能，请确保您记住了正确的密码。"
                      }
                    </p>
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
            {currentLocale === "en" ? "Cancel" : "取消"}
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isLoading={isLoading}
            isDisabled={!canSubmit}
          >
            {currentLocale === "en" ? "Login" : "登录"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
