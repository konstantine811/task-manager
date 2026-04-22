import {
  auth,
  db,
  FirebaseCollection,
  FirebaseCollectionProps,
  storage,
} from "@/config/firebase.config";

/** Firestore rejects undefined. Recursively strip undefined from objects/arrays. */
function stripUndefined<T>(val: T): T {
  if (val === undefined) {
    return val;
  }
  if (Array.isArray(val)) {
    return val
      .map((v) => stripUndefined(v))
      .filter((v) => v !== undefined) as T;
  }
  if (val !== null && typeof val === "object" && !(val instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) {
        const cleaned = stripUndefined(v);
        if (cleaned !== undefined) {
          out[k] = cleaned;
        }
      }
    }
    return out as T;
  }
  return val;
}
import {
  DailyTaskRecord,
  Items,
  ItemTaskCategory,
} from "@/types/drag-and-drop.model";
import { DailyJournal } from "@/types/daily-journal.model";
import { DailyTaskTimerSyncState } from "@/types/task-timer-sync.model";
import { parseDates } from "@/utils/date.util";
import { formatISO } from "date-fns";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  QueryDocumentSnapshot,
  setDoc,
  Unsubscribe,
  where,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";

export const saveTemplateTasks = async (items: Items) => {
  const user = await waitForUserAuth();
  if (!user) {
    console.warn("❌ Cannot save tasks. User not authenticated.");
    return;
  }

  const uid = user.uid;
  const ref = doc(db, FirebaseCollection.templateTasks, uid);

  try {
    const cleanItems = stripUndefined(items);
    await setDoc(ref, {
      updatedAt: new Date().toISOString(),
      email: user.email,
      items: cleanItems,
    });
    return;
  } catch (error) {
    console.error("🔥 Error saving tasks:", error);
  }
};

async function loadUserScopedDocument<T>(
  collectionName: FirebaseCollection,
): Promise<T | null> {
  const user = await waitForUserAuth();
  if (!user) return null;

  const ref = doc(db, collectionName, user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return snap.data().items as T;
  }

  return null;
}

export const saveDailyTasks = async <T>(
  items: T,
  date: string,
  collectionName: FirebaseCollection,
) => {
  const user = await waitForUserAuth();
  if (!user) {
    console.warn("❌ Cannot save tasks. User not authenticated.");
    return;
  }

  const uid = user.uid;
  const ref = doc(
    db,
    collectionName,
    uid,
    collectionName === FirebaseCollection.plannedTasks ||
      collectionName === FirebaseCollection.dailyTasks ||
      collectionName === FirebaseCollection.dailyAnalytics ||
      collectionName === FirebaseCollection.dailyJournal
      ? FirebaseCollectionProps[collectionName].days
      : "",
    date,
  );

  try {
    const cleanItems = stripUndefined(items);
    await setDoc(ref, {
      updatedAt: new Date().toISOString(),
      email: user.email,
      items: cleanItems,
    }, { merge: true });
  } catch (error) {
    console.error("🔥 Error saving tasks:", error);
  }
};

export interface DailyTaskDocSnapshot<T> {
  items: T | null;
  timerState: DailyTaskTimerSyncState | null;
}

export const saveDailyTaskTimerState = async (
  date: string,
  timerState: DailyTaskTimerSyncState | null,
) => {
  const user = await waitForUserAuth();
  if (!user) {
    console.warn("❌ Cannot sync timer. User not authenticated.");
    return;
  }

  const ref = doc(
    db,
    FirebaseCollection.dailyTasks,
    user.uid,
    FirebaseCollectionProps[FirebaseCollection.dailyTasks].days,
    date,
  );

  try {
    await setDoc(
      ref,
      {
        updatedAt: new Date().toISOString(),
        timerState: timerState ? stripUndefined(timerState) : null,
      },
      { merge: true },
    );
  } catch (error) {
    console.error("🔥 Error syncing timer state:", error);
  }
};

