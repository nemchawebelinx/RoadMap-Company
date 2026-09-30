import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "./firebase";
import { normalizeProjectState } from "./schema";
import { ProjectState } from "./types";

const COLLECTION = "roadmap-company";
const DOC_ID = "default";

export type SaveResult = { ok: true } | { ok: false; error: string };

function message(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
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

export async function loadFromFirestore(): Promise<ProjectState | null> {
  if (!isFirebaseConfigured()) return null;
  const db = getFirebaseDb();
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, COLLECTION, DOC_ID));
    if (snap.exists()) return normalizeProjectState(snap.data());
    return null;
  } catch (e) {
    console.error("Firestore load failed:", e);
    return null;
  }
}
