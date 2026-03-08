"use client"

import { Card, CardBody } from "@heroui/card"
import { Shield, Zap, Gauge } from "lucide-react"
import { useTranslations } from "next-intl"

export default function FeatureCards() {
  const t = useTranslations("featureCards")

  const features = [
    { icon: Shield, titleKey: "secureTitle" as const, descKey: "secureDesc" as const },
    { icon: Zap, titleKey: "instantTitle" as const, descKey: "instantDesc" as const },
    { icon: Gauge, titleKey: "fastTitle" as const, descKey: "fastDesc" as const },
  ]

  return (
    <div className="mt-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-6 py-4">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <Card key={index} className="border border-gray-200 dark:border-gray-700 dark:bg-gray-800">
              <CardBody className="p-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <Icon size={24} className="text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">{t(feature.titleKey)}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{t(feature.descKey)}</p>
              </CardBody>
            </Card>
          )
        })}
      </div>

      <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          {t("poweredBy")}
        </p>
      </div>
    </div>
  )
}
