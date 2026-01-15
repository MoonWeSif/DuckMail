"use client"

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal"
import { Button } from "@heroui/button"
import { Card, CardBody } from "@heroui/card"
import { Bell, Database, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react"

interface UpdateNoticeModalProps {
  isOpen: boolean
  onClose: () => void
  currentLocale: string
}

export default function UpdateNoticeModal({
  isOpen,
  onClose,
  currentLocale
}: UpdateNoticeModalProps) {
  const isZh = currentLocale !== "en"

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      placement="center"
      backdrop="blur"
      size="lg"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex justify-center mb-2">
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <Bell size={28} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-center">
            {isZh ? "系统更新通知" : "System Update Notice"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            {isZh ? "2026年1月16日" : "January 16, 2026"}
          </p>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {/* 更新内容 */}
            <Card className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <CardBody className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800/50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Database size={16} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                      {isZh ? "存储系统升级" : "Storage System Upgrade"}
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                      {isZh
                        ? "由于之前系统的存储方式存在部分问题，影响了 API 性能，因此在 2026 年 1 月 16 日进行了后端的存储方式重构，采取更加高效化的存储方式。"
                        : "Due to some issues with the previous storage method affecting API performance, we restructured the backend storage on January 16, 2026, adopting a more efficient storage approach."}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* 影响说明 */}
            <Card className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <CardBody className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-100 dark:bg-amber-800/50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertCircle size={16} className="text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                      {isZh ? "账户数据说明" : "Account Data Notice"}
                    </h3>
                    <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
                      {isZh
                        ? "由于存储方式的兼容性问题，之前的账户信息并没有迁移保留。如果您需要使用原账户，请使用相同的用户名再次创建一次即可，不影响后续的正常接码使用。"
                        : "Due to storage compatibility issues, previous account information was not migrated. If you need to use your original account, simply create it again with the same username. This will not affect your future email receiving functionality."}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* 操作指引 */}
            <Card className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <CardBody className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-800/50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 size={16} className="text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-green-800 dark:text-green-200 mb-2">
                      {isZh ? "如何恢复原账户" : "How to Recover Your Account"}
                    </h3>
                    <ul className="text-sm text-green-700 dark:text-green-300 leading-relaxed space-y-1.5">
                      <li className="flex items-start gap-2">
                        <ArrowRight size={14} className="mt-0.5 flex-shrink-0" />
                        <span>
                          {isZh
                            ? "使用与之前相同的用户名创建新账户"
                            : "Create a new account with the same username as before"}
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight size={14} className="mt-0.5 flex-shrink-0" />
                        <span>
                          {isZh
                            ? "设置一个新密码（可以与之前相同或不同）"
                            : "Set a new password (can be the same or different from before)"}
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight size={14} className="mt-0.5 flex-shrink-0" />
                        <span>
                          {isZh
                            ? "原邮箱地址的邮件将继续正常接收"
                            : "Emails to your original address will continue to be received normally"}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* 致歉 */}
            <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-2">
              <p>
                {isZh
                  ? "对于此次更新带来的不便，我们深表歉意。感谢您对 DuckMail 的支持！"
                  : "We apologize for any inconvenience caused by this update. Thank you for your support of DuckMail!"}
              </p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            color="primary"
            onPress={onClose}
            className="w-full"
          >
            {isZh ? "我知道了" : "I Understand"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
