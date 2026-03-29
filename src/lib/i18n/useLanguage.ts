"use client";
import { useState, useEffect, useCallback } from "react";
import en from "./en.json";
import hi from "./hi.json";

const translations: Record<string, Record<string, string>> = { en, hi };

export function useLanguage() {
  const [lang, setLangState] = useState<"en" | "hi">("en");

  useEffect(() => {
    const saved = localStorage.getItem("lang") as "en" | "hi";
    if (saved) setLangState(saved);
  }, []);

  const setLang = useCallback((l: "en" | "hi") => {
    setLangState(l);
    localStorage.setItem("lang", l);
  }, []);

  const t = useCallback(
    (key: string): string => {
      return translations[lang]?.[key] || translations["en"]?.[key] || key;
    },
    [lang]
  );

  const toggleLang = useCallback(() => {
    setLang(lang === "en" ? "hi" : "en");
  }, [lang, setLang]);

  return { lang, setLang, t, toggleLang };
}
