import type { NextRequest } from "next/server";

// A lightweight browser-context check, not proof of a human: scripts can forge these headers.
export function rejectNonBrowserRequest(request: Pick<NextRequest, "headers" | "nextUrl">): Response | null {
  const headers = request.headers;
  const mode = headers.get("Sec-Fetch-Mode");
  let allowed = headers.get("Sec-Fetch-Site") === "same-origin" &&
    headers.get("Sec-Fetch-Dest") === "empty" &&
    (mode === "cors" || mode === "same-origin");
  const origin = headers.get("Origin");
  if (origin) {
    try {
      const source = new URL(origin);
      // Host is preserved by our reverse proxy; nextUrl may contain the internal container host.
      const target = new URL(`${source.protocol}//${headers.get("Host") || request.nextUrl.host}`);
      allowed &&= (source.protocol === "https:" || source.protocol === "http:") && source.host === target.host;
    } catch { allowed = false; }
  }
  return allowed ? null : Response.json(
    { error: "Forbidden", message: "This endpoint only accepts same-origin browser requests. Use the backend API for programmatic access." },
    { status: 403, headers: { "Cache-Control": "no-store" } },
  );
}
