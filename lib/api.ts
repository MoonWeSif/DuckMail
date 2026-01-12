import type { Account, Domain, Message, MessageDetail } from "@/types"

// 直接指向 DuckMail API 服务（默认提供商）
const API_BASE_URL = "https://api.duckmail.sbs"

// 获取默认API提供商配置（用于向后兼容）
function getDefaultProviderConfig() {
  return {
    id: "duckmail",
    name: "DuckMail",
    baseUrl: API_BASE_URL,
    mercureUrl: "https://mercure.duckmail.sbs/.well-known/mercure",
  }
}

// 根据 providerId 获取实际要使用的 API 基础地址
function getApiBaseUrlForProvider(providerId?: string): string {
  if (typeof window === "undefined") return API_BASE_URL

  if (!providerId) {
    const provider = getDefaultProviderConfig()
    return provider.baseUrl || API_BASE_URL
  }

  const provider = getProviderConfig(providerId)
  if (provider && provider.baseUrl) {
    return provider.baseUrl
  }

  // 回退到默认提供商
  const fallbackProvider = getDefaultProviderConfig()
  return fallbackProvider.baseUrl || API_BASE_URL
}

// 创建带有提供商信息的请求头（不带认证）
function createBaseHeaders(providerId?: string): Record<string, string> {
  const provider = providerId ? getProviderConfig(providerId) : getDefaultProviderConfig()
  const headers: Record<string, string> = {}

  if (provider) {
    headers["X-API-Provider-Base-URL"] = provider.baseUrl
  }

  return headers
}

// 创建带有 API Key 认证的请求头（仅用于 fetchDomains 和 createAccount）
function createHeadersWithApiKey(additionalHeaders: Record<string, string> = {}, providerId?: string): HeadersInit {
  const headers = {
    ...createBaseHeaders(providerId),
    ...additionalHeaders,
  }

  const apiKey = getApiKey()
  if (apiKey && apiKey.trim()) {
    const trimmedApiKey = apiKey.trim()
    console.log(`🔑 [API] Using API Key for domain/account operation: ${trimmedApiKey.substring(0, 10)}...`)

    if (trimmedApiKey.startsWith('Bearer ')) {
      headers["Authorization"] = trimmedApiKey
    } else if (trimmedApiKey.startsWith('dk_')) {
      headers["Authorization"] = `Bearer ${trimmedApiKey}`
    } else {
      headers["Authorization"] = `Bearer ${trimmedApiKey}`
    }
  }

  return headers
}

// 创建带有 JWT Token 认证的请求头（用于其他所有需要认证的操作）
function createHeadersWithToken(token: string, additionalHeaders: Record<string, string> = {}, providerId?: string): HeadersInit {
  const headers = {
    ...createBaseHeaders(providerId),
    ...additionalHeaders,
    Authorization: `Bearer ${token}`,
  }

  return headers
}

// 获取当前存储的 API Key
function getApiKey(): string {
  if (typeof window === "undefined") return ""
  const apiKey = localStorage.getItem("api-key") || ""
  console.log(`🔑 [API] getApiKey called, found: ${apiKey ? `${apiKey.substring(0, 10)}...` : 'null'}`)
  return apiKey
}

// 从邮箱地址推断提供商ID
function inferProviderFromEmail(email: string): string {
  if (typeof window === "undefined") return "duckmail"

  try {
    const domain = email.split("@")[1]
    if (!domain) return "duckmail"

    // 首先检查已知的域名模式
    const knownDomainPatterns: Record<string, string> =   {
      "1secmail.com": "mailtm"
    }

    // 检查是否是已知域名
    if (knownDomainPatterns[domain]) {
      console.log(`📍 [API] Domain ${domain} mapped to provider: ${knownDomainPatterns[domain]}`)
      return knownDomainPatterns[domain]
    }

    // 获取所有域名信息（从localStorage缓存中获取，避免API调用）
    const cachedDomains = localStorage.getItem("cached-domains")
    if (cachedDomains) {
      const domains = JSON.parse(cachedDomains)
      const matchedDomain = domains.find((d: any) => d.domain === domain)
      if (matchedDomain && matchedDomain.providerId) {
        console.log(`📍 [API] Domain ${domain} found in cache, provider: ${matchedDomain.providerId}`)
        return matchedDomain.providerId
      }
    }

    // 如果没有找到匹配的域名，返回默认提供商
    console.log(`⚠️ [API] Domain ${domain} not found, using default provider: duckmail`)
    return "duckmail"
  } catch (error) {
    console.error("Error inferring provider from email:", error)
    return "duckmail"
  }
}

