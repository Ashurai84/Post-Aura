import admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import dotenv from "dotenv";


dotenv.config();

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

if (!admin.apps.length) {
  if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
  } else {
    console.warn("Firebase Admin SDK not fully configured. Check backend/.env");
  }
}

export function getAdminAuth(): admin.auth.Auth {
  if (!admin.apps.length) {
    throw new Error(
      "Firebase Admin SDK not initialized. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in backend/.env"
    );
  }
  return admin.auth();
}

export function getAdminDb(): admin.firestore.Firestore {
  if (!admin.apps.length) {
    throw new Error(
      "Firebase Admin SDK not initialized. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in backend/.env"
    );
  }
  return admin.firestore();
}

export { FieldValue };
