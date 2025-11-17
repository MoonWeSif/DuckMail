"use client"

import { useState, useEffect } from "react"
import { Select, SelectItem } from "@heroui/select"
import { Spinner } from "@heroui/spinner"

import type { Domain } from "@/types"

interface DomainSelectorProps {
  value: string
  onSelectionChange: (domain: string) => void
  currentLocale: string
  isDisabled?: boolean
}

export function DomainSelector({ value, onSelectionChange, currentLocale, isDisabled }: DomainSelectorProps) {
  const [domains, setDomains] = useState<Domain[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isZh = currentLocale !== "en"

  useEffect(() => {
    const loadDomains = async () => {
      try {
        setLoading(true)
        setError(null)

        // 获取启用的提供商列表
        const disabledProviders = JSON.parse(localStorage.getItem("disabled-api-providers") || "[]")
        const presetProviders = [
          { id: "duckmail", name: "DuckMail" },
          { id: "mailtm", name: "Mail.tm" },
        ]
        const customProviders = JSON.parse(localStorage.getItem("custom-api-providers") || "[]")

        const allProviders = [...presetProviders, ...customProviders]
        const enabledProviders = allProviders.filter(p => !disabledProviders.includes(p.id))

        if (enabledProviders.length === 0) {
          setError(isZh ? "没有启用的提供商" : "No enabled providers")
          setLoading(false)
          return
        }

        // 并发获取所有提供商的域名，哪个先完成就先显示哪个
        let completedCount = 0
        let hasAnySuccess = false
        let firstSuccessReceived = false

        // 为每个提供商创建独立的请求Promise
        const providerPromises = enabledProviders.map(async (provider) => {
          try {
            const { fetchDomainsFromProvider } = await import("@/lib/api")
            const providerDomains = await fetchDomainsFromProvider(provider.id)

            if (providerDomains.length > 0) {
              // 为域名添加提供商信息
              const domainsWithProvider = providerDomains.map(domain => ({
                ...domain,
                providerId: provider.id,
                providerName: provider.name,
              }))

              // 立即更新域名列表（使用函数式更新并去重：按 providerId + domain 去重）
              setDomains(prevDomains => {
                // 合并新域名，并根据 providerId + domain 去重
                const existingKeys = new Set(
                  prevDomains.map(d => `${d.providerId || "duckmail"}:${d.domain}`)
                )
                const uniqueNewDomains = domainsWithProvider.filter(d => {
                  const key = `${d.providerId || "duckmail"}:${d.domain}`
                  return !existingKeys.has(key)
                })
                const newDomains = [...prevDomains, ...uniqueNewDomains]

                // 缓存当前结果
                localStorage.setItem("cached-domains", JSON.stringify(newDomains))
                return newDomains
              })

              hasAnySuccess = true

              // 第一次成功获取到域名时，立即停止loading状态
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
            // 如果所有请求都完成了，检查是否有任何成功的
            if (completedCount === enabledProviders.length) {
              if (!hasAnySuccess) {
                setError(isZh ? "所有提供商都无法获取域名" : "Failed to fetch domains from all providers")
              }
              // 确保loading状态被设置为false
              setLoading(false)
            }
          }
        })

        // 等待所有请求完成（但不阻塞UI更新）
        await Promise.allSettled(providerPromises)

      } catch (err) {
        console.error("Failed to load domains:", err)
        setError(isZh ? "获取域名失败" : "Failed to fetch domains")
        setLoading(false)
      }
    }

    loadDomains()
  }, [isZh])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Spinner size="sm" />
        <span className="ml-2 text-sm text-gray-600">
          {isZh ? "加载域名中..." : "Loading domains..."}
        </span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500 text-sm">
        {error}
      </div>
    )
  }

  // 按提供商分组域名
  const domainsByProvider = domains.reduce((acc, domain) => {
    const providerId = domain.providerId || "duckmail"
    if (!acc[providerId]) {
      acc[providerId] = {
        providerName: domain.providerName || providerId,
        domains: [],
      }
    }
    acc[providerId].domains.push(domain)
    return acc
  }, {} as Record<string, { providerName: string; domains: Domain[] }>)

  return (
    <Select
      label={isZh ? "选择域名" : "Select Domain"}
      placeholder={isZh ? "选择一个域名" : "Choose a domain"}
      selectedKeys={value ? (() => {
        // 找到匹配的域名key
        const matchingKey = Object.entries(domainsByProvider).flatMap(([providerId, { domains }]) =>
          domains.map(domain => `${providerId}-${domain.domain}`)
        ).find(key => key.endsWith(`-${value}`))
        return matchingKey ? [matchingKey] : []
      })() : []}
      onSelectionChange={(keys) => {
        const selectedKey = Array.from(keys)[0] as string
        if (selectedKey) {
          // 如果key包含providerId前缀，提取纯域名
          const domain = selectedKey.includes('-') ? selectedKey.split('-').slice(1).join('-') : selectedKey
          onSelectionChange(domain)
        }
      }}
      isDisabled={isDisabled}
      className="w-full"
      classNames={{
        listbox: "p-0",
        popoverContent: "p-1",
      }}
    >
      {Object.entries(domainsByProvider).flatMap(([providerId, { providerName, domains: providerDomains }]) => [
        // 提供商分组标题
        <SelectItem
          key={`header-${providerId}`}
          textValue={`${providerName}`}
          className="opacity-100 cursor-default pointer-events-none"
          classNames={{
            base: "bg-gray-50 dark:bg-gray-800 rounded-md mx-1 my-1",
            wrapper: "px-3 py-2",
          }}
          isReadOnly
        >
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              providerId === 'duckmail' ? 'bg-blue-500' :
              providerId === 'mailtm' ? 'bg-green-500' : 'bg-purple-500'
            }`} />
            <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">
              {providerName}
            </span>
          </div>
        </SelectItem>,
        // 该提供商的域名
        ...providerDomains.map((domain) => (
          <SelectItem
            key={`${providerId}-${domain.domain}`}
            textValue={domain.domain}
            className="mx-1 rounded-md"
            classNames={{
              base: "hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
              wrapper: "px-3 py-2",
            }}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  providerId === 'duckmail' ? 'bg-blue-400' :
                  providerId === 'mailtm' ? 'bg-green-400' : 'bg-purple-400'
                }`} />
                <span className="text-gray-800 dark:text-gray-200 font-mono text-sm">
                  {domain.domain}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {(domain.isPrivate || (!domain.isPublic && domain.isPublic !== undefined)) && (
                  <div className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 rounded-full text-xs font-medium">
                    {isZh ? "私有" : "Private"}
                  </div>
                )}
                {!domain.isActive && (
                  <div className="px-2 py-0.5 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-full text-xs font-medium">
                    {isZh ? "不可用" : "Inactive"}
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
