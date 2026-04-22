import { adminStorage } from '../../lib/firebase-admin.js';

const FIREBASE_STORAGE_BUCKET = process.env.FIREBASE_STORAGE_BUCKET;

function getBucket() {
  const bucketName = FIREBASE_STORAGE_BUCKET || adminStorage.app.options.storageBucket;
  if (!bucketName) {
    throw new Error(
      'Firebase storage is not configured. Set FIREBASE_STORAGE_BUCKET to your bucket name.'
    );
  }
  return adminStorage.bucket(bucketName);
}

export async function generateUploadUrl(key, contentType, { expiresInSeconds = 15 * 60 } = {}) {
  const bucket = getBucket();
  const file = bucket.file(key);
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
  const [uploadUrl] = await file.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + expiresInSeconds * 1000,
    contentType,
  });
  return { uploadUrl, key, expiresAt };
}

export async function generateDownloadUrl(
  key,
  { expiresInSeconds = 60 * 60, fileName = '', contentType = 'application/octet-stream' } = {}
) {
  const bucket = getBucket();
  const file = bucket.file(key);
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
  const safeFileName = String(fileName || '').trim();
  const safeContentType = String(contentType || '').trim() || 'application/octet-stream';
  const [downloadUrl] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + expiresInSeconds * 1000,
    responseDisposition: safeFileName ? `attachment; filename="${safeFileName}"` : 'attachment',
    responseType: safeContentType,
  });
  return { downloadUrl, expiresAt };
}

export async function deleteFile(key) {
  const bucket = getBucket();
  const file = bucket.file(key);
  await file.delete({ ignoreNotFound: true });
}

export async function checkStorageHealth() {
  const bucket = getBucket();
  await bucket.getMetadata();
}
