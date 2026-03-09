"use client"

import { useEffect, useRef } from "react"

export function AdSenseBanner() {
  const adRef = useRef<HTMLModElement>(null)
  const pushed = useRef(false)

  useEffect(() => {
    if (adRef.current && !pushed.current) {
      try {
        ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
        pushed.current = true
      } catch {
        // AdSense 脚本尚未加载，忽略
      }
    }
  }, [])

  return (
    <div className="w-full px-4 py-3">
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-5940655086623123"
        data-ad-slot="3389348840"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  )
}
