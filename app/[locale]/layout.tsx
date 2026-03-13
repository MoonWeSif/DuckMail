import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { NextIntlClientProvider } from "next-intl"
import { getMessages, setRequestLocale } from "next-intl/server"
import { routing } from "@/i18n/routing"
import { notFound } from "next/navigation"
import "../globals.css"
import { Providers } from "./providers"

const inter = Inter({ subsets: ["latin"] })

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params

  const isZh = locale === "zh"

  return {
    title: isZh
      ? "Temp Mail-临时邮件-安全、即时、快速- DuckMail"
      : "Temp Mail - Secure, Instant, Fast - DuckMail",
    description: isZh
      ? "使用 DuckMail 保护您的个人邮箱地址免受垃圾邮件、机器人、钓鱼和其他在线滥用——安全的临时邮件服务。"
      : "Protect your personal email address from spam, bots, phishing and other online abuse with DuckMail - secure temporary email service.",
    icons: {
      icon: "https://img.116119.xyz/img/2025/06/08/547d9cd9739b8e15a51e510342af3fb0.png",
      shortcut: "https://img.116119.xyz/img/2025/06/08/547d9cd9739b8e15a51e510342af3fb0.png",
      apple: "https://img.116119.xyz/img/2025/06/08/547d9cd9739b8e15a51e510342af3fb0.png",
    },
    alternates: {
      languages: {
        zh: "/zh",
        en: "/en",
      },
    },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // 验证 locale 有效性
  if (!routing.locales.includes(locale as any)) {
    notFound()
  }

  // 启用静态渲染
  setRequestLocale(locale)

  // 获取翻译消息
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            {children}
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
