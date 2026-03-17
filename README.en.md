<div align="center">
  <img src="https://img.116119.xyz/img/2025/06/08/547d9cd9739b8e15a51e510342af3fb0.png" alt="DuckMail Logo" width="120" height="120">

  # DuckMail - Temporary Email Service

  **Secure, Instant, Fast Temporary Email Service**

  English | [中文](./README.md)

  A modern temporary email service built with Next.js and Mail.tm API, providing secure, fast, and anonymous disposable email functionality.

  **🌐 [Try it now at duckmail.sbs](https://duckmail.sbs)**
</div>

## ✨ Features

- 🔒 **Secure & Reliable** - Built on Mail.tm's reliable infrastructure
- ⚡ **Instant Access** - Get temporary email addresses instantly
- 🌐 **Multi-language Support** - Supports Chinese and English, automatic browser language detection
- 🎨 **Modern UI** - Beautiful design based on HeroUI components
- 🔄 **Real-time Updates** - Supports Mercure SSE for real-time message notifications
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

> ⚠️ **Note**: Vercel deployment only supports DuckMail API, not Mail.tm API (because Mail.tm blocks Vercel's IP addresses). Please disable the Mail.tm provider in settings after deployment.
>
> 🚀 **Zero Configuration**: Vercel automatically detects Next.js projects and uses optimal configuration for deployment.

## 📧 API Documentation

This project uses DuckMail's self-hosted email backend server, supporting the following operations:

- **Account Management**: Create and login to temporary email accounts
- **Email Reception**: Real-time email receiving and viewing
- **Domain Retrieval**: Get available email domains
- **Real-time Notifications**: Real-time message push via Mercure Hub

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

- Rate Limit: 50 QPS. For special needs (such as public welfare purposes), please apply for a higher quota via email.
- Email Validity: Emails are retained for three days, then automatically deleted. Accounts are not deleted and can still be logged in with the same credentials to receive codes.
- No password recovery functionality

#### About Authentication

1. All endpoints can be used without an API Key. When creating an email account, you will receive a token for authentication of email-related operations.
2. The Domains and Accounts endpoints support an additional API Key Header for authentication. With an API Key, you can access private domains under that key and create new email accounts using private domains. All other operations remain the same.

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
