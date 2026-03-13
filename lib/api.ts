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

// 将后端端点路径转换为本地代理 URL（解决 CORS 问题，仅用于客户端）
function buildProxyUrl(endpoint: string): string {
  return `/api/mail?endpoint=${encodeURIComponent(endpoint)}`
}

// 根据API文档改进错误处理
function getErrorMessage(status: number, errorData: any): string {
  // 前缀添加HTTP状态码，便于retryFetch识别
  const prefix = `HTTP ${status}: `

  switch (status) {
    case 400:
      return prefix + "请求参数错误或缺失必要信息"
    case 401:
      return prefix + "认证失败，请检查登录状态"
    case 404:
      return prefix + "请求的资源不存在"
    case 405:
      return prefix + "请求方法不被允许"
    case 418:
      return prefix + "服务器暂时不可用"
    case 422:
      // 处理具体的422错误信息
      if (errorData?.violations && Array.isArray(errorData.violations)) {
        const violation = errorData.violations[0]
        if (violation?.propertyPath === "address" && violation?.message?.includes("already used")) {
          return prefix + "该邮箱地址已被使用，请尝试其他用户名"
        }
        return prefix + (violation?.message || "请求数据格式错误")
      }

      // 处理不同API提供商的错误消息格式
      const errorMessage = errorData?.detail || errorData?.message || ""

      // 统一处理邮箱已存在的错误
      if (errorMessage.includes("Email address already exists") ||
          errorMessage.includes("already used") ||
          errorMessage.includes("already exists")) {
        return prefix + "该邮箱地址已被使用，请尝试其他用户名"
      }

      return prefix + (errorMessage || "请求数据格式错误，请检查用户名长度或域名格式")
    case 429:
      return prefix + "请求过于频繁，请稍后再试"
    default:
      return prefix + (errorData?.message || errorData?.details || errorData?.error || `请求失败`)
  }
}

// 检查是否应该重试的错误
function shouldRetry(status: number): boolean {
  // 不应该重试的状态码（401由自动刷新机制处理）
  const noRetryStatuses = [400, 401, 403, 404, 405, 422, 429]
  return !noRetryStatuses.includes(status)
}

// 从localStorage获取当前账户信息
function getCurrentAccountFromStorage(): { address: string; password: string; token: string; providerId: string } | null {
  if (typeof window === "undefined") return null

  try {
    const authData = localStorage.getItem("auth")
    if (!authData) return null

    const parsed = JSON.parse(authData)
    const currentAccount = parsed.currentAccount
    if (!currentAccount) return null

    return {
      address: currentAccount.address,
      password: currentAccount.password,
      token: currentAccount.token || parsed.token,
      providerId: currentAccount.providerId || "duckmail"
    }
  } catch (error) {
    console.error("[API] Failed to get current account from storage:", error)
    return null
  }
}

// 更新localStorage中的token，并通知auth-context同步更新
function updateTokenInStorage(newToken: string): void {
  if (typeof window === "undefined") return

  try {
    const authData = localStorage.getItem("auth")
    if (!authData) return

    const parsed = JSON.parse(authData)
    if (parsed.currentAccount) {
      parsed.currentAccount.token = newToken
      // 同时更新accounts数组中对应账户的token
      if (parsed.accounts && Array.isArray(parsed.accounts)) {
        parsed.accounts = parsed.accounts.map((acc: any) =>
          acc.address === parsed.currentAccount.address
            ? { ...acc, token: newToken }
            : acc
        )
      }
    }
    parsed.token = newToken

    localStorage.setItem("auth", JSON.stringify(parsed))
    console.log("🔄 [API] Token refreshed and saved to storage")

    // 触发自定义事件，通知auth-context更新React state
    window.dispatchEvent(new CustomEvent("token-refreshed", { detail: { token: newToken } }))
  } catch (error) {
    console.error("[API] Failed to update token in storage:", error)
  }
}

// 全局变量：用于防止并发token刷新
let refreshTokenPromise: Promise<string | null> | null = null

