// PIN hashing helper — the PIN is never stored as plain text.
// We salt + SHA-256 hash it so the database only ever holds a hash.
// crypto.subtle is async so all callers use await.

const PIN_SALT = "krishimitra-pin-salt-v1";

export async function hashPin(pin: string): Promise<string> {
  const salted = `${PIN_SALT}:${pin.trim()}`;
  const data = new TextEncoder().encode(salted);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function isValidPin(pin: string): boolean {
  return /^\d{4,6}$/.test(pin.trim());
}

export function normalizePhone(phone: string): string {
  const clean = phone.replace(/\D/g, "");
  return clean.length === 10 ? `+91${clean}` : phone.trim();
}