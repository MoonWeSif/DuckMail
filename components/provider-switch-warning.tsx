"use client"

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal"
import { Button } from "@heroui/button"
import { Card, CardBody } from "@heroui/card"
import { AlertTriangle, Users } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import type { ApiProvider } from "@/types"
import { useTranslations } from "next-intl"

interface ProviderSwitchWarningProps {
  isOpen: boolean
  onClose: () => void
  newProvider: ApiProvider | null
  onConfirm: () => void
}

export function ProviderSwitchWarning({ isOpen, onClose, newProvider, onConfirm }: ProviderSwitchWarningProps) {
  const { getCurrentProviderAccounts, currentAccount } = useAuth()
  const t = useTranslations("providerWarning")
  const tc = useTranslations("common")
  const currentProviderAccounts = getCurrentProviderAccounts()

  if (!newProvider) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalContent>
        <ModalHeader className="flex items-center gap-2">
          <AlertTriangle className="text-warning" size={20} />
          {t("title")}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <Card className="border-warning-200 bg-warning-50">
              <CardBody>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-warning mt-0.5" size={20} />
                  <div>
                    <h4 className="font-semibold text-warning-800 mb-2">{t("importantNotice")}</h4>
                    <p className="text-warning-700 text-sm">{t("warningText")}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <div>
              <h4 className="font-medium mb-2">{t("switchDetails")}</h4>
              <p className="text-sm text-gray-600 mb-3">{t("switchingTo", { provider: newProvider.name })}</p>
            </div>

            {currentProviderAccounts.length > 0 && (
              <Card>
                <CardBody>
                  <div className="flex items-start gap-3">
                    <Users className="text-blue-500 mt-0.5" size={20} />
                    <div>
                      <h4 className="font-medium text-blue-800 mb-2">{t("currentAccounts")}</h4>
                      <div className="space-y-1">
                        {currentProviderAccounts.map((account) => (
                          <div
                            key={account.id}
                            className={`text-sm p-2 rounded ${
                              account.id === currentAccount?.id
                                ? 'bg-blue-100 text-blue-800 font-medium'
                                : 'text-gray-600'
                            }`}
                          >
                            {account.address}
                            {account.id === currentAccount?.id && (
                              <span className="ml-2 text-xs">({t("current")})</span>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-blue-600 mt-2">{t("accountsNotAvailable")}</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}

            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-medium mb-2">{t("whatHappens")}</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• {t("loggedOut")}</li>
                <li>• {t("needNewAccount")}</li>
                <li>• {t("preserved")}</li>
              </ul>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>{tc("cancel")}</Button>
          <Button color="warning" onPress={onConfirm}>{t("confirm")}</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
