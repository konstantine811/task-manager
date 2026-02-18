import {
  auth,
  db,
  FirebaseCollection,
  FirebaseCollectionProps,
} from "@/config/firebase.config";

/** Firestore rejects undefined. Recursively strip undefined from objects/arrays. */
function stripUndefined<T>(val: T): T {
  if (val === undefined) {
    return val;
  }
  if (Array.isArray(val)) {
    return val.map((v) => stripUndefined(v)).filter((v) => v !== undefined) as T;
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

export const saveDailyTasks = async <T>(
  items: T,
  date: string,
  collectionName: FirebaseCollection
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
      collectionName === FirebaseCollection.dailyAnalytics
      ? FirebaseCollectionProps[collectionName].days
      : "",
    date
  );

  try {
    const cleanItems = stripUndefined(items);
    await setDoc(ref, {
      updatedAt: new Date().toISOString(),
      email: user.email,
      items: cleanItems,
    });
  } catch (error) {
    console.error("🔥 Error saving tasks:", error);
  }
};

export const loadTemplateTasks = async (): Promise<Items | null> => {
  const user = await waitForUserAuth();
  if (!user) return null;

  const ref = doc(db, FirebaseCollection.templateTasks, user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return snap.data().items as Items;
  }
  return null;
};

export const loadDailyTasksByDate = async <T>(
  date: string,
  collectionName: FirebaseCollection
): Promise<T | null> => {
  const user = await waitForUserAuth();
  if (!user) return null;

  const uid = user.uid;
  const ref = doc(
    db,
    collectionName,
    uid,
    collectionName === FirebaseCollection.plannedTasks ||
      collectionName === FirebaseCollection.dailyTasks
      ? FirebaseCollectionProps[collectionName].days
      : "",
    date
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
  tasks: ItemTaskCategory[]
) => {
  const user = await waitForUserAuth();
  if (!user) throw new Error("User not authenticated");
  const ref = doc(
    db,
    FirebaseCollection.plannedTasks,
    user.uid,
    FirebaseCollectionProps[FirebaseCollection.plannedTasks].days,
    date
  );

  await setDoc(ref, { items: stripUndefined(tasks) }, { merge: true });
};

export const subscribeToNonEmptyTaskDates = async <
  T extends Items | ItemTaskCategory[]
>(
  collectionType: FirebaseCollection,
  onUpdate: (dates: Date[]) => void
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
      : ""
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

export const subscribeToPlannedTasksWithCounts = async (
  onUpdate: (taskCountPerDate: Record<string, number>) => void
): Promise<Unsubscribe | undefined> => {
  const user = await waitForUserAuth();
  if (!user) return;

  const uid = user.uid;
  const daysCollectionRef = collection(
    db,
    FirebaseCollection.plannedTasks,
    uid,
    FirebaseCollectionProps[FirebaseCollection.plannedTasks].days
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

export const fetchAllDailyTasks = async (): Promise<Array<{ date: string; items: Items }>> => {
  const user = await waitForUserAuth();
  if (!user) return [];

  const uid = user.uid;
  const daysRef = collection(
    db,
    FirebaseCollection.dailyTasks,
    uid,
    FirebaseCollectionProps[FirebaseCollection.dailyTasks].days
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
  to: Date
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
    FirebaseCollectionProps[FirebaseCollection.dailyTasks].days
  );

  const q = query(
    daysRef,
    where("__name__", ">=", fromId),
    where("__name__", "<=", toId)
  );

  const snapshot = await getDocs(q);

  const results: DailyTaskRecord[] = snapshot.docs.map(
    (docSnap: QueryDocumentSnapshot<DocumentData>) => ({
      date: docSnap.id,
      items: docSnap.data().items as Items,
    })
  );

  return results;
}

const waitForUserAuth = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      resolve(user);
    });
  });
};
