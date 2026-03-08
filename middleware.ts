import createMiddleware from "next-intl/middleware"
import { routing } from "./i18n/routing"

export default createMiddleware(routing)

export const config = {
  // 匹配所有路径，排除 API 路由、Next.js 内部路由和静态资源
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
}
