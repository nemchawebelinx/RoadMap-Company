import { doc, getDoc, setDoc } from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "./firebase";
import { ProjectState } from "./types";

const COLLECTION = "projects";
const DOC_ID = "default";

export async function saveToFirestore(state: ProjectState): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;
  const db = getFirebaseDb();
  if (!db) return false;
  try {
    await setDoc(doc(db, COLLECTION, DOC_ID), JSON.parse(JSON.stringify(state)));
    return true;
  } catch (e) {
    console.error("Firestore save failed:", e);
    return false;
  }
}

export async function loadFromFirestore(): Promise<ProjectState | null> {
  if (!isFirebaseConfigured()) return null;
  const db = getFirebaseDb();
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, COLLECTION, DOC_ID));
    if (snap.exists()) return snap.data() as ProjectState;
    return null;
  } catch (e) {
    console.error("Firestore load failed:", e);
    return null;
  }
}
