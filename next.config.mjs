import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./i18n/request.ts")

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // 图片未启用优化，sharp 及其平台相关原生库不会被用到；从 standalone 产物中排除，
  // 使产物与 CPU 架构无关（Docker 多架构镜像只需构建一次）并减小镜像体积
  outputFileTracingExcludes: {
    "*": [
      "./node_modules/sharp/**",
      "./node_modules/@img/**",
      // pnpm 的真实文件位于 .pnpm 目录下
      "./node_modules/.pnpm/sharp@*/**",
      "./node_modules/.pnpm/@img+*/**",
    ],
  },
}

export default withNextIntl(nextConfig)
