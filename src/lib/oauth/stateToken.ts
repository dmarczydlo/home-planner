import { createHmac, randomBytes } from "crypto";

const STATE_TOKEN_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const NONCE_LENGTH = 16;

interface StateTokenPayload {
  userId: string;
  timestamp: number;
  nonce: string;
  returnPath?: string;
}

function getStateSecret(): string {
  const secret = import.meta.env.OAUTH_STATE_SECRET;
  if (!secret) {
    throw new Error("OAUTH_STATE_SECRET environment variable is not set");
  }
  return secret;
}

function signToken(payload: StateTokenPayload): string {
  const secret = getStateSecret();
  const payloadJson = JSON.stringify(payload);
  const hmac = createHmac("sha256", secret);
  hmac.update(payloadJson);
  const signature = hmac.digest("hex");
  return `${Buffer.from(payloadJson).toString("base64")}.${signature}`;
}

function verifyToken(token: string): StateTokenPayload | null {
  try {
    const secret = getStateSecret();
    const [payloadBase64, signature] = token.split(".");
    if (!payloadBase64 || !signature) {
      return null;
    }

    const payloadJson = Buffer.from(payloadBase64, "base64").toString("utf8");
    const hmac = createHmac("sha256", secret);
    hmac.update(payloadJson);
    const expectedSignature = hmac.digest("hex");

    if (signature !== expectedSignature) {
      return null;
    }

    return JSON.parse(payloadJson) as StateTokenPayload;
  } catch {
    return null;
  }
}

export function generateStateToken(userId: string, returnPath?: string): string {
  const payload: StateTokenPayload = {
    userId,
    timestamp: Date.now(),
    nonce: randomBytes(NONCE_LENGTH).toString("hex"),
    returnPath,
  };
  return signToken(payload);
}

export function validateStateToken(state: string): { userId: string; returnPath?: string; valid: boolean } {
  const payload = verifyToken(state);
  if (!payload) {
    return { userId: "", valid: false };
  }

  const now = Date.now();
  const age = now - payload.timestamp;
  if (age > STATE_TOKEN_EXPIRY_MS) {
    return { userId: "", valid: false };
  }

  if (age < 0) {
    return { userId: "", valid: false };
  }

  return { userId: payload.userId, returnPath: payload.returnPath, valid: true };
}
