import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

/**
 * AES-256-GCM for credentials Vera must be able to read back (WhatsApp grant tokens).
 * Format: base64url(iv).base64url(tag).base64url(ciphertext), versioned with "v1.".
 */
export function encrypt(plaintext: string, keyBase64: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(
    "aes-256-gcm",
    Buffer.from(keyBase64, "base64"),
    iv,
  );
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  return ["v1", iv, cipher.getAuthTag(), ciphertext]
    .map((part) =>
      typeof part === "string" ? part : part.toString("base64url"),
    )
    .join(".");
}

export function decrypt(payload: string, keyBase64: string): string {
  const [version, iv, tag, ciphertext] = payload.split(".");
  if (version !== "v1" || !iv || !tag || !ciphertext)
    throw new Error("Unsupported ciphertext");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    Buffer.from(keyBase64, "base64"),
    Buffer.from(iv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

/** Stable lookup key for personal identifiers (phone numbers) without storing them in clear. */
export function hashIdentifier(value: string, keyBase64: string): string {
  return createHmac("sha256", Buffer.from(keyBase64, "base64"))
    .update(value)
    .digest("hex");
}

export function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Constant-time check of Meta's X-Hub-Signature-256 over the raw request body. */
export function verifyMetaSignature(
  rawBody: Buffer,
  header: string | undefined,
  appSecret: string,
): boolean {
  if (!header?.startsWith("sha256=")) return false;
  const expected = Buffer.from(
    createHmac("sha256", appSecret).update(rawBody).digest("hex"),
  );
  const given = Buffer.from(header.slice("sha256=".length));
  return given.length === expected.length && timingSafeEqual(given, expected);
}
