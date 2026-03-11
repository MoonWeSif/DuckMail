"use client"

import { useTransition } from "react"
import { Card, CardBody, CardHeader } from "@heroui/card"
import { Button } from "@heroui/button"
import { ArrowLeft, HelpCircle, Languages } from "lucide-react"
import { useTranslations, useLocale } from "next-intl"
import { useRouter, usePathname } from "@/i18n/navigation"
import { AdSenseBanner } from "@/components/adsense-banner"
import { useIsMobile } from "@/hooks/use-mobile"

export default function FaqPage() {
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations("faqSection")
  const tc = useTranslations("common")
  const locale = useLocale()
  const isMobile = useIsMobile()
  const [isPending, startTransition] = useTransition()

  const toggleLocale = () => {
    const newLocale = locale === "en" ? "zh" : "en"
    startTransition(() => {
      router.replace(pathname, { locale: newLocale })
    })
  }

  const useCaseIcons = ["🛡️", "🧪", "💻", "🔒"]
  const useCaseKeys = ["useCase1", "useCase2", "useCase3", "useCase4"] as const

  const steps = [
    { num: 1, color: "border-blue-400 dark:border-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20", titleKey: "step1Title", descKey: "step1Desc" },
    { num: 2, color: "border-violet-400 dark:border-violet-500", bg: "bg-violet-50 dark:bg-violet-900/20", titleKey: "step2Title", descKey: "step2Desc" },
    { num: 3, color: "border-emerald-400 dark:border-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20", titleKey: "step3Title", descKey: "step3Desc" },
  ] as const

  const faqs: Array<{ q: string; a: string }> = [
    { q: t("q1"), a: t("a1") },
    { q: t("q2"), a: t("a2") },
    { q: t("q3"), a: t("a3") },
    { q: t("q4"), a: t("a4") },
    { q: t("q5"), a: t("a5") },
    { q: t("q6"), a: t("a6") },
    { q: t("q7"), a: t("a7") },
  ]

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-opacity duration-200 ${isPending ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 顶部导航栏 */}
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
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <HelpCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t("faqTitle")}</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">DuckMail</p>
              </div>
            </div>
          </CardHeader>

          <CardBody className="space-y-10">
            {/* 使用场景 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 border-l-4 border-blue-500 pl-4">
                {t("useCasesTitle")}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {useCaseKeys.map((key, i) => (
                  <div key={key} className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <span className="text-xl shrink-0">{useCaseIcons[i]}</span>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{t(key)}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 广告位 1 */}
            {!isMobile && <AdSenseBanner />}

            {/* 三步指南 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 border-l-4 border-violet-500 pl-4">
                {t("howToUseTitle")}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {steps.map((step) => (
                  <div key={step.num} className={`p-4 rounded-lg border-l-4 ${step.color} ${step.bg}`}>
                    <div className="text-2xl font-bold text-gray-400 dark:text-gray-500 mb-2">0{step.num}</div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2 text-sm">{t(step.titleKey)}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{t(step.descKey)}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* FAQ 问答 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 border-l-4 border-emerald-500 pl-4">
                {t("faqTitle")}
              </h2>
              <div className="space-y-4">
                {faqs.map((item, index) => (
                  <div key={index} className="border-l-4 border-primary-500 pl-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{item.q}</h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">{item.a}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 广告位 2 */}
            {!isMobile && <AdSenseBanner />}

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                © 2024 DuckMail. All rights reserved.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
