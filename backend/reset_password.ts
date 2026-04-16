import admin from "firebase-admin";
import dotenv from "dotenv";
import path from "path";

// ✅ FIXED PATH: Looking for .env in the current 'backend' directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

async function resetPassword(email: string, newPassword: string) {
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().updateUser(user.uid, {
      password: newPassword,
    });
    console.log(`✅ Successfully reset password for ${email}`);
    process.exit(0);
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      console.error(`❌ User ${email} not found in Firebase Auth.`);
    } else {
      console.error("❌ Error resetting password:", error.message);
    }
    process.exit(1);
  }
}

// ✅ UPDATED PASSWORD
const NEW_PASSWORD = "Ashutosh@71";
resetPassword("raia40094@gmail.com", NEW_PASSWORD);
