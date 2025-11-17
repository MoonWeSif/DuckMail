"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Tabs,
  Tab,
  Input,
  Textarea,
  Code as NextCode,
} from "@nextui-org/react"
import {
  ArrowLeft,
  Code,
  ExternalLink,
  Globe,
  Shield,
  Zap,
  Users,
  Languages,
  Book,
  Server,
  AlertTriangle,
  Key,
  Gift,
  Mail,
  MessageSquare,
  User,
  Trash2,
  Download,
  Eye,
  FileText,
  Info,
} from "lucide-react"
import { useRouter } from "next/navigation"

const content = {
  zh: {
    back: "返回",
    language: "English",
    title: "API 文档",
    subtitle: "欢迎使用 DuckMail API",
    description:
      "此 API 允许您自动化各种需要邮箱确认的网站注册流程，用于测试目的。严禁将我们的 API 用于非法活动。",
    generalInfo: "通用信息",
    baseUrl: "基础 URL",
    auth: "认证",
    authDescription:
      "大部分端点需要通过 Bearer Token 进行认证。您可以通过提供地址和密码来获取 Token。",
    apiKey: "API 密钥 (可选)",
    apiKeyDescription_pre:
      "部分接口 (获取域名、创建账户) 支持可选的 API 密钥，用于获取私有域名或在私有域名下创建邮箱。密钥以 `dk_` 开头。您可以访问 ",
    apiKeyDescription_link: "https://domain.duckmail.sbs",
    apiKeyDescription_post: " 获取您的 API 密钥。",
    endpoints: "API 端点",
    errorHandling: "错误处理",
    contributions: "贡献",
    contributionsDescription:
      "我们欢迎开发者为 DuckMail API 创建集成、库和工具。如果您有任何贡献，请随时联系我们或在我们的 GitHub 仓库上提交拉取请求。",
    githubRepo: "GitHub 仓库",
    contactUs: "联系我们",
    tryItOut: "试一试",
    authorization: "授权",
    bearerToken: "Bearer Token",
    headers: "请求头",
    headerName: "名称",
    headerValue: "值",
    parameters: "参数",
    paramName: "名称",
    paramValue: "值",
    body: "请求体",
    execute: "执行",
    response: "响应",
    loading: "加载中...",
    error: "错误",
    success: "成功",
    path: "路径",
    descriptionTitle: "描述",
  },
  en: {
    back: "Back",
    language: "中文",
    title: "API Documentation",
    subtitle: "Welcome to the DuckMail API",
    description:
      "This API allows you to automate the registration process at various sites which require email confirmation for testing purposes. Usage of our API for illegal activity is strictly prohibited.",
    generalInfo: "General Information",
    baseUrl: "Base URL",
    auth: "Authentication",
    authDescription:
      "Most endpoints require authentication via a Bearer Token. You can obtain a token by providing an address and password.",
    apiKey: "API Key (Optional)",
    apiKeyDescription_pre:
      "Some endpoints (getting domains, creating accounts) support an optional API Key to get private domains or create accounts under them. The key starts with `dk_`. You can obtain your API Key from ",
    apiKeyDescription_link: "https://domain.duckmail.sbs",
    apiKeyDescription_post: ".",
    endpoints: "API Endpoints",
    errorHandling: "Error Handling",
    contributions: "Contributions",
    contributionsDescription:
      "We welcome developers to create integrations, libraries, and tools for the DuckMail API. If you have any contributions, feel free to contact us or submit a pull request on our GitHub repository.",
    githubRepo: "GitHub Repository",
    contactUs: "Contact Us",
    tryItOut: "Try it out",
    authorization: "Authorization",
    bearerToken: "Bearer Token",
    headers: "Headers",
    headerName: "Name",
    headerValue: "Value",
    parameters: "Parameters",
    paramName: "Name",
    paramValue: "Value",
    body: "Body",
    execute: "Execute",
    response: "Response",
    loading: "Loading...",
    error: "Error",
    success: "Success",
    path: "Path",
    descriptionTitle: "Description",
  },
}