// 尝试刷新token（在收到401时调用）- 带竞态保护
async function tryRefreshToken(): Promise<string | null> {
  // 如果已经有一个刷新请求在进行中，等待它完成
  if (refreshTokenPromise) {
    console.log("⏳ [API] Token refresh already in progress, waiting...")
    return refreshTokenPromise
  }

  const account = getCurrentAccountFromStorage()
  if (!account || !account.password) {
    console.log("⚠️ [API] Cannot refresh token: no password stored")
    return null
  }

  // 创建刷新Promise并存储，防止并发刷新
  refreshTokenPromise = (async () => {
    try {
      console.log("🔄 [API] Attempting to refresh token for:", account.address)
      const baseUrl = getApiBaseUrlForProvider(account.providerId)
      const headers = {
        ...createBaseHeaders(account.providerId),
        "Content-Type": "application/json",
      }

      const res = await fetch(buildProxyUrl('/token'), {
        method: "POST",
        headers,
        body: JSON.stringify({ address: account.address, password: account.password }),
      })

      if (!res.ok) {
        console.log("❌ [API] Token refresh failed:", res.status)
        return null
      }

      const data = await res.json()
      const newToken = data.token

      // 更新存储中的token
      updateTokenInStorage(newToken)

      console.log("✅ [API] Token refreshed successfully")
      return newToken
    } catch (error) {
      console.error("❌ [API] Token refresh error:", error)
      return null
    } finally {
      // 刷新完成后清除Promise，允许下次刷新
      refreshTokenPromise = null
    }
  })()

  return refreshTokenPromise
}

