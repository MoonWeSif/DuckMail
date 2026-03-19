"use client"

import { useState, useTransition } from "react"
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
  Languages,
  Key,
  Gift,
  Server,
  FileText,
  Info,
} from "lucide-react"
import { useTranslations, useLocale } from "next-intl"
import { useRouter, usePathname } from "@/i18n/navigation"

const ApiEndpointCard = ({ endpoint, t }: { endpoint: any; t: any }) => {
  const [apiKey, setApiKey] = useState("")
  const [token, setToken] = useState("")
  const [body, setBody] = useState(endpoint.body || "")
  const [pathParams, setPathParams] = useState(endpoint.pathParams || [])
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const methodColor = (method: string) => {
    switch (method) {
      case "GET": return "primary"
      case "POST": return "success"
      case "DELETE": return "danger"
      default: return "default"
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
    const url = `/api/mail?endpoint=${encodeURIComponent(urlPath)}`

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
      if (!res.ok) throw data
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
          <Chip color={methodColor(endpoint.method)} size="sm" variant="flat">{endpoint.method}</Chip>
          <NextCode className="text-lg">{endpoint.path}</NextCode>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-default-600 mb-4">{endpoint.description}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-4">
            {(endpoint.authType === "optional-apikey" || endpoint.authType === "required-token") && (
              <div>
                <h4 className="font-semibold mb-2">{t("authorization")}</h4>
                <Input
                  label={endpoint.authType === "optional-apikey" ? `${t("apiKey")} (dk_...)` : t("bearerToken")}
                  placeholder={endpoint.authType === "optional-apikey" ? "Enter your API Key (optional)" : "Enter your Bearer Token"}
                  value={endpoint.authType === "optional-apikey" ? apiKey : token}
                  onChange={(e) => endpoint.authType === "optional-apikey" ? setApiKey(e.target.value) : setToken(e.target.value)}
                />
              </div>
            )}

            {pathParams.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">{t("path")} {t("parameters")}</h4>
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
                <h4 className="font-semibold mb-2">{t("body")}</h4>
                <Textarea value={body} onChange={(e) => setBody(e.target.value)} minRows={5} maxRows={10} />
              </div>
            )}

            <Button color="primary" onClick={handleExecute} isLoading={loading}>{t("execute")}</Button>
          </div>

          <div>
            <h4 className="font-semibold mb-2">{t("response")}</h4>
            <div className="bg-default-100 rounded-lg p-4 min-h-[200px] text-sm">
              {loading && <p>{t("loading")}</p>}
              {error && (
                <>
                  <p className="text-danger-500 font-bold">{t("error")}</p>
                  <pre className="whitespace-pre-wrap break-all">{JSON.stringify(error, null, 2)}</pre>
                </>
              )}
              {response && (
                <>
                  <p className="text-success-500 font-bold">{t("success")}</p>
                  <pre className="whitespace-pre-wrap break-all">{JSON.stringify(response, null, 2)}</pre>
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
  const navRouter = useRouter()
  const pathname = usePathname()
  const [copySuccess, setCopySuccess] = useState(false)
  const t = useTranslations("apiDocs")
  const locale = useLocale()
  const [isPending, startTransition] = useTransition()

  const toggleLocale = () => {
    const newLocale = locale === "en" ? "zh" : "en"
    startTransition(() => {
      navRouter.replace(pathname, { locale: newLocale })
    })
  }

  // API 端点数据（使用翻译 key）
  const apiEndpoints = [
    {
      group: t("domainGroup"),
      endpoints: [
        { method: "GET", path: "/domains", description: t("domainGetDesc"), authType: "optional-apikey" },
      ],
    },
    {
      group: t("accountGroup"),
      endpoints: [
        {
          method: "POST", path: "/accounts", description: t("accountCreateDesc"), authType: "optional-apikey",
          body: `{\n  "address": "user@duckmail.sbs",\n  "password": "your_password",\n  "expiresIn": 0\n}`,
        },
        { method: "GET", path: "/me", description: t("accountMeDesc"), authType: "required-token" },
        { method: "DELETE", path: "/accounts/{id}", description: t("accountDeleteDesc"), authType: "required-token", pathParams: [{ name: "id", value: "" }] },
      ],
    },
    {
      group: t("authGroup"),
      endpoints: [
        {
          method: "POST", path: "/token", description: t("tokenDesc"), authType: "none",
          body: `{\n  "address": "user@duckmail.sbs",\n  "password": "your_password"\n}`,
        },
      ],
    },
    {
      group: t("messageGroup"),
      endpoints: [
        { method: "GET", path: "/messages", description: t("messageListDesc"), authType: "required-token" },
        { method: "GET", path: "/messages/{id}", description: t("messageGetDesc"), authType: "required-token", pathParams: [{ name: "id", value: "" }] },
        { method: "DELETE", path: "/messages/{id}", description: t("messageDeleteDesc"), authType: "required-token", pathParams: [{ name: "id", value: "" }] },
      ],
    },
  ]

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-opacity duration-200 ${isPending ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6 flex justify-between items-center">
          <Button variant="light" startContent={<ArrowLeft size={16} />} onPress={() => navRouter.push("/")}>
            {t("back")}
          </Button>
          <Button variant="flat" startContent={<Languages size={16} />} onPress={toggleLocale}>
            {t("language")}
          </Button>
        </div>

        <header className="mb-10">
          <h1 className="text-4xl font-bold mb-2">{t("title")}</h1>
          <p className="text-xl text-default-500">{t("subtitle")}</p>
          <p className="mt-2 text-default-600">{t("description")}</p>
        </header>

        <main className="space-y-8">
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <FileText size={20} /> {t("llmDocs")}
              </h2>
            </CardHeader>
            <CardBody>
              <p className="text-default-600 mb-4">{t("llmDocsDescription")}</p>
              <div className="flex items-center gap-3 bg-default-100 rounded-lg p-3 mb-4">
                <NextCode className="text-sm flex-1 truncate">
                  https://raw.githubusercontent.com/MoonWeSif/DuckMail/main/public/llm-api-docs.txt
                </NextCode>
              </div>
              <div className="flex gap-3">
                <Button
                  as="a"
                  href="https://raw.githubusercontent.com/MoonWeSif/DuckMail/main/public/llm-api-docs.txt"
                  target="_blank"
                  rel="noopener noreferrer"
                  color="primary"
                  variant="flat"
                  startContent={<ExternalLink size={16} />}
                >
                  {t("openLink")}
                </Button>
                <Button
                  variant="bordered"
                  startContent={<Code size={16} />}
                  color={copySuccess ? "success" : "default"}
                  onPress={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        "https://raw.githubusercontent.com/MoonWeSif/DuckMail/main/public/llm-api-docs.txt"
                      )
                      setCopySuccess(true)
                      setTimeout(() => setCopySuccess(false), 2000)
                    } catch {}
                  }}
                >
                  {copySuccess ? t("copySuccess") : t("copyLink")}
                </Button>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Info size={20} /> {t("generalInfo")}
              </h2>
            </CardHeader>
            <CardBody>
              <p className="mb-2">
                <strong>{t("baseUrl")}:</strong>{" "}
                <NextCode>https://api.duckmail.sbs</NextCode>
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Key size={20} /> {t("auth")}
              </h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{t("bearerToken")}</h3>
                <p className="text-default-600">{t("authDescription")}</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg">{t("apiKey")}</h3>
                <p className="text-default-600">
                  {t("apiKeyDescription_pre")}
                  <a
                    href={t("apiKeyDescription_link")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    {t("apiKeyDescription_link")}
                  </a>
                  {t("apiKeyDescription_post")}
                </p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Server size={20} /> {t("endpoints")}
              </h2>
            </CardHeader>
            <CardBody>
              <Tabs aria-label="API Endpoints">
                {apiEndpoints.map((group) => (
                  <Tab key={group.group} title={group.group}>
                    <div className="pt-4">
                      {group.endpoints.map((endpoint) => (
                        <ApiEndpointCard
                          key={endpoint.path + endpoint.method}
                          endpoint={endpoint}
                          t={t}
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
                <Gift size={20} /> {t("contributions")}
              </h2>
            </CardHeader>
            <CardBody>
              <p className="mb-4">{t("contributionsDescription")}</p>
              <div className="flex gap-3">
                <Button
                  as="a"
                  href="https://github.com/moonwesif/DuckMail"
                  target="_blank"
                  rel="noopener noreferrer"
                  color="primary"
                  endContent={<ExternalLink size={14} />}
                >
                  {t("githubRepo")}
                </Button>
                <Button as="a" href="mailto:syferie@proton.me" variant="bordered">
                  {t("contactUs")}
                </Button>
              </div>
            </CardBody>
          </Card>
        </main>
      </div>
    </div>
  )
}
