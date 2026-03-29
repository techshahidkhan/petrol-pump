"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IndianRupee, Droplets, Wallet, AlertTriangle, Play, Square, TrendingUp, Banknote } from "lucide-react";
import { getCurrentUser, getTodaySummary, getAlerts, getActiveShiftForEmployee } from "@/lib/store/data";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { formatCurrency, formatLiters } from "@/lib/utils";
import KPICard from "@/components/KPICard";
import type { Employee } from "@/lib/store/types";
import Link from "next/link";

export default function DashboardPage() {
  const [user, setUser] = useState<Employee | null>(null);
  const [summary, setSummary] = useState({ totalLiters: 0, totalAmount: 0, totalCollected: 0, shortage: 0, activeShifts: 0, bankDeposit: 0, cashInHand: 0, previousCashBalance: 0 });
  const [alerts, setAlerts] = useState<ReturnType<typeof getAlerts>>([]);
  const [hasActiveShift, setHasActiveShift] = useState(false);
  const { lang, t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) { router.replace("/login"); return; }
    setUser(u);
    setSummary(getTodaySummary());
    setAlerts(getAlerts());
    if (u.role === "employee") {
      setHasActiveShift(!!getActiveShiftForEmployee(u.id));
    }
  }, [router]);

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">
          {t("welcome")}, {user.name}!
        </h2>
        <p className="text-gray-500 text-sm mt-1">{t("daily_summary")} — {new Date().toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      {/* Employee quick actions */}
      {user.role === "employee" && (
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/shift/start"
            className="flex flex-col items-center gap-3 p-6 bg-green-50 border-2 border-green-200 rounded-2xl hover:bg-green-100 transition-colors"
          >
            <Play className="w-10 h-10 text-green-600" />
            <span className="text-lg font-bold text-green-700">{t("start_shift")}</span>
          </Link>
          <Link
            href="/shift/end"
            className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-colors ${
              hasActiveShift
                ? "bg-red-50 border-red-200 hover:bg-red-100"
                : "bg-gray-50 border-gray-200 opacity-50 pointer-events-none"
            }`}
          >
            <Square className="w-10 h-10 text-red-600" />
            <span className="text-lg font-bold text-red-700">{t("end_shift")}</span>
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={t("todays_sales")}
          value={formatCurrency(summary.totalAmount)}
          icon={IndianRupee}
          color="orange"
        />
        <KPICard
          title={t("liters_sold")}
          value={formatLiters(summary.totalLiters)}
          icon={Droplets}
          color="blue"
        />
        <KPICard
          title={t("total_collection")}
          value={formatCurrency(summary.totalCollected)}
          icon={Wallet}
          color="green"
        />
        <KPICard
          title={t("shortage")}
          value={formatCurrency(summary.shortage)}
          icon={AlertTriangle}
          color={summary.shortage > 0 ? "red" : "green"}
        />
      </div>

      {/* Active Shifts Count */}
      {user.role === "admin" && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          <span className="text-sm font-medium text-blue-700">
            {summary.activeShifts} {t("active_shifts")}
          </span>
        </div>
      )}

      {/* Cash & Bank Summary */}
      {user.role === "admin" && (
        <Link href="/collections" className="block bg-white rounded-2xl border shadow-sm p-4 hover:border-orange-300 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Banknote className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">{lang === "hi" ? "नकद और बैंक" : "Cash & Bank"}</p>
              <p className="text-xs text-gray-400">{lang === "hi" ? "बैंक जमा और नकद शेष" : "Bank deposit & cash balance"}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div>
              <p className="text-gray-400">{t("previous_balance")}</p>
              <p className="font-bold text-gray-700">{formatCurrency(summary.previousCashBalance)}</p>
            </div>
            <div>
              <p className="text-gray-400">{t("bank_deposit")}</p>
              <p className="font-bold text-gray-700">{formatCurrency(summary.bankDeposit)}</p>
            </div>
            <div>
              <p className="text-gray-400">{t("cash_balance")}</p>
              <p className="font-bold text-lg text-green-600">{formatCurrency(summary.cashInHand)}</p>
            </div>
          </div>
        </Link>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            {t("alerts")}
          </h3>
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <div
                key={i}
                className={`px-4 py-3 rounded-xl text-sm font-medium ${
                  alert.severity === "red"
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : alert.severity === "yellow"
                    ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                    : "bg-green-50 text-green-700 border border-green-200"
                }`}
              >
                {lang === "hi" ? alert.messageHi : alert.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No alerts */}
      {alerts.length === 0 && (
        <div className="bg-green-50 border border-green-100 rounded-2xl p-6 text-center">
          <p className="text-green-600 font-medium">{lang === "en" ? "No alerts - All readings are normal" : "कोई अलर्ट नहीं - सभी रीडिंग सामान्य"}</p>
        </div>
      )}
    </div>
  );
}
