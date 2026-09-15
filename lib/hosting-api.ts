import type { Account } from "@/types";
import { getApiKey } from "./api";
export function hasHostingKey() {
  return !!getApiKey();
}
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const key = getApiKey();
  if (!key) throw new Error("请先填写 DuckMail API Key");
  const res = await fetch(
    `/api/mail?endpoint=${encodeURIComponent(endpoint)}`,
    {
      ...options,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "X-DuckMail-Hosted": "true",
      },
      cache: "no-store",
    },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "托管邮箱请求失败");
  return data;
}
export function listHostedAccounts(
  page = 1,
  q = "",
  status = "",
  signal?: AbortSignal,
) {
  return request<{ "hydra:member": Account[]; "hydra:totalItems": number }>(
    `/accounts/hosted?${new URLSearchParams({ page: String(page), q, status })}`,
    { signal },
  );
}
export async function exchangeHostedToken(address: string) {
  return request<{ id: string; token: string }>("/token", {
    method: "POST",
    body: JSON.stringify({ address }),
  });
}
export async function hostedMessages(
  token: string,
  page: number,
  filters: Record<string, string> = {},
) {
  const { getHostedMessagePage } = await import("./api");
  return getHostedMessagePage(token, page, filters);
}
