export function isCapturedPracticePhoto(value: unknown): value is string {
  return typeof value === "string" && /^(?:data:image\/|blob:|https?:\/\/)/i.test(value.trim());
}
