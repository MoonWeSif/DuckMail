"use client"

import { Button } from "@heroui/button"
import { useTranslations } from "next-intl"
import { DUCKMAIL_LOGO_PATH } from "@/lib/brand"

interface EmptyStateProps {
  onCreateAccount: () => void
  isAuthenticated: boolean
  isCreating?: boolean
}

/**
 * Fallback shown only when automatic provisioning failed (or the user removed
 * every mailbox): one sentence and one button.
 */
export default function EmptyState({ onCreateAccount, isAuthenticated, isCreating = false }: EmptyStateProps) {
  const t = useTranslations("emptyState")

  return (
    <div className="flex flex-col items-center px-6 pb-4 pt-20 text-center">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white p-2 shadow-sm dark:bg-gray-800">
        <img src={DUCKMAIL_LOGO_PATH} alt="DuckMail" className="h-full w-full object-contain" />
      </div>

      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{t("title")}</h2>
      <p className="mt-2 max-w-md text-small leading-6 text-gray-500 dark:text-gray-400">{t("noRisk")}</p>

      {!isAuthenticated && (
        <Button
          color="primary"
          className="mt-6 px-6 font-medium"
          onPress={onCreateAccount}
          isLoading={isCreating}
          isDisabled={isCreating}
        >
          {isCreating ? t("creating") : t("useNow")}
        </Button>
      )}
    </div>
  )
}
