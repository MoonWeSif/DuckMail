"use client"

import { useState, useEffect } from "react"
import { Select, SelectItem } from "@heroui/select"
import { Spinner } from "@heroui/spinner"

import type { Domain } from "@/types"
import { useTranslations } from "next-intl"

interface DomainSelectorProps {
  value: string
  onSelectionChange: (domain: string) => void
  isDisabled?: boolean
}

export function DomainSelector({ value, onSelectionChange, isDisabled }: DomainSelectorProps) {
  const [domains, setDomains] = useState<Domain[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const t = useTranslations("domainSelector")

  useEffect(() => {
    const loadDomains = async () => {
      try {
        setLoading(true)
        setError(null)

        const disabledProviders = JSON.parse(localStorage.getItem("disabled-api-providers") || '["mailtm"]')
        const presetProviders = [
          { id: "duckmail", name: "DuckMail" },
          { id: "mailtm", name: "Mail.tm" },
        ]
        const customProviders = JSON.parse(localStorage.getItem("custom-api-providers") || "[]")

        const allProviders = [...presetProviders, ...customProviders]
        const enabledProviders = allProviders.filter(p => !disabledProviders.includes(p.id))

        if (enabledProviders.length === 0) {
          setError(t("noProviders"))
          setLoading(false)
          return
        }

        let completedCount = 0
        let hasAnySuccess = false
        let firstSuccessReceived = false

        const providerPromises = enabledProviders.map(async (provider) => {
          try {
            const { fetchDomainsFromProvider } = await import("@/lib/api")
            const providerDomains = await fetchDomainsFromProvider(provider.id)

            if (providerDomains.length > 0) {
              const domainsWithProvider = providerDomains.map(domain => ({
                ...domain,
                providerId: provider.id,
                providerName: provider.name,
              }))

              setDomains(prevDomains => {
                const existingKeys = new Set(
                  prevDomains.map(d => `${d.providerId || "duckmail"}:${d.domain}`)
                )
                const uniqueNewDomains = domainsWithProvider.filter(d => {
                  const key = `${d.providerId || "duckmail"}:${d.domain}`
                  return !existingKeys.has(key)
                })
                const newDomains = [...prevDomains, ...uniqueNewDomains]
                localStorage.setItem("cached-domains", JSON.stringify(newDomains))
                return newDomains
              })

              hasAnySuccess = true

              if (!firstSuccessReceived) {
                firstSuccessReceived = true
                setLoading(false)
              }

              console.log(`✅ [DomainSelector] Loaded ${providerDomains.length} domains from ${provider.name}`)
            } else {
              console.log(`⚠️ [DomainSelector] No domains found for ${provider.name}`)
            }
          } catch (err) {
            console.error(`❌ [DomainSelector] Failed to fetch domains from ${provider.name}:`, err)
          } finally {
            completedCount++
            if (completedCount === enabledProviders.length) {
              if (!hasAnySuccess) {
                setError(t("allFailed"))
              }
              setLoading(false)
            }
          }
        })

        await Promise.allSettled(providerPromises)

      } catch (err) {
        console.error("Failed to load domains:", err)
        setError(t("fetchFailed"))
        setLoading(false)
      }
    }

    loadDomains()
  }, [t])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Spinner size="sm" />
        <span className="ml-2 text-sm text-gray-600">{t("loading")}</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500 text-sm">{error}</div>
    )
  }

  const domainsByProvider = domains.reduce((acc, domain) => {
    const providerId = domain.providerId || "duckmail"
    if (!acc[providerId]) {
      acc[providerId] = { providerName: domain.providerName || providerId, domains: [] }
    }
    acc[providerId].domains.push(domain)
    return acc
  }, {} as Record<string, { providerName: string; domains: Domain[] }>)

  return (
    <Select
      label={t("selectDomain")}
      placeholder={t("chooseDomain")}
      selectedKeys={value ? (() => {
        const matchingKey = Object.entries(domainsByProvider).flatMap(([providerId, { domains }]) =>
          domains.map(domain => `${providerId}-${domain.domain}`)
        ).find(key => key.endsWith(`-${value}`))
        return matchingKey ? [matchingKey] : []
      })() : []}
      onSelectionChange={(keys) => {
        const selectedKey = Array.from(keys)[0] as string
        if (selectedKey) {
          const domain = selectedKey.includes('-') ? selectedKey.split('-').slice(1).join('-') : selectedKey
          onSelectionChange(domain)
        }
      }}
      isDisabled={isDisabled}
      className="w-full"
      classNames={{ listbox: "p-0", popoverContent: "p-1" }}
    >
      {Object.entries(domainsByProvider).flatMap(([providerId, { providerName, domains: providerDomains }]) => [
        <SelectItem
          key={`header-${providerId}`}
          textValue={`${providerName}`}
          className="opacity-100 cursor-default pointer-events-none"
          classNames={{ base: "bg-gray-50 dark:bg-gray-800 rounded-md mx-1 my-1", wrapper: "px-3 py-2" }}
          isReadOnly
        >
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              providerId === 'duckmail' ? 'bg-blue-500' :
              providerId === 'mailtm' ? 'bg-green-500' : 'bg-purple-500'
            }`} />
            <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">{providerName}</span>
          </div>
        </SelectItem>,
        ...providerDomains.map((domain) => (
          <SelectItem
            key={`${providerId}-${domain.domain}`}
            textValue={domain.domain}
            className="mx-1 rounded-md"
            classNames={{ base: "hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors", wrapper: "px-3 py-2" }}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  providerId === 'duckmail' ? 'bg-blue-400' :
                  providerId === 'mailtm' ? 'bg-green-400' : 'bg-purple-400'
                }`} />
                <span className="text-gray-800 dark:text-gray-200 font-mono text-sm">{domain.domain}</span>
              </div>
              <div className="flex items-center gap-1">
                {domain.ownerId && (
                  <div className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 rounded-full text-xs font-medium">
                    {t("private")}
                  </div>
                )}
              </div>
            </div>
          </SelectItem>
        ))
      ])}
    </Select>
  )
}
