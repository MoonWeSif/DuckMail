"use client"
import { rateLimitedFetch as fetch } from "@/lib/rate-limited-fetch"
import RequestBodyEditor from "@/components/request-body-editor"
import { parseRequestBody } from "@/lib/request-body"

import { useState, useTransition } from "react"
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Code,
  Input,
  ScrollShadow,
  Snippet,
  Tab,
  Tabs,
} from "@heroui/react"
import {
  ArrowLeft,
  Code as CodeIcon,
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

const llmDocsPath = "/llm-api-docs.txt"
const compactInput = { inputWrapper: "h-8 min-h-8" }

type PathParam = { name: string; value: string }

const methodColor = (method: string) => {
  switch (method) {
    case "GET": return "primary"
    case "POST": return "success"
    case "PATCH": return "warning"
    case "DELETE": return "danger"
    default: return "default"
  }
}

const ApiEndpointCard = ({ endpoint, t }: { endpoint: any; t: any }) => {
  const [apiKey, setApiKey] = useState("")
  const [token, setToken] = useState("")
  const [body, setBody] = useState(endpoint.body || "")
  const [pathParams, setPathParams] = useState<PathParam[]>(endpoint.pathParams || [])
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const invalidBody = !!endpoint.body && !parseRequestBody(body)
  const needsAuth = endpoint.authType === "optional-apikey" || endpoint.authType === "required-apikey" || endpoint.authType === "required-token"

  const handleExecute = async () => {
    if (invalidBody) return
    setLoading(true)
    setError(null)
    setResponse(null)

    let urlPath = endpoint.path
    pathParams.forEach((param) => {
      urlPath = urlPath.replace(`{${param.name}}`, param.value)
    })
    const url = `/api/mail?endpoint=${encodeURIComponent(urlPath)}`

    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (endpoint.authType === "optional-apikey" && apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`
    }
    if (endpoint.authType === "required-apikey" && apiKey) {
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
      const data = res.status === 204 ? {status:204} : await res.json()
      if (!res.ok) throw data
      setResponse(data)
    } catch (err: any) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  const authFields = (needsAuth || pathParams.length > 0) ? (
    <div className="flex flex-wrap gap-3">
      {needsAuth && (
        <Input
          size="sm"
          variant="bordered"
          labelPlacement="outside"
          className="w-full sm:max-w-xs"
          label={endpoint.authType === "required-token" ? t("bearerToken") : `${t("apiKey")} (dk_...)`}
          placeholder={
            endpoint.authType === "required-token"
              ? "Enter your Bearer Token"
              : endpoint.authType === "required-apikey"
                ? "Enter your API Key"
                : "Enter your API Key (optional)"
          }
          value={endpoint.authType === "required-token" ? token : apiKey}
          classNames={compactInput}
          onValueChange={(value) => endpoint.authType === "required-token" ? setToken(value) : setApiKey(value)}
        />
      )}
      {pathParams.map((param, index) => (
        <Input
          key={param.name}
          size="sm"
          variant="bordered"
          labelPlacement="outside"
          className="w-full sm:max-w-xs"
          label={param.name}
          value={param.value}
          classNames={compactInput}
          onValueChange={(value) => {
            setPathParams((params) => params.map((item, i) => i === index ? { ...item, value } : item))
          }}
        />
      ))}
    </div>
  ) : null

  const executeButton = (
    <Button
      color="primary"
      className="w-full sm:w-auto sm:self-start"
      onPress={handleExecute}
      isLoading={loading}
      isDisabled={invalidBody}
    >
      {t("execute")}
    </Button>
  )

  const responsePane = (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-2">
      <div className="flex h-8 shrink-0 items-center gap-2">
        <h4 className="text-sm font-medium">{t("response")}</h4>
        {error && <Chip color="danger" size="sm" variant="flat">{t("error")}</Chip>}
        {response && <Chip color="success" size="sm" variant="flat">{t("success")}</Chip>}
      </div>
      <ScrollShadow className="min-h-0 flex-1 overflow-y-auto rounded-xl bg-default-100 p-3 text-xs">
        {loading && <p className="text-default-500">{t("loading")}</p>}
        {!loading && (error || response) && (
          <pre className="whitespace-pre-wrap break-all font-mono">{JSON.stringify(error ?? response, null, 2)}</pre>
        )}
        {!loading && !error && !response && (
          <p className="text-default-400">{t("responseEmpty")}</p>
        )}
      </ScrollShadow>
    </div>
  )

  return (
    <Card shadow="none" className="mb-4 border border-default-200">
      <CardHeader className="flex-col items-start gap-2 pb-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Chip color={methodColor(endpoint.method)} size="sm" variant="flat">{endpoint.method}</Chip>
          <Code className="whitespace-normal break-all text-sm">{endpoint.path}</Code>
        </div>
        <p className="text-sm text-default-500">{endpoint.description}</p>
      </CardHeader>
      <CardBody className="flex flex-col gap-4 pt-0">
        {endpoint.body ? (
          <>
            {authFields}
            <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex min-w-0 flex-col gap-3">
                <RequestBodyEditor pane="fields" value={body} example={endpoint.body} onChange={setBody} />
                {executeButton}
              </div>
              <RequestBodyEditor pane="json" value={body} example={endpoint.body} onChange={setBody} />
              <div className="min-h-48 md:col-span-2 lg:col-span-1">
                {responsePane}
              </div>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-3">
              {authFields}
              {executeButton}
            </div>
            {responsePane}
          </div>
        )}
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
          body: `{\n  "address": "user@duckmail.sbs",\n  "password": "your_password",\n  "expiresIn": 86400\n}`,
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
    {
      group: t("hostedGroup"),
      endpoints: [
        { method: "GET", path: "/accounts/hosted", description: t("hostedListDesc"), authType: "required-apikey" },
        { method: "POST", path: "/token", description: t("hostedTokenDesc"), authType: "required-apikey", body: JSON.stringify({ address: "example@outlook.com" }, null, 2) },
        { method: "POST", path: "/accounts/imports", description: t("hostedImportDesc"), authType: "required-apikey", body: JSON.stringify({ entries: [{ address: "example@outlook.com", password: "<DuckMail_access_password>", protocol: "auto", refreshToken: "<refresh_token>", clientId: "<original_client_id>" }] }, null, 2) },
        { method: "GET", path: "/accounts/imports/{importId}", description: t("hostedImportGetDesc"), authType: "required-apikey", pathParams: [{ name: "importId", value: "" }] },
        { method: "PATCH", path: "/accounts/{id}", description: t("hostedPatchDesc"), authType: "required-apikey", pathParams: [{ name: "id", value: "" }], body: JSON.stringify({ label: "", paused: false, status: "active" }, null, 2) },
        { method: "DELETE", path: "/accounts/{id}", description: t("hostedDeleteDesc"), authType: "required-apikey", pathParams: [{ name: "id", value: "" }] },
        { method: "POST", path: "/accounts/{id}/sync", description: t("hostedOwnerSyncDesc"), authType: "required-apikey", pathParams: [{ name: "id", value: "" }] },
      ],
    },
  ]

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-opacity duration-200 ${isPending ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
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
            <CardBody className="gap-4">
              <p className="text-default-600">{t("llmDocsDescription")}</p>
              <Snippet symbol="" variant="flat" className="max-w-full" codeString={llmDocsPath}>
                {llmDocsPath}
              </Snippet>
              <div className="flex gap-3">
                <Button
                  as="a"
                  href={llmDocsPath}
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
                  startContent={<CodeIcon size={16} />}
                  color={copySuccess ? "success" : "default"}
                  onPress={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        new URL(llmDocsPath, window.location.origin).href
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
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{t("baseUrl")}</span>
                <Snippet symbol="" variant="flat" hideCopyButton>https://api.duckmail.sbs</Snippet>
              </div>
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
              <h2 className="text-2xl font-semibold">{t("rateLimits")}</h2>
            </CardHeader>
            <CardBody className="space-y-3 text-default-600">
              <p>{t("rateLimitsDescription")}</p>
              <p>{t("retryDescription")}</p>
              <h3 className="font-semibold text-default-900">{t("errorHandling")}</h3>
              <p>{t("errorHandlingDescription")}</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Server size={20} /> {t("endpoints")}
              </h2>
            </CardHeader>
            <CardBody>
              <Tabs aria-label="API Endpoints" classNames={{ panel: "pt-4" }}>
                {apiEndpoints.map((group) => (
                  <Tab key={group.group} title={group.group}>
                    {group.endpoints.map((endpoint) => (
                      <ApiEndpointCard
                        key={endpoint.path + endpoint.method}
                        endpoint={endpoint}
                        t={t}
                      />
                    ))}
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
