import { isIP } from "node:net";

// Enable only when the Web port is private and the ingress proxy overwrites X-Real-IP.
// Never forward a browser-supplied X-Forwarded-For chain or send client IPs to other providers.
export function forwardClientIP(incoming: Headers, outgoing: Headers, target: URL, configured: URL) {
  if (process.env.DUCKMAIL_TRUST_PROXY_HEADERS !== "true" || target.origin !== configured.origin) return;
  const ip = incoming.get("X-Real-IP")?.trim();
  if (!ip || !isIP(ip)) return;
  outgoing.set("X-Real-IP", ip);
  outgoing.set("X-Forwarded-For", ip);
}
