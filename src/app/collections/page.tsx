"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Banknote, ArrowLeft, Fuel, Save, Check } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/useLanguage";
import {
  getCurrentUser, recalcDailyCollection, saveDailyCollection, getDailyCollection,
  getStore, updateFuelPrice, getEmployeeById, getNozzleById, getPumpById,
  getFuelTypeById, getPaymentForShift
} from "@/lib/store/data";
import type { DailyCollection, Shift, FuelType } from "@/lib/store/types";
import Link from "next/link";

interface ShiftRow {
  id: string;
  employee: string;
  pump: number;
  nozzle: number;
  fuel: string;
  rate: number;
  openReading: number;
  closeReading: number;
  liters: number;
  amount: number;
  collected: number;
  diff: number;
  time: string;
}

export default function CollectionsPage() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [collection, setCollection] = useState<DailyCollection | null>(null);
  const [bankDeposit, setBankDeposit] = useState("");
  const [remarks, setRemarks] = useState("");
  const [saved, setSaved] = useState(false);
  const [fuelTypes, setFuelTypes] = useState<FuelType[]>([]);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [priceSaved, setPriceSaved] = useState(false);
  const [shiftRows, setShiftRows] = useState<ShiftRow[]>([]);
  const { lang, t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== "admin") { router.replace("/login"); return; }
    loadAll();
  }, [router, date]);

  const loadAll = () => {
    // Load fuel types
    const store = getStore();
    setFuelTypes(store.fuelTypes);
    const p: Record<string, string> = {};
    store.fuelTypes.forEach(f => { p[f.id] = String(f.currentPrice); });
    setPrices(p);

    // Load daily collection
    const existing = getDailyCollection(date);
    const calc = recalcDailyCollection(date);
    setCollection(calc);
    setBankDeposit(String(existing?.bankDeposit || 0));
    setRemarks(existing?.remarks || "");
    setSaved(false);

    // Load shift rows for selected date
    const dayShifts = store.shifts.filter(
      (s: Shift) => s.startedAt.startsWith(date) && s.status === "completed"
    );
    const rows: ShiftRow[] = dayShifts.map((shift: Shift) => {
      const emp = getEmployeeById(shift.employeeId);
      const nozzle = getNozzleById(shift.nozzleId);
      const pump = nozzle ? getPumpById(nozzle.pumpId) : null;
      const fuel = nozzle ? getFuelTypeById(nozzle.fuelTypeId) : null;
      const payment = getPaymentForShift(shift.id);
      const liters = shift.totalLiters || 0;
      const amount = shift.totalAmount || (liters * shift.fuelRate);
      const collected = payment?.totalCollected || 0;
      return {
        id: shift.id,
        employee: emp?.name || "?",
        pump: pump?.pumpNumber || 0,
        nozzle: nozzle?.nozzleNumber || 0,
        fuel: (lang === "hi" ? fuel?.nameHi : fuel?.name) || "?",
        rate: shift.fuelRate,
        openReading: shift.openingReading,
        closeReading: shift.closingReading || 0,
        liters,
        amount,
        collected,
        diff: amount - collected,
        time: new Date(shift.startedAt).toLocaleTimeString(lang === "hi" ? "hi-IN" : "en-IN", { hour: "2-digit", minute: "2-digit" })
          + (shift.endedAt ? ` - ${new Date(shift.endedAt).toLocaleTimeString(lang === "hi" ? "hi-IN" : "en-IN", { hour: "2-digit", minute: "2-digit" })}` : ""),
      };
    });
    setShiftRows(rows.sort((a, b) => a.time.localeCompare(b.time)));
  };

  const savePrices = () => {
    for (const [id, price] of Object.entries(prices)) {
      updateFuelPrice(id, parseFloat(price));
    }
    setPriceSaved(true);
    setTimeout(() => setPriceSaved(false), 2000);
  };

  const handleSave = () => {
    const dc = saveDailyCollection(date, parseFloat(bankDeposit) || 0, remarks);
    setCollection(dc);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!collection) return null;

  const totalLiters = shiftRows.reduce((s, r) => s + r.liters, 0);
  const totalAmount = shiftRows.reduce((s, r) => s + r.amount, 0);
  const totalCollected = shiftRows.reduce((s, r) => s + r.collected, 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
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

      {/* ===== TODAY'S FUEL RATE ===== */}
      <div className="bg-white rounded-2xl border shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Fuel className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold text-gray-700">{lang === "hi" ? "आज का रेट" : "Today's Rate"}</h3>
        </div>
        <div className="space-y-3">
          {fuelTypes.map(fuel => (
            <div key={fuel.id} className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold",
                fuel.name === "Petrol" ? "bg-green-500" : "bg-yellow-500"
              )}>
                {fuel.name === "Petrol" ? "P" : "D"}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-700 text-sm">{lang === "hi" ? fuel.nameHi : fuel.name}</p>
                <p className="text-xs text-gray-400">{t("price_per_liter")}</p>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-400 text-lg">₹</span>
                <input
                  type="number"
                  value={prices[fuel.id] || ""}
                  onChange={e => setPrices({ ...prices, [fuel.id]: e.target.value })}
                  className="w-28 px-3 py-2.5 border-2 rounded-xl text-lg font-bold text-right focus:border-orange-400 outline-none"
                  step="0.01"
                />
              </div>
            </div>
          ))}
        </div>
        <button onClick={savePrices}
          className={cn("w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors",
            priceSaved ? "bg-green-500 text-white" : "bg-orange-500 hover:bg-orange-600 text-white")}>
          {priceSaved ? <><Check className="w-4 h-4" /> {lang === "hi" ? "रेट सेव हो गया!" : "Rate Saved!"}</> : <><Save className="w-4 h-4" /> {lang === "hi" ? "रेट सेव करें" : "Save Rate"}</>}
        </button>
      </div>

      {/* ===== DATE-WISE SHIFT SALES TABLE ===== */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-gray-700">{lang === "hi" ? "शिफ्ट वार बिक्री" : "Shift-wise Sales"}</h3>
          <span className="text-xs text-gray-400">{shiftRows.length} {lang === "hi" ? "शिफ्ट" : "shifts"}</span>
        </div>

        {shiftRows.length === 0 ? (
          <div className="p-8 text-center text-gray-400">{t("no_data")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-gray-500 font-medium">{lang === "hi" ? "कर्मचारी" : "Employee"}</th>
                  <th className="px-3 py-2 text-left text-gray-500 font-medium">{lang === "hi" ? "पंप/नोज़ल" : "P/N"}</th>
                  <th className="px-3 py-2 text-left text-gray-500 font-medium">{lang === "hi" ? "ईंधन" : "Fuel"}</th>
                  <th className="px-3 py-2 text-right text-gray-500 font-medium">{lang === "hi" ? "रेट" : "Rate"}</th>
                  <th className="px-3 py-2 text-right text-gray-500 font-medium">{lang === "hi" ? "ओपन" : "Open"}</th>
                  <th className="px-3 py-2 text-right text-gray-500 font-medium">{lang === "hi" ? "क्लोज" : "Close"}</th>
                  <th className="px-3 py-2 text-right text-gray-500 font-medium">{lang === "hi" ? "लीटर" : "Liters"}</th>
                  <th className="px-3 py-2 text-right text-gray-500 font-medium">{lang === "hi" ? "राशि" : "Amount"}</th>
                  <th className="px-3 py-2 text-right text-gray-500 font-medium">{lang === "hi" ? "वसूली" : "Collected"}</th>
                </tr>
              </thead>
              <tbody>
                {shiftRows.map(row => (
                  <tr key={row.id} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-gray-700">{row.employee}</p>
                      <p className="text-gray-400 text-[10px]">{row.time}</p>
                    </td>
                    <td className="px-3 py-2.5 text-gray-600">P{row.pump}-N{row.nozzle}</td>
                    <td className="px-3 py-2.5">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-bold",
                        row.fuel.includes("Petrol") || row.fuel.includes("पेट्रोल") ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      )}>
                        {row.fuel}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-gray-600">₹{row.rate}</td>
                    <td className="px-3 py-2.5 text-right text-gray-500">{row.openReading}</td>
                    <td className="px-3 py-2.5 text-right text-gray-500">{row.closeReading}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-blue-600">{row.liters.toFixed(2)}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-orange-600">{formatCurrency(row.amount)}</td>
                    <td className="px-3 py-2.5 text-right">
                      <span className={cn("font-bold", Math.abs(row.diff) > 10 ? "text-red-600" : "text-green-600")}>
                        {formatCurrency(row.collected)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-orange-50 border-t-2 border-orange-200">
                <tr>
                  <td colSpan={6} className="px-3 py-2.5 font-bold text-gray-700">{lang === "hi" ? "कुल" : "TOTAL"}</td>
                  <td className="px-3 py-2.5 text-right font-bold text-blue-700">{totalLiters.toFixed(2)} L</td>
                  <td className="px-3 py-2.5 text-right font-bold text-orange-700">{formatCurrency(totalAmount)}</td>
                  <td className="px-3 py-2.5 text-right font-bold text-green-700">{formatCurrency(totalCollected)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* ===== SALES SUMMARY ===== */}
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

      {/* ===== PAYMENT BREAKDOWN ===== */}
      <div className="bg-white rounded-2xl border p-4 space-y-3">
        <h3 className="font-semibold text-gray-700">{t("payment_breakdown")}</h3>
        <div className="grid grid-cols-4 gap-2 text-sm">
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <p className="text-gray-400 text-[10px]">{t("cash")}</p>
            <p className="font-bold text-green-700 text-sm">{formatCurrency(collection.totalCash)}</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-3 text-center">
            <p className="text-gray-400 text-[10px]">{t("upi")}</p>
            <p className="font-bold text-purple-700 text-sm">{formatCurrency(collection.totalUpi)}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <p className="text-gray-400 text-[10px]">{t("card")}</p>
            <p className="font-bold text-blue-700 text-sm">{formatCurrency(collection.totalCard)}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-3 text-center">
            <p className="text-gray-400 text-[10px]">{t("credit")}</p>
            <p className="font-bold text-red-700 text-sm">{formatCurrency(collection.totalCredit)}</p>
          </div>
        </div>
      </div>

      {/* ===== CASH & BANK TRACKING ===== */}
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

        {/* Warning if bank deposit exceeds available cash */}
        {(parseFloat(bankDeposit) || 0) > collection.previousCashBalance + collection.totalCash && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600 font-medium">
            ⚠️ {lang === "hi"
              ? "बैंक जमा उपलब्ध नकद से अधिक है!"
              : "Bank deposit exceeds available cash!"}
          </div>
        )}

        {/* Cash In Hand (auto) */}
        <div className={cn("rounded-xl p-4 text-center",
          (collection.previousCashBalance + collection.totalCash - (parseFloat(bankDeposit) || 0)) < 0
            ? "bg-red-50" : "bg-orange-50"
        )}>
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
