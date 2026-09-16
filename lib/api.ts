import { rateLimitedFetch as fetch } from "@/lib/rate-limited-fetch"
import type { Account, Domain, Message, MessageDetail } from "@/types"

// 直接指向 DuckMail API 服务（默认提供商）
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.duckmail.sbs"

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

  const apiKey = (!providerId || providerId === "duckmail") ? getApiKey() : ""
  if (apiKey && apiKey.trim()) {
    const trimmedApiKey = apiKey.trim()

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
export function getApiKey(): string {
  if (typeof window === "undefined") return ""
  const apiKey = localStorage.getItem("api-key") || ""
  return apiKey.trim().replace(/^Bearer\s+/i, "")
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
      return knownDomainPatterns[domain]
    }

    // 获取所有域名信息（从localStorage缓存中获取，避免API调用）
    const cachedDomains = localStorage.getItem("cached-domains")
    if (cachedDomains) {
      const domains = JSON.parse(cachedDomains)
      const matchedDomain = domains.find((d: any) => d.domain === domain)
      if (matchedDomain && matchedDomain.providerId) {
        return matchedDomain.providerId
      }
    }

    // 如果没有找到匹配的域名，返回默认提供商
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
        baseUrl: API_BASE_URL,
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
      baseUrl: API_BASE_URL,
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

interface StoredAccountSnapshot {
  id: string
  source?: string
  loginMethod?: string

  address: string
  password?: string
  token?: string
  providerId: string
}

// 从localStorage获取当前账户信息
function getCurrentAccountFromStorage(): StoredAccountSnapshot | null {
  if (typeof window === "undefined") return null

  try {
    const authData = localStorage.getItem("auth")
    if (!authData) return null

    const parsed = JSON.parse(authData)
    const currentAccount = parsed.currentAccount
    if (!currentAccount || !currentAccount.address) return null

    return {
      address: currentAccount.address,
      id: currentAccount.id, source:currentAccount.source, loginMethod:currentAccount.loginMethod,
      password: currentAccount.password,
      token: currentAccount.token || parsed.token,
      providerId: currentAccount.providerId || "duckmail"
    }
  } catch (error) {
    console.error("[API] Failed to get current account from storage:", error)
    return null
  }
}

// 从 JWT payload 中解析账户地址（DuckMail / mail.tm 的 token 都带 address 字段）。
// 解析失败返回 null，调用方需要退回到"比较 token 字符串"的保守策略。
function getAddressFromToken(token: string): string | null {
  try {
    const payload = token.split(".")[1]
    if (!payload) return null
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/")
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4)
    const data = JSON.parse(atob(padded))
    return typeof data?.address === "string" && data.address ? data.address : null
  } catch {
    return null
  }
}

// 从请求头中取出 Bearer token
function getBearerToken(headers: HeadersInit | undefined): string | null {
  if (!headers) return null
  const auth = new Headers(headers).get("Authorization")
  if (!auth || !auth.startsWith("Bearer ")) return null
  return auth.slice("Bearer ".length)
}

// 替换请求头中的 Bearer token
function withBearerToken(options: RequestInit, token: string): RequestInit {
  const headers = new Headers(options.headers)
  headers.set("Authorization", `Bearer ${token}`)
  return { ...options, headers }
}

// 更新 localStorage 中 *指定账户* 的 token，并通知 auth-context 同步更新。
// 只有当该账户仍然是当前账户时才更新顶层 token，避免刷新完成时已经切换到其他账户导致串号。
function updateTokenInStorage(address: string, newToken: string): void {
  if (typeof window === "undefined") return

  try {
    const authData = localStorage.getItem("auth")
    if (!authData) return

    const parsed = JSON.parse(authData)

    if (parsed.accounts && Array.isArray(parsed.accounts)) {
      parsed.accounts = parsed.accounts.map((acc: any) =>
        acc?.address === address ? { ...acc, token: newToken } : acc
      )
    }

    if (parsed.currentAccount?.address === address) {
      parsed.currentAccount.token = newToken
      parsed.token = newToken
    }

    localStorage.setItem("auth", JSON.stringify(parsed))

    // 触发自定义事件，通知auth-context更新React state
    window.dispatchEvent(new CustomEvent("token-refreshed", { detail: { token: newToken, address } }))
  } catch (error) {
    console.error("[API] Failed to update token in storage:", error)
  }
}

