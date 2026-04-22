let mediaTransportAudio: HTMLAudioElement | null = null;
let silentAudioUrl: string | null = null;

const SILENT_SAMPLE_RATE = 8000;
const SILENT_DURATION_SECONDS = 1;

const canUseMediaTransport = (): boolean =>
  typeof window !== "undefined" && typeof Audio !== "undefined";

const createSilentWavUrl = (): string => {
  const sampleCount = SILENT_SAMPLE_RATE * SILENT_DURATION_SECONDS;
  const dataSize = sampleCount;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SILENT_SAMPLE_RATE, true);
  view.setUint32(28, SILENT_SAMPLE_RATE, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  for (let index = 44; index < 44 + dataSize; index += 1) {
    view.setUint8(index, 128);
  }

  const blob = new Blob([buffer], { type: "audio/wav" });
  return URL.createObjectURL(blob);
};

const ensureMediaTransportAudio = (): HTMLAudioElement | null => {
  if (!canUseMediaTransport()) return null;
  if (mediaTransportAudio) return mediaTransportAudio;

  silentAudioUrl ??= createSilentWavUrl();
  const audio = new Audio(silentAudioUrl);
  audio.loop = true;
  audio.volume = 0.0001;
  audio.preload = "auto";
  audio.setAttribute("playsinline", "true");
  mediaTransportAudio = audio;
  return mediaTransportAudio;
};

export const primeTaskMediaTransport = async (): Promise<boolean> => {
  const audio = ensureMediaTransportAudio();
  if (!audio) return false;

  try {
    await audio.play();
    audio.pause();
    audio.currentTime = 0;
    return true;
  } catch {
    return false;
  }
};

export const playTaskMediaTransport = async (): Promise<boolean> => {
  const audio = ensureMediaTransportAudio();
  if (!audio) return false;

  try {
    await audio.play();
    return true;
  } catch {
    return false;
  }
};

export const pauseTaskMediaTransport = () => {
  mediaTransportAudio?.pause();
  if (mediaTransportAudio) {
    mediaTransportAudio.currentTime = 0;
  }
};
