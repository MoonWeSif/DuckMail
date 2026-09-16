<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./public/images/duckmail-logo-on-dark.png">
    <img src="./public/images/duckmail-logo.png" alt="DuckMail Logo" width="160">
  </picture>

  # DuckMail - 临时邮件服务

  **安全、即时、快速的临时邮箱服务**

  [English](./README.en.md) | 中文

  一个基于 Next.js 和 DuckMail 自建后端的邮箱 Web 客户端，支持临时邮箱、Microsoft 托管邮箱及可选的 Mail.tm 提供商。

  **🌐 [立即使用 duckmail.sbs](https://duckmail.sbs)**
</div>

## ✨ 特性

- 🔒 **安全可靠** - 使用 DuckMail 自建后端，Mail.tm 为可选提供商
- ⚡ **即时可用** - 立即获得临时邮箱地址
- 🌐 **多语言支持** - 支持中文和英文，自动检测浏览器语言
- 🎨 **现代化界面** - 基于 HeroUI 的精美设计
- 🔄 **实时更新** - 通过轮询更新邮件列表：临时收件箱主轮询间隔 2 秒，托管收件箱 3 秒
- 🌙 **深色模式** - 支持明暗主题切换
- 📧 **多账户管理** - 支持创建和管理多个临时邮箱
- 🔧 **多API提供商** - 支持 DuckMail API 和 Mail.tm API 切换
- 🔑 **API Key 支持** - 可选配置 API Key 获得更多域名选择和私有域名权限
- 🔗 **开源透明** - 支持社区贡献

## 📸 应用展示

<div align="center">
  <img src="./img/display1.png" alt="DuckMail 主界面" width="800">
  <p><em>主界面 - 简洁现代的设计</em></p>

  <img src="./img/display2.png" alt="DuckMail 邮件管理" width="800">
  <p><em>邮件管理 - 实时接收和管理临时邮件</em></p>
</div>

## 🚀 快速开始

### 一键部署

#### Netlify 部署（推荐）

点击下面的按钮，一键部署到 Netlify：

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/moonwesif/duckmail)

> 🎉 **零配置部署** - 点击按钮后，Netlify 会自动 fork 项目到你的 GitHub 账户并开始部署，无需任何额外配置！

#### Vercel 部署

点击下面的按钮，一键部署到 Vercel：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/moonwesif/duckmail)

> 所选部署平台必须能访问配置的邮箱 API。上游访问限制可能影响某些提供商，Mail.tm 默认禁用，可在设置中启用。
>
> 🚀 **零配置**：Vercel 会自动检测 Next.js 项目并使用最佳配置进行部署。

## 📧 API 说明

本项目使用 DuckMail 自建的邮箱后端服务器，支持以下操作

- **账户管理**: 创建、登录临时邮箱账户
- **邮件接收**: 实时接收和查看邮件
- **域名获取**: 获取可用的邮箱域名
- **托管邮箱**: 使用独立访问密码或所有者 API Key 登录，查看已同步的 Microsoft 邮件
- **列表更新**: 通过轮询获取邮件，DuckMail 当前不提供 Mercure SSE

通过 https://www.duckmail.sbs/zh/api-docs 界面来获取接口文档与调试

### API Key 功能（可选）

应用支持可选的 API Key 配置，提供增强功能：

- **无 API Key**: 使用公共域名，基础功能完整可用
- **有 API Key**: 获得更多域名选择和私有域名创建权限

**配置方法**：
1. 点击右上角设置按钮
2. 在 "API Key 设置" 区域输入您的 API Key
3. 点击保存即可生效

#### API Key 获取方式
1. 访问 https://domain.duckmail.sbs
2. LinuxDo 鉴权登录
3. 点击左侧栏 API Key 选项，新建 API key

### API 限制

- 请求频率限制：当前线上每 IP：有效 JWT/API Key 为 1000 请求/秒，未认证请求为 1000 请求/秒，其中未认证创建账号为 200 请求/秒。自建部署以实际配置为准。持续异常请求会触发降速或临时封禁。429 时遵循 `Retry-After`，不要重复登录或创建账号。
- 邮件有效期：与账号有效期独立，取决于后端保留时间和容量配置，不保证保存三天。托管邮箱显示近期同步记录，清理本地缓存不会删除 Microsoft 原信。
- 账户有效期: 通过 API 创建账户时可设置 `expiresIn` 参数（秒）。`0` 或 `-1` = 永不过期，不传 = 默认 24 小时后自动清理。网页端一键创建和手动创建默认不过期
- SMTP 临时邮箱不能找回密码；托管邮箱的独立访问密码可由所有者在管理面板重设。