// 按账户地址去重的刷新 Promise：同一账户并发 401 只刷新一次，不同账户互不影响
const refreshTokenPromises = new Map<string, Promise<string | null>>()

// 尝试刷新 *指定账户* 的 token（在收到401时调用）
async function tryRefreshToken(account: StoredAccountSnapshot): Promise<string | null> {

  const inflight = refreshTokenPromises.get(account.address)
  if (inflight) {
    return inflight
  }

  let password = account.password
  if (!password && account.loginMethod !== "apiKey") {
    if (account.source === "microsoft") {
      const { requestHostedRelogin } = await import("./hosting-session")
      requestHostedRelogin(account.address)
    }
    return null
  }

  const promise = (async () => {
    try {
      if (account.source === "microsoft" && account.loginMethod === "apiKey") {
        const { exchangeHostedToken } = await import("./hosting-api")
        const { token } = await exchangeHostedToken(account.address)
        updateTokenInStorage(account.address, token)
        return token
      }
      const headers = {
        ...createBaseHeaders(account.providerId),
        "Content-Type": "application/json",
      }

      const res = await fetch(buildProxyUrl('/token'), {
        method: "POST",
        headers,
        body: JSON.stringify({ address: account.address, password }),
      })

      if (!res.ok) {
        return null
      }

      const data = await res.json()
      const newToken: string | undefined = data?.token
      if (!newToken) return null

      updateTokenInStorage(account.address, newToken)
      return newToken
    } catch (error) {
      if ((error as { status?: number })?.status === 429) throw error
      console.error("❌ [API] Token refresh error:", error)
      return null
    } finally {
      refreshTokenPromises.delete(account.address)
    }
  })()

  refreshTokenPromises.set(account.address, promise)
  return promise
}

// 带自动token刷新的fetch函数。
// 只会为"当前账户"的 token 做刷新；其他账户的请求（例如 switchAccount 校验旧 token、
// 切换账号后仍在飞的旧请求）收到 401 时原样返回，交给调用方处理，避免用 A 的凭据刷新后套到 B 上。
async function fetchWithTokenRefresh(
  url: string,
  options: RequestInit,
  providerId?: string,
): Promise<Response> {
  let response = await fetch(url, options)
  if (response.status !== 401) return response

  const failingToken = getBearerToken(options.headers)
  const current = getCurrentAccountFromStorage()
  if (!failingToken || !current) return response

  const tokenAddress = getAddressFromToken(failingToken)
  const belongsToCurrent = tokenAddress
    ? tokenAddress === current.address
    : failingToken === current.token

  if (!belongsToCurrent) {
    return response
  }

  // 存储中已有更新的 token（例如并发刷新已完成），先直接复用
  if (current.token && current.token !== failingToken) {
    response = await fetch(url, withBearerToken(options, current.token))
    if (response.status !== 401) return response
  }

  const newToken = await tryRefreshToken(current)
  if (!newToken) return response

  return fetch(url, withBearerToken(options, newToken))
}

// 重试函数：仅对网络错误 / 5xx 做一次短间隔重试，避免失败请求拖很久
async function retryFetch<T>(fn: () => Promise<T>, retries = 1, delay = 500): Promise<T> {
  try {
    return await fn()
  } catch (error: any) {
    if (error?.name === "AbortError") throw error
    // 如果错误包含状态码信息，检查是否应该重试
    if (error?.message && typeof error.message === 'string') {
      const statusMatch = error.message.match(/HTTP (\d+)/)
      if (statusMatch) {
        const status = parseInt(statusMatch[1])
        if (!shouldRetry(status)) {
          throw error
        }
      }
    }

    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay))
      return retryFetch(fn, retries - 1, delay)
    }
    throw error
  }
}

// 统一的“需要 JWT 认证”的请求入口：自动带上提供商头 / token，401 自动刷新（仅当前账户），失败抛出带状态码的错误
async function authorizedRequest(
  endpoint: string,
  token: string,
  providerId?: string,
  init: RequestInit = {},
  extraHeaders: Record<string, string> = {},
): Promise<Response> {
  return retryFetch(async () => {
    const headers = createHeadersWithToken(token, extraHeaders, providerId)
    const res = await fetchWithTokenRefresh(buildProxyUrl(endpoint), { ...init, headers }, providerId)

    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(getErrorMessage(res.status, error))
    }

    return res
  })
}

