import { initializeApp, type FirebaseOptions } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp, setLogLevel } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

function getFirebaseWebConfig(): FirebaseOptions {
  const {
    VITE_FIREBASE_API_KEY,
    VITE_FIREBASE_AUTH_DOMAIN,
    VITE_FIREBASE_PROJECT_ID,
    VITE_FIREBASE_STORAGE_BUCKET,
    VITE_FIREBASE_MESSAGING_SENDER_ID,
    VITE_FIREBASE_APP_ID,
    VITE_FIREBASE_MEASUREMENT_ID,
  } = import.meta.env;

  if (!VITE_FIREBASE_API_KEY || !VITE_FIREBASE_AUTH_DOMAIN || !VITE_FIREBASE_PROJECT_ID) {
    throw new Error(
      "Firebase web config missing. Copy frontend/.env.example → frontend/.env and set VITE_FIREBASE_* (see README). Never commit .env."
    );
  }

  return {
    apiKey: VITE_FIREBASE_API_KEY,
    authDomain: VITE_FIREBASE_AUTH_DOMAIN,
    projectId: VITE_FIREBASE_PROJECT_ID,
    storageBucket: VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: VITE_FIREBASE_APP_ID,
    measurementId: VITE_FIREBASE_MEASUREMENT_ID || undefined,
  };
}

const firebaseConfig = getFirebaseWebConfig();
const app = initializeApp(firebaseConfig);
const firestoreDbId = import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || "(default)";

export const db = getFirestore(app, firestoreDbId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

if (!import.meta.env.DEV) {
  setLogLevel("silent");
}

if (typeof window !== "undefined" && import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) {
  isSupported().then((ok) => {
    if (ok) getAnalytics(app);
  });
}

export const signInWithGoogle = async () => {
  try {
    // Prefer popup flow so auth doesn't depend on Firebase redirect helper hosting.
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    const code = (error as { code?: string })?.code;
    // Fallback to redirect where popup auth is blocked or unsupported.
    if (code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment") {
      await signInWithRedirect(auth, googleProvider);
      return;
    }

    if (import.meta.env.DEV) {
      console.error("Error signing in with Google", error);
    } else {
      console.error("Error signing in with Google");
    }
    throw error;
  }
};

export const handleRedirectResult = async () => {
  try {
    // ✅ SECURITY: Clean up URL after redirect to remove exposed API key from browser history
    if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
      window.history.replaceState({}, document.title, window.location.origin + window.location.pathname);
    }

    const result = await getRedirectResult(auth);
    
    // ✅ SECURITY: Clear sensitive query parameters after successful auth
    if (result && typeof window !== "undefined") {
      window.history.replaceState({}, document.title, window.location.origin + window.location.pathname);
    }

    if (!result) return null;
    const user = result.user;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
        freeGenerationsUsed: 0,
        isPro: false,
        planType: "free",
        planActivatedAt: null,
        planExpiresAt: null,
        instamojoPaymentId: null,
      });
    }

    return user;
  } catch (error) {
    // ✅ SECURITY: Clean URL on error too
    if (typeof window !== "undefined") {
      window.history.replaceState({}, document.title, window.location.origin + window.location.pathname);
    }
    
    if (import.meta.env.DEV) {
      console.error("Error handling redirect result", error);
    } else {
      console.error("Error handling redirect result");
    }
    throw error;
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Error signing out", error);
    } else {
      console.error("Error signing out");
    }
    throw error;
  }
};
