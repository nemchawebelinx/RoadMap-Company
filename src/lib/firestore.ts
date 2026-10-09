import { doc, getDoc, serverTimestamp, setDoc, FirestoreError } from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "./firebase";
import { normalizeProjectState } from "./schema";
import { ProjectState } from "./types";

const COLLECTION = "roadmap-company";
const DOC_ID = "default";

export type SaveResult = { ok: true } | { ok: false; error: string };

export type LoadResult =
  | { ok: true; state: ProjectState | null }
  | { ok: false; denied: boolean; error: string };

function message(e: unknown): string {
  if (e instanceof FirestoreError && e.code === "permission-denied") {
    return "Access denied. Your account is not authorized to access this roadmap.";
  }
  return e instanceof Error ? e.message : String(e);
}

function isDenied(e: unknown): boolean {
  return e instanceof FirestoreError && e.code === "permission-denied";
}

export async function saveToFirestore(state: ProjectState): Promise<SaveResult> {
  if (!isFirebaseConfigured()) {
    return { ok: false, error: "Firebase env vars are missing (.env.local)" };
  }
  const db = getFirebaseDb();
  if (!db) return { ok: false, error: "Firebase failed to initialize" };
  try {
    await setDoc(doc(db, COLLECTION, DOC_ID), {
      ...JSON.parse(JSON.stringify(state)),
      updatedAt: serverTimestamp(),
    });
    return { ok: true };
  } catch (e) {
    console.error("Firestore save failed:", e);
    return { ok: false, error: message(e) };
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
