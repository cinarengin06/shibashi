"use client";

import { useEffect, useState, type ReactNode } from "react";
import { shenThemes, visualThemes, type SharedShenId, type VisualThemeId } from "@/packages/design-tokens";

const shenKey = "ritim-kapisi-selected-shen";
const visualKey = "shibashi-visual-theme";

export function ShenThemeBoundary({ children }: { children: ReactNode }) {
  const [shen, setShen] = useState<SharedShenId>("shen");
  const [visual, setVisual] = useState<VisualThemeId>("ink-night");

  useEffect(() => {
    const update = () => {
      const savedShen = window.localStorage.getItem(shenKey);
      const savedVisual = window.localStorage.getItem(visualKey);
      if (savedShen && savedShen in shenThemes) setShen(savedShen as SharedShenId);
      if (savedVisual && savedVisual in visualThemes) setVisual(savedVisual as VisualThemeId);
    };
    update();
    window.addEventListener("storage", update);
    window.addEventListener("shibashi-theme-change", update);
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener("shibashi-theme-change", update);
    };
  }, []);

  return <div className={`site-theme shen-theme-${shen}`} data-shen={shen} data-visual-theme={visual}>{children}</div>;
}
