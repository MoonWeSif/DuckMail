"use client"

import { useTranslations } from "next-intl"

const FEATURES = ["noSignup", "localPassword", "instant", "api"] as const
// A short, curated subset of the full FAQ; the complete list lives on /faq.
const FAQ = ["3", "4", "7", "5"] as const

/**
 * Quiet, text-only introduction rendered under an empty inbox. No cards, no
 * badges — just a short description, four one-line features and a few FAQs,
 * so the pane reads like documentation rather than a landing page.
 */
export default function InboxIntro() {
  const t = useTranslations("inboxIntro")
  const faq = useTranslations("faqSection")

  return (
    <section className="mx-auto w-full max-w-2xl px-6 pb-16 pt-4">
      <p className="text-small leading-7 text-gray-500 dark:text-gray-400">
        {t("intro")}
      </p>

      <dl className="mt-10 grid gap-x-10 gap-y-7 sm:grid-cols-2">
        {FEATURES.map((key) => (
          <div key={key}>
            <dt className="text-small font-medium text-gray-800 dark:text-gray-100">
              {t(`features.${key}.title`)}
            </dt>
            <dd className="mt-1 text-small leading-6 text-gray-500 dark:text-gray-400">
              {t(`features.${key}.desc`)}
            </dd>
          </div>
        ))}
      </dl>

      {/* API Key / 域名面板只面向社区用户，普通用户需要明确知道可以忽略 */}
      <div className="mt-14 border-t border-gray-200 pt-8 dark:border-gray-800">
        <h3 className="text-small font-medium text-gray-800 dark:text-gray-100">
          {t("community.title")}
        </h3>
        <p className="mt-2 text-small leading-6 text-gray-500 dark:text-gray-400">
          {t("community.p1")}
        </p>
        <p className="mt-3 text-small leading-6 text-gray-500 dark:text-gray-400">
          {t("community.p2")}
        </p>
      </div>

      <div className="mt-10 border-t border-gray-200 dark:border-gray-800">
        {FAQ.map((n) => (
          <div key={n} className="border-b border-gray-200 py-5 dark:border-gray-800">
            <p className="text-small font-medium text-gray-800 dark:text-gray-100">
              {faq(`q${n}`)}
            </p>
            <p className="mt-1.5 text-small leading-6 text-gray-500 dark:text-gray-400">
              {faq(`a${n}`)}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-8 text-tiny leading-5 text-gray-400 dark:text-gray-500">
        {t("poweredBy")}
      </p>
    </section>
  )
}
