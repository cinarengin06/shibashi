import Link from "next/link";
import styles from "./web-header.module.css";

type WebHeaderTab = "home" | "practice" | "practice2" | "posture" | "newPosture" | "journey" | "learning" | "journal" | "profile";

const navigation: Array<{ id: WebHeaderTab; label: string; href: string }> = [
  { id: "home", label: "Özel Odam", href: "/" },
  { id: "practice2", label: "Akışa Gir", href: "/pratik2" },
  { id: "practice", label: "Yolculuk", href: "/?tab=practice" },
  { id: "posture", label: "Bedenini Gör", href: "/?tab=posture" },
  { id: "newPosture", label: "New_posture", href: "/?tab=newPosture" },
  { id: "journey", label: "Haritan", href: "/?tab=journey" },
  { id: "learning", label: "Yaşayarak Öğren", href: "/yasayarak-ogren" },
  { id: "journal", label: "Günlüğüm", href: "/?tab=journal" },
  { id: "profile", label: "Gelişimim", href: "/?tab=profile" },
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
      <Link className={styles.profile} href="/?tab=profile">Profil</Link>
    </header>
  );
}