// 根据providerId获取提供商配置
function getProviderConfig(providerId: string) {
  if (typeof window === "undefined") return null

  try {
    // 预设提供商
    const presetProviders = [
      {
        id: "duckmail",
        name: "DuckMail",
        baseUrl: "https://api.duckmail.sbs",
        mercureUrl: "https://mercure.duckmail.sbs/.well-known/mercure",
      },
      {
        id: "mailtm",
        name: "Mail.tm",
        baseUrl: "https://api.mail.tm",
        mercureUrl: "https://mercure.mail.tm/.well-known/mercure",
      },
    ]

    // 查找预设提供商
    let provider = presetProviders.find(p => p.id === providerId)

    // 如果没找到，查找自定义提供商
    if (!provider) {
      const customProviders = localStorage.getItem("custom-api-providers")
      if (customProviders) {
        const parsed = JSON.parse(customProviders)
        provider = parsed.find((p: any) => p.id === providerId)
      }
    }

    return provider || presetProviders[0] // 默认返回第一个预设提供商
  } catch (error) {
    console.error("Error getting provider config:", error)
    return {
      id: "duckmail",
      name: "DuckMail",
      baseUrl: "https://api.duckmail.sbs",
      mercureUrl: "https://mercure.duckmail.sbs/.well-known/mercure",
    }
  }
}

// 根据API文档改进错误处理
function getErrorMessage(status: number, errorData: any): string {
  switch (status) {
    case 400:
      return "请求参数错误或缺失必要信息"
    case 401:
      return "认证失败，请检查登录状态"
    case 404:
      return "请求的资源不存在"
    case 405:
      return "请求方法不被允许"
    case 418:
      return "服务器暂时不可用"
    case 422:
      // 处理具体的422错误信息
      if (errorData?.violations && Array.isArray(errorData.violations)) {
        const violation = errorData.violations[0]
        if (violation?.propertyPath === "address" && violation?.message?.includes("already used")) {
          return "该邮箱地址已被使用，请尝试其他用户名"
        }
        return violation?.message || "请求数据格式错误"
      }

      // 处理不同API提供商的错误消息格式
      const errorMessage = errorData?.detail || errorData?.message || ""

      // 统一处理邮箱已存在的错误
      if (errorMessage.includes("Email address already exists") ||
          errorMessage.includes("already used") ||
          errorMessage.includes("already exists")) {
        return "该邮箱地址已被使用，请尝试其他用户名"
      }

      return errorMessage || "请求数据格式错误，请检查用户名长度或域名格式"
    case 429:
      return "请求过于频繁，请稍后再试"
    default:
      return errorData?.message || errorData?.details || errorData?.error || `请求失败 (${status})`
  }
}

// 检查是否应该重试的错误
function shouldRetry(status: number): boolean {
  // 不应该重试的状态码
  const noRetryStatuses = [400, 401, 403, 404, 405, 422, 429]
  return !noRetryStatuses.includes(status)
}

// 重试函数，改进错误处理
async function retryFetch(fn: () => Promise<any>, retries = 3, delay = 1000): Promise<any> {
  try {
    const response = await fn()
    return response
  } catch (error: any) {
    // 如果错误包含状态码信息，检查是否应该重试
    if (error.message && typeof error.message === 'string') {
      // 从错误消息中提取状态码
      const statusMatch = error.message.match(/HTTP (\d+)/)
      if (statusMatch) {
        const status = parseInt(statusMatch[1])
        if (!shouldRetry(status)) {
          console.log(`Status ${status} should not be retried, throwing error immediately`)
          throw error
        }
      }
    }

    // 对于其他错误，如果还有重试次数，则重试
    if (retries > 0) {
      console.log(`Retrying... ${retries} attempts left`)
      await new Promise((resolve) => setTimeout(resolve, delay))
      return retryFetch(fn, retries - 1, delay * 2)
    }
    throw error
  }
}

