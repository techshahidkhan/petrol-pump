"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { IndianRupee, Droplets, Wallet, AlertTriangle, Play, Square, TrendingUp, Banknote, RefreshCw, CheckCircle2, ArrowRight } from "lucide-react";
import { getCurrentUser, getTodaySummary, getAlerts, getActiveShiftForEmployee } from "@/lib/store/data";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { formatCurrency, formatLiters } from "@/lib/utils";
import KPICard from "@/components/KPICard";
import type { Employee } from "@/lib/store/types";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const [user, setUser] = useState<Employee | null>(null);
  const [summary, setSummary] = useState({ totalLiters: 0, totalAmount: 0, totalCollected: 0, shortage: 0, activeShifts: 0, bankDeposit: 0, cashInHand: 0, previousCashBalance: 0 });
  const [alerts, setAlerts] = useState<ReturnType<typeof getAlerts>>([]);
  const [hasActiveShift, setHasActiveShift] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const { lang, t } = useLanguage();
  const router = useRouter();

  const refreshData = useCallback(() => {
    const u = getCurrentUser();
    if (!u) { router.replace("/login"); return; }
    setUser(u);
    setSummary(getTodaySummary());
    setAlerts(getAlerts());
    if (u.role === "employee") {
      setHasActiveShift(!!getActiveShiftForEmployee(u.id));
    }
  }, [router]);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, [refreshData]);

  const handleRefresh = () => {
    setSpinning(true);
    refreshData();
    setTimeout(() => setSpinning(false), 700);
  };

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Welcome */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-800 tracking-tight">
            {t("welcome")}, {user.name}! <span className="inline-block animate-float">&#128075;</span>
          </h2>
          <p className="text-gray-400 text-sm mt-1 font-medium">
            {t("daily_summary")} — {new Date().toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="p-2.5 hover:bg-white/60 rounded-xl transition-all hover:shadow-sm"
          title="Refresh"
        >
          <RefreshCw className={cn("w-5 h-5 text-gray-400 transition-transform", spinning && "animate-spin")} />
        </button>
      </div>

      {/* Employee quick actions */}
      {user.role === "employee" && (
        <div className="grid grid-cols-2 gap-4 stagger">
          <Link
            href="/shift/start"
            className="group flex flex-col items-center gap-3 p-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-200/40 hover:shadow-xl hover:shadow-emerald-300/50 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <Play className="w-7 h-7 text-white" />
            </div>
            <span className="text-lg font-bold">{t("start_shift")}</span>
          </Link>
          <Link
            href="/shift/end"
            className={cn(
              "group flex flex-col items-center gap-3 p-6 rounded-2xl shadow-lg transition-all",
              hasActiveShift
                ? "bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-red-200/40 hover:shadow-xl hover:shadow-red-300/50 hover:scale-[1.02] active:scale-[0.98]"
                : "bg-gray-100 text-gray-400 opacity-50 pointer-events-none shadow-none"
            )}
          >
            <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center", hasActiveShift ? "bg-white/20" : "bg-gray-200")}>
              <Square className="w-7 h-7" />
            </div>
            <span className="text-lg font-bold">{t("end_shift")}</span>
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <KPICard title={t("todays_sales")} value={formatCurrency(summary.totalAmount)} icon={IndianRupee} color="orange" />
        <KPICard title={t("liters_sold")} value={formatLiters(summary.totalLiters)} icon={Droplets} color="blue" />
        <KPICard title={t("total_collection")} value={formatCurrency(summary.totalCollected)} icon={Wallet} color="green" />
        <KPICard title={t("shortage")} value={formatCurrency(summary.shortage)} icon={AlertTriangle} color={summary.shortage > 0 ? "red" : "green"} />
      </div>

      {/* Active Shifts */}
      {user.role === "admin" && (
        <div className="glass-card rounded-2xl p-4 flex items-center gap-3 animate-slide-up">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-200/40">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <span className="text-sm font-bold text-gray-700">
              {summary.activeShifts} {t("active_shifts")}
            </span>
            <p className="text-xs text-gray-400">{lang === "hi" ? "अभी चल रही शिफ्ट" : "Currently running"}</p>
          </div>
          {summary.activeShifts > 0 && (
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-lg shadow-green-500/40 animate-pulse" />
          )}
        </div>
      )}

      {/* Cash & Bank Summary */}
      {user.role === "admin" && (
        <Link href="/collections" className="group block glass-card rounded-2xl overflow-hidden hover-lift animate-slide-up">
          <div className="h-1 bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500" />
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-md shadow-green-200/40">
                  <Banknote className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-800">{lang === "hi" ? "नकद और बैंक" : "Cash & Bank"}</p>
                  <p className="text-xs text-gray-400">{lang === "hi" ? "बैंक जमा और नकद शेष" : "Bank deposit & cash balance"}</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-gray-50/60 rounded-xl p-3">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{t("previous_balance")}</p>
                <p className="font-bold text-gray-700 mt-0.5">{formatCurrency(summary.previousCashBalance)}</p>
              </div>
              <div className="bg-gray-50/60 rounded-xl p-3">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{t("bank_deposit")}</p>
                <p className="font-bold text-gray-700 mt-0.5">{formatCurrency(summary.bankDeposit)}</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-3 border border-emerald-100/50">
                <p className="text-[10px] text-emerald-500 font-medium uppercase tracking-wide">{t("cash_balance")}</p>
                <p className="font-extrabold text-lg text-emerald-600 mt-0.5">{formatCurrency(summary.cashInHand)}</p>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3 animate-slide-up">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            </div>
            {t("alerts")}
          </h3>
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <div
                key={i}
                className={cn(
                  "glass-card rounded-xl px-4 py-3 text-sm font-medium border-l-4",
                  alert.severity === "red"
                    ? "border-l-red-500 text-red-700"
                    : alert.severity === "yellow"
                    ? "border-l-amber-500 text-amber-700"
                    : "border-l-green-500 text-green-700"
                )}
              >
                {lang === "hi" ? alert.messageHi : alert.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No alerts */}
      {alerts.length === 0 && (
        <div className="glass-card rounded-2xl p-6 text-center animate-scale-in border-green-100/50">
          <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-green-600 font-semibold">
            {lang === "en" ? "All clear - No alerts" : "सब सही है - कोई अलर्ट नहीं"}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {lang === "en" ? "All readings are normal" : "सभी रीडिंग सामान्य"}
          </p>
        </div>
      )}
    </div>
  );
}
