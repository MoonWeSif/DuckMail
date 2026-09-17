export type RequestBody = Record<string, unknown>

export function parseRequestBody(text: string): RequestBody | null {
  try {
    const value = JSON.parse(text)
    return value !== null && typeof value === "object" && !Array.isArray(value) ? value : null
  } catch {
    return null
  }
}

// Always edit the current JSON, preserving fields that are only exposed in JSON mode.
export function updateRequestBody(text: string, field: string, value: unknown, entryIndex?: number): string {
  const body = parseRequestBody(text)
  if (!body) return text
  const target = entryIndex === undefined ? body : (body.entries as RequestBody[])[entryIndex]
  const updated = { ...target, [field]: value }
  if (value === undefined) delete updated[field]
  const next = entryIndex === undefined
    ? updated
    : { ...body, entries: (body.entries as RequestBody[]).map((entry, index) => index === entryIndex ? updated : entry) }
  return JSON.stringify(next, null, 2)
}