// 带自动token刷新的fetch函数
async function fetchWithTokenRefresh(
  url: string,
  options: RequestInit,
  providerId?: string,
  retried = false
): Promise<Response> {
  const response = await fetch(url, options)

  // 如果收到401且还没重试过，尝试刷新token
  if (response.status === 401 && !retried) {
    console.log("⚠️ [API] Received 401, attempting token refresh...")
    const newToken = await tryRefreshToken()

    if (newToken) {
      // 用新token重试请求
      const newHeaders = {
        ...Object.fromEntries(new Headers(options.headers as HeadersInit).entries()),
        Authorization: `Bearer ${newToken}`,
      }

      console.log("🔄 [API] Retrying request with new token...")
      return fetchWithTokenRefresh(url, { ...options, headers: newHeaders }, providerId, true)
    }
  }

  return response
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
      const res = await fetch(buildProxyUrl('/domains'), { headers })

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
            console.log(`🚫 [API] [DuckMail] Filtering out unverified domain: ${domain.domain}`)
            return false
          }

          console.log(`✅ [API] [DuckMail] Including available domain: ${domain.domain} (verified: ${domain.isVerified})`)
          return true
        })
      } else {
        // 其他提供商：不进行过滤，直接使用所有域名
        console.log(`✅ [API] [${providerId}] Using all domains without filtering (${availableDomains.length} domains)`)
      }

      // 为每个域名添加提供商信息
      return availableDomains.map((domain: any) => ({
        ...domain,
        providerId, // 添加提供商ID
      }))
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

  const res = await fetch(buildProxyUrl('/accounts'), {
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

  const res = await fetch(buildProxyUrl('/token'), {
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

// 获取账户信息（只需要 JWT Token）- 带自动token刷新
export async function getAccount(token: string, providerId?: string): Promise<Account> {
  const baseUrl = getApiBaseUrlForProvider(providerId)
  let currentToken = token

  const response = await retryFetch(async () => {
    const headers = createHeadersWithToken(currentToken, {}, providerId)
    const res = await fetchWithTokenRefresh(buildProxyUrl('/me'), { headers }, providerId)

    if (!res.ok) {
      if (res.status === 401) {
        const account = getCurrentAccountFromStorage()
        if (account && account.token && account.token !== currentToken) {
          currentToken = account.token
          const retryHeaders = createHeadersWithToken(currentToken, {}, providerId)
          const retryRes = await fetch(buildProxyUrl('/me'), { headers: retryHeaders })
          if (retryRes.ok) return retryRes
        }
      }
      const error = await res.json().catch(() => ({}))
      throw new Error(getErrorMessage(res.status, error))
    }

    return res
  })

  return response.json()
}

// 获取消息列表（只需要 JWT Token）- 带自动token刷新
export async function getMessages(token: string, page = 1, providerId?: string): Promise<{ messages: Message[]; total: number; hasMore: boolean }> {
  const baseUrl = getApiBaseUrlForProvider(providerId)
  let currentToken = token

  const response = await retryFetch(async () => {
    const headers = createHeadersWithToken(currentToken, {}, providerId)
    const res = await fetchWithTokenRefresh(buildProxyUrl(`/messages?page=${page}`), { headers }, providerId)

    if (!res.ok) {
      // 如果刷新后仍然失败，检查是否需要更新token
      if (res.status === 401) {
        // 尝试从storage获取最新token（可能已被刷新）
        const account = getCurrentAccountFromStorage()
        if (account && account.token && account.token !== currentToken) {
          currentToken = account.token
          // 用新token重试一次
          const retryHeaders = createHeadersWithToken(currentToken, {}, providerId)
          const retryRes = await fetch(buildProxyUrl(`/messages?page=${page}`), { headers: retryHeaders })
          if (retryRes.ok) return retryRes
        }
      }
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

// 获取单条消息详情（只需要 JWT Token）- 带自动token刷新
export async function getMessage(token: string, id: string, providerId?: string): Promise<MessageDetail> {
  const baseUrl = getApiBaseUrlForProvider(providerId)
  let currentToken = token

  const response = await retryFetch(async () => {
    const headers = createHeadersWithToken(currentToken, {}, providerId)
    const res = await fetchWithTokenRefresh(buildProxyUrl(`/messages/${id}`), { headers }, providerId)

    if (!res.ok) {
      if (res.status === 401) {
        const account = getCurrentAccountFromStorage()
        if (account && account.token && account.token !== currentToken) {
          currentToken = account.token
          const retryHeaders = createHeadersWithToken(currentToken, {}, providerId)
          const retryRes = await fetch(buildProxyUrl(`/messages/${id}`), { headers: retryHeaders })
          if (retryRes.ok) return retryRes
        }
      }
      const error = await res.json().catch(() => ({}))
      throw new Error(getErrorMessage(res.status, error))
    }

    return res
  })

  return response.json()
}

// 标记消息为已读（只需要 JWT Token）- 带自动token刷新
export async function markMessageAsRead(token: string, id: string, providerId?: string): Promise<{ seen: boolean }> {
  const baseUrl = getApiBaseUrlForProvider(providerId)
  let currentToken = token

  const response = await retryFetch(async () => {
    const headers = createHeadersWithToken(currentToken, { "Content-Type": "application/merge-patch+json" }, providerId)
    const res = await fetchWithTokenRefresh(buildProxyUrl(`/messages/${id}`), {
      method: "PATCH",
      headers,
      body: JSON.stringify({ seen: true }),
    }, providerId)

    if (!res.ok) {
      if (res.status === 401) {
        const account = getCurrentAccountFromStorage()
        if (account && account.token && account.token !== currentToken) {
          currentToken = account.token
          const retryHeaders = createHeadersWithToken(currentToken, { "Content-Type": "application/merge-patch+json" }, providerId)
          const retryRes = await fetch(buildProxyUrl(`/messages/${id}`), { method: "PATCH", headers: retryHeaders, body: JSON.stringify({ seen: true }) })
          if (retryRes.ok) {
            if (retryRes.headers.get("content-type")?.includes("application/json")) {
              return retryRes.json()
            }
            return { seen: true }
          }
        }
      }
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

// 删除消息（只需要 JWT Token）- 带自动token刷新
export async function deleteMessage(token: string, id: string, providerId?: string): Promise<void> {
  const baseUrl = getApiBaseUrlForProvider(providerId)
  let currentToken = token

  await retryFetch(async () => {
    const headers = createHeadersWithToken(currentToken, {}, providerId)
    const res = await fetchWithTokenRefresh(buildProxyUrl(`/messages/${id}`), {
      method: "DELETE",
      headers,
    }, providerId)

    if (!res.ok) {
      if (res.status === 401) {
        const account = getCurrentAccountFromStorage()
        if (account && account.token && account.token !== currentToken) {
          currentToken = account.token
          const retryHeaders = createHeadersWithToken(currentToken, {}, providerId)
          const retryRes = await fetch(buildProxyUrl(`/messages/${id}`), { method: "DELETE", headers: retryHeaders })
          if (retryRes.ok) return retryRes
        }
      }
      const error = await res.json().catch(() => ({}))
      throw new Error(getErrorMessage(res.status, error))
    }

    return res
  })
}

// 删除账户（只需要 JWT Token）- 带自动token刷新
export async function deleteAccount(token: string, id: string, providerId?: string): Promise<void> {
  const baseUrl = getApiBaseUrlForProvider(providerId)
  let currentToken = token

  await retryFetch(async () => {
    const headers = createHeadersWithToken(currentToken, {}, providerId)
    const res = await fetchWithTokenRefresh(buildProxyUrl(`/accounts/${id}`), {
      method: "DELETE",
      headers,
    }, providerId)

    if (!res.ok) {
      if (res.status === 401) {
        const account = getCurrentAccountFromStorage()
        if (account && account.token && account.token !== currentToken) {
          currentToken = account.token
          const retryHeaders = createHeadersWithToken(currentToken, {}, providerId)
          const retryRes = await fetch(buildProxyUrl(`/accounts/${id}`), { method: "DELETE", headers: retryHeaders })
          if (retryRes.ok) return retryRes
        }
      }
      const error = await res.json().catch(() => ({}))
      throw new Error(getErrorMessage(res.status, error))
    }

    return res
  })
}
