"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Globe } from "lucide-react";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { getCurrentUser, setCurrentUser } from "@/lib/store/data";
import type { Employee } from "@/lib/store/types";

export default function Header() {
  const [user, setUser] = useState<Employee | null>(null);
  const { lang, t, toggleLang } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const handleLogout = () => {
    setCurrentUser(null);
    router.push("/login");
  };

  const initials = user?.name ? user.name.charAt(0).toUpperCase() : "?";

  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/60 border-b border-white/30 px-4 py-3 flex items-center justify-between md:px-6 shadow-sm shadow-orange-100/30">
      <div className="ml-12 md:ml-0">
        <h1 className="text-lg font-bold text-gray-800 tracking-tight">{t("app_name")}</h1>
      </div>
      <div className="flex items-center gap-2.5">
        <button
          onClick={toggleLang}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-white/60 backdrop-blur-sm border border-gray-200/60 rounded-full hover:bg-orange-50 hover:border-orange-200 transition-all"
        >
          <Globe className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-gray-600">{lang === "en" ? "हिंदी" : "EN"}</span>
        </button>
        {user && (
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 pl-1 pr-3 py-1 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-full">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-sm">
                <span className="text-xs font-bold text-white">{initials}</span>
              </div>
              <span className="text-sm font-semibold text-gray-700">{user.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-orange-100/80 text-orange-600 rounded-full font-semibold uppercase">
                {t(user.role)}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50/80 rounded-full transition-all hover:scale-105"
              title={t("logout")}
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
