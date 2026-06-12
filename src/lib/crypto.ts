import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

let _key: Buffer | undefined;

function getKey(): Buffer {
  if (!_key) {
    const secret = process.env.API_KEY_ENCRYPTION_SECRET;
    if (!secret || !/^[0-9a-f]{64}$/i.test(secret)) {
      throw new Error(
        "API_KEY_ENCRYPTION_SECRET must be a 64-character hex string (32 bytes). " +
        "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
      );
    }
    _key = Buffer.from(secret, "hex");
  }
  return _key;
}

export function encryptApiKey(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("hex"), authTag.toString("hex"), ciphertext.toString("hex")].join(":");
}

export function decryptApiKey(stored: string): string {
  const [ivHex, authTagHex, ciphertextHex] = stored.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const ciphertext = Buffer.from(ciphertextHex, "hex");
  const decipher = createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