// 获取单个提供商的域名（需要 API Key 来获取私有域名）
export async function fetchDomainsFromProvider(providerId: string): Promise<Domain[]> {
  try {
    const baseUrl = getApiBaseUrlForProvider(providerId)
    // 使用 API Key 认证，以便获取用户私有域名
    const headers = createHeadersWithApiKey({ "Cache-Control": "no-cache" }, providerId)


    const response = await retryFetch(async () => {
      const res = await fetch(buildProxyUrl('/domains'), { headers })


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
            return false
          }

          return true
        })
      } else {
        // 其他提供商：不进行过滤，直接使用所有域名
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
// expiresIn: 账户有效期（秒）。0 或 -1 = 永不过期，undefined = 服务端默认 24h，正数 = 自定义秒数
export async function createAccount(address: string, password: string, providerId?: string, expiresIn?: number): Promise<Account> {
  // 如果没有指定providerId，尝试从邮箱地址推断
  if (!providerId) {
    providerId = inferProviderFromEmail(address)
  }

  const baseUrl = getApiBaseUrlForProvider(providerId)

  // 使用 API Key 认证，以便在私有域名下创建账户
  const headers = createHeadersWithApiKey({ "Content-Type": "application/json" }, providerId)

  // 构建请求体，仅在指定 expiresIn 时才传递该字段
  const requestBody: Record<string, any> = { address, password }
  if (expiresIn !== undefined) {
    requestBody.expiresIn = expiresIn
  }

  const res = await fetch(buildProxyUrl('/accounts'), {
    method: "POST",
    headers,
    body: JSON.stringify(requestBody),
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
  const response = await authorizedRequest('/me', token, providerId)
  return response.json()
}

// 获取消息列表（只需要 JWT Token）- 带自动token刷新
export async function getMessages(token: string, page = 1, providerId?: string): Promise<{ messages: Message[]; total: number; hasMore: boolean }> {
  const response = await authorizedRequest(`/messages?page=${page}`, token, providerId)

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
  const response = await authorizedRequest(`/messages/${id}`, token, providerId)
  return response.json()
}

// 标记消息为已读（只需要 JWT Token）- 带自动token刷新
export async function markMessageAsRead(token: string, id: string, providerId?: string): Promise<{ seen: boolean }> {
  const response = await authorizedRequest(
    `/messages/${id}`,
    token,
    providerId,
    { method: "PATCH", body: JSON.stringify({ seen: true }) },
    { "Content-Type": "application/merge-patch+json" },
  )

  if (response.headers.get("content-type")?.includes("application/json")) {
    return response.json()
  }
  return { seen: true }
}

// 删除消息（只需要 JWT Token）- 带自动token刷新
export async function deleteMessage(token: string, id: string, providerId?: string): Promise<void> {
  await authorizedRequest(`/messages/${id}`, token, providerId, { method: "DELETE" })
}

// 删除账户（只需要 JWT Token）- 带自动token刷新
export async function deleteAccount(token: string, id: string, providerId?: string): Promise<void> {
  await authorizedRequest(`/accounts/${id}`, token, providerId, { method: "DELETE" })
}

export async function getHostedMessagePage(token:string,page=1,filters:Record<string,string>={}) {
  const query=new URLSearchParams({page:String(page),...Object.fromEntries(Object.entries(filters).filter(([,v])=>v))})
  const res=await authorizedRequest(`/messages?${query}`,token,"duckmail")
  const data=await res.json()
  return {messages:(data["hydra:member"]||[]) as Message[],total:data["hydra:totalItems"]||0,sync:data.sync as import("@/types").HostingStatus}
}
export async function syncHostedAccount(token:string,id:string){await authorizedRequest(`/accounts/${encodeURIComponent(id)}/sync`,token,"duckmail",{method:"POST"})}
export async function downloadHostedFile(token:string,url:string,filename:string){
  if(!/^\/messages\/[^/]+\/(source|attachments\/[^/]+)$/.test(url))throw new Error("无效下载路径")
  const response=await authorizedRequest(url,token,"duckmail")
  const blob=await response.blob();const local=URL.createObjectURL(blob);const a=document.createElement("a");a.href=local;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(local),1000)
}
