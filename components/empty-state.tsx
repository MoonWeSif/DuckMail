"use client"

import { Button } from "@heroui/button"
import { useTranslations } from "next-intl"

interface EmptyStateProps {
  onCreateAccount: () => void
  isAuthenticated: boolean
}

export default function EmptyState({ onCreateAccount, isAuthenticated }: EmptyStateProps) {
  const t = useTranslations("emptyState")

  return (
    <div className="flex flex-col items-center justify-center h-full py-12">
      <div className="mb-8">
        <div className="w-32 h-32 mx-auto flex items-center justify-center">
          <img
            src="https://img.116119.xyz/img/2025/06/08/547d9cd9739b8e15a51e510342af3fb0.png"
            alt="DuckMail Logo"
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
        {t("title")}
      </h2>

      <p className="text-gray-600 dark:text-gray-300 text-center max-w-md leading-relaxed mb-4">
        {t("description")}
      </p>

      <p className="text-gray-500 dark:text-gray-400 text-center max-w-lg leading-relaxed mb-4">
        {t("noRisk")}
      </p>

      <p className="text-xs text-gray-400 dark:text-gray-500 text-center max-w-lg leading-relaxed mb-8 px-4">
        {t("poweredBy")}
      </p>

      {!isAuthenticated && (
        <Button color="primary" size="lg" className="px-8 py-6 text-lg font-medium" onPress={onCreateAccount}>
          {t("useNow")}
        </Button>
      )}
    </div>
  )
}
