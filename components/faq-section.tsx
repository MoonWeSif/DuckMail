"use client"

import { useTranslations } from "next-intl"

export default function FaqSection() {
  const t = useTranslations("faqSection")

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
    <div className="w-full px-6 py-8 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      {/* 使用场景 */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">{t("useCasesTitle")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(["useCase1", "useCase2", "useCase3", "useCase4"] as const).map((key) => (
            <div key={key} className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
              <span className="mt-0.5 text-blue-500 text-lg select-none">✓</span>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{t(key)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 如何使用 */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">{t("howToUseTitle")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {([1, 2, 3] as const).map((step) => (
            <div key={step} className="relative p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center mb-3">
                {step}
              </div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">{t(`step${step}Title` as any)}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{t(`step${step}Desc` as any)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">{t("faqTitle")}</h2>
        <div className="space-y-5">
          {faqs.map((item, index) => (
            <div key={index} className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-5 py-4 bg-gray-50 dark:bg-gray-800">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{item.q}</h3>
              </div>
              <div className="px-5 py-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
