import { initializeApp, type FirebaseOptions } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  OAuthProvider,
} from "firebase/auth";
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
export const linkedinProvider = new OAuthProvider("linkedin.com");

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

export const signInWithLinkedIn = async () => {
  try {
    linkedinProvider.addScopes(["r_liteprofile", "r_emailaddress"]);
    await signInWithPopup(auth, linkedinProvider);
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment") {
      await signInWithRedirect(auth, linkedinProvider);
      return;
    }

    if (import.meta.env.DEV) {
      console.error("Error signing in with LinkedIn", error);
    } else {
      console.error("Error signing in with LinkedIn");
    }
    throw error;
  }
};

export const signUpWithEmail = async (email: string, password: string, displayName: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;

    // Save user profile to Firestore
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        email: user.email,
        displayName: displayName,
        photoURL: null,
        createdAt: serverTimestamp(),
        authMethod: "email",
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
    if (import.meta.env.DEV) {
      console.error("Error signing up with email", error);
    }
    throw error;
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Error signing in with email", error);
    }
    throw error;
  }
};

export const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
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
