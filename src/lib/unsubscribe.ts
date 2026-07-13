import { createHmac } from "crypto";

const SECRET =
  process.env.NEXTAUTH_SECRET ?? "hairland-unsubscribe-fallback";

/** Generate an HMAC token for unsubscribe links. */
export function generateUnsubscribeToken(email: string): string {
  return createHmac("sha256", SECRET).update(email).digest("hex").slice(0, 32);
}

/** Verify an HMAC token for unsubscribe links. */
export function verifyUnsubscribeToken(
  email: string,
  token: string,
): boolean {
  const expected = generateUnsubscribeToken(email);
  return token === expected;
}

/** Build the full unsubscribe URL for an email. */
export function getUnsubscribeUrl(email: string): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.hairland.cz";
  const token = generateUnsubscribeToken(email);
  return `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
}
