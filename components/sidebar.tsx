"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import { Input } from "@heroui/input";
import { Spinner } from "@heroui/spinner";
import {
  Listbox,
  ListboxItem,
  ScrollShadow,
  Skeleton,
  Tab,
  Tabs,
  Tooltip,
} from "@heroui/react";
import {
  Ban,
  Bell,
  ChevronLeft,
  ChevronRight,
  Code,
  Github,
  HelpCircle,
  KeyRound,
  ListFilter,
  LogIn,
  PauseCircle,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  X,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { DUCKMAIL_LOGO_PATH } from "@/lib/brand";
import { useAuth } from "@/contexts/auth-context";
import { useApiProvider } from "@/contexts/api-provider-context";
import { useHeroUIToast } from "@/hooks/use-heroui-toast";
import { listHostedAccounts } from "@/lib/hosting-api";
import type { Account } from "@/types";

export type SidebarNavItem =
  "inbox" | "update-notice" | "api" | "faq" | "privacy" | "github";

interface SidebarProps {
  onItemClick: (item: SidebarNavItem) => void;
  onQuickCreate: () => void;
  onCreateAccount: () => void;
  onLogin: () => void;
  onOpenSettings: () => void;
  isCreating?: boolean;
  isMobile?: boolean;
  onClose?: () => void;
}

type Scope = "all" | "temp" | "hosted";
type HostedFilter = "" | "needs_reauth" | "paused";
type AccountStatus = "disabled" | "needs_reauth" | "paused" | null;

const PAGE_SIZE = 30;
const PROVIDER_NAMES: Record<string, string> = {
  duckmail: "DuckMail",
  mailtm: "Mail.tm",
};

const identity = (a: Account) => `${a.providerId || "duckmail"}:${a.id}`;
const isHosted = (a: Account) => a.source === "microsoft";
const domainOf = (a: Account) => a.address.split("@")[1]?.toLowerCase() || "";
const initials = (address: string) => address.slice(0, 2).toUpperCase();
const byRecent = (a: Account, b: Account) =>
  Number(statusOf(a) === "disabled") - Number(statusOf(b) === "disabled") ||
  (b.lastAccessedAt || 0) - (a.lastAccessedAt || 0) ||
  a.address.localeCompare(b.address);
const matchesQuery = (a: Account, q: string) =>
  !q ||
  [a.address, a.label, ...(a.tags || [])].some((v) =>
    v?.toLowerCase().includes(q),
  );
const statusOf = (a: Account): AccountStatus =>
  a.status === "disabled" || a.isDisabled
    ? "disabled"
    : a.hosting?.status === "needs_reauth"
      ? "needs_reauth"
      : a.hosting?.paused
        ? "paused"
        : null;
const matchesFilter = (a: Account, filter: HostedFilter) =>
  !filter || statusOf(a) === filter;

export default function Sidebar({
  onItemClick,
  onQuickCreate,
  onCreateAccount,
  onLogin,
  onOpenSettings,
  isCreating = false,
  isMobile = false,
  onClose,
}: SidebarProps) {
  const t = useTranslations("sidebar");
  const { toast } = useHeroUIToast();
  const { accounts, currentAccount, switchAccount } = useAuth();
  const { apiKey } = useApiProvider();

  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<Scope>("all");
  const [hostedFilter, setHostedFilter] = useState<HostedFilter>("");
  const [tempDomain, setTempDomain] = useState("");
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [switching, setSwitching] = useState("");
  const [remote, setRemote] = useState<{
    items: Account[];
    total: number;
    loading: boolean;
    error: string;
  }>({ items: [], total: 0, loading: false, error: "" });

  const q = query.trim().toLowerCase();
  const currentKey = currentAccount ? identity(currentAccount) : "";

  // Temp mailboxes always live on this device.
  const tempDomains = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of accounts) {
      if (isHosted(a)) continue;
      const d = domainOf(a);
      if (d) counts.set(d, (counts.get(d) || 0) + 1);
    }
    return [...counts.entries()]
      .sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0]))
      .map(([domain, count]) => ({ domain, count }));
  }, [accounts]);
  const activeDomain = tempDomains.some((d) => d.domain === tempDomain)
    ? tempDomain
    : "";
  const temp = useMemo(
    () =>
      accounts
        .filter(
          (a) =>
            !isHosted(a) &&
            matchesQuery(a, q) &&
            (!activeDomain || domainOf(a) === activeDomain),
        )
        .sort(byRecent),
    [accounts, q, activeDomain],
  );

  // Hosted mailboxes stored locally. When an API Key is present, entries that
  // were derived from that key are served by the remote list instead.
  const localHosted = useMemo(
    () =>
      accounts
        .filter(
          (a) =>
            isHosted(a) &&
            (!apiKey || a.loginMethod !== "apiKey") &&
            matchesQuery(a, q) &&
            matchesFilter(a, hostedFilter),
        )
        .sort(byRecent),
    [accounts, apiKey, q, hostedFilter],
  );
  const remoteItems = useMemo(
    () =>
      apiKey
        ? remote.items.filter((r) => !localHosted.some((l) => l.id === r.id))
        : [],
    [apiKey, remote.items, localHosted],
  );
  const hosted = useMemo(
    () => [...localHosted, ...remoteItems],
    [localHosted, remoteItems],
  );
  const hostedTotal = apiKey
    ? remote.total +
      (localHosted.length - (remote.items.length - remoteItems.length))
    : localHosted.length;
  const pages = Math.max(1, Math.ceil(remote.total / PAGE_SIZE));
  const hostedAvailable = !!apiKey || accounts.some(isHosted);
  const showTemp = scope !== "hosted";
  const showHosted = scope === "hosted" || (scope === "all" && hostedAvailable);

  useEffect(() => {
    if (!apiKey || scope === "temp") return;
    const controller = new AbortController();
    setRemote((r) => ({ ...r, loading: true, error: "" }));
    const timer = setTimeout(
      async () => {
        try {
          const result = await listHostedAccounts(
            page,
            q,
            hostedFilter,
            controller.signal,
          );
          if (controller.signal.aborted) return;
          const total = result["hydra:totalItems"];
          const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
          if (page > lastPage) {
            setPage(lastPage);
            return;
          }
          setRemote({
            items: result["hydra:member"],
            total,
            loading: false,
            error: "",
          });
        } catch (e) {
          if (controller.signal.aborted) return;
          setRemote({
            items: [],
            total: 0,
            loading: false,
            error: e instanceof Error ? e.message : t("loadFailed"),
          });
        }
      },
      q ? 250 : 0,
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [apiKey, scope, q, hostedFilter, page, reload, t]);

  useEffect(() => {
    if (!apiKey) setRemote({ items: [], total: 0, loading: false, error: "" });
    setPage(1);
  }, [apiKey]);

  const accountByKey = useMemo(() => {
    const map = new Map<string, Account>();
    for (const a of [...temp, ...hosted]) map.set(identity(a), a);
    return map;
  }, [temp, hosted]);

  const select = async (key: string) => {
    const account = accountByKey.get(key);
    if (!account || switching) return;
    if (key === currentKey) {
      onItemClick("inbox");
      onClose?.();
      return;
    }
    setSwitching(key);
    try {
      const target: Account =
        isHosted(account) && apiKey && account.loginMethod !== "password"
          ? { ...account, providerId: "duckmail", loginMethod: "apiKey" }
          : account;
      await switchAccount(target);
      onItemClick("inbox");
      onClose?.();
    } catch (e) {
      toast({
        title: t("switchFailed"),
        description: e instanceof Error ? e.message : undefined,
        color: "danger",
        variant: "flat",
      });
    } finally {
      setSwitching("");
    }
  };

  const statusLabel: Record<Exclude<AccountStatus, null>, string> = {
    disabled: t("statusDisabled"),
    needs_reauth: t("statusNeedsReauth"),
    paused: t("statusPaused"),
  };

  const renderItem = (a: Account) => {
    const key = identity(a);
    const active = key === currentKey;
    const status = statusOf(a);
    const provider = a.providerId || "duckmail";
    const description =
      a.label ||
      (a.tags?.length ? a.tags.join(" · ") : null) ||
      (!isHosted(a) && provider !== "duckmail"
        ? PROVIDER_NAMES[provider] || provider
        : null);
    return (
      <ListboxItem
        key={key}
        textValue={a.address}
        description={description}
        onPress={() => void select(key)}
        startContent={
          <Avatar
            size="sm"
            name={initials(a.address)}
            classNames={{
              base: `h-8 w-8 shrink-0 ${active ? "bg-primary" : "bg-default-100"}`,
              name: `text-tiny font-semibold ${active ? "text-primary-foreground" : "text-default-600"}`,
            }}
          />
        }
        endContent={
          switching === key ? (
            <Spinner size="sm" className="shrink-0" />
          ) : status ? (
            <Tooltip content={statusLabel[status]} size="sm" closeDelay={0}>
              <span className="flex shrink-0 items-center">
                {status === "disabled" ? (
                  <Ban size={15} className="text-danger" />
                ) : status === "needs_reauth" ? (
                  <ShieldAlert size={15} className="text-warning" />
                ) : (
                  <PauseCircle size={15} className="text-default-400" />
                )}
              </span>
            </Tooltip>
          ) : null
        }
      >
        {a.address}
      </ListboxItem>
    );
  };

  const disabledKeys = useMemo(
    () =>
      [...temp, ...hosted]
        .filter((a) => statusOf(a) === "disabled")
        .map(identity),
    [temp, hosted],
  );

  const listProps = {
    variant: "flat" as const,
    selectionMode: "single" as const,
    hideSelectedIcon: true,
    disallowEmptySelection: true,
    selectedKeys: currentKey ? [currentKey] : [],
    disabledKeys,
    classNames: { base: "p-0", list: "gap-0.5" },
    itemClasses: {
      base: [
        "h-11 gap-2.5 px-2 rounded-medium",
        "data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary",
        "data-[selected=true]:data-[hover=true]:bg-primary/15",
      ].join(" "),
      title: "truncate text-small",
      description: "truncate text-tiny",
    },
  };

  const footerLinks: {
    id: SidebarNavItem;
    label: string;
    icon: typeof Bell;
  }[] = [
    { id: "update-notice", label: t("updates"), icon: Bell },
    { id: "api", label: t("api"), icon: Code },
    { id: "faq", label: t("faq"), icon: HelpCircle },
    { id: "privacy", label: t("privacy"), icon: ShieldCheck },
    { id: "github", label: t("github"), icon: Github },
  ];

  const tempEmpty = !temp.length;
  const hostedEmpty = !hosted.length && !remote.loading && !remote.error;
  const collapseBoth =
    scope === "all" && !!q && tempEmpty && (!showHosted || hostedEmpty);

  return (
    <aside
      aria-label={t("navigation")}
      className={`flex w-72 shrink-0 flex-col bg-white dark:bg-gray-900 ${
        isMobile
          ? "h-full"
          : "h-screen border-r border-gray-200 dark:border-gray-800"
      }`}
    >
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center gap-2.5 pl-4 pr-2">
        <img
          className="h-8 w-8 rounded-lg bg-white p-0.5"
          src={DUCKMAIL_LOGO_PATH}
          alt="DuckMail Logo"
        />
        <span className="flex-1 truncate text-lg font-semibold">
          duckmail.sbs
        </span>
        {isMobile && onClose && (
          <Button
            isIconOnly
            size="sm"
            variant="light"
            aria-label={t("closeMenu")}
            className="text-default-500"
            onPress={onClose}
          >
            <X size={18} />
          </Button>
        )}
      </div>

      {/* Search + scope */}
      <div className="flex shrink-0 flex-col gap-2 px-3 pb-2">
        <Input
          size="sm"
          isClearable
          aria-label={t("searchPlaceholder")}
          placeholder={t("searchPlaceholder")}
          value={query}
          onValueChange={(v) => {
            setQuery(v);
            setPage(1);
          }}
          onClear={() => {
            setQuery("");
            setPage(1);
          }}
          startContent={
            <Search size={15} className="shrink-0 text-default-400" />
          }
          classNames={{ inputWrapper: "h-9 min-h-9", input: "text-small" }}
        />
        <Tabs
          size="sm"
          fullWidth
          aria-label={t("navigation")}
          selectedKey={scope}
          onSelectionChange={(k) => setScope(k as Scope)}
        >
          <Tab key="all" title={t("scopeAll")} />
          <Tab
            key="temp"
            title={<TabTitle label={t("scopeTemp")} count={temp.length} />}
          />
          <Tab
            key="hosted"
            title={
              <TabTitle
                label={t("scopeHosted")}
                count={hostedAvailable ? hostedTotal : undefined}
              />
            }
          />
        </Tabs>
      </div>

      {/* Mailboxes */}
      <ScrollShadow
        hideScrollBar
        size={16}
        className="flex-1 min-h-0 px-2 pb-2"
      >
        {collapseBoth ? (
          <p className="px-3 py-6 text-center text-tiny text-default-500">
            {t("noMatch")}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {showTemp && (!q || !tempEmpty || scope === "temp") && (
              <section aria-label={t("tempMailboxes")}>
                <SectionHeader title={t("tempMailboxes")} count={temp.length}>
                  {tempDomains.length > 1 && (
                    <Dropdown placement="bottom-end">
                      <DropdownTrigger>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          aria-label={t("filterDomain")}
                          className={`h-7 w-7 min-w-7 ${activeDomain ? "text-primary" : "text-default-500"}`}
                        >
                          <ListFilter size={15} />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu
                        aria-label={t("filterDomain")}
                        selectionMode="single"
                        disallowEmptySelection
                        selectedKeys={[activeDomain || "all"]}
                        onSelectionChange={(keys) => {
                          const k = String(Array.from(keys)[0] ?? "all");
                          setTempDomain(k === "all" ? "" : k);
                        }}
                        items={[
                          {
                            domain: "all",
                            count: tempDomains.reduce((n, d) => n + d.count, 0),
                          },
                          ...tempDomains,
                        ]}
                      >
                        {(d) => (
                          <DropdownItem
                            key={d.domain}
                            textValue={
                              d.domain === "all"
                                ? t("filterAllDomains")
                                : d.domain
                            }
                            endContent={
                              <span className="tabular-nums text-tiny text-default-400">
                                {d.count}
                              </span>
                            }
                          >
                            {d.domain === "all"
                              ? t("filterAllDomains")
                              : `@${d.domain}`}
                          </DropdownItem>
                        )}
                      </DropdownMenu>
                    </Dropdown>
                  )}
                  <Dropdown placement="bottom-end">
                    <DropdownTrigger>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        aria-label={t("addMailbox")}
                        className="h-7 w-7 min-w-7 text-default-500"
                      >
                        <Plus size={15} />
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu
                      aria-label={t("addMailbox")}
                      onAction={(k) => {
                        if (k === "quick") onQuickCreate();
                        else if (k === "custom") onCreateAccount();
                        else onLogin();
                      }}
                    >
                      <DropdownItem
                        key="quick"
                        startContent={
                          <Zap size={16} className="text-warning" />
                        }
                        description={t("quickCreateDesc")}
                      >
                        {t("quickCreate")}
                      </DropdownItem>
                      <DropdownItem
                        key="custom"
                        startContent={
                          <UserPlus size={16} className="text-default-500" />
                        }
                        description={t("customCreateDesc")}
                      >
                        {t("customCreate")}
                      </DropdownItem>
                      <DropdownItem
                        key="login"
                        startContent={
                          <LogIn size={16} className="text-default-500" />
                        }
                        description={t("loginExistingDesc")}
                      >
                        {t("loginExisting")}
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </SectionHeader>
                {tempEmpty ? (
                  <EmptyHint
                    text={q || activeDomain ? t("noMatch") : t("noTemp")}
                  >
                    {!q && !activeDomain && (
                      <Button
                        size="sm"
                        variant="flat"
                        color="primary"
                        startContent={!isCreating && <Zap size={14} />}
                        isLoading={isCreating}
                        onPress={onQuickCreate}
                      >
                        {t("quickCreate")}
                      </Button>
                    )}
                  </EmptyHint>
                ) : (
                  <Listbox aria-label={t("tempMailboxes")} {...listProps}>
                    {temp.map(renderItem)}
                  </Listbox>
                )}
              </section>
            )}

            {showHosted &&
              (!q || !hostedEmpty || scope === "hosted" || remote.loading) && (
                <section aria-label={t("hostedMailboxes")}>
                  <SectionHeader
                    title={t("hostedMailboxes")}
                    count={hostedAvailable ? hostedTotal : undefined}
                  >
                    {hostedAvailable && (
                      <Dropdown placement="bottom-end">
                        <DropdownTrigger>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            aria-label={t("filter")}
                            className={`h-7 w-7 min-w-7 ${hostedFilter ? "text-primary" : "text-default-500"}`}
                          >
                            <ListFilter size={15} />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                          aria-label={t("filter")}
                          selectionMode="single"
                          disallowEmptySelection
                          selectedKeys={[hostedFilter || "all"]}
                          onSelectionChange={(keys) => {
                            const k = String(Array.from(keys)[0] ?? "all");
                            setHostedFilter(
                              k === "all" ? "" : (k as HostedFilter),
                            );
                            setPage(1);
                          }}
                        >
                          <DropdownItem key="all">
                            {t("filterAll")}
                          </DropdownItem>
                          <DropdownItem
                            key="needs_reauth"
                            startContent={
                              <ShieldAlert size={15} className="text-warning" />
                            }
                          >
                            {t("filterNeedsReauth")}
                          </DropdownItem>
                          <DropdownItem
                            key="paused"
                            startContent={
                              <PauseCircle
                                size={15}
                                className="text-default-400"
                              />
                            }
                          >
                            {t("filterPaused")}
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    )}
                    {apiKey && (
                      <Tooltip content={t("reload")} size="sm" closeDelay={0}>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          aria-label={t("reload")}
                          isDisabled={remote.loading}
                          className="h-7 w-7 min-w-7 text-default-500"
                          onPress={() => setReload((n) => n + 1)}
                        >
                          <RefreshCw
                            size={14}
                            className={remote.loading ? "animate-spin" : ""}
                          />
                        </Button>
                      </Tooltip>
                    )}
                  </SectionHeader>

                  {remote.loading && !hosted.length ? (
                    <div className="flex flex-col gap-0.5" aria-busy="true">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="flex h-11 items-center gap-2.5 px-2"
                        >
                          <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                          <div className="flex flex-1 flex-col gap-1.5">
                            <Skeleton className="h-3 w-3/4 rounded-md" />
                            <Skeleton className="h-2.5 w-1/3 rounded-md" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : hosted.length ? (
                    <div
                      className={
                        remote.loading ? "opacity-60 transition-opacity" : ""
                      }
                      aria-busy={remote.loading}
                    >
                      <Listbox aria-label={t("hostedMailboxes")} {...listProps}>
                        {hosted.map(renderItem)}
                      </Listbox>
                    </div>
                  ) : hostedAvailable && !remote.error ? (
                    <EmptyHint
                      text={q || hostedFilter ? t("noMatch") : t("noHosted")}
                    />
                  ) : null}

                  {remote.error && (
                    <EmptyHint text={remote.error} tone="danger">
                      <Button
                        size="sm"
                        variant="flat"
                        onPress={() => setReload((n) => n + 1)}
                      >
                        {t("retry")}
                      </Button>
                    </EmptyHint>
                  )}

                  {apiKey && pages > 1 && !remote.error && (
                    <div className="flex items-center justify-between pl-3 pr-1 pt-1 text-tiny text-default-400">
                      <span className="tabular-nums">
                        {page} / {pages}
                      </span>
                      <div className="flex">
                        <Tooltip
                          content={t("prevPage")}
                          size="sm"
                          closeDelay={0}
                        >
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            aria-label={t("prevPage")}
                            className="h-7 w-7 min-w-7 text-default-500"
                            isDisabled={page <= 1 || remote.loading}
                            onPress={() => setPage((p) => p - 1)}
                          >
                            <ChevronLeft size={15} />
                          </Button>
                        </Tooltip>
                        <Tooltip
                          content={t("nextPage")}
                          size="sm"
                          closeDelay={0}
                        >
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            aria-label={t("nextPage")}
                            className="h-7 w-7 min-w-7 text-default-500"
                            isDisabled={page >= pages || remote.loading}
                            onPress={() => setPage((p) => p + 1)}
                          >
                            <ChevronRight size={15} />
                          </Button>
                        </Tooltip>
                      </div>
                    </div>
                  )}

                  {!apiKey && scope === "hosted" && (
                    <div className="mx-1 mt-2 flex flex-col gap-3 rounded-medium bg-default-50 p-3 dark:bg-default-100/50">
                      <div className="flex items-start gap-2.5">
                        <KeyRound
                          size={16}
                          className="mt-0.5 shrink-0 text-primary"
                        />
                        <p className="text-tiny leading-5 text-default-600">
                          {t("apiKeyHint")}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        onPress={onOpenSettings}
                      >
                        {t("setApiKey")}
                      </Button>
                    </div>
                  )}
                </section>
              )}
          </div>
        )}
      </ScrollShadow>

      {/* Footer */}
      <div className="flex shrink-0 items-center justify-between pl-4 pr-2 py-2">
        <span className="text-tiny text-default-400">© duckmail.sbs</span>
        <div className="flex items-center">
          {footerLinks.map(({ id, label, icon: Icon }) => (
            <Tooltip key={id} content={label} size="sm" closeDelay={0}>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                aria-label={label}
                className="h-8 w-8 min-w-8 text-default-500"
                onPress={() => onItemClick(id)}
              >
                <Icon size={16} />
              </Button>
            </Tooltip>
          ))}
        </div>
      </div>
    </aside>
  );
}

function TabTitle({ label, count }: { label: string; count?: number }) {
  return (
    <span className="flex items-center gap-1">
      {label}
      {count !== undefined && (
        <span className="tabular-nums text-tiny text-default-400 group-data-[selected=true]:text-default-500">
          {count}
        </span>
      )}
    </span>
  );
}

function SectionHeader({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children?: ReactNode;
}) {
  return (
    <div className="flex h-8 items-center justify-between pl-3 pr-0.5">
      <span className="flex items-baseline gap-1.5 text-tiny font-medium text-default-500">
        {title}
        {count !== undefined && (
          <span className="tabular-nums font-normal text-default-400">
            {count}
          </span>
        )}
      </span>
      <div className="flex items-center">{children}</div>
    </div>
  );
}

function EmptyHint({
  text,
  tone = "default",
  children,
}: {
  text: string;
  tone?: "default" | "danger";
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-2 px-3 py-2">
      <p
        className={`text-tiny leading-5 ${tone === "danger" ? "text-danger" : "text-default-500"}`}
      >
        {text}
      </p>
      {children}
    </div>
  );
}
