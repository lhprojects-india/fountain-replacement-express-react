import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

let firebaseAdminApp;

if (!getApps().length) {
  // Prefer JSON secret in hosted environments; fallback to local file path for development.
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
    : (() => {
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
          ? path.resolve(__dirname, '../../../../', process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
          : path.resolve(__dirname, '../../driver-onboarding-lh-firebase-adminsdk-fbsvc-51cf561c46.json');
        return require(serviceAccountPath);
      })();

  firebaseAdminApp = initializeApp({
    credential: cert(serviceAccount),
  });
} else {
  firebaseAdminApp = getApps()[0];
}

export const adminAuth = getAuth(firebaseAdminApp);
