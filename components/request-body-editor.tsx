"use client"

import { useId } from "react"
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Select,
  SelectItem,
  Switch,
  Textarea,
  Tooltip,
} from "@heroui/react"
import { Plus, RotateCcw, WandSparkles, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { parseRequestBody, updateRequestBody, type RequestBody } from "@/lib/request-body"

const choices: Record<string, string[]> = {
  protocol: ["auto", "graph", "imap"],
  status: ["active", "disabled"],
}

const compactInput = { inputWrapper: "h-8 min-h-8" }
const compactSelect = { trigger: "h-8 min-h-8" }

export default function RequestBodyEditor({ value, example, onChange, pane }: {
  value: string
  example: string
  onChange: (value: string) => void
  pane: "fields" | "json"
}) {
  const t = useTranslations("apiDocs")
  const id = useId()
  const body = parseRequestBody(value)
  const template = parseRequestBody(example)!
  const entryTemplate = (template.entries as RequestBody[] | undefined)?.[0]
  const entries = body?.entries
  const editableEntries = Array.isArray(entries) && entries.every(entry =>
    entry !== null && typeof entry === "object" && !Array.isArray(entry))

  if (pane === "json") {
    return (
      <div className="flex h-full min-h-0 min-w-0 flex-col gap-2">
        <div className="flex h-8 shrink-0 items-center justify-between gap-2">
          <h4 className="text-sm font-medium">{t("jsonEditor")}</h4>
          <Tooltip content={t("formatJson")}>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              isDisabled={!body}
              aria-label={t("formatJson")}
              onPress={() => onChange(JSON.stringify(body, null, 2))}
            >
              <WandSparkles size={14} />
            </Button>
          </Tooltip>
        </div>
        {!body && <p role="alert" className="text-sm text-danger">{t("invalidBodyJson")}</p>}
        <Textarea
          aria-label={t("jsonEditor")}
          value={value}
          onValueChange={onChange}
          minRows={1}
          spellCheck={false}
          isInvalid={!body}
          variant="bordered"
          className="min-h-0 flex-1"
          classNames={{
            base: "flex h-full min-h-0 flex-1 flex-col",
            inputWrapper: "h-full min-h-0 flex-1",
            input: "h-full font-mono text-xs",
          }}
        />
      </div>
    )
  }

  const fields = (sample: RequestBody, current: RequestBody, entryIndex?: number) => (
    <div className="flex flex-col gap-2">
      {Object.entries(sample).filter(([key]) => key !== "entries").map(([key, initial]) => {
        const present = Object.hasOwn(current, key)
        const fieldValue = current[key]
        const fieldId = `${id}-${entryIndex ?? "root"}-${key}`
        const options = choices[key] || (typeof initial === "boolean" ? ["false", "true"] : undefined)
        const compatible = !present || typeof fieldValue === typeof initial
        const setField = (next: unknown) => onChange(updateRequestBody(value, key, next, entryIndex))
        const selected = present ? String(fieldValue) : ""
        const selectOptions = options && selected && !options.includes(selected)
          ? [...options, selected]
          : options

        return (
          <div key={key} className={`flex min-w-0 items-center gap-2 ${present ? "" : "opacity-50"}`}>
            <span className="w-28 shrink-0 truncate font-mono text-xs text-default-600" title={key}>{key}</span>
            <div className="min-w-0 flex-1">
              {!compatible ? (
                <p className="text-xs text-warning-600">{t("editInJson")}</p>
              ) : selectOptions ? (
                <Select
                  id={fieldId}
                  size="sm"
                  variant="bordered"
                  aria-label={key}
                  placeholder="—"
                  selectedKeys={present ? [selected] : []}
                  isDisabled={!present}
                  className="w-full"
                  classNames={compactSelect}
                  renderValue={(items) => items.map((item) => item.textValue).join("")}
                  onSelectionChange={(keys) => {
                    const next = Array.from(keys)[0] as string | undefined
                    if (next == null) return
                    setField(typeof initial === "boolean" ? next === "true" : next)
                  }}
                >
                  {selectOptions.map(option => (
                    <SelectItem key={option} textValue={option}>{option}</SelectItem>
                  ))}
                </Select>
              ) : (
                <Input
                  id={fieldId}
                  size="sm"
                  variant="bordered"
                  aria-label={key}
                  type={typeof initial === "number" ? "number" : "text"}
                  value={present ? String(fieldValue) : ""}
                  placeholder={String(initial)}
                  isDisabled={!present}
                  autoComplete="off"
                  spellCheck={false}
                  classNames={compactInput}
                  onValueChange={(next) => {
                    if (typeof initial !== "number") setField(next)
                    else if (next === "") setField(undefined)
                    else if (Number.isFinite(Number(next))) setField(Number(next))
                  }}
                />
              )}
            </div>
            <Tooltip content={t("includeField", { field: key })} placement="left">
              <div className="flex shrink-0">
                <Switch
                  size="sm"
                  isSelected={present}
                  aria-label={t("includeField", { field: key })}
                  onValueChange={(include) => setField(include ? initial : undefined)}
                />
              </div>
            </Tooltip>
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-8 items-center justify-between gap-2">
        <h4 className="text-sm font-medium">{t("body")}</h4>
        <Tooltip content={t("resetExample")}>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            aria-label={t("resetExample")}
            onPress={() => onChange(example)}
          >
            <RotateCcw size={14} />
          </Button>
        </Tooltip>
      </div>

      {!body && <p role="alert" className="text-sm text-danger">{t("invalidBodyJson")}</p>}
      {body && (
        <div className="flex flex-col gap-3">
          {fields(template, body)}
          {entryTemplate && (
            <div className="flex flex-col gap-3">
              {editableEntries ? entries.map((entry, index) => (
                <Card key={index} shadow="none" className="border border-default-200">
                  <CardHeader className="px-3 py-2">
                    <span className="text-sm font-medium">{t("entryNumber", { number: index + 1 })}</span>
                    <Tooltip content={t("removeEntry")}>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="danger"
                        className="ml-auto"
                        aria-label={t("removeEntryNumber", { number: index + 1 })}
                        onPress={() => onChange(updateRequestBody(value, "entries", entries.filter((_, i) => i !== index)))}
                      >
                        <X size={14} />
                      </Button>
                    </Tooltip>
                  </CardHeader>
                  <CardBody className="px-3 pb-3 pt-0">
                    {fields(entryTemplate, entry as RequestBody, index)}
                  </CardBody>
                </Card>
              )) : <p className="text-sm text-warning-600">{t("editInJson")}</p>}
              {editableEntries && (
                <Button
                  size="sm"
                  variant="flat"
                  className="self-start"
                  startContent={<Plus size={14} />}
                  isDisabled={entries.length >= 500}
                  onPress={() => onChange(updateRequestBody(value, "entries", [...entries, {
                    ...entryTemplate, address: "", password: "", refreshToken: "", clientId: "",
                  }]))}
                >
                  {t("addEntry")}
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
