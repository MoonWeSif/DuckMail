export const HOSTED_AUTH_REQUIRED = "hosted-auth-required";

export function requestHostedRelogin(address: string) {
  if (typeof window === "undefined" || !address) return;
  window.dispatchEvent(
    new CustomEvent(HOSTED_AUTH_REQUIRED, { detail: { address } }),
  );
}
