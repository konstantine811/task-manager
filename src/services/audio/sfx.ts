type PlaySfxOptions = {
  volume?: number;
  offsetSeconds?: number;
};

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

let audioContext: AudioContext | null = null;
let unlockListenersInstalled = false;
const audioBufferCache = new Map<string, Promise<AudioBuffer>>();

const canUseSfx = (): boolean =>
  typeof window !== "undefined" &&
  (typeof window.AudioContext !== "undefined" ||
    typeof window.webkitAudioContext !== "undefined");

const getAudioContext = (): AudioContext | null => {
  if (!canUseSfx()) return null;
  if (audioContext) return audioContext;

  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) return null;

  audioContext = new AudioContextCtor();
  return audioContext;
};

const ensureUnlocked = async (): Promise<AudioContext | null> => {
  const context = getAudioContext();
  if (!context) return null;

  if (context.state !== "running") {
    await context.resume();
  }

  return context;
};

const loadAudioBuffer = async (src: string): Promise<AudioBuffer> => {
  const existing = audioBufferCache.get(src);
  if (existing) return existing;

  const promise = (async () => {
    const context = getAudioContext();
    if (!context) {
      throw new Error("Web Audio API is not available.");
    }

    const response = await fetch(src);
    if (!response.ok) {
      throw new Error(`Failed to load sound: ${src}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return context.decodeAudioData(arrayBuffer.slice(0));
  })();

  audioBufferCache.set(src, promise);
  return promise;
};

export const initializeSfx = (sources: string[] = []) => {
  const context = getAudioContext();
  if (!context) return;

  if (!unlockListenersInstalled) {
    const unlock = () => {
      void ensureUnlocked().finally(() => {
        if (audioContext?.state === "running") {
          window.removeEventListener("pointerdown", unlock);
          window.removeEventListener("keydown", unlock);
          unlockListenersInstalled = false;
        }
      });
    };

    window.addEventListener("pointerdown", unlock, { passive: true });
    window.addEventListener("keydown", unlock, { passive: true });
    unlockListenersInstalled = true;
  }

  sources.forEach((src) => {
    void loadAudioBuffer(src).catch(() => undefined);
  });
};

export const playSfx = async (
  src: string,
  options: PlaySfxOptions = {},
): Promise<boolean> => {
  const context = await ensureUnlocked();
  if (!context) return false;

  const buffer = await loadAudioBuffer(src);
  const source = context.createBufferSource();
  source.buffer = buffer;

  const gainNode = context.createGain();
  gainNode.gain.value = options.volume ?? 1;

  source.connect(gainNode);
  gainNode.connect(context.destination);

  const offsetSeconds = Math.min(
    Math.max(options.offsetSeconds ?? 0, 0),
    Math.max(buffer.duration - 0.01, 0),
  );

  source.start(0, offsetSeconds);
  source.onended = () => {
    source.disconnect();
    gainNode.disconnect();
  };

  return true;
};
