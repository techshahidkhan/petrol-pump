"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Fuel, Eye, EyeOff, Globe, AlertTriangle } from "lucide-react";
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background mesh gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-100 via-amber-50 to-rose-50" />
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-orange-300/20 rounded-full blur-3xl" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-amber-200/25 rounded-full blur-3xl" />
      <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-rose-200/15 rounded-full blur-3xl" />

      <div className="w-full max-w-sm relative z-10 animate-slide-up">
        {/* Language toggle */}
        <div className="flex justify-end mb-5">
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium backdrop-blur-xl bg-white/50 border border-white/40 rounded-full shadow-sm hover:bg-white/70 transition-all"
          >
            <Globe className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">{lang === "en" ? "हिंदी" : "English"}</span>
          </button>
        </div>

        <div className="backdrop-blur-xl bg-white/70 border border-white/40 rounded-3xl shadow-2xl shadow-orange-900/5 p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center mb-5 shadow-xl shadow-orange-500/25 animate-float">
              <Fuel className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">{t("app_name")}</h1>
            <p className="text-sm text-gray-400 mt-1 font-medium">Shift Management System</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-500 mb-2">{t("username")}</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-4 py-3.5 text-base font-medium bg-white/60 border-2 border-gray-200/60 rounded-xl input-modern transition-all placeholder:text-gray-300"
                placeholder={t("username")}
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-500 mb-2">{t("password")}</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 text-base font-medium bg-white/60 border-2 border-gray-200/60 rounded-xl input-modern transition-all pr-12 placeholder:text-gray-300"
                  placeholder={t("password")}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 p-1.5 hover:text-gray-600 rounded-lg hover:bg-gray-100/50 transition-all"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50/80 backdrop-blur-sm border border-red-100 text-red-600 text-sm font-medium px-4 py-3 rounded-xl animate-scale-in">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-lg font-bold rounded-xl transition-all shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/30 hover:scale-[1.01] active:scale-[0.99]"
            >
              {t("login")}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-gray-50/60 backdrop-blur-sm border border-gray-100/50 rounded-xl">
            <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">Demo Credentials</p>
            <div className="space-y-1.5 text-xs text-gray-500">
              <p className="flex justify-between"><span className="font-semibold text-gray-600">Admin:</span> <span className="font-mono">admin / admin123</span></p>
              <p className="flex justify-between"><span className="font-semibold text-gray-600">Employee:</span> <span className="font-mono">suresh / 1234</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