export const subscribeToDailyTasksByDate = async <T>(
  date: string,
  collectionName: FirebaseCollection,
  onUpdate: (data: DailyTaskDocSnapshot<T>) => void,
): Promise<Unsubscribe | undefined> => {
  const user = await waitForUserAuth();
  if (!user) return;

  const uid = user.uid;
  const ref = doc(
    db,
    collectionName,
    uid,
    collectionName === FirebaseCollection.plannedTasks ||
      collectionName === FirebaseCollection.dailyTasks ||
      collectionName === FirebaseCollection.dailyJournal
      ? FirebaseCollectionProps[collectionName].days
      : "",
    date,
  );

  const unsubscribe = onSnapshot(ref, (docSnap) => {
    if (!docSnap.exists()) {
      onUpdate({ items: null, timerState: null });
      return;
    }

    const data = docSnap.data();
    const rawTimerState = data.timerState as
      | Partial<DailyTaskTimerSyncState>
      | null
      | undefined;

    const timerState =
      rawTimerState &&
      typeof rawTimerState.taskId === "string" &&
      typeof rawTimerState.startedAt === "number" &&
      typeof rawTimerState.baseTimeDone === "number" &&
      typeof rawTimerState.updatedAt === "number"
        ? (rawTimerState as DailyTaskTimerSyncState)
        : null;

    onUpdate({
      items: (data.items as T | undefined) ?? null,
      timerState,
    });
  });

  return unsubscribe;
};

export const loadTemplateTasks = async (): Promise<Items | null> => {
  return loadUserScopedDocument<Items>(FirebaseCollection.templateTasks);
};

export const loadDailyTasksByDate = async <T>(
  date: string,
  collectionName: FirebaseCollection,
): Promise<T | null> => {
  const user = await waitForUserAuth();
  if (!user) return null;

  const uid = user.uid;
  const ref = doc(
    db,
    collectionName,
    uid,
    collectionName === FirebaseCollection.plannedTasks ||
      collectionName === FirebaseCollection.dailyTasks ||
      collectionName === FirebaseCollection.dailyJournal
      ? FirebaseCollectionProps[collectionName].days
      : "",
    date,
  );

  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data().items as T;
    }
    return null;
  } catch (error) {
    console.error("🔥 Error loading tasks:", error);
    return null;
  }
};

export const updatePlannedTasksOnServer = async (
  date: string,
  tasks: ItemTaskCategory[],
) => {
  const user = await waitForUserAuth();
  if (!user) throw new Error("User not authenticated");
  const ref = doc(
    db,
    FirebaseCollection.plannedTasks,
    user.uid,
    FirebaseCollectionProps[FirebaseCollection.plannedTasks].days,
    date,
  );

  await setDoc(ref, { items: stripUndefined(tasks) }, { merge: true });
};

export const subscribeToNonEmptyTaskDates = async <
  T extends Items | ItemTaskCategory[],
>(
  collectionType: FirebaseCollection,
  onUpdate: (dates: Date[]) => void,
): Promise<Unsubscribe | undefined> => {
  const user = await waitForUserAuth();
  if (!user) return;

  const uid = user.uid;
  const daysCollectionRef = collection(
    db,
    collectionType,
    uid,
    collectionType === FirebaseCollection.plannedTasks ||
      collectionType === FirebaseCollection.dailyTasks
      ? FirebaseCollectionProps[collectionType].days
      : "",
  );

  const unsubscribe = onSnapshot(daysCollectionRef, (querySnapshot) => {
    const validDates: string[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const items = data.items as T;
      if (items && items.length) {
        validDates.push(docSnap.id);
      }
    });
    onUpdate(parseDates(validDates));
  });

  return unsubscribe;
};

export const subscribeToNonEmptyJournalDates = async (
  onUpdate: (dates: Date[]) => void,
): Promise<Unsubscribe | undefined> => {
  const user = await waitForUserAuth();
  if (!user) return;

  const uid = user.uid;
  const daysCollectionRef = collection(
    db,
    FirebaseCollection.dailyJournal,
    uid,
    FirebaseCollectionProps[FirebaseCollection.dailyJournal].days,
  );

  const unsubscribe = onSnapshot(daysCollectionRef, (querySnapshot) => {
    const validDates: string[] = [];

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const journal = data.items as DailyJournal | undefined;
      if (journal?.content?.trim()) {
        validDates.push(docSnap.id);
      }
    });

    onUpdate(parseDates(validDates));
  });

  return unsubscribe;
};

