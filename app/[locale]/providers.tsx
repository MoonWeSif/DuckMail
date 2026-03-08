"use client"

import type React from "react"

import { HeroUIProvider } from "@heroui/react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { ToastProvider } from "@heroui/toast"
import { ApiProviderProvider } from "@/contexts/api-provider-context"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      <NextThemesProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange={false}
      >
        <ApiProviderProvider>
          {children}
          <ToastProvider
            placement="bottom-center"
            maxVisibleToasts={3}
            toastProps={{
              color: "primary",
              variant: "flat",
              radius: "md",
              timeout: 4000,
            }}
          />
        </ApiProviderProvider>
      </NextThemesProvider>
    </HeroUIProvider>
  )
}