// 获取单个提供商的域名（需要 API Key 来获取私有域名）
export async function fetchDomainsFromProvider(providerId: string): Promise<Domain[]> {
  try {
    const baseUrl = getApiBaseUrlForProvider(providerId)
    // 使用 API Key 认证，以便获取用户私有域名
    const headers = createHeadersWithApiKey({ "Cache-Control": "no-cache" }, providerId)

    console.log(`📤 [API] fetchDomainsFromProvider baseUrl=${baseUrl}`)

    const response = await retryFetch(async () => {
      const url = `${baseUrl}/domains`
      const res = await fetch(url, { headers })

      console.log(`📥 [API] Response status: ${res.status}`)

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }

      return res
    })

    const data = await response.json()

    if (data && data["hydra:member"] && Array.isArray(data["hydra:member"])) {
      // 只对 DuckMail 提供商进行域名过滤，其他提供商直接返回所有域名
      let availableDomains = data["hydra:member"]

      if (providerId === "duckmail") {
        // DuckMail 提供商：过滤可用的域名，只显示已验证的域名
        availableDomains = data["hydra:member"].filter((domain: any) => {
          // 必须已验证才能使用
          if (!domain.isVerified) {
            console.log(`🚫 [API] [DuckMail] Filtering out unverified domain: ${domain.domainName}`)
            return false
          }

          // 必须是活跃状态
          if (!domain.isActive) {
            console.log(`🚫 [API] [DuckMail] Filtering out inactive domain: ${domain.domainName}`)
            return false
          }

          console.log(`✅ [API] [DuckMail] Including available domain: ${domain.domainName} (public: ${domain.isPublic}, verified: ${domain.isVerified})`)
          return true
        })
      } else {
        // 其他提供商：不进行过滤，直接使用所有域名
        console.log(`✅ [API] [${providerId}] Using all domains without filtering (${availableDomains.length} domains)`)
      }

      // 为每个域名添加提供商信息，并标准化字段名
      return availableDomains.map((domain: any) => {
        const standardizedDomain: any = {
          ...domain,
          providerId, // 添加提供商ID
        }

        // 只对 DuckMail 提供商进行字段标准化
        if (providerId === "duckmail") {
          standardizedDomain.domain = domain.domainName || domain.domain // 标准化域名字段
          standardizedDomain.isPrivate = domain.isPrivate || (!domain.isPublic && domain.isPublic !== undefined) // 标准化私有字段
        } else {
          // 其他提供商保持原有字段结构
          standardizedDomain.domain = domain.domain || domain.domainName
        }

        return standardizedDomain
      })
    } else {
      console.error("Invalid domains data format:", data)
      return []
    }
  } catch (error) {
    console.error(`Error fetching domains from provider ${providerId}:`, error)
    return [] // 返回空数组而不是抛出错误，这样其他提供商仍然可以工作
  }
}

// 获取所有启用提供商的域名
export async function fetchAllDomains(): Promise<Domain[]> {
  if (typeof window === "undefined") return []

  try {
    // 获取启用的提供商列表
    // 默认禁用 mail.tm，用户可在设置中手动启用
    const disabledProviders = JSON.parse(localStorage.getItem("disabled-api-providers") || '["mailtm"]')
    const presetProviders = [
      { id: "duckmail", name: "DuckMail" },
      { id: "mailtm", name: "Mail.tm" },
    ]
    const customProviders = JSON.parse(localStorage.getItem("custom-api-providers") || "[]")

    const allProviders = [...presetProviders, ...customProviders]
    const enabledProviders = allProviders.filter(p => !disabledProviders.includes(p.id))

    // 并行获取所有启用提供商的域名
    const domainPromises = enabledProviders.map(provider =>
      fetchDomainsFromProvider(provider.id)
    )

    const domainResults = await Promise.all(domainPromises)

    // 合并所有域名，并添加提供商名称信息
    const allDomains: Domain[] = []
    domainResults.forEach((domains, index) => {
      const provider = enabledProviders[index]
      domains.forEach(domain => {
        allDomains.push({
          ...domain,
          providerId: provider.id,
          providerName: provider.name, // 添加提供商名称用于显示
        })
      })
    })

    return allDomains
  } catch (error) {
    console.error("Error fetching domains from all providers:", error)
    throw error
  }
}

// 保持向后兼容的函数
export async function fetchDomains(): Promise<Domain[]> {
  return fetchAllDomains()
}

