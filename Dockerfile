# syntax=docker/dockerfile:1

ARG NODE_VERSION=22
ARG PNPM_VERSION=10

# ---------- 依赖安装（始终在构建机原生架构上运行，避免 QEMU 模拟拖慢）----------
FROM --platform=$BUILDPLATFORM node:${NODE_VERSION}-alpine AS deps
ARG PNPM_VERSION
ENV PNPM_HOME=/pnpm \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable pnpm && corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
# 复用 pnpm store 缓存，重复构建时不必重新下载依赖
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile --ignore-scripts

# ---------- 构建（同样只在原生架构构建一次；standalone 产物为纯 JS，与目标架构无关）----------
FROM deps AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN pnpm build

# ---------- 运行（按目标架构分别打包，仅做文件拷贝，无需模拟执行）----------
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

# standalone 输出已包含精简后的 node_modules 和 server.js
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ >/dev/null || exit 1

CMD ["node", "server.js"]
