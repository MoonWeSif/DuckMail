"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Account, AuthState } from "@/types";
import {
  createAccount,
  getToken,
  getAccount,
  deleteAccount as deleteAccountApi,
} from "@/lib/api";
import { exchangeHostedToken, hasHostingKey } from "@/lib/hosting-api";
interface AuthContextType extends AuthState {
  /** True once persisted accounts have been read from localStorage. */
  isReady: boolean;
  login: (address: string, password: string) => Promise<void>;
  logout: () => void;
  register: (
    address: string,
    password: string,
    expiresIn?: number,
  ) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  switchAccount: (account: Account) => Promise<void>;
  addAccount: (account: Account, token: string, password?: string) => void;
  getAccountsForProvider: (id: string) => Account[];
  getCurrentProviderAccounts: () => Account[];
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
const empty: AuthState = {
  token: null,
  currentAccount: null,
  accounts: [],
  isAuthenticated: false,
};
function providerFor(address: string) {
  if (/^(outlook|hotmail|live|msn)\./i.test(address.split("@")[1] || ""))
    return "duckmail";
  try {
    const cached = JSON.parse(localStorage.getItem("cached-domains") || "[]");
    return (
      cached.find((d: any) => d.domain === address.split("@")[1])?.providerId ||
      "duckmail"
    );
  } catch {
    return "duckmail";
  }
}
function safeAccount(a: Account): Account {
  return a.source === "microsoft"
    ? { ...a, password: undefined, providerId: "duckmail" }
    : a;
}
function same(a: Account, b: Account) {
  return (
    a.id === b.id &&
    (a.providerId || "duckmail") === (b.providerId || "duckmail")
  );
}
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(empty),
    [ready, setReady] = useState(false);
  const operation = useRef(0);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("auth");
      if (raw) {
        const data = JSON.parse(raw);
        if (Array.isArray(data.accounts))
          setState({
            ...data,
            accounts: data.accounts.map(safeAccount),
            currentAccount: data.currentAccount
              ? safeAccount(data.currentAccount)
              : null,
          });
      }
    } catch {
      localStorage.removeItem("auth");
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    if (state.accounts.length || state.currentAccount) {
      localStorage.setItem(
        "auth",
        JSON.stringify({
          ...state,
          accounts: state.accounts.map(safeAccount),
          currentAccount: state.currentAccount
            ? safeAccount(state.currentAccount)
            : null,
        }),
      );
    } else localStorage.removeItem("auth");
  }, [state, ready]);
  useEffect(() => {
    const refreshed = (event: Event) => {
      const { token, address } = (event as CustomEvent).detail;
      if (!token || !address) return;
      setState((s) => ({
        ...s,
        accounts: s.accounts.map((a) =>
          a.address === address ? { ...a, token } : a,
        ),
        ...(s.currentAccount && s.currentAccount.address === address
          ? { token, currentAccount: { ...s.currentAccount, token } }
          : {}),
      }));
    };
    window.addEventListener("token-refreshed", refreshed);
    return () => window.removeEventListener("token-refreshed", refreshed);
  }, []);
  const apply = (a: Account, token: string, password?: string) => {
    const account = safeAccount({
      ...a,
      lastAccessedAt: Date.now(),
      token,
      password,
      providerId:
        a.source === "microsoft"
          ? "duckmail"
          : a.providerId || providerFor(a.address),
    });
    setState((s) => ({
      token,
      currentAccount: account,
      isAuthenticated: true,
      accounts: s.accounts.some((x) => same(x, account))
        ? s.accounts.map((x) => (same(x, account) ? account : x))
        : [...s.accounts, account],
    }));
  };
  const login = async (address: string, password: string) => {
    const seq = ++operation.current;
    const providerId = providerFor(address);
    const { token } = await getToken(address, password, providerId);
    const account = await getAccount(token, providerId);
    if (seq !== operation.current) return;
    apply({ ...account, providerId, loginMethod: "password" }, token, password);
  };
  const register = async (
    address: string,
    password: string,
    expiresIn?: number,
  ) => {
    await createAccount(address, password, providerFor(address), expiresIn);
    await login(address, password);
  };
  const switchAccount = async (account: Account) => {
    const seq = ++operation.current,
      providerId =
        account.source === "microsoft"
          ? "duckmail"
          : account.providerId || "duckmail";
    let token = account.token;
    let loaded: Account | undefined;
    if (token) {
      try {
        loaded = await getAccount(token, providerId);
      } catch (e) {
        if (!(e instanceof Error) || !e.message.includes("401")) throw e;
        token = undefined;
      }
    }
    if (!token) {
      if (
        account.source === "microsoft" &&
        account.loginMethod === "apiKey" &&
        hasHostingKey()
      ) {
        token = (await exchangeHostedToken(account.id)).token;
      } else if (account.source !== "microsoft" && account.password) {
        token = (await getToken(account.address, account.password, providerId))
          .token;
      } else throw new Error("登录已过期，请重新输入访问密码或连接 API Key");
      loaded = await getAccount(token, providerId);
    }
    if (
      !loaded ||
      loaded.id !== account.id ||
      loaded.address.toLowerCase() !== account.address.toLowerCase()
    )
      throw new Error("账号身份不匹配，请重新登录");
    if (seq !== operation.current) return;
    apply(
      { ...loaded, providerId, loginMethod: account.loginMethod },
      token,
      account.password,
    );
  };
  const remove = (id: string) => {
    operation.current++;
    setState((s) => {
      const list = s.accounts.filter((a) => a.id !== id);
      if (s.currentAccount?.id !== id) return { ...s, accounts: list };
      const next = list.find((a) => a.token) || null;
      return {
        accounts: list,
        currentAccount: next,
        token: next?.token || null,
        isAuthenticated: !!next?.token,
      };
    });
  };
  const logout = () => {
    if (state.currentAccount) remove(state.currentAccount.id);
    else {
      operation.current++;
      setState((s) => ({ ...s, token: null, isAuthenticated: false }));
    }
  };
  const deleteAccount = async (id: string) => {
    const a = state.accounts.find((a) => a.id === id);
    if (!a) return;
    if (a.source !== "microsoft") {
      const token = state.currentAccount?.id === id ? state.token : a.token;
      if (!token) throw new Error("请先登录此账号");
      await deleteAccountApi(token, id, a.providerId);
    }
    remove(id);
  };
  const addAccount = (account: Account, token: string, password?: string) => {
    operation.current++;
    apply(account, token, password);
  };
  return (
    <AuthContext.Provider
      value={{
        ...state,
        isReady: ready,
        login,
        logout,
        register,
        switchAccount,
        deleteAccount,
        addAccount,
        getAccountsForProvider: (id) =>
          state.accounts.filter((a) => (a.providerId || "duckmail") === id),
        getCurrentProviderAccounts: () =>
          state.accounts.filter(
            (a) =>
              (a.providerId || "duckmail") ===
              (state.currentAccount?.providerId || "duckmail"),
          ),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
