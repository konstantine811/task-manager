import { db, storage } from "@/config/firebase.config";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

export const DOCUMENTATION_IMAGE_KEYS = [
  "hero",
  "templates",
  "daily",
  "analytics",
  "profile",
] as const;

export type DocumentationImageKey = (typeof DOCUMENTATION_IMAGE_KEYS)[number];

export type DocumentationImages = Partial<Record<DocumentationImageKey, string>>;

const DOCS_COLLECTION = "appDocs";
const GUIDE_IMAGES_DOC_ID = "guideImages";

const getGuideImagesRef = () => doc(db, DOCS_COLLECTION, GUIDE_IMAGES_DOC_ID);

const guessImageExt = (file: File) => {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext && /^[a-z0-9]+$/.test(ext)) return ext;
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  return "jpg";
};

export async function loadDocumentationImages(): Promise<DocumentationImages> {
  const snap = await getDoc(getGuideImagesRef());
  if (!snap.exists()) return {};

  const images = snap.data().images;
  if (!images || typeof images !== "object") return {};

  return images as DocumentationImages;
}

export async function uploadDocumentationImage(
  key: DocumentationImageKey,
  file: File,
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Image must be up to 10 MB.");
  }

  const fileRef = ref(storage, `app-docs/guide/${key}.${guessImageExt(file)}`);
  await uploadBytes(fileRef, file, { contentType: file.type });
  const url = await getDownloadURL(fileRef);

  await setDoc(
    getGuideImagesRef(),
    {
      images: {
        [key]: url,
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return url;
}
