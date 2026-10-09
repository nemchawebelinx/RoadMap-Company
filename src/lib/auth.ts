import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "./firebase";

const STORAGE_KEY = "webelinx-roadmap-state";

export type AuthError = { code: string; message: string };

function friendlyError(e: unknown): AuthError {
  const code =
    e && typeof e === "object" && "code" in e ? String((e as { code: unknown }).code) : "unknown";

  switch (code) {
    case "auth/admin-restricted-operation":
      return { code, message: "This Google account doesn't have access to this roadmap." };
    case "auth/popup-blocked":
      return { code, message: "The sign-in popup was blocked. Please allow popups for this site." };
    case "auth/unauthorized-domain":
      return {
        code,
        message:
          "This domain is not authorized for sign-in. Add it in Firebase Console → Authentication → Settings → Authorized domains.",
      };
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return { code, message: "" };
    default:
      return {
        code,
        message: e instanceof Error ? e.message : "Sign-in failed. Please try again.",
      };
  }
}

export async function signInWithGoogle(): Promise<{ ok: true } | { ok: false; error: AuthError }> {
  const auth = getFirebaseAuth();
  if (!auth) return { ok: false, error: { code: "no-auth", message: "Firebase is not configured." } };

  try {
    await setPersistence(auth, browserLocalPersistence);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    await signInWithPopup(auth, provider);
    return { ok: true };
  } catch (e) {
    const error = friendlyError(e);
    if (!error.message) return { ok: true }; // user dismissed — not a real error
    return { ok: false, error };
  }
}

export async function signOutUser(): Promise<void> {
  const auth = getFirebaseAuth();
  if (auth) await signOut(auth);
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function subscribeToAuth(cb: (user: User | null) => void): () => void {
  const auth = getFirebaseAuth();
  if (!auth) {
    cb(null);
    return () => {};
  }
  return onAuthStateChanged(auth, cb);
}

export type { User };
