/**
 * Edge-compatible JWT utility using standard Web APIs (crypto.subtle, btoa, atob).
 * 100% compliant with Next.js Edge Proxy/Middleware, Node.js server, and Serverless functions.
 */

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role?: string;
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

export interface SignJwtInput {
  sub: string;
  email: string;
  role?: string;
  [key: string]: unknown;
}

const DEFAULT_SECRET =
  process.env.JWT_SECRET || "bridges-development-secret-change-in-production";

function base64UrlEncode(str: string): string {
  const base64 = btoa(str);
  return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return base64UrlEncode(binary);
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return atob(base64);
}

function base64UrlDecodeToBytes(str: string): Uint8Array {
  const binary = base64UrlDecode(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Signs a payload into an HS256 JWT string.
 *
 * @param payload - Data to embed in the token (must include sub and email)
 * @param expiresInSeconds - Token validity duration in seconds (default: 7 days)
 * @param secret - Optional secret override
 */
export async function signJwt(
  payload: SignJwtInput,
  expiresInSeconds = 60 * 60 * 24 * 7,
  secret = DEFAULT_SECRET
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JwtPayload = {
    ...payload,
    sub: payload.sub,
    email: payload.email,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

  const dataToSign = `${encodedHeader}.${encodedPayload}`;
  const key = await getCryptoKey(secret);
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(dataToSign)
  );

  const signature = base64UrlEncodeBytes(new Uint8Array(signatureBuffer));
  return `${dataToSign}.${signature}`;
}

/**
 * Verifies an HS256 JWT signature and validity period.
 * Returns the decoded payload or throws an Error if invalid.
 */
export async function verifyJwt(
  token: string,
  secret = DEFAULT_SECRET
): Promise<JwtPayload> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT token format");
  }

  const [encodedHeader, encodedPayload, signaturePart] = parts;
  const dataToVerify = `${encodedHeader}.${encodedPayload}`;

  const key = await getCryptoKey(secret);
  const signatureBytes = base64UrlDecodeToBytes(signaturePart);

  const isValid = await crypto.subtle.verify(
    "HMAC",
    key,
    signatureBytes as BufferSource,
    new TextEncoder().encode(dataToVerify)
  );

  if (!isValid) {
    throw new Error("Invalid token signature");
  }

  const payloadText = base64UrlDecode(encodedPayload);
  const payload: JwtPayload = JSON.parse(payloadText);
  const now = Math.floor(Date.now() / 1000);

  if (payload.exp && payload.exp < now) {
    throw new Error("Token has expired");
  }

  return payload;
}
