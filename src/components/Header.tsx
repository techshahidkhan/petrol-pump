"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Globe, User } from "lucide-react";
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

  return (
    <header className="sticky top-0 z-30 bg-white border-b px-4 py-3 flex items-center justify-between md:px-6">
      <div className="ml-12 md:ml-0">
        <h1 className="text-lg font-semibold text-gray-800">{t("app_name")}</h1>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={toggleLang}
          className="flex items-center gap-1.5 px-3 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Globe className="w-4 h-4" />
          {lang === "en" ? "हिंदी" : "English"}
        </button>
        {user && (
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-orange-50 rounded-lg">
              <User className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-orange-700">{user.name}</span>
              <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded">
                {t(user.role)}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title={t("logout")}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
