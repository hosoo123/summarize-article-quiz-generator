"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Languages } from "lucide-react";
import { useI18n, type Locale } from "@/lib/i18n";

const languages: { value: Locale; flag: string; labelKey: "english" | "mongolian" }[] = [
  { value: "en", flag: "🇺🇸", labelKey: "english" },
  { value: "mn", flag: "🇲🇳", labelKey: "mongolian" },
];

export function LanguageSelector() {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const current = languages.find((item) => item.value === locale) ?? languages[0];

  return (
    <div className="language-selector" ref={rootRef}>
      <button
        type="button"
        className="language-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("language")}
        onClick={() => setOpen((value) => !value)}
      >
        <Languages size={16} />
        <span className="language-flag" aria-hidden="true">{current.flag}</span>
        <span className="language-current">{t(current.labelKey)}</span>
      </button>

      {open ? (
        <div className="language-menu" role="menu" aria-label={t("language")}>
          {languages.map((item) => {
            const selected = item.value === locale;
            return (
              <button
                key={item.value}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                className={`language-option ${selected ? "selected" : ""}`}
                onClick={() => {
                  setLocale(item.value);
                  setOpen(false);
                }}
              >
                <span className="language-flag" aria-hidden="true">{item.flag}</span>
                <span>{t(item.labelKey)}</span>
                {selected ? <Check size={16} /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
