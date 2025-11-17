"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Account, AuthState } from "@/types"
import { createAccount, getToken, getAccount, deleteAccount as deleteAccountApi } from "@/lib/api"

interface AuthContextType extends AuthState {
  login: (address: string, password: string) => Promise<void>
  logout: () => void
  register: (address: string, password: string) => Promise<void>
  deleteAccount: (id: string) => Promise<void>
  switchAccount: (account: Account) => Promise<void>
  addAccount: (account: Account, token: string, password?: string) => void
  getAccountsForProvider: (providerId: string) => Account[]
  getCurrentProviderAccounts: () => Account[]
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    currentAccount: null,
    accounts: [],
    isAuthenticated: false,
  })



  // 从邮箱地址获取提供商ID
  const getProviderIdFromEmail = (email: string) => {
    if (typeof window === "undefined") return "duckmail"

    try {
      const domain = email.split("@")[1]
      if (!domain) return "duckmail"

      // 获取缓存的域名信息
      const cachedDomains = localStorage.getItem("cached-domains")
      if (cachedDomains) {
        const domains = JSON.parse(cachedDomains)
        const matchedDomain = domains.find((d: any) => d.domain === domain)
        if (matchedDomain && matchedDomain.providerId) {
          return matchedDomain.providerId
        }
      }

      return "duckmail"
    } catch (error) {
      console.error("Error getting provider from email:", error)
      return "duckmail"
    }
  }

  useEffect(() => {
    // 从本地存储加载认证状态
    const savedAuth = localStorage.getItem("auth")
    if (savedAuth) {
      try {
        const parsedAuth = JSON.parse(savedAuth)

        // 数据迁移：为现有账户添加providerId（向后兼容）
        const migratedAccounts = parsedAuth.accounts?.map((account: Account) => ({
          ...account,
          providerId: account.providerId || "duckmail" // 默认为duckmail
        })) || []

        const migratedCurrentAccount = parsedAuth.currentAccount ? {
          ...parsedAuth.currentAccount,
          providerId: parsedAuth.currentAccount.providerId || "duckmail"
        } : null

        setAuthState({
          ...parsedAuth,
          accounts: migratedAccounts,
          currentAccount: migratedCurrentAccount
        })
      } catch (error) {
        console.error("Failed to parse auth from localStorage:", error)
      }
    }
  }, [])

  useEffect(() => {
    // 保存认证状态到本地存储
    // 始终保存状态，包括所有账户信息，即使当前没有活跃的token
    if (authState.accounts.length > 0 || authState.currentAccount || authState.token) {
      localStorage.setItem("auth", JSON.stringify(authState))
    } else {
      // 如果没有任何账户信息，清除localStorage
      localStorage.removeItem("auth")
    }
  }, [authState])

  const login = async (address: string, password: string) => {
    try {
      const { token, id } = await getToken(address, password)
      const providerId = getProviderIdFromEmail(address)
      const account = await getAccount(token, providerId)

      // 添加密码、token和providerId到账户信息
      const accountWithAuth = {
        ...account,
        password,
        token,
        providerId,
      }

      // 检查账户是否已存在
      const existingAccountIndex = authState.accounts.findIndex((acc) => acc.address === account.address)

      let updatedAccounts: Account[]
      if (existingAccountIndex !== -1) {
        // 更新现有账户的信息
        updatedAccounts = authState.accounts.map((acc, index) =>
          index === existingAccountIndex ? accountWithAuth : acc
        )
      } else {
        // 添加新账户
        updatedAccounts = [...authState.accounts, accountWithAuth]
      }

      setAuthState({
        token,
        currentAccount: accountWithAuth,
        accounts: updatedAccounts,
        isAuthenticated: true,
      })
    } catch (error) {
      console.error("Login failed:", error)
      throw error
    }
  }

  const register = async (address: string, password: string) => {
    try {
      const providerId = getProviderIdFromEmail(address)
      await createAccount(address, password, providerId)
      // 注册成功后直接登录
      await login(address, password)
    } catch (error) {
      console.error("Registration failed:", error)
      throw error
    }
  }

  const logout = () => {
    console.log("🚪 [Auth] Logging out current account")

    const { currentAccount, accounts } = authState

    // 没有当前账户时，直接清除认证状态但保留账户列表
    if (!currentAccount) {
      setAuthState({
        ...authState,
        token: null,
        isAuthenticated: false,
      })
      return
    }

    // 从账户列表中彻底移除当前账户（不再保留在下拉列表和 localStorage 中）
    const remainingAccounts = accounts.filter((account) => account.id !== currentAccount.id)

    // 如果还有其他账户，则自动切换到下一个账户，避免回到首页
    if (remainingAccounts.length > 0) {
      const nextAccount = remainingAccounts[0]
      console.log(`🔁 [Auth] Other accounts exist, auto switching to: ${nextAccount.address}`)

      setAuthState({
        token: nextAccount.token || null,
        currentAccount: nextAccount,
        accounts: remainingAccounts,
        isAuthenticated: !!nextAccount.token,
      })
    } else {
      // 只有当前一个账户时，真正退出到未登录状态，并清空账户列表
      setAuthState({
        token: null,
        currentAccount: null,
        accounts: [],
        isAuthenticated: false,
      })
    }
    // 不要删除 localStorage，交给 useEffect 根据 authState 自动清理/保存
  }

  const deleteAccount = async (id: string) => {
    try {
      console.log(`🗑️ [Auth] Deleting account: ${id}`)
      const { currentAccount, accounts, token } = authState

      // 调用后端删除接口，确保账号真的被删除
      const targetAccount = accounts.find((account) => account.id === id)
      const providerId = targetAccount?.providerId || "duckmail"

      const deleteToken =
        currentAccount?.id === id
          ? token
          : targetAccount?.token

      if (!deleteToken) {
        throw new Error("缺少删除该账号所需的登录凭据，请先登录该账号后再尝试删除。")
      }

      await deleteAccountApi(deleteToken, id, providerId)

      const remainingAccounts = accounts.filter((account) => account.id !== id)
      const isDeletingCurrent = currentAccount?.id === id

      // 如果删除的不是当前账户，只更新账户列表即可
      if (!isDeletingCurrent) {
        setAuthState(prev => ({
          ...prev,
          accounts: remainingAccounts,
        }))
        return
      }

      // 删除的是当前账户
      if (remainingAccounts.length === 0) {
        // 删除的是最后一个账户，回到未登录状态
        console.log("🚪 [Auth] Deleted last account, logging out")
        setAuthState({
          token: null,
          currentAccount: null,
          accounts: [],
          isAuthenticated: false,
        })
        return
      }

      // 删除的是当前账户，但还有其他账户：
      // 1）先清除当前无效 token，并保存剩余账户
      setAuthState(prev => ({
        ...prev,
        token: null,
        currentAccount: null,
        accounts: remainingAccounts,
        isAuthenticated: false,
      }))

      // 2）优先选择仍然有凭据的账户尝试自动切换
      const candidate =
        remainingAccounts.find(account => account.token || account.password) ||
        remainingAccounts[0]

      try {
        console.log(`🔁 [Auth] Deleted current account, trying to auto switch to: ${candidate.address}`)
        await switchAccount(candidate)
      } catch (switchError) {
        // 自动切换失败：保持未登录状态，但保留 remainingAccounts，方便用户手动登录
        console.error("❌ [Auth] Auto switch after delete failed:", switchError)
      }
    } catch (error) {
      console.error("Delete account failed:", error)
      throw error
    }
  }

  const switchAccount = async (account: Account) => {
    try {
      console.log(`🔄 [Auth] Switching to account: ${account.address}`)

      const accountProviderId = account.providerId || "duckmail"

      // 如果既没有 token 也没有密码，直接报错，不修改当前状态
      if (!account.token && !account.password) {
        console.warn(`⚠️ [Auth] No credentials available for account: ${account.address}`)
        throw new Error("缺少登录凭据，请重新登录")
      }

      const applyAccountWithAuth = (accountWithAuth: Account, token: string) => {
        setAuthState(prev => {
          const updatedAccounts = prev.accounts.map((acc) =>
            acc.address === account.address ? accountWithAuth : acc
          )

          return {
            token,
            currentAccount: accountWithAuth,
            accounts: updatedAccounts,
            isAuthenticated: true,
          }
        })
      }

      if (account.token) {
        console.log(`🔍 [Auth] Validating existing token for account: ${account.address}`)
        try {
          // 先尝试用现有 token 获取账户信息
          const updatedAccount = await getAccount(account.token, accountProviderId)
          const accountWithAuth = {
            ...updatedAccount,
            password: account.password,
            token: account.token,
            providerId: accountProviderId,
          }

          console.log(`✅ [Auth] Token validated, account info updated: ${account.address}`)
          applyAccountWithAuth(accountWithAuth, account.token)
          return
        } catch (tokenError) {
          console.warn(`⚠️ [Auth] Stored token invalid for account: ${account.address}`)

          // Token 无效，如果有密码则尝试重新获取 token
          if (account.password) {
            try {
              console.log(`🔑 [Auth] Token invalid, getting fresh token for account: ${account.address}`)
              const { token } = await getToken(account.address, account.password, accountProviderId)
              const updatedAccount = await getAccount(token, accountProviderId)

              const accountWithAuth = {
                ...updatedAccount,
                password: account.password,
                token,
                providerId: accountProviderId,
              }

              console.log(`✅ [Auth] Fresh token obtained, switched to account: ${account.address}`)
              applyAccountWithAuth(accountWithAuth, token)
              return
            } catch (refreshError) {
              console.error(`❌ [Auth] Failed to refresh token for account: ${account.address}`)
              // 刷新失败时，仅清理该账号的 token，保持当前登录状态不变
              setAuthState(prev => ({
                ...prev,
                accounts: prev.accounts.map(acc =>
                  acc.address === account.address
                    ? { ...acc, token: undefined }
                    : acc
                ),
              }))
              throw new Error("Token 已过期且刷新失败，请重新登录")
            }
          } else {
            // 没有密码无法刷新 token，只清理该账号的 token
            setAuthState(prev => ({
              ...prev,
              accounts: prev.accounts.map(acc =>
                acc.address === account.address
                  ? { ...acc, token: undefined }
                  : acc
              ),
            }))
            throw new Error("Token 已过期，请重新登录")
          }
        }
      }

      if (account.password) {
        // 没有 token 但有密码，在后台获取新的 token
        try {
          console.log(`🔑 [Auth] Getting token for account: ${account.address}`)
          const { token } = await getToken(account.address, account.password, accountProviderId)
          const updatedAccount = await getAccount(token, accountProviderId)

          const accountWithAuth = {
            ...updatedAccount,
            password: account.password,
            token,
            providerId: accountProviderId,
          }

          console.log(`✅ [Auth] Token obtained, switched to account: ${account.address}`)
          applyAccountWithAuth(accountWithAuth, token)
          return
        } catch (error) {
          console.error(`❌ [Auth] Failed to get token for account: ${account.address}`)
          throw new Error("获取登录凭据失败，请重新登录")
        }
      }
    } catch (error) {
      console.error("❌ [Auth] Switch account failed:", error)
      throw error
    }
  }

  const addAccount = (account: Account, token: string, password?: string) => {
    const providerId = getProviderIdFromEmail(account.address)
    const accountWithAuth = {
      ...account,
      password,
      token,
      providerId,
    }

    setAuthState({
      token,
      currentAccount: accountWithAuth,
      accounts: [...authState.accounts, accountWithAuth],
      isAuthenticated: true,
    })
  }

  // 获取指定提供商的账户
  const getAccountsForProvider = (providerId: string): Account[] => {
    return authState.accounts.filter(account =>
      (account.providerId || "duckmail") === providerId
    )
  }

  // 获取当前账户的提供商的所有账户
  const getCurrentProviderAccounts = (): Account[] => {
    if (!authState.currentAccount) return []
    const currentProviderId = authState.currentAccount.providerId || "duckmail"
    return getAccountsForProvider(currentProviderId)
  }

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        register,
        deleteAccount,
        switchAccount,
        addAccount,
        getAccountsForProvider,
        getCurrentProviderAccounts,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
