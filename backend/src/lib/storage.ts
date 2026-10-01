import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const STORAGE_PREFIXES = {
  MENTOR_AVATARS: "avatars/mentors",
  USER_AVATARS: "avatars/users",
  DOCUMENTS: "documents",
  ATTACHMENTS: "attachments",
} as const;

export type StoragePrefix =
  (typeof STORAGE_PREFIXES)[keyof typeof STORAGE_PREFIXES];

let s3ClientInstance: S3Client | null = null;

/**
 * Checks whether Cloudflare R2 environment variables are configured.
 */
export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME
  );
}

/**
 * Lazily initializes and returns the S3/R2 client.
 */
export function getStorageClient(): S3Client {
  if (s3ClientInstance) {
    return s3ClientInstance;
  }

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Missing Cloudflare R2 credentials (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY). Please set them in your environment."
    );
  }

  s3ClientInstance = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return s3ClientInstance;
}

/**
 * Resolves the public CDN / bucket URL for a given object key.
 */
export function getPublicUrl(key: string): string {
  const publicBaseUrl =
    process.env.R2_PUBLIC_URL ||
    `https://${process.env.R2_BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

  const cleanBase = publicBaseUrl.replace(/\/+$/, "");
  const cleanKey = key.replace(/^\/+/, "");
  return `${cleanBase}/${cleanKey}`;
}

export interface UploadFileInput {
  buffer: Buffer | Uint8Array;
  key: string;
  contentType: string;
  metadata?: Record<string, string>;
}

/**
 * Uploads a file buffer directly to Cloudflare R2 and returns its public URL.
 */
export async function uploadFile({
  buffer,
  key,
  contentType,
  metadata,
}: UploadFileInput): Promise<{ key: string; publicUrl: string }> {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) {
    throw new Error("R2_BUCKET_NAME is not defined in environment variables.");
  }

  const client = getStorageClient();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      Metadata: metadata,
    })
  );

  return {
    key,
    publicUrl: getPublicUrl(key),
  };
}

export interface PresignedUploadUrlInput {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}

export interface PresignedUploadUrlResult {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

/**
 * Generates a presigned URL allowing the client (mobile app or browser)
 * to directly PUT an object into Cloudflare R2, bypassing server bandwidth limits.
 */
export async function generatePresignedUploadUrl({
  key,
  contentType,
  expiresInSeconds = 300,
}: PresignedUploadUrlInput): Promise<PresignedUploadUrlResult> {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) {
    throw new Error("R2_BUCKET_NAME is not defined in environment variables.");
  }

  const client = getStorageClient();

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: expiresInSeconds,
  });

  return {
    uploadUrl,
    publicUrl: getPublicUrl(key),
    key,
  };
}

/**
 * Deletes an object from Cloudflare R2 by key.
 */
export async function deleteFile(key: string): Promise<boolean> {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) {
    throw new Error("R2_BUCKET_NAME is not defined in environment variables.");
  }

  const client = getStorageClient();
  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );

  return true;
}
