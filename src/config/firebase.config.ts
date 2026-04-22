import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
if (!apiKey || typeof apiKey !== "string" || apiKey.length < 10) {
  throw new Error(
    "Firebase API key is missing or invalid. Create a .env file in the task-manager root and set VITE_FIREBASE_API_KEY (and other VITE_FIREBASE_* vars). You can copy them from your 3d-react-abc-folio .env.",
  );
}

export const firebaseConfig = {
  apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "abc-folio",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ??
    "abc-folio.firebasestorage.app",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "493686804138",
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ??
    "1:493686804138:web:1c5f418cae4e89d9440ad3",
};

export const firebaseFunctionsRegion =
  import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION ?? "us-central1";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const provider = new GoogleAuthProvider();

export enum FirebaseCollection {
  dailyTasks = "daily-tasks",
  templateTasks = "template-tasks",
  plannedTasks = "planned-tasks",
  dailyAnalytics = "daily-analytics",
  dailyJournal = "daily-journal",
  taskInstances = "task-instances",
}

export const FirebaseCollectionProps = {
  [FirebaseCollection.dailyTasks]: { days: "days" },
  [FirebaseCollection.plannedTasks]: { days: "days" },
  [FirebaseCollection.dailyAnalytics]: { days: "days" },
  [FirebaseCollection.dailyJournal]: { days: "days" },
  [FirebaseCollection.taskInstances]: { days: "days" },
};
