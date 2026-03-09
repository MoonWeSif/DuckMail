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
- 📱 **Responsive Design** - Perfect for both desktop and mobile devices
- 🎨 **Modern UI** - Beautiful design based on HeroUI components
- 🔄 **Real-time Updates** - Supports Mercure SSE for real-time message notifications
- 🌙 **Dark Mode** - Light and dark theme support
- 📧 **Multi-account Management** - Create and manage multiple temporary email accounts
- 🔧 **Multi-API Provider** - Support switching between DuckMail API and Mail.tm API
- 🎯 **Smart Error Handling** - Elegant error messages and automatic retry mechanisms
- 🔗 **Open Source** - Fully open source with community contributions
- 🔧 **Multi-API Provider** - Support switching between DuckMail API and Mail.tm API
- 🎯 **Smart Error Handling** - Elegant error messages and automatic retry mechanisms
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

### Local Development

#### Prerequisites

- Node.js 18+
- npm or pnpm

#### Installation

```bash
# Clone the repository
git clone https://github.com/moonwesif/duckmail.git
cd duckmail

# Install dependencies
npm install
# or
pnpm install
```

### Development

```bash
# Start development server
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Production Build

```bash
# Build for production
npm run build
npm start

# or
pnpm build
pnpm start
```

## 🛠️ Tech Stack

- **Frontend Framework**: Next.js 15
- **UI Component Library**: HeroUI
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **API**: Mail.tm REST API / DuckMail API
- **Real-time Communication**: Mercure SSE
- **Language**: TypeScript

## 🌐 Deployment Guide

### Platform Compatibility

| Platform | DuckMail API | Mail.tm API | Rating |
|----------|-------------|-------------|--------|
| **Netlify** | ✅ Supported | ✅ Supported | ⭐⭐⭐⭐⭐ |
| **Vercel** | ✅ Supported | ❌ Not Supported* | ⭐⭐⭐⭐ |
| **Other Platforms** | ✅ Supported | ✅ Supported | ⭐⭐⭐ |

> *Mail.tm blocks Vercel's IP addresses, so Vercel deployment cannot use Mail.tm API.

### Deployment Recommendations

- **Full Features**: Recommended to use **Netlify**, supports all API providers
- **Quick Deploy**: Can use **Vercel**, but need to disable Mail.tm provider in settings

## 📧 API Documentation

This project uses the free API service provided by [Mail.tm](https://mail.tm):

- **Account Management**: Create and login to temporary email accounts
- **Email Reception**: Real-time email receiving and viewing
- **Domain Retrieval**: Get available email domains
- **Real-time Notifications**: Real-time message push via Mercure Hub

### API Limitations

- Rate Limit: 8 QPS
- Email Validity: According to Mail.tm policy
- No password recovery functionality

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Create a Pull Request

## 📢 About Ads

This project includes Google AdSense ads in the desktop sidebar (desktop only, not shown on mobile).

**Why ads?**

DuckMail is a completely free and open-source project, but the backend server costs are real:
- Continuous operation and maintenance of the mail server
- Domain renewal and SSL certificates
- Server bandwidth and storage costs

Ad revenue will be **used to cover server operating costs**, helping the project run stably in the long term. If you fork this project for self-deployment, feel free to remove or replace the ad code with your own.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Mail.tm](https://mail.tm) - For providing free and reliable temporary email API service
- [HeroUI](https://heroui.com) - Modern React UI component library
- [Next.js](https://nextjs.org) - Powerful React framework
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework

## 📞 Contact

If you have any questions or suggestions, please contact us through:

- Create an [Issue](https://github.com/moonwesif/duckmail/issues)
- Send email to: syferie@proton.me

## 💖 Sponsor

If this project helps you, welcome to sponsor and support the developer to continue maintaining and improving the project:

[![爱发电](https://img.shields.io/badge/%E7%88%B1%E5%8F%91%E7%94%B5-syferie-946ce6?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K)](https://afdian.com/a/syferie)

Your support is the driving force for the project's continued development! 🚀

---

⭐ If this project helps you, please give it a star!
