export function capitalizeFirstLetter(str: string) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export const normalizeStr = (str: string) =>
  str
    .replace(/['''ʼ`´]/g, "")
    .trim()
    .toLowerCase();

export function sanitizeName(input: string) {
  return input
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^A-Za-z0-9._-]/g, "");
}
