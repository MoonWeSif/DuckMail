"use client"

import { Spinner } from "@heroui/spinner"
import { useTranslations } from "next-intl"
import { DUCKMAIL_LOGO_PATH } from "@/lib/brand"

/**
 * Shown while the first temporary mailbox is being provisioned automatically
 * (and for the brief moment before persisted state is restored). Deliberately
 * quiet: a breathing logo, one line of status, nothing to click.
 */
export default function CreatingState() {
  const t = useTranslations("emptyState")

  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-16">
      <div className="mb-6 flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl bg-white p-2 shadow-sm dark:bg-gray-800">
        <img src={DUCKMAIL_LOGO_PATH} alt="DuckMail" className="h-full w-full object-contain" />
      </div>

      <div className="flex items-center gap-2 text-medium font-medium text-gray-800 dark:text-gray-100">
        <Spinner size="sm" color="default" />
        <span>{t("creatingTitle")}</span>
      </div>
      <p className="mt-1.5 text-small text-gray-500 dark:text-gray-400">
        {t("creatingDesc")}
      </p>
    </div>
  )
}
