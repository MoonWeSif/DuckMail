import { NextRequest, NextResponse } from "next/server";
const BASE =
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://api.duckmail.sbs";
async function handle(req: NextRequest) {
  const endpoint = req.nextUrl.searchParams.get("endpoint") || "";
  if (
    !/^\/(accounts|token|me|messages|sources|domains|mercure)(\/|\?|$)/.test(
      endpoint,
    ) ||
    endpoint.includes("\\")
  )
    return NextResponse.json({ message: "Invalid endpoint" }, { status: 400 });
  const configured = new URL(BASE);
  let base = BASE;
  if (req.headers.get("X-DuckMail-Hosted") !== "true") {
    const supplied = req.headers.get("X-API-Provider-Base-URL");
    if (supplied) {
      try {
        const target = new URL(supplied);
        const allowed = [
          configured.origin,
          "https://api.duckmail.sbs",
          "https://api.mail.tm",
          ...(process.env.DUCKMAIL_ALLOWED_API_ORIGINS || "")
            .split(",")
            .filter(Boolean),
        ];
        if (
          !allowed.includes(target.origin) ||
          target.username ||
          target.password
        )
          return NextResponse.json(
            { message: "管理员尚未允许此 API 来源" },
            { status: 400 },
          );
        // The browser's default DuckMail provider always uses the server-configured backend.
        base =
          target.origin === "https://api.duckmail.sbs" ||
          target.origin === configured.origin
            ? BASE
            : target.origin;
      } catch {
        return NextResponse.json(
          { message: "Invalid API origin" },
          { status: 400 },
        );
      }
    }
  }
  const url = new URL(endpoint, base);
  if (url.origin !== new URL(base).origin)
    return NextResponse.json({ message: "Invalid endpoint" }, { status: 400 });
  const headers = new Headers({
    Accept: "application/ld+json, application/json, */*",
  });
  for (const h of ["Authorization", "Content-Type", "Idempotency-Key"]) {
    const v = req.headers.get(h);
    if (v) headers.set(h, v);
  }
  try {
    const body = ["GET", "HEAD"].includes(req.method)
      ? undefined
      : await req.text();
    if (body && Buffer.byteLength(body) > 5 * 1024 * 1024)
      return NextResponse.json(
        { message: "Request too large" },
        { status: 413 },
      );
    const res = await fetch(url, {
      method: req.method,
      headers,
      body: body || undefined,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(30000),
    });
    const out = new Headers({ "Cache-Control": "no-store" });
    for (const h of [
      "Content-Type",
      "Content-Disposition",
      "Retry-After",
      "X-Content-Type-Options",
      "Content-Security-Policy",
    ]) {
      const v = res.headers.get(h);
      if (v) out.set(h, v);
    }
    return new Response(res.status === 204 ? null : res.body, {
      status: res.status,
      headers: out,
    });
  } catch {
    return NextResponse.json(
      { message: "邮箱服务暂时无法连接，请稍后重试" },
      { status: 502 },
    );
  }
}
export const GET = handle,
  POST = handle,
  PATCH = handle,
  DELETE = handle;