const apiEndpoints = {
  zh: [
    {
      group: "域名",
      endpoints: [
        {
          method: "GET",
          path: "/domains",
          description: "获取可用域名列表。如果提供了 API 密钥，将同时返回私有域名。",
          authType: "optional-apikey",
        },
      ],
    },
    {
      group: "账户",
      endpoints: [
        {
          method: "POST",
          path: "/accounts",
          description: "创建一个新的邮箱账户。如果使用私有域名，则需要提供 API 密钥。",
          authType: "optional-apikey",
          body: `{
  "address": "user@duckmail.sbs",
  "password": "your_password"
}`,
        },
        {
          method: "GET",
          path: "/me",
          description: "获取当前已认证账户的信息。",
          authType: "required-token",
        },
        {
          method: "DELETE",
          path: "/accounts/{id}",
          description: "通过 ID 删除当前已认证的邮箱账户。只能删除当前登录的账户。",
          authType: "required-token",
          pathParams: [{ name: "id", value: "" }],
        },
      ],
    },
    {
      group: "认证",
      endpoints: [
        {
          method: "POST",
          path: "/token",
          description: "通过邮箱地址和密码获取认证 Token。",
          authType: "none",
          body: `{
  "address": "user@duckmail.sbs",
  "password": "your_password"
}`,
        },
      ],
    },
    {
      group: "邮件",
      endpoints: [
        {
          method: "GET",
          path: "/messages",
          description: "获取收件箱中的邮件列表。",
          authType: "required-token",
        },
        {
          method: "GET",
          path: "/messages/{id}",
          description: "通过 ID 获取单封邮件的详细信息。",
          authType: "required-token",
          pathParams: [{ name: "id", value: "" }],
        },
        {
          method: "DELETE",
          path: "/messages/{id}",
          description: "通过 ID 删除一封邮件。",
          authType: "required-token",
          pathParams: [{ name: "id", value: "" }],
        },
      ],
    },
  ],
  en: [
    {
      group: "Domains",
      endpoints: [
        {
          method: "GET",
          path: "/domains",
          description: "Get the list of available domains. Private domains are returned if an API key is provided.",
          authType: "optional-apikey",
        },
      ],
    },
    {
      group: "Accounts",
      endpoints: [
        {
          method: "POST",
          path: "/accounts",
          description: "Create a new email account. An API key is required if using a private domain.",
          authType: "optional-apikey",
          body: `{
  "address": "user@duckmail.sbs",
  "password": "your_password"
}`,
        },
        {
          method: "GET",
          path: "/me",
          description: "Get information about the currently authenticated account.",
          authType: "required-token",
        },
        {
          method: "DELETE",
          path: "/accounts/{id}",
          description: "Delete the currently authenticated email account by ID. You can only delete your own account.",
          authType: "required-token",
          pathParams: [{ name: "id", value: "" }],
        },
      ],
    },
    {
      group: "Authentication",
      endpoints: [
        {
          method: "POST",
          path: "/token",
          description: "Get an authentication token using an email address and password.",
          authType: "none",
          body: `{
  "address": "user@duckmail.sbs",
  "password": "your_password"
}`,
        },
      ],
    },
    {
      group: "Messages",
      endpoints: [
        {
          method: "GET",
          path: "/messages",
          description: "Get the list of messages in the inbox.",
          authType: "required-token",
        },
        {
          method: "GET",
          path: "/messages/{id}",
          description: "Get detailed information for a single message by its ID.",
          authType: "required-token",
          pathParams: [{ name: "id", value: "" }],
        },
        {
          method: "DELETE",
          path: "/messages/{id}",
          description: "Delete a message by its ID.",
          authType: "required-token",
          pathParams: [{ name: "id", value: "" }],
        },
      ],
    },
  ],
}

