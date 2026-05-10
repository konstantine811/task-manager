import { auth, db } from "@/config/firebase.config";
import type { ItemTask } from "@/types/drag-and-drop.model";
import type { User } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

export type SocialVisibility = "private" | "friends" | "public";
export type SocialPriority = "low" | "medium" | "high";

export type SocialProfile = {
  uid: string;
  email: string | null;
  emailLower: string | null;
  displayName: string;
  photoURL: string | null;
  visibility: SocialVisibility;
  showOnMap: boolean;
  trackCurrentLocation: boolean;
  city: string;
  focusStatus: string;
  activeTaskTitle: string;
  showTaskTitle: boolean;
  priority: SocialPriority;
  locationLat: number | null;
  locationLng: number | null;
  updatedAt?: unknown;
  createdAt?: unknown;
};

export type SocialProfileUpdate = Pick<
  SocialProfile,
  | "displayName"
  | "visibility"
  | "showOnMap"
  | "trackCurrentLocation"
  | "city"
  | "locationLat"
  | "locationLng"
> & {
  showTaskTitle: boolean;
};

export type FriendRequest = {
  fromUid: string;
  toUid: string;
  fromEmail: string | null;
  toEmail: string | null;
  status: "pending" | "accepted" | "declined";
};

const SOCIAL_PROFILES_COLLECTION = "socialProfiles";
const FRIEND_REQUESTS_COLLECTION = "friendRequests";

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const getFallbackName = (user: User) =>
  user.displayName?.trim() || user.email?.split("@")[0] || "Life Focus user";

export const buildDefaultSocialProfile = (user: User): SocialProfile => ({
  uid: user.uid,
  email: user.email,
  emailLower: user.email ? normalizeEmail(user.email) : null,
  displayName: getFallbackName(user),
  photoURL: user.photoURL,
  visibility: "private",
  showOnMap: false,
  trackCurrentLocation: false,
  city: "",
  focusStatus: "Не в фокус-сесії",
  activeTaskTitle: "",
  showTaskTitle: false,
  priority: "medium",
  locationLat: null,
  locationLng: null,
});

export async function ensureSocialProfile(user: User): Promise<SocialProfile> {
  const profileRef = doc(db, SOCIAL_PROFILES_COLLECTION, user.uid);
  const snap = await getDoc(profileRef);

  if (snap.exists()) {
    const data = snap.data() as SocialProfile;
    return {
      ...buildDefaultSocialProfile(user),
      ...data,
      photoURL: user.photoURL || data.photoURL || null,
    };
  }

  const profile = buildDefaultSocialProfile(user);
  await setDoc(profileRef, {
    ...profile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return profile;
}

export async function saveSocialProfile(
  user: User,
  update: SocialProfileUpdate,
): Promise<void> {
  await setDoc(
    doc(db, SOCIAL_PROFILES_COLLECTION, user.uid),
    {
      ...update,
      uid: user.uid,
      email: user.email,
      emailLower: user.email ? normalizeEmail(user.email) : null,
      displayName: update.displayName || getFallbackName(user),
      photoURL: user.photoURL,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export type SocialFocusSource = "timer" | "lastDone" | "idle";

export async function syncSocialFocusFromTask(
  task: ItemTask | null,
  source: SocialFocusSource,
): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  const focusStatus =
    source === "timer"
      ? "У фокус-сесії"
      : source === "lastDone"
        ? "Остання виконана задача"
        : "Не в фокус-сесії";

  await setDoc(
    doc(db, SOCIAL_PROFILES_COLLECTION, user.uid),
    {
      uid: user.uid,
      email: user.email,
      emailLower: user.email ? normalizeEmail(user.email) : null,
      displayName: getFallbackName(user),
      photoURL: user.photoURL,
      focusStatus,
      activeTaskTitle: task?.title ?? "",
      priority: task?.priority ?? "medium",
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function loadPublicMapProfiles(): Promise<SocialProfile[]> {
  const profilesQuery = query(
    collection(db, SOCIAL_PROFILES_COLLECTION),
    where("visibility", "==", "public"),
    where("showOnMap", "==", true),
    limit(40),
  );
  const snap = await getDocs(profilesQuery);
  return snap.docs.map((profileDoc) => profileDoc.data() as SocialProfile);
}

export async function findPublicProfileByEmail(
  email: string,
): Promise<SocialProfile | null> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  const profilesQuery = query(
    collection(db, SOCIAL_PROFILES_COLLECTION),
    where("emailLower", "==", normalizedEmail),
    where("visibility", "==", "public"),
    limit(1),
  );
  const snap = await getDocs(profilesQuery);
  return snap.docs[0]?.data() as SocialProfile | undefined ?? null;
}

export async function sendFriendRequest(
  fromUser: User,
  toProfile: SocialProfile,
): Promise<void> {
  const requestId = `${fromUser.uid}_${toProfile.uid}`;
  const request: FriendRequest = {
    fromUid: fromUser.uid,
    toUid: toProfile.uid,
    fromEmail: fromUser.email,
    toEmail: toProfile.email,
    status: "pending",
  };

  await setDoc(
    doc(db, FRIEND_REQUESTS_COLLECTION, requestId),
    {
      ...request,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function respondToFriendRequest(
  requestId: string,
  status: "accepted" | "declined",
): Promise<void> {
  await updateDoc(doc(db, FRIEND_REQUESTS_COLLECTION, requestId), {
    status,
    updatedAt: serverTimestamp(),
  });
}
