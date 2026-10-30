import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "./firebase";
import { normalizeProjectState } from "./schema";
import { ProjectState } from "./types";

const COLLECTION = "roadmap-company";
const DOC_ID = "default";

export type SaveResult =
  | { ok: true }
  | { ok: false; denied: boolean; error: string };

const WRITE_DENIED_MESSAGE =
  "You don't have permission to save changes to this roadmap. Contact an admin(nemanjapetrasinovic@webelinx.com) to request edit permission.";

export type LoadResult =
  | { ok: true; state: ProjectState | null }
  | { ok: false; denied: boolean; error: string };

function errorCode(e: unknown): string {
  if (!e || typeof e !== "object" || !("code" in e)) return "";
  return String((e as { code: unknown }).code);
}

function message(e: unknown): string {
  if (isDenied(e)) {
    return "Access denied. Your account is not authorized to access this roadmap.";
  }
  return e instanceof Error ? e.message : String(e);
}

// FirebaseError resets the prototype, so instanceof FirestoreError is false
// for real permission-denied errors.
function isDenied(e: unknown): boolean {
  const code = errorCode(e);
  return code === "permission-denied" || code === "firestore/permission-denied";
}

export async function saveToFirestore(state: ProjectState): Promise<SaveResult> {
  if (!isFirebaseConfigured()) {
    return { ok: false, denied: false, error: "Firebase credentials are missing!" };
  }
  const db = getFirebaseDb();
  if (!db) return { ok: false, denied: false, error: "Firebase failed to initialize" };
  try {
    await setDoc(doc(db, COLLECTION, DOC_ID), {
      ...JSON.parse(JSON.stringify(state)),
      updatedAt: serverTimestamp(),
    });
    return { ok: true };
  } catch (e) {
    console.error("Firestore save failed:", e);
    const denied = isDenied(e);
    return { ok: false, denied, error: denied ? WRITE_DENIED_MESSAGE : message(e) };
  }
}

export async function loadFromFirestore(): Promise<LoadResult> {
  if (!isFirebaseConfigured()) return { ok: true, state: null };
  const db = getFirebaseDb();
  if (!db) return { ok: false, denied: false, error: "Firebase failed to initialize" };
  try {
    const snap = await getDoc(doc(db, COLLECTION, DOC_ID));
    if (snap.exists()) return { ok: true, state: normalizeProjectState(snap.data()) };
    return { ok: true, state: null };
  } catch (e) {
    console.error("Firestore load failed:", e);
    return { ok: false, denied: isDenied(e), error: message(e) };
  }
}
