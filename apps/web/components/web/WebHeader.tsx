import Link from "next/link";
import styles from "./web-header.module.css";

type WebHeaderTab = "home" | "mainMap" | "practice" | "posture" | "journey" | "bodyLines" | "journal" | "profile";

const navigation: Array<{ id: WebHeaderTab; label: string; href: string }> = [
  { id: "home", label: "Özel Odam", href: "/" },
  { id: "mainMap", label: "Ana Haritam", href: "/ana-haritam" },
  { id: "bodyLines", label: "18 Hareketle Öğren", href: "/beden-hatlari" },
  { id: "posture", label: "Postür Analizi", href: "/?tab=posture" },
  { id: "journey", label: "Haritam", href: "/?tab=journey" },
  { id: "journal", label: "Günlük", href: "/?tab=journal" },
  { id: "profile", label: "Ayarlar", href: "/?tab=profile" },
];

export function WebHeader({ active }: { active: WebHeaderTab }) {
  return (
    <header className={styles.header}>
      <Link aria-label="Shibashi EFE ana sayfa" className={styles.brand} href="/">
        <i aria-hidden="true" />
        <span>SHIBASHI EFE</span>
      </Link>
      <nav aria-label="Ana gezinme">
        {navigation.map((item) => (
          <Link aria-current={active === item.id ? "page" : undefined} className={active === item.id ? styles.active : undefined} href={item.href} key={item.id}>
            {item.label}
          </Link>
        ))}
      </nav>
      <Link className={styles.profile} href="/?tab=profile">Ayarlar</Link>
    </header>
  );
}