#### 关于鉴权

1. 公共域名和公共临时邮箱创建无需 API Key；创建返回账号信息，需另行调用 `POST /token` 获取收件 Token。
2. 私有域名使用、托管邮箱列表/导入/管理需要所有者 API Key。API Key 使用 `Authorization: Bearer dk_...`，不代表直接 API 调用免限流。
3. Microsoft 托管邮箱使用 `POST /accounts/imports` 导入（每批最多 500 个），不是 `POST /accounts`。默认 `auto` 优先 Graph，仅明确缺少协议权限时回退 IMAP。独立访问密码不是微软密码，无需客户端计算哈希。
4. 浏览器共享同一后端的 429 冷却时间，包括收件、登录、切换账号及其他标签页；冷却期间不会继续向该后端发送请求。普通 2 秒轮询和托管 3 秒轮询不保证上游同步时延。

### 自建部署的服务端变量

| 变量 | 用途 |
| --- | --- |
| `API_BASE_URL` | Next.js 代理使用的后端地址，默认 `https://api.duckmail.sbs`；Docker 可在运行时设置。 |
| `NEXT_PUBLIC_API_BASE_URL` | 构建时的公开默认提供商地址；不得存放任何密钥。 |
| `DUCKMAIL_ALLOWED_API_ORIGINS` | 额外允许的 API 来源，逗号分隔；不需要时留空。 |
| `DUCKMAIL_WEB_PROXY_SECRET` | 可选，至少 32 字节，与 Go API 的 `INBUCKET_DUCKAPI_WEB_PROXY_SECRET` 相同。仅由服务端给自家后端添加内部头，豁免普通限流和异常 IP 降级，不豁免账号鉴权。 |
| `DUCKMAIL_TRUST_PROXY_HEADERS` | 默认 false；仅在 Web 端口私有、入口代理覆盖 `X-Real-IP` 时设为 true，以转发真实 IP。 |

内部密钥不能使用 `NEXT_PUBLIC_` 前缀，也不能放进客户端代码。公开的 Web 代理启用豁免后，脚本也可以经此代理绕过限流，这不等同于仅允许真人浏览器。不开启豁免时，须正确配置完整代理可信链，否则不同用户可能共用前端出口 IP 的额度和处罚。

本机 OpenResty 反代部署应将 Web 端口仅绑定到回环地址，例如 `127.0.0.1:22042:3000`。后端的可信代理 IP/CIDR 按实际网络确定，不要笼统信任所有来源。API 服务密钥（JWT、HOSTING_KEY 等）不应复制到前端。

中英文 API 文档位于 `/zh/api-docs`、`/en/api-docs`；随当前 Web 版本发布的纯文本参考位于 `/llm-api-docs.txt`。修改页面说明时同步 `messages/zh.json`、`messages/en.json` 和 `public/llm-api-docs.txt`。

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Mail.tm](https://mail.tm) - 提供免费可靠的临时邮件 API 服务

## 📞 联系

如有问题或建议，请通过以下方式联系：

- 创建 [Issue](https://github.com/moonwesif/duckmail/issues)
- 发送邮件到: syferie@proton.me

## 💖 赞助支持

如果这个项目对你有帮助，欢迎赞助支持开发者继续维护和改进项目，项目后端成本高昂，您的支持将会帮助项目持续发展。：

[![爱发电](https://img.shields.io/badge/%E7%88%B1%E5%8F%91%E7%94%B5-syferie-946ce6?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K)](https://afdian.com/a/syferie)

你的支持是项目持续发展的动力！🚀

---

⭐ 如果这个项目对你有帮助，请给它一个星标！

### Web 代理的基础浏览器检查

`/api/mail` 和 `/api/sse` 只接受浏览器页面发起的同源 fetch 请求：检查 `Sec-Fetch-Site`、`Sec-Fetch-Mode`、`Sec-Fetch-Dest`，并在存在 `Origin` 时检查来源主机。普通 curl/脚本直连、跨站请求和地址栏直接打开这些接口会返回英文 JSON 403；应使用正式后端 API 进行程序调用。正常网页请求无需新增参数，内部密钥豁免仍然有效。

这是基础过滤，不是反爬认证：刻意伪造浏览器头的脚本仍可能通过。不支持这些请求头的旧浏览器，以及非安全上下文的远程 HTTP 部署，可能被拒绝；生产使用 HTTPS，本地开发使用 localhost。页面和容器首页健康检查不受影响。
