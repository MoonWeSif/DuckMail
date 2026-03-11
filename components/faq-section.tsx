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

  const useCaseIcons = ["🛡️", "🧪", "💻", "🔒"]
  const useCaseKeys = ["useCase1", "useCase2", "useCase3", "useCase4"] as const

  const steps = [
    { num: 1, color: "from-blue-500 to-blue-600", titleKey: "step1Title", descKey: "step1Desc" },
    { num: 2, color: "from-violet-500 to-violet-600", titleKey: "step2Title", descKey: "step2Desc" },
    { num: 3, color: "from-emerald-500 to-emerald-600", titleKey: "step3Title", descKey: "step3Desc" },
  ] as const

  return (
    <div className="w-full bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700/60">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-12">

        {/* 使用场景 */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-5 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-blue-500 inline-block" />
            {t("useCasesTitle")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {useCaseKeys.map((key, i) => (
              <div
                key={key}
                className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
              >
                <span className="text-xl shrink-0 mt-0.5">{useCaseIcons[i]}</span>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{t(key)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 如何使用 */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-5 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-violet-500 inline-block" />
            {t("howToUseTitle")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {steps.map((step) => (
              <div key={step.num} className="relative p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${step.color} text-white text-sm font-bold flex items-center justify-center mb-4 shadow-sm`}>
                  {step.num}
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2 text-sm">{t(step.titleKey)}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{t(step.descKey)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-5 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-emerald-500 inline-block" />
            {t("faqTitle")}
          </h2>
          <div className="space-y-2">
            {faqs.map((item, index) => (
              <div
                key={index}
                className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className="px-5 py-3.5 flex items-start gap-3">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center mt-0.5">
                    Q
                  </span>
                  <p className="font-medium text-gray-800 dark:text-gray-100 text-sm">{item.q}</p>
                </div>
                <div className="px-5 pb-4 flex items-start gap-3">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center mt-0.5">
                    A
                  </span>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}
