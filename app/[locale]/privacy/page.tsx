"use client"

import { useTransition } from "react"
import { Card, CardBody, CardHeader } from "@heroui/card"
import { Button } from "@heroui/button"
import { ArrowLeft, Shield, Languages } from "lucide-react"
import { useTranslations, useLocale } from "next-intl"
import { useRouter, usePathname } from "@/i18n/navigation"

export default function PrivacyPage() {
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations("privacy")
  const tc = useTranslations("common")
  const locale = useLocale()
  const [isPending, startTransition] = useTransition()

  const sections = [
    { titleKey: "dataCollection" as const, contentKey: "dataCollectionContent" as const },
    { titleKey: "dataUse" as const, contentKey: "dataUseContent" as const },
    { titleKey: "cookies" as const, contentKey: "cookiesContent" as const },
    { titleKey: "tempEmailSecurity" as const, contentKey: "tempEmailSecurityContent" as const },
    { titleKey: "dataDeletion" as const, contentKey: "dataDeletionContent" as const },
    { titleKey: "userCare" as const, contentKey: "userCareContent" as const },
  ]

  const toggleLocale = () => {
    const newLocale = locale === "en" ? "zh" : "en"
    startTransition(() => {
      router.replace(pathname, { locale: newLocale })
    })
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-opacity duration-200 ${isPending ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6 flex justify-between items-center">
          <Button
            variant="light"
            startContent={<ArrowLeft size={16} />}
            onPress={() => router.push("/")}
            className="text-gray-600 dark:text-gray-300"
          >
            {tc("back")}
          </Button>

          <Button
            variant="flat"
            startContent={<Languages size={16} />}
            onPress={toggleLocale}
            className="text-primary-600 dark:text-primary-400"
          >
            {locale === "en" ? "中文" : "English"}
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
                <Shield className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t("title")}</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">{t("subtitle")}</p>
              </div>
            </div>
          </CardHeader>

          <CardBody className="space-y-6">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{t("description")}</p>

            {sections.map((section, index) => (
              <div key={index} className="border-l-4 border-primary-500 pl-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{t(section.titleKey)}</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{t(section.contentKey)}</p>
              </div>
            ))}

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                © 2024 DuckMail. {t("allRightsReserved")}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
