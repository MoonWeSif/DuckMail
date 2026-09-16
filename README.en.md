<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./public/images/duckmail-logo-on-dark.png">
    <img src="./public/images/duckmail-logo.png" alt="DuckMail Logo" width="160">
  </picture>

  # DuckMail - Temporary Email Service

  **Secure, Instant, Fast Temporary Email Service**

  English | [中文](./README.md)

  A Next.js Web client for the DuckMail backend, supporting temporary mailboxes, Microsoft hosted mailboxes and the optional Mail.tm provider.

  **🌐 [Try it now at duckmail.sbs](https://duckmail.sbs)**
</div>

## ✨ Features

- 🔒 **Secure & Reliable** - Uses the DuckMail backend, with Mail.tm as an optional provider
- ⚡ **Instant Access** - Get temporary email addresses instantly
- 🌐 **Multi-language Support** - Supports Chinese and English, automatic browser language detection
- 🎨 **Modern UI** - Beautiful design based on HeroUI components
- 🔄 **Real-time Updates** - Polls message lists: a 2-second main interval for temporary inboxes and 3 seconds for hosted inboxes
- 🌙 **Dark Mode** - Light and dark theme support
- 📧 **Multi-account Management** - Create and manage multiple temporary email accounts
- 🔧 **Multi-API Provider** - Support switching between DuckMail API and Mail.tm API
- 🔑 **API Key Support** - Optional API Key configuration for more domain choices and private domain access
- 🔗 **Open Source** - Fully open source with community contributions

## 📸 Screenshots

<div align="center">
  <img src="./img/display1.png" alt="DuckMail Main Interface" width="800">
  <p><em>Main Interface - Clean and Modern Design</em></p>

  <img src="./img/display2.png" alt="DuckMail Email Management" width="800">
  <p><em>Email Management - Real-time Email Reception and Management</em></p>
</div>

## 🚀 Quick Start

### One-Click Deploy

#### Netlify Deploy (Recommended)

Click the button below to deploy to Netlify with one click:

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/moonwesif/duckmail)

> 🎉 **Zero Configuration Deployment** - After clicking the button, Netlify will automatically fork the project to your GitHub account and start deployment, no additional configuration required!

#### Vercel Deploy

Click the button below to deploy to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/moonwesif/duckmail)

> Your deployment platform must be able to reach the configured mail API. Upstream access restrictions may affect some providers. Mail.tm is disabled by default and can be enabled in settings.
>
> 🚀 **Zero Configuration**: Vercel automatically detects Next.js projects and uses optimal configuration for deployment.

## 📧 API Documentation

This project uses DuckMail's self-hosted email backend server, supporting the following operations:

- **Account Management**: Create and login to temporary email accounts
- **Email Reception**: Real-time email receiving and viewing
- **Domain Retrieval**: Get available email domains
- **Hosted Mailboxes**: Sign in with an independent access password or an owner API Key to read synchronized Microsoft mail
- **List Updates**: Poll for messages; DuckMail currently does not provide Mercure SSE

Visit https://www.duckmail.sbs/en/api-docs for API documentation and debugging interface.

### API Key Feature (Optional)

The application supports optional API Key configuration for enhanced features:

- **Without API Key**: Use public domains, all basic features fully available
- **With API Key**: Access more domain choices and private domain creation permissions

**Configuration**:
1. Click the settings button in the top right corner
2. Enter your API Key in the "API Key Settings" area
3. Click save to apply

#### How to Get an API Key
1. Visit https://domain.duckmail.sbs
2. Log in via LinuxDo authentication
3. Click the API Key option in the sidebar, create a new API Key

### API Limitations

- Rate limits: the current public deployment allows 1,000 requests/second per IP with a valid JWT/API Key, or 1,000 without authentication, except unauthenticated account creation at 200 requests/second. Self-hosted limits depend on configuration. Persistent invalid requests can trigger reduced rates or a temporary block. Honor `Retry-After` on 429 instead of repeatedly logging in or creating accounts.
- Message retention is independent of account expiry and depends on backend retention/capacity settings; three days is not guaranteed. Hosted lists show recent synchronized records. Local cache cleanup does not delete Microsoft originals.
- Account Validity: When creating accounts via API, set `expiresIn` parameter (seconds). `0` or `-1` = never expires, omit = defaults to 24 hours auto-cleanup. Accounts created via web UI default to never expire.
- SMTP temporary passwords cannot be recovered. An owner can reset a hosted mailbox's independent access password in the management panel.