const ApiEndpointCard = ({ endpoint, texts }: { endpoint: any; texts: any }) => {
  const [apiKey, setApiKey] = useState("")
  const [token, setToken] = useState("")
  const [body, setBody] = useState(endpoint.body || "")
  const [pathParams, setPathParams] = useState(endpoint.pathParams || [])
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const methodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "primary"
      case "POST":
        return "success"
      case "DELETE":
        return "danger"
      default:
        return "default"
    }
  }

  const handleExecute = async () => {
    setLoading(true)
    setError(null)
    setResponse(null)

    let urlPath = endpoint.path
    pathParams.forEach((param: any) => {
      urlPath = urlPath.replace(`{${param.name}}`, param.value)
    })
    const url = `https://api.duckmail.sbs${urlPath}`

    const headers: any = { "Content-Type": "application/json" }
    if (endpoint.authType === "optional-apikey" && apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`
    }
    if (endpoint.authType === "required-token" && token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    try {
      const res = await fetch(url, {
        method: endpoint.method,
        headers,
        body: endpoint.method !== "GET" ? body : undefined,
      })
      const data = await res.json()
      if (!res.ok) {
        throw data
      }
      setResponse(data)
    } catch (err: any) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mb-6" shadow="md">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Chip color={methodColor(endpoint.method)} size="sm" variant="flat">
            {endpoint.method}
          </Chip>
          <NextCode className="text-lg">{endpoint.path}</NextCode>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-default-600 mb-4">{endpoint.description}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left side: Request */}
          <div className="flex flex-col gap-4">
            {(endpoint.authType === "optional-apikey" || endpoint.authType === "required-token") && (
              <div>
                <h4 className="font-semibold mb-2">{texts.authorization}</h4>
                <Input
                  label={
                    endpoint.authType === "optional-apikey"
                      ? `${texts.apiKey} (dk_...)`
                      : texts.bearerToken
                  }
                  placeholder={
                    endpoint.authType === "optional-apikey"
                      ? "Enter your API Key (optional)"
                      : "Enter your Bearer Token"
                  }
                  value={endpoint.authType === "optional-apikey" ? apiKey : token}
                  onChange={(e) =>
                    endpoint.authType === "optional-apikey"
                      ? setApiKey(e.target.value)
                      : setToken(e.target.value)
                  }
                />
              </div>
            )}

            {pathParams.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">{texts.path} {texts.parameters}</h4>
                {pathParams.map((param: any, index: number) => (
                  <Input
                    key={index}
                    label={param.name}
                    value={param.value}
                    onChange={(e) => {
                      const newParams = [...pathParams]
                      newParams[index].value = e.target.value
                      setPathParams(newParams)
                    }}
                    className="mb-2"
                  />
                ))}
              </div>
            )}

            {endpoint.body && (
              <div>
                <h4 className="font-semibold mb-2">{texts.body}</h4>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  minRows={5}
                  maxRows={10}
                />
              </div>
            )}

            <Button color="primary" onClick={handleExecute} isLoading={loading}>
              {texts.execute}
            </Button>
          </div>

          {/* Right side: Response */}
          <div>
            <h4 className="font-semibold mb-2">{texts.response}</h4>
            <div className="bg-default-100 rounded-lg p-4 min-h-[200px] text-sm">
              {loading && <p>{texts.loading}</p>}
              {error && (
                <>
                  <p className="text-danger-500 font-bold">{texts.error}</p>
                  <pre className="whitespace-pre-wrap break-all">
                    {JSON.stringify(error, null, 2)}
                  </pre>
                </>
              )}
              {response && (
                <>
                  <p className="text-success-500 font-bold">{texts.success}</p>
                  <pre className="whitespace-pre-wrap break-all">
                    {JSON.stringify(response, null, 2)}
                  </pre>
                </>
              )}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

export default function ApiDocsPage() {
  const router = useRouter()
  const [currentLocale, setCurrentLocale] = useState("zh")

  useEffect(() => {
    const savedLocale = localStorage.getItem("duckmail-locale") || "zh"
    setCurrentLocale(savedLocale)
  }, [])

  const currentContent = content[currentLocale as keyof typeof content]
  const currentEndpoints = apiEndpoints[currentLocale as keyof typeof apiEndpoints]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6 flex justify-between items-center">
          <Button
            variant="light"
            startContent={<ArrowLeft size={16} />}
            onPress={() => router.push("/")}
          >
            {currentContent.back}
          </Button>
          <Button
            variant="flat"
            startContent={<Languages size={16} />}
            onPress={() => {
              const newLocale = currentLocale === "en" ? "zh" : "en"
              setCurrentLocale(newLocale)
              localStorage.setItem("duckmail-locale", newLocale)
            }}
          >
            {currentContent.language}
          </Button>
        </div>

        <header className="mb-10">
          <h1 className="text-4xl font-bold mb-2">{currentContent.title}</h1>
          <p className="text-xl text-default-500">{currentContent.subtitle}</p>
          <p className="mt-2 text-default-600">{currentContent.description}</p>
        </header>

        <main className="space-y-8">
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Info size={20} /> {currentContent.generalInfo}
              </h2>
            </CardHeader>
            <CardBody>
              <p className="mb-2">
                <strong>{currentContent.baseUrl}:</strong>{" "}
                <NextCode>https://api.duckmail.sbs</NextCode>
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Key size={20} /> {currentContent.auth}
              </h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{currentContent.bearerToken}</h3>
                <p className="text-default-600">{currentContent.authDescription}</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg">{currentContent.apiKey}</h3>
                <p className="text-default-600">
                  {currentContent.apiKeyDescription_pre}
                  <a
                    href={currentContent.apiKeyDescription_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    {currentContent.apiKeyDescription_link}
                  </a>
                  {currentContent.apiKeyDescription_post}
                </p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Server size={20} /> {currentContent.endpoints}
              </h2>
            </CardHeader>
            <CardBody>
              <Tabs aria-label="API Endpoints">
                {currentEndpoints.map((group) => (
                  <Tab key={group.group} title={group.group}>
                    <div className="pt-4">
                      {group.endpoints.map((endpoint) => (
                        <ApiEndpointCard
                          key={endpoint.path + endpoint.method}
                          endpoint={endpoint}
                          texts={currentContent}
                        />
                      ))}
                    </div>
                  </Tab>
                ))}
              </Tabs>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Gift size={20} /> {currentContent.contributions}
              </h2>
            </CardHeader>
            <CardBody>
              <p className="mb-4">{currentContent.contributionsDescription}</p>
              <div className="flex gap-3">
                <Button
                  as="a"
                  href="https://github.com/moonwesif/DuckMail"
                  target="_blank"
                  rel="noopener noreferrer"
                  color="primary"
                  endContent={<ExternalLink size={14} />}
                >
                  {currentContent.githubRepo}
                </Button>
                <Button as="a" href="mailto:syferie@proton.me" variant="bordered">
                  {currentContent.contactUs}
                </Button>
              </div>
            </CardBody>
          </Card>
        </main>
      </div>
    </div>
  )
}
