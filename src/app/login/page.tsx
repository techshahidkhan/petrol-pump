"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Fuel, Eye, EyeOff, Globe } from "lucide-react";
import { login, setCurrentUser } from "@/lib/store/data";
import { useLanguage } from "@/lib/i18n/useLanguage";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { lang, t, toggleLang } = useLanguage();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const user = login(username, password);
    if (user) {
      setCurrentUser(user);
      router.push("/dashboard");
    } else {
      setError(lang === "en" ? "Invalid username or password" : "गलत यूज़रनेम या पासवर्ड");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Language toggle */}
        <div className="flex justify-end mb-4">
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-white rounded-lg shadow-sm hover:shadow-md transition-all"
          >
            <Globe className="w-4 h-4" />
            {lang === "en" ? "हिंदी" : "English"}
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <Fuel className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">{t("app_name")}</h1>
            <p className="text-sm text-gray-400 mt-1">Shift Management System</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">{t("username")}</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-4 py-3.5 text-lg border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                placeholder={t("username")}
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">{t("password")}</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 text-lg border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all pr-12"
                  placeholder={t("password")}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white text-lg font-semibold rounded-xl transition-colors shadow-lg shadow-orange-200"
            >
              {t("login")}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-400 mb-2 font-medium">Demo Credentials:</p>
            <div className="space-y-1 text-xs text-gray-500">
              <p><span className="font-medium">Admin:</span> admin / admin123</p>
              <p><span className="font-medium">Employee:</span> suresh / 1234</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
