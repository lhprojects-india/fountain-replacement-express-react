import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const S3_BUCKET = process.env.S3_BUCKET;
const S3_REGION = process.env.S3_REGION || 'auto';
const S3_ENDPOINT = process.env.S3_ENDPOINT;
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;

let s3Client = null;

function assertStorageConfigured() {
  if (!S3_BUCKET || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) {
    throw new Error('S3 storage is not configured. Missing required environment variables.');
  }
}

function getS3Client() {
  if (s3Client) return s3Client;
  assertStorageConfigured();

  s3Client = new S3Client({
    region: S3_REGION,
    endpoint: S3_ENDPOINT || undefined,
    credentials: {
      accessKeyId: S3_ACCESS_KEY_ID,
      secretAccessKey: S3_SECRET_ACCESS_KEY,
    },
    forcePathStyle: Boolean(S3_ENDPOINT),
  });

  return s3Client;
}

export async function generateUploadUrl(key, contentType, { expiresInSeconds = 15 * 60 } = {}) {
  const client = getS3Client();
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  return { uploadUrl, key, expiresAt };
}

export async function generateDownloadUrl(
  key,
  { expiresInSeconds = 60 * 60, fileName = '', contentType = 'application/octet-stream' } = {}
) {
  const client = getS3Client();
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
  const safeFileName = String(fileName || '').trim();
  const safeContentType = String(contentType || '').trim() || 'application/octet-stream';

  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ResponseContentDisposition: safeFileName
      ? `attachment; filename="${safeFileName}"`
      : 'attachment',
    ResponseContentType: safeContentType,
  });

  const downloadUrl = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  return { downloadUrl, expiresAt };
}

export async function deleteFile(key) {
  const client = getS3Client();
  const command = new DeleteObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });
  await client.send(command);
}

export async function checkStorageHealth() {
  const client = getS3Client();
  const command = new HeadBucketCommand({ Bucket: S3_BUCKET });
  await client.send(command);
}
