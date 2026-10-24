import type { FormStep, FormSteps } from "@/packages/gamification";

const key = (userId?: string) => `shibashi-form-steps-v1:${userId || "guest"}`;
export const formStepsEvent = "shibashi-form-steps-change";

export function loadFormSteps(userId?: string): FormSteps {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key(userId)) ?? "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value as FormSteps : {};
  } catch { return {}; }
}

export function markFormStep(order: number, step: FormStep, userId?: string): FormSteps {
  const current = loadFormSteps(userId);
  if (!Number.isInteger(order) || order < 1 || order > 18 || current[order]?.[step]) return current;
  const next = { ...current, [order]: { ...current[order], [step]: true } };
  localStorage.setItem(key(userId), JSON.stringify(next));
  window.dispatchEvent(new Event(formStepsEvent));
  return next;
}