export const subscribeToPlannedTasksWithCounts = async (
  onUpdate: (taskCountPerDate: Record<string, number>) => void,
): Promise<Unsubscribe | undefined> => {
  const user = await waitForUserAuth();
  if (!user) return;

  const uid = user.uid;
  const daysCollectionRef = collection(
    db,
    FirebaseCollection.plannedTasks,
    uid,
    FirebaseCollectionProps[FirebaseCollection.plannedTasks].days,
  );

  const unsubscribe = onSnapshot(daysCollectionRef, (querySnapshot) => {
    const counts: Record<string, number> = {};
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const items = data.items as ItemTaskCategory[];
      if (items && items.length) {
        counts[docSnap.id] = items.length;
      }
    });
    onUpdate(counts);
  });

  return unsubscribe;
};

export const fetchAllDailyTasks = async (): Promise<
  Array<{ date: string; items: Items }>
> => {
  const user = await waitForUserAuth();
  if (!user) return [];

  const uid = user.uid;
  const daysRef = collection(
    db,
    FirebaseCollection.dailyTasks,
    uid,
    FirebaseCollectionProps[FirebaseCollection.dailyTasks].days,
  );

  try {
    const snapshot = await getDocs(daysRef);
    return snapshot.docs
      .map((docSnap) => {
        const data = docSnap.data();
        const items = data.items as Items;
        if (!items || !Array.isArray(items)) return null;
        return { date: docSnap.id, items };
      })
      .filter((r): r is { date: string; items: Items } => r != null);
  } catch (error) {
    console.error("🔥 Error fetching daily tasks:", error);
    return [];
  }
};

export async function loadDailyTasksByRange(
  from: Date,
  to: Date,
): Promise<DailyTaskRecord[]> {
  const user = await waitForUserAuth();
  if (!user) throw new Error("User not authenticated");

  const uid = user.uid;
  const fromId = formatISO(from, { representation: "date" });
  const toId = formatISO(to, { representation: "date" });
  const daysRef = collection(
    db,
    FirebaseCollection.dailyTasks,
    uid,
    FirebaseCollectionProps[FirebaseCollection.dailyTasks].days,
  );

  const q = query(
    daysRef,
    where("__name__", ">=", fromId),
    where("__name__", "<=", toId),
  );

  const snapshot = await getDocs(q);

  const results: DailyTaskRecord[] = snapshot.docs.map(
    (docSnap: QueryDocumentSnapshot<DocumentData>) => ({
      date: docSnap.id,
      items: docSnap.data().items as Items,
    }),
  );

  return results;
}

const DAILY_JOURNAL_STORAGE_ROOT = "task-manager-chrono";

const guessImageExtByMimeType = (contentType: string): string => {
  const normalized = contentType.toLowerCase();
  if (normalized === "image/jpeg") return "jpg";
  if (normalized === "image/png") return "png";
  if (normalized === "image/webp") return "webp";
  if (normalized === "image/gif") return "gif";
  if (normalized === "image/bmp") return "bmp";
  if (normalized === "image/heic") return "heic";
  if (normalized === "image/heif") return "heif";
  if (normalized === "image/avif") return "avif";
  return "jpg";
};

const toHex = (buffer: ArrayBuffer): string => {
  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const hashFileBytes = async (file: File): Promise<string> => {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
  const fileBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", fileBuffer);
  return toHex(hashBuffer);
};

const extractImageUrlsFromMarkdown = (content: string): Set<string> => {
  const urls = new Set<string>();
  if (!content.trim()) return urls;

  const markdownImageRegex =
    /!\[[^\]]*]\(\s*(?:<([^>]+)>|([^\s)]+))(?:\s+["'][^"']*["'])?\s*\)/g;
  const htmlImageRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;

  for (const match of content.matchAll(markdownImageRegex)) {
    const candidate = (match[1] || match[2] || "").trim();
    if (candidate.startsWith("http://") || candidate.startsWith("https://") || candidate.startsWith("gs://")) {
      urls.add(candidate);
    }
  }

  for (const match of content.matchAll(htmlImageRegex)) {
    const candidate = (match[1] || "").trim();
    if (candidate) urls.add(candidate);
  }

  return urls;
};

const extractStorageObjectPathsFromMarkdown = (content: string): Set<string> => {
  const paths = new Set<string>();
  const urls = extractImageUrlsFromMarkdown(content);
  urls.forEach((url) => {
    const objectPath = extractStorageObjectPath(url);
    if (objectPath) {
      paths.add(objectPath);
    }
  });
  return paths;
};