#### About Authentication

1. Public domain listing and public temporary account creation do not require an API Key. Creation returns account details; call `POST /token` separately for a mailbox token.
2. Private domains and hosted mailbox listing/import/management require an owner API Key, sent as `Authorization: Bearer dk_...`. API Keys do not exempt direct API calls from rate limits.
3. Import Microsoft mailboxes through `POST /accounts/imports` (up to 500 per batch), not `POST /accounts`. Default `auto` tries Graph first and falls back to IMAP only for explicit protocol-permission failures. The independent access password is not the Microsoft password; no client-side hashing is required.
4. Browser calls share a backend's 429 cooldown across mail access, login, account switching and tabs. No new request to that backend is sent during the cooldown. Normal 2-second temporary polling and 3-second hosted polling do not guarantee upstream synchronization latency.

### Server-side deployment variables

| Variable | Purpose |
| --- | --- |
| `API_BASE_URL` | Backend used by the Next.js proxy, default `https://api.duckmail.sbs`; configurable at Docker runtime. |
| `NEXT_PUBLIC_API_BASE_URL` | Public default provider address set at build time; never store secrets here. |
| `DUCKMAIL_ALLOWED_API_ORIGINS` | Additional allowed API origins, comma-separated; leave empty if unnecessary. |
| `DUCKMAIL_WEB_PROXY_SECRET` | Optional, at least 32 bytes, matching the Go API's `INBUCKET_DUCKAPI_WEB_PROXY_SECRET`. The server adds an internal header only for its own backend, exempting normal rates and IP abuse penalties, never account authentication. |
| `DUCKMAIL_TRUST_PROXY_HEADERS` | Default false. Enable only when the Web port is private and the ingress proxy overwrites `X-Real-IP`, to forward the actual client IP. |

Never use a `NEXT_PUBLIC_` variable or client code for the internal secret. Exempting a public Web proxy also allows scripts using that proxy to bypass limits; it does not identify human browser users. Without exemption, configure the complete trusted proxy chain correctly or users may share the Web server's outbound IP quota and penalties.

For a local OpenResty reverse proxy, bind the Web port to loopback, e.g. `127.0.0.1:22042:3000`. Configure backend trusted IPs/CIDRs from the actual network; do not trust all sources. Backend JWT and HOSTING_KEY secrets do not belong in the frontend.

Bilingual API docs are at `/zh/api-docs` and `/en/api-docs`; `/llm-api-docs.txt` serves the reference bundled with the deployed Web version. Keep `messages/zh.json`, `messages/en.json` and `public/llm-api-docs.txt` in sync when editing API guidance.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Mail.tm](https://mail.tm) - For providing free and reliable temporary email API service

## 📞 Contact

If you have any questions or suggestions, please contact us through:

- Create an [Issue](https://github.com/moonwesif/duckmail/issues)
- Send email to: syferie@proton.me

## 💖 Sponsor

If this project helps you, welcome to sponsor and support the developer to continue maintaining and improving the project. The backend costs are significant, and your support will help the project's continued development:

[![爱发电](https://img.shields.io/badge/%E7%88%B1%E5%8F%91%E7%94%B5-syferie-946ce6?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K)](https://afdian.com/a/syferie)

Your support is the driving force for the project's continued development! 🚀

---

⭐ If this project helps you, please give it a star!

### Basic browser checks on the Web proxy

`/api/mail` and `/api/sse` accept same-origin browser fetches, checking `Sec-Fetch-Site`, `Sec-Fetch-Mode`, `Sec-Fetch-Dest` and, when present, the Origin host. Ordinary curl/script requests, cross-site requests and direct address-bar navigation return English JSON 403. Use the backend API for programmatic access. Normal page requests need no extra parameters; the internal server-secret exemption still applies.

This is a basic filter, not bot authentication: a script that deliberately forges browser headers can still pass. Old browsers without these headers and insecure remote HTTP deployments may be rejected; use HTTPS in production and localhost for development. Pages and homepage health checks are unaffected.
