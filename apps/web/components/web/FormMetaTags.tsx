import { formCatalog } from "@/packages/form-catalog";
import styles from "./form-meta-tags.module.css";

export function FormMetaTags({ order, compact = false }: { order: number; compact?: boolean }) {
  const form = formCatalog.find((item) => item.order === order);
  if (!form) return null;
  return <span className={`${styles.tags} ${compact ? styles.compact : ""}`} aria-label={`${form.energy}; kapılar: ${form.gateNames.join(", ") || "yok"}; organlar: ${form.organs.join(", ") || "yok"}`}>
    <span className={form.energy === "Yin" ? styles.yin : styles.yang}>{form.energy}</span>
    {form.gateNames.length ? <span title={form.gateNames.join(" · ")}>Kapı · {form.gateNames[0]}{form.gateNames.length > 1 ? ` +${form.gateNames.length - 1}` : ""}</span> : null}
    {form.organs.length ? <span title={form.organs.join(" · ")}>Organ · {form.organs[0]}{form.organs.length > 1 ? ` +${form.organs.length - 1}` : ""}</span> : null}
  </span>;
}
