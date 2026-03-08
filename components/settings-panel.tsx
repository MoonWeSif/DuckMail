"use client"

import { useState, useEffect } from "react"
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal"
import { Button } from "@heroui/button"
import { Input } from "@heroui/input"
import { Card, CardBody, CardHeader } from "@heroui/card"

import { Divider } from "@heroui/react"
import { Trash2, Plus, Edit3 } from "lucide-react"
import { useApiProvider } from "@/contexts/api-provider-context"
import { useHeroUIToast } from "@/hooks/use-heroui-toast"
import type { CustomApiProvider } from "@/types"
import { useTranslations } from "next-intl"

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const {
    providers,
    addCustomProvider,
    removeCustomProvider,
    updateCustomProvider,
    toggleProviderEnabled,
    isProviderEnabled,
    apiKey,
    setApiKey
  } = useApiProvider()
  const { toast } = useHeroUIToast()
  const t = useTranslations("settings")
  const tc = useTranslations("common")

  const [showCustomForm, setShowCustomForm] = useState(false)
  const [editingProvider, setEditingProvider] = useState<CustomApiProvider | null>(null)

  const [customForm, setCustomForm] = useState({
    id: "",
    name: "",
    baseUrl: "",
    mercureUrl: "",
  })

  const [apiKeyInput, setApiKeyInput] = useState(apiKey)

  useEffect(() => {
    setApiKeyInput(apiKey)
  }, [apiKey])

  const resetCustomForm = () => {
    setCustomForm({ id: "", name: "", baseUrl: "", mercureUrl: "" })
    setEditingProvider(null)
  }

  const handleSave = () => {
    toast({ title: t("saved"), color: "success", variant: "flat" })
    onClose()
  }

  const handleAddCustomProvider = () => {
    if (!customForm.id || !customForm.name || !customForm.baseUrl || !customForm.mercureUrl) {
      toast({ title: t("fillAllFields"), color: "danger", variant: "flat" })
      return
    }

    if (providers.some(p => p.id === customForm.id)) {
      toast({ title: t("idExists"), description: t("idExistsDesc"), color: "danger", variant: "flat" })
      return
    }

    const newProvider: CustomApiProvider = { ...customForm, isCustom: true }

    if (editingProvider) {
      updateCustomProvider(newProvider)
      toast({ title: t("providerUpdated"), color: "success", variant: "flat" })
    } else {
      addCustomProvider(newProvider)
      toast({ title: t("providerAdded"), color: "success", variant: "flat" })
    }

    setShowCustomForm(false)
    resetCustomForm()
  }

  const handleEditProvider = (provider: CustomApiProvider) => {
    setCustomForm({ id: provider.id, name: provider.name, baseUrl: provider.baseUrl, mercureUrl: provider.mercureUrl })
    setEditingProvider(provider)
    setShowCustomForm(true)
  }

  const handleDeleteProvider = (providerId: string) => {
    removeCustomProvider(providerId)
    toast({ title: t("providerDeleted"), color: "warning", variant: "flat" })
  }

  const handleSaveApiKey = () => {
    console.log(`🔑 [Settings] Saving API Key: ${apiKeyInput ? `${apiKeyInput.substring(0, 10)}...` : 'null'}`)

    if (apiKeyInput && !apiKeyInput.startsWith('dk_') && !apiKeyInput.startsWith('Bearer ')) {
      toast({ title: t("apiKeyFormatWarning"), color: "warning", variant: "flat" })
    }

    setApiKey(apiKeyInput)
    toast({ title: t("apiKeySaved"), color: "success", variant: "flat" })
  }

  const handleTestApiKey = async () => {
    const currentApiKey = localStorage.getItem("api-key")
    console.log(`🔑 [Settings] Current stored API Key: ${currentApiKey ? `${currentApiKey.substring(0, 10)}...` : 'null'}`)

    if (currentApiKey) {
      try {
        const { fetchDomainsFromProvider } = await import("@/lib/api")
        console.log(`🔑 [Settings] Testing API Key with domains request...`)
        await fetchDomainsFromProvider("duckmail")
        toast({ title: t("testComplete"), color: "success", variant: "flat" })
      } catch (error) {
        console.error(`🔑 [Settings] API Key test failed:`, error)
        toast({ title: t("testFailed"), color: "danger", variant: "flat" })
      }
    } else {
      toast({ title: t("noApiKey"), color: "warning", variant: "flat" })
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">{t("title")}</ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">{t("providerManagement")}</h3>
              <div className="space-y-3">
                {providers.map((provider) => (
                  <Card key={provider.id} className={`border ${isProviderEnabled(provider.id) ? 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20' : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'}`}>
                    <CardBody className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${isProviderEnabled(provider.id) ? 'bg-green-500' : 'bg-gray-400'}`} />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">{provider.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{provider.baseUrl}</div>
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              {isProviderEnabled(provider.id) ? t("enabled") : t("disabled")}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {provider.isCustom && (
                            <>
                              <Button isIconOnly size="sm" variant="light" onPress={() => handleEditProvider(provider as CustomApiProvider)}>
                                <Edit3 size={16} />
                              </Button>
                              <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => handleDeleteProvider(provider.id)}>
                                <Trash2 size={16} />
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant={isProviderEnabled(provider.id) ? "flat" : "solid"}
                            color={isProviderEnabled(provider.id) ? "warning" : "success"}
                            onPress={() => toggleProviderEnabled(provider.id)}
                          >
                            {isProviderEnabled(provider.id) ? t("disable") : t("enable")}
                          </Button>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>

            <Divider />

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
              <h3 className="text-lg font-semibold mb-3">{t("apiKeySettings")}</h3>
              <div className="space-y-3">
                <Input
                  label={t("apiKeyLabel")}
                  placeholder={t("apiKeyPlaceholder")}
                  description={t("apiKeyDescription", { apiKey: apiKey ? `${apiKey.substring(0, 10)}...` : t("apiKeyNotSet") })}
                  value={apiKeyInput}
                  onValueChange={setApiKeyInput}
                  type="password"
                  variant="bordered"
                />
                <div className="flex justify-end gap-2">
                  <Button size="sm" color="secondary" variant="flat" onPress={handleTestApiKey}>{t("test")}</Button>
                  <Button size="sm" color="primary" onPress={handleSaveApiKey}>{tc("save")}</Button>
                </div>
              </div>
            </div>

            <Divider />

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">{t("customProvider")}</h3>
                <Button
                  size="sm"
                  color="primary"
                  variant="flat"
                  startContent={<Plus size={16} />}
                  onPress={() => { resetCustomForm(); setShowCustomForm(true) }}
                >
                  {t("add")}
                </Button>
              </div>

              {showCustomForm && (
                <Card>
                  <CardHeader>
                    <h4 className="text-md font-medium">
                      {editingProvider ? t("editProvider") : t("addCustomProvider")}
                    </h4>
                  </CardHeader>
                  <CardBody className="space-y-4">
                    <Input label={t("idLabel")} placeholder={t("idPlaceholder")} value={customForm.id} onValueChange={(value) => setCustomForm(prev => ({ ...prev, id: value }))} isDisabled={!!editingProvider} />
                    <Input label={t("nameLabel")} placeholder={t("namePlaceholder")} value={customForm.name} onValueChange={(value) => setCustomForm(prev => ({ ...prev, name: value }))} />
                    <Input label={t("baseUrlLabel")} placeholder="https://api.example.com" value={customForm.baseUrl} onValueChange={(value) => setCustomForm(prev => ({ ...prev, baseUrl: value }))} />
                    <Input label={t("mercureUrlLabel")} placeholder="https://mercure.example.com/.well-known/mercure" value={customForm.mercureUrl} onValueChange={(value) => setCustomForm(prev => ({ ...prev, mercureUrl: value }))} />
                    <div className="flex gap-2">
                      <Button color="primary" onPress={handleAddCustomProvider}>
                        {editingProvider ? t("update") : t("add")}
                      </Button>
                      <Button variant="light" onPress={() => { setShowCustomForm(false); resetCustomForm() }}>
                        {tc("cancel")}
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              )}
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>{tc("cancel")}</Button>
          <Button color="primary" onPress={handleSave}>{tc("save")}</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
