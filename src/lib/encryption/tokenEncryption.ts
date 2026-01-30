import { createCipheriv, createDecipheriv, randomBytes, scrypt } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

function getEncryptionKey(): string {
  const key = import.meta.env.TOKEN_ENCRYPTION_KEY;
  if (!key) {
    throw new Error("TOKEN_ENCRYPTION_KEY environment variable is not set");
  }
  if (key.length < 32) {
    throw new Error("TOKEN_ENCRYPTION_KEY must be at least 32 characters long");
  }
  return key;
}

async function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  const derived = (await scryptAsync(password, salt as unknown as string, 32)) as Buffer;
  return derived;
}

export async function encryptToken(token: string): Promise<string> {
  try {
    const password = getEncryptionKey();
    const salt = randomBytes(SALT_LENGTH);
    const key = await deriveKey(password, salt);
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);

    const encrypted1 = cipher.update(token, "utf8");
    const encrypted2 = cipher.final();
    const encrypted = Buffer.concat([encrypted1, encrypted2]);
    const tag = cipher.getAuthTag();

    const result = Buffer.concat([salt, iv, tag, encrypted]);
    return result.toString("base64");
  } catch (error) {
    throw new Error(`Failed to encrypt token: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function decryptToken(encryptedToken: string): Promise<string> {
  try {
    const password = getEncryptionKey();
    const data = Buffer.from(encryptedToken, "base64");

    const salt = Buffer.from(data.subarray(0, SALT_LENGTH));
    const iv = Buffer.from(data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH));
    const tag = Buffer.from(data.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH));
    const encrypted = Buffer.from(data.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH));

    const key = await deriveKey(password, salt);
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag as unknown as Buffer);

    const decrypted1 = decipher.update(encrypted);
    const decrypted2 = decipher.final();
    const decryptedArray = new Uint8Array(decrypted1.length + decrypted2.length);
    decryptedArray.set(decrypted1);
    decryptedArray.set(decrypted2, decrypted1.length);
    const decrypted = Buffer.from(decryptedArray);

    return decrypted.toString("utf8");
  } catch (error) {
    throw new Error(`Failed to decrypt token: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
