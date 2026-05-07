import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../../');

function parseServiceAccountJson(rawJson) {
  try {
    return JSON.parse(rawJson);
  } catch (error) {
    throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_JSON. Ensure it is valid JSON.');
  }
}

function loadServiceAccountFromFile(filePath) {
  try {
    const rawFile = fs.readFileSync(filePath, 'utf8');
    return parseServiceAccountJson(rawFile);
  } catch (error) {
    throw new Error(`Unable to read Firebase service account file at ${filePath}`);
  }
}

function resolveServiceAccountPath(rawPath) {
  const input = String(rawPath || '').trim();
  if (!input) return '';

  // First: if it's already a real absolute path, use it.
  if (path.isAbsolute(input) && fs.existsSync(input)) {
    return input;
  }

  // Common local-dev case: env has "/file.json" but file is in repo root.
  if (input.startsWith('/')) {
    const projectRelative = path.resolve(REPO_ROOT, `.${input}`);
    if (fs.existsSync(projectRelative)) {
      return projectRelative;
    }
  }

  // Default: treat as repo-root-relative.
  return path.resolve(REPO_ROOT, input);
}

function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return parseServiceAccountJson(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const serviceAccountPath = resolveServiceAccountPath(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    return loadServiceAccountFromFile(serviceAccountPath);
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKeyRaw) {
    return {
      project_id: projectId,
      client_email: clientEmail,
      private_key: privateKeyRaw.replace(/\\n/g, '\n'),
    };
  }

  throw new Error(
    'Firebase Admin is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON, FIREBASE_SERVICE_ACCOUNT_PATH, or FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY.'
  );
}

function resolveStorageBucket(serviceAccount) {
  const explicitBucket =
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.FIREBASE_BUCKET ||
    process.env.GCLOUD_STORAGE_BUCKET;
  if (explicitBucket) {
    return explicitBucket;
  }

  const projectId =
    serviceAccount?.project_id ||
    process.env.FIREBASE_PROJECT_ID ||
    process.env.GCLOUD_PROJECT;
  if (!projectId) {
    return undefined;
  }

  // Default Firebase Storage bucket naming for most projects.
  return `${projectId}.appspot.com`;
}

let firebaseAdminApp;

if (!getApps().length) {
  const serviceAccount = loadServiceAccount();
  const storageBucket = resolveStorageBucket(serviceAccount);

  firebaseAdminApp = initializeApp({
    credential: cert(serviceAccount),
    storageBucket,
  });
} else {
  firebaseAdminApp = getApps()[0];
}

export const adminAuth = getAuth(firebaseAdminApp);
export const adminStorage = getStorage(firebaseAdminApp);
export { firebaseAdminApp };
