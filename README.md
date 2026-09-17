<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./public/images/duckmail-logo-on-dark.png">
    <img src="./public/images/duckmail-logo.png" alt="DuckMail" width="120">
  </picture>
  <h1>DuckMail</h1>
  <p>临时邮箱与 Microsoft 托管邮箱的 Web 客户端。</p>
  <p>
    <a href="https://duckmail.sbs">在线使用</a> ·
    <a href="https://www.duckmail.sbs/zh/api-docs">API 文档</a> ·
    <a href="https://domain.duckmail.sbs">管理面板</a> ·
    <a href="./README.en.md">English</a>
  </p>
</div>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./img/duckmail-dark.png">
  <img src="./img/duckmail-light.png" alt="DuckMail 多邮箱管理与收件箱（演示数据）">
</picture>

## 功能

- **临时邮箱**：一键生成地址，或自定义地址、密码和账户有效期。
- **托管邮箱**：通过独立访问密码或所有者 API Key 访问已接入的 Microsoft 邮箱，查看邮件与同步状态。
- **多邮箱管理**：切换、搜索邮箱，按类型、域名或托管状态筛选。
- **邮件阅读**：自动刷新收件箱，查看正文、下载附件和原始邮件。
- **界面**：支持中文、英文、明暗主题与移动端布局。

基于 Next.js、React、TypeScript 和 HeroUI 构建。本仓库包含 Web 界面与 API 代理，邮件接收和存储由独立后端提供；默认连接 DuckMail API，可在设置中启用 Mail.tm 或添加兼容服务。

## 快速开始

直接访问 [duckmail.sbs](https://duckmail.sbs) 即可创建临时邮箱，使用公共域名无需 API Key。

需要私有域名或访问自己名下的托管邮箱时，在[管理面板](https://domain.duckmail.sbs)创建 API Key，再填入网页的「设置 → API Key」。

## 部署

### Docker

```bash
docker run -d \
  --name duckmail-web \
  --restart unless-stopped \
  -p 3000:3000 \
  syferie/duckmail-web:latest
```

启动后访问 [http://localhost:3000](http://localhost:3000)。也可在克隆仓库后使用自带的 [docker-compose.yml](./docker-compose.yml)：

```bash
docker compose up -d
```

### Vercel / Netlify

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/moonwesif/duckmail)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/moonwesif/duckmail)

部署环境需支持 Next.js 服务端运行，并能访问所选邮箱 API。生产环境使用 HTTPS，本地开发使用 localhost。

## 本地开发

需要 Node.js **20.9+** 和 pnpm；仓库的 Docker 构建使用 Node.js 22、pnpm 10。

```bash
git clone https://github.com/moonwesif/duckmail.git
cd duckmail
pnpm install --frozen-lockfile
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000)。构建使用 `pnpm build`；Docker 镜像通过内置的 standalone 服务运行。

## 使用说明

- 邮箱列表、登录状态和 API Key 保存在当前浏览器；清除站点数据后需重新登录，请自行保存临时邮箱的地址和密码。
- 网页创建的临时账户默认不过期，邮件保留时间由后端决定，与账户有效期无关。
- 程序调用请直接使用后端 API。Web 的 `/api/mail` 和 `/api/sse` 会检查同源浏览器请求，普通脚本直连会返回 `403`。

接口、鉴权和限流说明见 [API 文档](https://www.duckmail.sbs/zh/api-docs)，另提供[供 AI 读取的纯文本 API 文档](./public/llm-api-docs.txt)。

## 反馈与支持

通过 [Issues](https://github.com/moonwesif/duckmail/issues) 反馈问题或提交 Pull Request。联系：[syferie@proton.me](mailto:syferie@proton.me) · 赞助：[爱发电](https://afdian.com/a/syferie)。

## 许可证

MIT。