// 创建账户（需要 API Key 来在私有域名下创建账户）
export async function createAccount(address: string, password: string, providerId?: string): Promise<Account> {
  // 如果没有指定providerId，尝试从邮箱地址推断
  if (!providerId) {
    providerId = inferProviderFromEmail(address)
  }

  const baseUrl = getApiBaseUrlForProvider(providerId)
  console.log(`🔧 [API] Creating account ${address} with provider: ${providerId}`)

  // 使用 API Key 认证，以便在私有域名下创建账户
  const headers = createHeadersWithApiKey({ "Content-Type": "application/json" }, providerId)

  const res = await fetch(`${baseUrl}/accounts`, {
    method: "POST",
    headers,
    body: JSON.stringify({ address, password }),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    const errorMessage = getErrorMessage(res.status, error)
    throw new Error(errorMessage)
  }

  return res.json()
}

// 登录获取 JWT Token（不需要 API Key）
export async function getToken(address: string, password: string, providerId?: string): Promise<{ token: string; id: string }> {
  // 如果没有指定providerId，尝试从邮箱地址推断
  if (!providerId) {
    providerId = inferProviderFromEmail(address)
  }

  const baseUrl = getApiBaseUrlForProvider(providerId)
  const headers = {
    ...createBaseHeaders(providerId),
    "Content-Type": "application/json",
  }

  const res = await fetch(`${baseUrl}/token`, {
    method: "POST",
    headers,
    body: JSON.stringify({ address, password }),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(getErrorMessage(res.status, error))
  }

  return res.json()
}
export async function getMercureToken(token: string, providerId?: string): Promise<{ token: string }> {
  // Mercure 已弃用，保持兼容但直接抛出错误
  throw new Error("Mercure is no longer supported. Please use polling on /messages instead.")
}

// 获取账户信息（只需要 JWT Token）
export async function getAccount(token: string, providerId?: string): Promise<Account> {
  const baseUrl = getApiBaseUrlForProvider(providerId)
  const headers = createHeadersWithToken(token, {}, providerId)

  const response = await retryFetch(async () => {
    const res = await fetch(`${baseUrl}/me`, { headers })

    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(getErrorMessage(res.status, error))
    }

    return res
  })

  return response.json()
}

// 获取消息列表（只需要 JWT Token）
export async function getMessages(token: string, page = 1, providerId?: string): Promise<{ messages: Message[]; total: number; hasMore: boolean }> {
  const baseUrl = getApiBaseUrlForProvider(providerId)
  const headers = createHeadersWithToken(token, {}, providerId)

  const response = await retryFetch(async () => {
    const res = await fetch(`${baseUrl}/messages?page=${page}`, { headers })

    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      console.log(`❌ [API] getMessages failed - Status: ${res.status}`)
      throw new Error(getErrorMessage(res.status, error))
    }

    return res
  })

  const data = await response.json()
  const messages = data["hydra:member"] || []
  const total = data["hydra:totalItems"] || 0

  // 根据API文档，每页最多30条消息
  const hasMore = messages.length === 30 && (page * 30) < total

  return {
    messages,
    total,
    hasMore,
  }
}

// 获取单条消息详情（只需要 JWT Token）
export async function getMessage(token: string, id: string, providerId?: string): Promise<MessageDetail> {
  const baseUrl = getApiBaseUrlForProvider(providerId)
  const headers = createHeadersWithToken(token, {}, providerId)

  const response = await retryFetch(async () => {
    const res = await fetch(`${baseUrl}/messages/${id}`, { headers })

    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(getErrorMessage(res.status, error))
    }

    return res
  })

  return response.json()
}

// 标记消息为已读（只需要 JWT Token）
export async function markMessageAsRead(token: string, id: string, providerId?: string): Promise<{ seen: boolean }> {
  const baseUrl = getApiBaseUrlForProvider(providerId)
  const headers = createHeadersWithToken(token, { "Content-Type": "application/merge-patch+json" }, providerId)

  const response = await retryFetch(async () => {
    const res = await fetch(`${baseUrl}/messages/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ seen: true }),
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(getErrorMessage(res.status, error))
    }

    if (res.headers.get("content-type")?.includes("application/json")) {
      return res.json()
    }
    return { seen: true }
  })

  return response
}

// 删除消息（只需要 JWT Token）
export async function deleteMessage(token: string, id: string, providerId?: string): Promise<void> {
  const baseUrl = getApiBaseUrlForProvider(providerId)
  const headers = createHeadersWithToken(token, {}, providerId)

  await retryFetch(async () => {
    const res = await fetch(`${baseUrl}/messages/${id}`, {
      method: "DELETE",
      headers,
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(getErrorMessage(res.status, error))
    }

    return res
  })
}

// 删除账户（只需要 JWT Token）
export async function deleteAccount(token: string, id: string, providerId?: string): Promise<void> {
  const baseUrl = getApiBaseUrlForProvider(providerId)
  const headers = createHeadersWithToken(token, {}, providerId)

  await retryFetch(async () => {
    const res = await fetch(`${baseUrl}/accounts/${id}`, {
      method: "DELETE",
      headers,
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(getErrorMessage(res.status, error))
    }

    return res
  })
}
