// Stub sound objects for task-manager (no howler/audio files).
// Use .play() and .stop() so existing code doesn't break.
const noop = () => {};
const soundStub = { play: noop, stop: noop };

export const checkInSound = soundStub;
export const checkOutSound = soundStub;