const extractStorageObjectPath = (url: string): string | null => {
  if (!url) return null;
  if (url.startsWith("gs://")) {
    const slashIndex = url.indexOf("/", 5);
    if (slashIndex === -1) return null;
    return decodeURIComponent(url.slice(slashIndex + 1));
  }

  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "firebasestorage.googleapis.com") return null;
    const pathMatch = parsed.pathname.match(/\/o\/(.+)$/);
    if (!pathMatch?.[1]) return null;
    return decodeURIComponent(pathMatch[1]);
  } catch {
    return null;
  }
};

const isDailyJournalStoragePath = (
  objectPath: string,
  uid: string,
  date: string,
): boolean => {
  const nextPrefix = `${DAILY_JOURNAL_STORAGE_ROOT}/${uid}/daily-journal-images/${date}/`;
  const legacyPrefix = `${uid}/daily-journal-images/${date}/`;
  return objectPath.startsWith(nextPrefix) || objectPath.startsWith(legacyPrefix);
};

export const saveDailyJournal = async (date: string, journal: DailyJournal) => {
  const user = await waitForUserAuth();
  if (!user) {
    console.warn("❌ Cannot save journal. User not authenticated.");
    return;
  }

  const ref = doc(
    db,
    FirebaseCollection.dailyJournal,
    user.uid,
    FirebaseCollectionProps[FirebaseCollection.dailyJournal].days,
    date,
  );

  let previousContent = "";
  try {
    const previousSnap = await getDoc(ref);
    if (previousSnap.exists()) {
      previousContent =
        ((previousSnap.data().items as DailyJournal | undefined)?.content ?? "");
    }
  } catch (error) {
    console.warn("⚠️ Failed to load previous journal version before save:", error);
  }

  const cleanJournal = stripUndefined(journal);
  await setDoc(
    ref,
    {
      updatedAt: new Date().toISOString(),
      email: user.email,
      items: cleanJournal,
    },
    { merge: true },
  );

  const nextContent = cleanJournal?.content ?? "";
  const beforePaths = extractStorageObjectPathsFromMarkdown(previousContent);
  const afterPaths = extractStorageObjectPathsFromMarkdown(nextContent);
  const removedPaths = [...beforePaths].filter(
    (objectPath) =>
      !afterPaths.has(objectPath) &&
      isDailyJournalStoragePath(objectPath, user.uid, date),
  );

  if (!removedPaths.length) return;

  await Promise.allSettled(
    removedPaths.map(async (objectPath) => {
      try {
        await deleteObject(storageRef(storage, objectPath));
      } catch (error) {
        const code =
          typeof error === "object" && error !== null && "code" in error
            ? String((error as { code: unknown }).code)
            : "";
        if (code === "storage/object-not-found") return;
        console.warn("⚠️ Failed to delete removed journal image:", objectPath, error);
      }
    }),
  );
};

export const uploadDailyJournalImage = async (
  date: string,
  file: File,
): Promise<string> => {
  const user = await waitForUserAuth();
  if (!user) {
    throw new Error("User not authenticated");
  }

  const safeName = file.name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const ext = (safeName.split(".").pop() || "").toLowerCase();
  const guessedTypeByExt: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    bmp: "image/bmp",
    heic: "image/heic",
    heif: "image/heif",
    avif: "image/avif",
  };
  const contentType =
    file.type && file.type.startsWith("image/")
      ? file.type
      : guessedTypeByExt[ext] || "image/jpeg";

  const normalizedExt = ext || guessImageExtByMimeType(contentType);
  const fileHash = await hashFileBytes(file);
  const path = `${DAILY_JOURNAL_STORAGE_ROOT}/${user.uid}/daily-journal-images/${date}/${fileHash}.${normalizedExt}`;
  const fileRef = storageRef(storage, path);

  try {
    return await getDownloadURL(fileRef);
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code: unknown }).code)
        : "";
    if (code !== "storage/object-not-found") {
      throw error;
    }
  }

  await uploadBytes(fileRef, file, {
    contentType,
  });

  return getDownloadURL(fileRef);
};

export const loadDailyJournalByDate = async (
  date: string,
): Promise<DailyJournal | null> => {
  return loadDailyTasksByDate<DailyJournal>(
    date,
    FirebaseCollection.dailyJournal,
  );
};

const waitForUserAuth = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      resolve(user);
    });
  });
};
