"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Banknote, ArrowLeft } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { getCurrentUser, recalcDailyCollection, saveDailyCollection, getDailyCollection } from "@/lib/store/data";
import type { DailyCollection } from "@/lib/store/types";
import Link from "next/link";

export default function CollectionsPage() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [collection, setCollection] = useState<DailyCollection | null>(null);
  const [bankDeposit, setBankDeposit] = useState("");
  const [remarks, setRemarks] = useState("");
  const [saved, setSaved] = useState(false);
  const { lang, t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== "admin") { router.replace("/login"); return; }
    loadCollection();
  }, [router, date]);

  const loadCollection = () => {
    const existing = getDailyCollection(date);
    const calc = recalcDailyCollection(date);
    setCollection(calc);
    setBankDeposit(String(existing?.bankDeposit || 0));
    setRemarks(existing?.remarks || "");
    setSaved(false);
  };

  const handleSave = () => {
    const dc = saveDailyCollection(date, parseFloat(bankDeposit) || 0, remarks);
    setCollection(dc);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!collection) return null;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-xl font-bold text-gray-800">{t("daily_summary")}</h2>
      </div>

      {/* Date picker */}
      <div className="flex items-center gap-2 bg-white rounded-xl border px-3 py-2 w-fit">
        <Calendar className="w-4 h-4 text-gray-400" />
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="text-sm outline-none" />
      </div>

      {/* Sales Summary (auto-calculated from shifts) */}
      <div className="bg-white rounded-2xl border p-4 space-y-3">
        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
          <Banknote className="w-5 h-5 text-orange-500" />
          {t("total_sales")}
        </h3>
        <div className="text-center">
          <p className="text-3xl font-bold text-orange-600">{formatCurrency(collection.totalSalesAmount)}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-gray-400 text-xs">{t("total_collected")}</p>
            <p className="font-bold text-gray-700">{formatCurrency(collection.totalCollected)}</p>
          </div>
          <div className={`rounded-xl p-3 ${collection.shortage > 0 ? "bg-red-50" : "bg-green-50"}`}>
            <p className="text-gray-400 text-xs">{t("shortage")}</p>
            <p className={`font-bold ${collection.shortage > 0 ? "text-red-600" : "text-green-600"}`}>
              {formatCurrency(collection.shortage)}
            </p>
          </div>
        </div>
      </div>

      {/* Payment Breakdown */}
      <div className="bg-white rounded-2xl border p-4 space-y-3">
        <h3 className="font-semibold text-gray-700">{t("payment_breakdown")}</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-green-50 rounded-xl p-3">
            <p className="text-gray-400 text-xs">{t("cash")}</p>
            <p className="font-bold text-green-700">{formatCurrency(collection.totalCash)}</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-3">
            <p className="text-gray-400 text-xs">{t("upi")}</p>
            <p className="font-bold text-purple-700">{formatCurrency(collection.totalUpi)}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3">
            <p className="text-gray-400 text-xs">{t("card")}</p>
            <p className="font-bold text-blue-700">{formatCurrency(collection.totalCard)}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-3">
            <p className="text-gray-400 text-xs">{t("credit")}</p>
            <p className="font-bold text-red-700">{formatCurrency(collection.totalCredit)}</p>
          </div>
        </div>
      </div>

      {/* Cash & Bank Tracking */}
      <div className="bg-white rounded-2xl border p-4 space-y-4">
        <h3 className="font-semibold text-gray-700">{lang === "hi" ? "नकद और बैंक" : "Cash & Bank"}</h3>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-gray-400 text-xs">{t("previous_balance")}</p>
            <p className="font-bold text-gray-700">{formatCurrency(collection.previousCashBalance)}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3">
            <p className="text-gray-400 text-xs">{lang === "hi" ? "आज का नकद" : "Today's Cash"}</p>
            <p className="font-bold text-green-700">{formatCurrency(collection.totalCash)}</p>
          </div>
        </div>

        {/* Bank Deposit - editable */}
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">{t("bank_deposit")}</label>
          <input
            type="number"
            value={bankDeposit}
            onChange={e => setBankDeposit(e.target.value)}
            className="w-full px-4 py-3 text-xl font-bold text-center border-2 border-gray-200 rounded-xl focus:border-orange-400 outline-none"
            placeholder="0"
            inputMode="numeric"
          />
        </div>

        {/* Cash In Hand (auto) */}
        <div className="bg-orange-50 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-500">{t("cash_balance")}</p>
          <p className="text-2xl font-bold text-orange-600">
            {formatCurrency(collection.previousCashBalance + collection.totalCash - (parseFloat(bankDeposit) || 0))}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            = {formatCurrency(collection.previousCashBalance)} + {formatCurrency(collection.totalCash)} - {formatCurrency(parseFloat(bankDeposit) || 0)}
          </p>
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">{t("remarks")}</label>
          <textarea
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-orange-400 outline-none text-sm"
            placeholder={lang === "hi" ? "टिप्पणी..." : "Notes..."}
          />
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        className={`w-full py-4 text-lg font-semibold rounded-xl transition-colors ${
          saved
            ? "bg-green-500 text-white"
            : "bg-orange-500 hover:bg-orange-600 text-white"
        }`}
      >
        {saved ? (lang === "hi" ? "सेव हो गया!" : "Saved!") : t("save")}
      </button>
    </div>
  );
}
