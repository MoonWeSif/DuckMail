"use client"

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal"
import { Button } from "@heroui/button"
import { Card, CardBody } from "@heroui/card"
import { Bell, Database, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react"
import { useTranslations } from "next-intl"

interface UpdateNoticeModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function UpdateNoticeModal({ isOpen, onClose }: UpdateNoticeModalProps) {
  const t = useTranslations("updateNotice")

  return (
    <Modal isOpen={isOpen} onClose={onClose} placement="center" backdrop="blur" size="lg" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex justify-center mb-2">
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <Bell size={28} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-center">{t("title")}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">{t("date")}</p>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <Card className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <CardBody className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800/50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Database size={16} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">{t("storageUpgrade")}</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">{t("storageUpgradeDesc")}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <CardBody className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-100 dark:bg-amber-800/50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertCircle size={16} className="text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-2">{t("accountDataNotice")}</h3>
                    <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">{t("accountDataNoticeDesc")}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <CardBody className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-800/50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 size={16} className="text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-green-800 dark:text-green-200 mb-2">{t("howToRecover")}</h3>
                    <ul className="text-sm text-green-700 dark:text-green-300 leading-relaxed space-y-1.5">
                      <li className="flex items-start gap-2">
                        <ArrowRight size={14} className="mt-0.5 flex-shrink-0" />
                        <span>{t("recoverStep1")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight size={14} className="mt-0.5 flex-shrink-0" />
                        <span>{t("recoverStep2")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight size={14} className="mt-0.5 flex-shrink-0" />
                        <span>{t("recoverStep3")}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardBody>
            </Card>

            <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-2">
              <p>{t("apology")}</p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onPress={onClose} className="w-full">{t("understand")}</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
