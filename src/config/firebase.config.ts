import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";

const envOrFallback = (value: string | undefined, fallback: string): string => {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : fallback;
};

const apiKey = envOrFallback(import.meta.env.VITE_FIREBASE_API_KEY, "");
if (!apiKey || typeof apiKey !== "string" || apiKey.length < 10) {
  throw new Error(
    "Firebase API key is missing or invalid. Create a .env file in the task-manager root and set VITE_FIREBASE_API_KEY (and other VITE_FIREBASE_* vars). You can copy them from your 3d-react-abc-folio .env.",
  );
}

export const firebaseConfig = {
  apiKey,
  authDomain: envOrFallback(
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    "abc-folio.firebaseapp.com",
  ),
  projectId: envOrFallback(import.meta.env.VITE_FIREBASE_PROJECT_ID, "abc-folio"),
  storageBucket:
    envOrFallback(
      import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      "abc-folio.firebasestorage.app",
    ),
  messagingSenderId:
    envOrFallback(
      import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      "493686804138",
    ),
  appId:
    envOrFallback(
      import.meta.env.VITE_FIREBASE_APP_ID,
      "1:493686804138:web:1c5f418cae4e89d9440ad3",
    ),
};

export const firebaseFunctionsRegion = envOrFallback(
  import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION,
  "us-central1",
);

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, firebaseFunctionsRegion);
export const provider = new GoogleAuthProvider();

const useFunctionsEmulator =
  import.meta.env.DEV &&
  import.meta.env.VITE_FIREBASE_FUNCTIONS_EMULATOR === "true";

if (useFunctionsEmulator) {
  const emulatorHost =
    envOrFallback(import.meta.env.VITE_FIREBASE_FUNCTIONS_EMULATOR_HOST, "127.0.0.1");
  const emulatorPort = Number(
    envOrFallback(import.meta.env.VITE_FIREBASE_FUNCTIONS_EMULATOR_PORT, "5001"),
  );

  connectFunctionsEmulator(functions, emulatorHost, emulatorPort);
}

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
