"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Spinner } from "@heroui/spinner";
import { Mail, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useMailStatus } from "@/contexts/mail-status-context";
import { getHostedMessagePage, syncHostedAccount } from "@/lib/api";
import type { HostingStatus, Message } from "@/types";
export default function HostedMessageList({
  onSelectMessage,
  refreshKey,
}: {
  onSelectMessage: (m: Message) => void;
  refreshKey: number;
}) {
  const { isEnabled } = useMailStatus();
  const { token, currentAccount } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]),
    [folder, setFolder] = useState("inbox"),
    [page, setPage] = useState(1),
    [total, setTotal] = useState(0),
    [sync, setSync] = useState<HostingStatus | undefined>(
      currentAccount?.hosting,
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [subject, setSubject] = useState(""),
    [from, setFrom] = useState(""),
    [after, setAfter] = useState(""),
    [filters, setFilters] = useState<Record<string, string>>({});
  const sequence = useRef(0);
  const load = useCallback(
    async (manual = false) => {
      if (!token || !currentAccount) return;
      const seq = ++sequence.current;
      setBusy(true);
      try {
        if (manual) await syncHostedAccount(token, currentAccount.id);
        const data = await getHostedMessagePage(token, page, folder, filters);
        if (seq !== sequence.current) return;
        setMessages(data.messages);
        setTotal(data.total);
        setSync(data.sync);
        setError("");
      } catch (e) {
        if (seq === sequence.current)
          setError(e instanceof Error ? e.message : "获取邮件失败");
      } finally {
        if (seq === sequence.current) setBusy(false);
      }
    },
    [token, currentAccount?.id, page, folder, filters],
  );
  useEffect(() => {
    load();
    const t = isEnabled
      ? setInterval(() => {
          if (!document.hidden) load();
        }, 15000)
      : undefined;
    return () => {
      if (t) clearInterval(t);
      sequence.current++;
    };
  }, [load, isEnabled]);
  useEffect(() => {
    if (refreshKey) load(true);
  }, [refreshKey]);
  const warning = sync?.paused
    ? "同步已暂停，当前显示已缓存邮件。"
    : sync?.status === "needs_reauth"
      ? "Microsoft 授权需要更新。DuckMail 仍可登录，当前只能显示已缓存邮件。"
      : !sync?.initialSyncComplete
        ? "首次同步尚未完成，当前结果不代表微软邮箱为空。"
        : sync?.stale
          ? "同步结果可能不是最新，正在等待下一轮同步。"
          : "";
  return (
    <div className="h-full overflow-y-auto bg-white p-4 text-gray-800 dark:bg-gray-900 dark:text-gray-100 md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">收件箱</h2>
          <p className="mt-1 text-xs text-default-500">
            Microsoft 托管 ·{" "}
            {sync?.lastSuccessAt
              ? `最近同步 ${new Date(sync.lastSuccessAt).toLocaleString()}`
              : "尚未完成首次同步"}
          </p>
        </div>
        <Button
          variant="flat"
          isLoading={busy}
          onPress={() => load(true)}
          startContent={!busy ? <RefreshCw size={16} /> : undefined}
        >
          刷新
        </Button>
      </div>
      {warning && (
        <p
          role="status"
          className="mb-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100"
        >
          {warning}
          {sync?.errorMessage && (
            <span className="block">{sync.errorMessage}</span>
          )}
        </p>
      )}
      {sync?.truncated && (
        <p className="mb-3 text-sm text-amber-700">
          同步结果已达窗口上限，列表不是完整远端邮箱。
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mb-3 rounded bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-100"
        >
          {error}
        </p>
      )}
      <div className="mb-4 flex gap-2">
        {[
          ["inbox", "收件箱"],
          ["junk", "垃圾邮件"],
          ["all", "全部已同步文件夹"],
        ].map(([id, label]) => (
          <Button
            key={id}
            size="sm"
            variant={folder === id ? "flat" : "light"}
            color={folder === id ? "primary" : "default"}
            onPress={() => {
              setFolder(id);
              setPage(1);
            }}
          >
            {label}
          </Button>
        ))}
      </div>
      <details className="mb-4 rounded-lg border border-default-200 p-3 text-sm">
        <summary className="cursor-pointer">筛选近期邮件</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Input
            size="sm"
            label="发件人"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <Input
            size="sm"
            label="主题"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <Input
            size="sm"
            label="接收时间之后"
            type="datetime-local"
            value={after}
            onChange={(e) => setAfter(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              color="primary"
              onPress={() => {
                setFilters({
                  from,
                  subject,
                  receivedAfter: after ? new Date(after).toISOString() : "",
                });
                setPage(1);
              }}
            >
              应用筛选
            </Button>
            <Button
              size="sm"
              variant="light"
              onPress={() => {
                setFrom("");
                setSubject("");
                setAfter("");
                setFilters({});
                setPage(1);
              }}
            >
              清除
            </Button>
          </div>
        </div>
      </details>
      {busy && !messages.length ? (
        <div className="py-10 text-center">
          <Spinner />
        </div>
      ) : !messages.length ? (
        <div className="py-12 text-center text-default-500">
          <Mail className="mx-auto mb-3 h-8 w-8" />
          <p>
            {!sync?.initialSyncComplete
              ? "正在建立邮件索引"
              : sync?.stale
                ? "当前暂无缓存结果，无法确认是否有新邮件"
                : "当前同步范围内没有匹配邮件"}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-default-200 rounded-lg border border-default-200">
          {messages.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelectMessage(m)}
              className="block w-full p-4 text-left hover:bg-default-50"
            >
              <div className="mb-2 flex items-center justify-between gap-3 text-xs text-default-500">
                <span>{m.from.name || m.from.address}</span>
                <time>{new Date(m.createdAt).toLocaleString()}</time>
              </div>
              <p className={`text-sm ${m.seen ? "" : "font-semibold"}`}>
                {!m.seen && (
                  <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                )}
                {m.subject || "无主题"}
              </p>
              <p className="mt-1 truncate text-xs text-default-500">
                {m.intro}
              </p>
            </button>
          ))}
        </div>
      )}
      <div className="mt-4 flex items-center justify-between gap-2 text-xs text-default-500">
        <span>已同步范围内共 {total} 封</span>
        <div className="flex gap-2">
          <Button
            size="sm"
            isDisabled={page === 1}
            onPress={() => setPage((p) => p - 1)}
          >
            上一页
          </Button>
          <Button
            size="sm"
            isDisabled={page * 30 >= total}
            onPress={() => setPage((p) => p + 1)}
          >
            下一页
          </Button>
        </div>
      </div>
    </div>
  );
}
