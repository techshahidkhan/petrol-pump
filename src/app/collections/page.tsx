"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Banknote, ArrowLeft, Fuel, Save, Check, Trash2, Plus, Wallet, Zap, Wrench, Users } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/useLanguage";
import {
  getCurrentUser, recalcDailyCollection, saveDailyCollection, getDailyCollection,
  getStore, updateFuelPrice, getEmployeeById, getNozzleById, getPumpById,
  getFuelTypeById, getPaymentForShift, addExpense, deleteExpense, getExpensesForDate
} from "@/lib/store/data";
import type { DailyCollection, Shift, FuelType, Expense } from "@/lib/store/types";
import Link from "next/link";

interface ShiftRow {
  id: string; employee: string; pump: number; nozzle: number; fuel: string; rate: number;
  openReading: number; closeReading: number; liters: number; testingQty: number;
  salesLiters: number; amount: number; collected: number; diff: number; time: string;
}

const EXPENSE_CATEGORIES: { value: Expense["category"]; labelHi: string; labelEn: string; icon: typeof Wallet }[] = [
  { value: "salary", labelHi: "वेतन", labelEn: "Salary", icon: Users },
  { value: "maintenance", labelHi: "रखरखाव", labelEn: "Maintenance", icon: Wrench },
  { value: "electricity", labelHi: "बिजली", labelEn: "Electricity", icon: Zap },
  { value: "other", labelHi: "अन्य", labelEn: "Other", icon: Wallet },
];

function getCategoryInfo(category: Expense["category"]) {
  return EXPENSE_CATEGORIES.find(c => c.value === category) || EXPENSE_CATEGORIES[3];
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
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expCategory, setExpCategory] = useState<Expense["category"]>("other");
  const [expDescription, setExpDescription] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const { lang, t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== "admin") { router.replace("/login"); return; }
    loadAll();
  }, [router, date]);

  const loadAll = () => {
    const store = getStore();
    setFuelTypes(store.fuelTypes);
    const p: Record<string, string> = {};
    store.fuelTypes.forEach(f => { p[f.id] = String(f.currentPrice); });
    setPrices(p);
    const existing = getDailyCollection(date);
    const calc = recalcDailyCollection(date);
    setCollection(calc);
    setBankDeposit(String(existing?.bankDeposit || 0));
    setRemarks(existing?.remarks || "");
    setSaved(false);
    setExpenses(getExpensesForDate(date));
    const dayShifts = store.shifts.filter((s: Shift) => s.startedAt.startsWith(date) && s.status === "completed");
    const rows: ShiftRow[] = dayShifts.map((shift: Shift) => {
      const emp = getEmployeeById(shift.employeeId);
      const nozzle = getNozzleById(shift.nozzleId);
      const pump = nozzle ? getPumpById(nozzle.pumpId) : null;
      const fuel = nozzle ? getFuelTypeById(nozzle.fuelTypeId) : null;
      const payment = getPaymentForShift(shift.id);
      const liters = shift.totalLiters || 0;
      const testingQty = shift.testingQuantity || 0;
      const salesLiters = liters - testingQty;
      const amount = shift.totalAmount || (salesLiters * shift.fuelRate);
      const collected = payment?.totalCollected || 0;
      return {
        id: shift.id, employee: emp?.name || "?", pump: pump?.pumpNumber || 0,
        nozzle: nozzle?.nozzleNumber || 0, fuel: (lang === "hi" ? fuel?.nameHi : fuel?.name) || "?",
        rate: shift.fuelRate, openReading: shift.openingReading, closeReading: shift.closingReading || 0,
        liters, testingQty, salesLiters, amount, collected, diff: amount - collected,
        time: new Date(shift.startedAt).toLocaleTimeString(lang === "hi" ? "hi-IN" : "en-IN", { hour: "2-digit", minute: "2-digit" })
          + (shift.endedAt ? ` - ${new Date(shift.endedAt).toLocaleTimeString(lang === "hi" ? "hi-IN" : "en-IN", { hour: "2-digit", minute: "2-digit" })}` : ""),
      };
    });
    setShiftRows(rows.sort((a, b) => a.time.localeCompare(b.time)));
  };

  const savePrices = () => {
    for (const [id, price] of Object.entries(prices)) updateFuelPrice(id, parseFloat(price));
    setPriceSaved(true); setTimeout(() => setPriceSaved(false), 2000);
  };

  const handleSave = () => {
    const dc = saveDailyCollection(date, parseFloat(bankDeposit) || 0, remarks);
    setCollection(dc); setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const handleAddExpense = () => {
    const amt = parseFloat(expAmount);
    if (!expDescription.trim() || !amt || amt <= 0) return;
    addExpense(date, expCategory, expDescription.trim(), amt);
    setExpDescription(""); setExpAmount(""); setExpCategory("other"); loadAll();
  };

  const handleDeleteExpense = (id: string) => { deleteExpense(id); loadAll(); };

  if (!collection) return null;

  const totalLiters = shiftRows.reduce((s, r) => s + r.liters, 0);
  const totalTestingQty = shiftRows.reduce((s, r) => s + r.testingQty, 0);
  const totalSalesLiters = shiftRows.reduce((s, r) => s + r.salesLiters, 0);
  const totalAmount = shiftRows.reduce((s, r) => s + r.amount, 0);
  const totalCollected = shiftRows.reduce((s, r) => s + r.collected, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const cashInHand = collection.previousCashBalance + collection.totalCash - (parseFloat(bankDeposit) || 0) - totalExpenses;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="p-2 hover:bg-white/60 rounded-xl transition-all">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <h2 className="text-xl font-extrabold text-gray-800 tracking-tight">{t("daily_summary")}</h2>
      </div>

      {/* Date picker */}
      <div className="flex items-center gap-2 glass-card rounded-full px-4 py-2 w-fit">
        <Calendar className="w-4 h-4 text-orange-400" />
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="text-sm font-medium outline-none bg-transparent text-gray-700" />
      </div>

      {/* Fuel Rate */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-orange-400 to-amber-500" />
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-md shadow-orange-200/40">
              <Fuel className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-bold text-gray-700">{lang === "hi" ? "आज का रेट" : "Today's Rate"}</h3>
          </div>
          {fuelTypes.map(fuel => (
            <div key={fuel.id} className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-md",
                fuel.name === "Petrol" ? "bg-gradient-to-br from-emerald-400 to-green-500 shadow-emerald-200/40" : "bg-gradient-to-br from-amber-400 to-yellow-500 shadow-amber-200/40"
              )}>
                {fuel.name === "Petrol" ? "P" : "D"}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-700 text-sm">{lang === "hi" ? fuel.nameHi : fuel.name}</p>
                <p className="text-[10px] text-gray-400">{t("price_per_liter")}</p>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-300 text-lg font-bold">₹</span>
                <input
                  type="number" value={prices[fuel.id] || ""}
                  onChange={e => setPrices({ ...prices, [fuel.id]: e.target.value })}
                  className="w-28 px-3 py-2.5 border-2 border-gray-200/50 bg-white/60 rounded-xl text-lg font-bold text-right input-modern"
                  step="0.01"
                />
              </div>
            </div>
          ))}
          <button onClick={savePrices}
            className={cn("w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all",
              priceSaved ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-green-200/40" : "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-200/40 hover:scale-[1.01] active:scale-[0.99]")}>
            {priceSaved ? <><Check className="w-4 h-4" /> {lang === "hi" ? "रेट सेव हो गया!" : "Rate Saved!"}</> : <><Save className="w-4 h-4" /> {lang === "hi" ? "रेट सेव करें" : "Save Rate"}</>}
          </button>
        </div>
      </div>

      {/* Shift Sales Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-100/50 flex items-center justify-between">
          <h3 className="font-bold text-gray-700">{lang === "hi" ? "शिफ्ट वार बिक्री" : "Shift-wise Sales"}</h3>
          <span className="text-xs text-gray-400 bg-gray-100/60 px-2.5 py-1 rounded-full font-medium">{shiftRows.length} {lang === "hi" ? "शिफ्ट" : "shifts"}</span>
        </div>
        {shiftRows.length === 0 ? (
          <div className="p-8 text-center text-gray-300 font-medium">{t("no_data")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50/60">
                  <th className="px-3 py-2.5 text-left text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{lang === "hi" ? "कर्मचारी" : "Employee"}</th>
                  <th className="px-3 py-2.5 text-left text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{lang === "hi" ? "पंप/नोज़ल" : "P/N"}</th>
                  <th className="px-3 py-2.5 text-left text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{lang === "hi" ? "ईंधन" : "Fuel"}</th>
                  <th className="px-3 py-2.5 text-right text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{lang === "hi" ? "रेट" : "Rate"}</th>
                  <th className="px-3 py-2.5 text-right text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{lang === "hi" ? "ओपन" : "Open"}</th>
                  <th className="px-3 py-2.5 text-right text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{lang === "hi" ? "क्लोज" : "Close"}</th>
                  <th className="px-3 py-2.5 text-right text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{lang === "hi" ? "लीटर" : "Ltrs"}</th>
                  <th className="px-3 py-2.5 text-right text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{lang === "hi" ? "टेस्ट" : "Test"}</th>
                  <th className="px-3 py-2.5 text-right text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{lang === "hi" ? "बिक्री" : "Sales"}</th>
                  <th className="px-3 py-2.5 text-right text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{lang === "hi" ? "राशि" : "Amt"}</th>
                  <th className="px-3 py-2.5 text-right text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{lang === "hi" ? "वसूली" : "Coll"}</th>
                </tr>
              </thead>
              <tbody>
                {shiftRows.map((row, i) => (
                  <tr key={row.id} className={cn("border-t border-gray-100/40 hover:bg-white/40 transition-colors", i % 2 === 0 && "bg-gray-50/20")}>
                    <td className="px-3 py-2.5">
                      <p className="font-semibold text-gray-700">{row.employee}</p>
                      <p className="text-gray-300 text-[10px]">{row.time}</p>
                    </td>
                    <td className="px-3 py-2.5 text-gray-500 font-medium">P{row.pump}-N{row.nozzle}</td>
                    <td className="px-3 py-2.5">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold",
                        row.fuel.includes("Petrol") || row.fuel.includes("पेट्रोल") ? "bg-emerald-100/80 text-emerald-700" : "bg-amber-100/80 text-amber-700"
                      )}>{row.fuel}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-gray-500">{formatCurrency(row.rate)}</td>
                    <td className="px-3 py-2.5 text-right text-gray-400 tabular-nums">{row.openReading}</td>
                    <td className="px-3 py-2.5 text-right text-gray-400 tabular-nums">{row.closeReading}</td>
                    <td className="px-3 py-2.5 text-right text-gray-500 tabular-nums">{row.liters.toFixed(2)}</td>
                    <td className="px-3 py-2.5 text-right text-gray-300 tabular-nums">{row.testingQty > 0 ? row.testingQty.toFixed(2) : "-"}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-blue-600 tabular-nums">{row.salesLiters.toFixed(2)}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-orange-600 tabular-nums">{formatCurrency(row.amount)}</td>
                    <td className="px-3 py-2.5 text-right">
                      <span className={cn("font-bold tabular-nums", Math.abs(row.diff) > 10 ? "text-red-600" : "text-emerald-600")}>{formatCurrency(row.collected)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gradient-to-r from-orange-50/80 to-amber-50/60 border-t-2 border-orange-200/60">
                  <td colSpan={6} className="px-3 py-3 font-bold text-gray-700">{lang === "hi" ? "कुल" : "TOTAL"}</td>
                  <td className="px-3 py-3 text-right font-bold text-gray-500 tabular-nums">{totalLiters.toFixed(2)}</td>
                  <td className="px-3 py-3 text-right font-bold text-gray-300 tabular-nums">{totalTestingQty.toFixed(2)}</td>
                  <td className="px-3 py-3 text-right font-bold text-blue-700 tabular-nums">{totalSalesLiters.toFixed(2)} L</td>
                  <td className="px-3 py-3 text-right font-bold text-orange-700 tabular-nums">{formatCurrency(totalAmount)}</td>
                  <td className="px-3 py-3 text-right font-bold text-emerald-700 tabular-nums">{formatCurrency(totalCollected)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Sales Summary */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-md shadow-orange-200/40">
            <Banknote className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-bold text-gray-700">{t("total_sales")}</h3>
        </div>
        <div className="text-center py-2">
          <p className="text-4xl font-black gradient-text">{formatCurrency(collection.totalSalesAmount)}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50/60 rounded-xl p-3">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{t("total_collected")}</p>
            <p className="font-bold text-gray-700 mt-0.5">{formatCurrency(collection.totalCollected)}</p>
          </div>
          <div className={cn("rounded-xl p-3", collection.shortage > 0 ? "bg-red-50/60" : "bg-emerald-50/60")}>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{t("shortage")}</p>
            <p className={cn("font-bold mt-0.5", collection.shortage > 0 ? "text-red-600" : "text-emerald-600")}>{formatCurrency(collection.shortage)}</p>
          </div>
        </div>
      </div>

      {/* Payment Breakdown */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: t("cash"), value: collection.totalCash, gradient: "from-emerald-500 to-green-600", shadow: "shadow-emerald-200/40" },
          { label: t("upi"), value: collection.totalUpi, gradient: "from-purple-500 to-violet-600", shadow: "shadow-purple-200/40" },
          { label: t("card"), value: collection.totalCard, gradient: "from-blue-500 to-indigo-600", shadow: "shadow-blue-200/40" },
          { label: t("credit"), value: collection.totalCredit, gradient: "from-red-500 to-rose-600", shadow: "shadow-red-200/40" },
        ].map(item => (
          <div key={item.label} className={cn("rounded-xl p-3 text-center bg-gradient-to-br text-white shadow-lg", item.gradient, item.shadow)}>
            <p className="text-[10px] font-medium opacity-80 uppercase tracking-wide">{item.label}</p>
            <p className="font-bold text-sm mt-1">{formatCurrency(item.value)}</p>
          </div>
        ))}
      </div>

      {/* Expense Tracking */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-red-400 to-rose-500" />
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center shadow-md shadow-red-200/40">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-bold text-gray-700">{lang === "hi" ? "खर्चे" : "Expenses"}</h3>
          </div>

          {expenses.length > 0 ? (
            <div className="space-y-2">
              {expenses.map(exp => {
                const catInfo = getCategoryInfo(exp.category);
                const CatIcon = catInfo.icon;
                return (
                  <div key={exp.id} className="flex items-center gap-3 bg-gray-50/60 rounded-xl px-3 py-2.5 hover:bg-gray-100/40 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-red-100/80 flex items-center justify-center">
                      <CatIcon className="w-4 h-4 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-700 truncate">{exp.description}</p>
                      <p className="text-[10px] text-gray-400">{lang === "hi" ? catInfo.labelHi : catInfo.labelEn}</p>
                    </div>
                    <p className="text-sm font-bold text-red-600 shrink-0">{formatCurrency(exp.amount)}</p>
                    <button onClick={() => handleDeleteExpense(exp.id)}
                      className="p-1.5 hover:bg-red-100/60 rounded-lg transition-colors shrink-0">
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-300 text-center py-3 font-medium">
              {lang === "hi" ? "आज कोई खर्चा नहीं" : "No expenses for this date"}
            </p>
          )}

          {expenses.length > 0 && (
            <div className="flex items-center justify-between bg-red-50/60 rounded-xl px-4 py-3">
              <p className="text-sm font-semibold text-gray-600">{lang === "hi" ? "कुल खर्चा" : "Total Expenses"}</p>
              <p className="text-lg font-extrabold text-red-600">{formatCurrency(totalExpenses)}</p>
            </div>
          )}

          {/* Add expense form */}
          <div className="border-t border-gray-100/50 pt-4 space-y-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{lang === "hi" ? "नया खर्चा जोड़ें" : "Add Expense"}</p>
            <div className="grid grid-cols-2 gap-2">
              <select value={expCategory} onChange={e => setExpCategory(e.target.value as Expense["category"])}
                className="px-3 py-2.5 border-2 border-gray-200/50 bg-white/60 rounded-xl text-sm font-medium input-modern">
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{lang === "hi" ? cat.labelHi : cat.labelEn}</option>
                ))}
              </select>
              <input type="number" value={expAmount} onChange={e => setExpAmount(e.target.value)}
                placeholder={lang === "hi" ? "राशि" : "Amount"}
                className="px-3 py-2.5 border-2 border-gray-200/50 bg-white/60 rounded-xl text-sm font-medium input-modern" inputMode="numeric" />
            </div>
            <input type="text" value={expDescription} onChange={e => setExpDescription(e.target.value)}
              placeholder={lang === "hi" ? "विवरण..." : "Description..."}
              className="w-full px-3 py-2.5 border-2 border-gray-200/50 bg-white/60 rounded-xl text-sm input-modern" />
            <button onClick={handleAddExpense}
              className="w-full py-2.5 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-red-200/30 hover:scale-[1.01] active:scale-[0.99] transition-all">
              <Plus className="w-4 h-4" /> {lang === "hi" ? "खर्चा जोड़ें" : "Add Expense"}
            </button>
          </div>
        </div>
      </div>

      {/* Cash & Bank */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-emerald-400 to-green-500" />
        <div className="p-5 space-y-4">
          <h3 className="font-bold text-gray-700">{lang === "hi" ? "नकद और बैंक" : "Cash & Bank"}</h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50/60 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{t("previous_balance")}</p>
              <p className="font-bold text-gray-700 mt-0.5">{formatCurrency(collection.previousCashBalance)}</p>
            </div>
            <div className="bg-emerald-50/60 rounded-xl p-3">
              <p className="text-[10px] text-emerald-500 font-medium uppercase tracking-wide">{lang === "hi" ? "आज का नकद" : "Today's Cash"}</p>
              <p className="font-bold text-emerald-700 mt-0.5">{formatCurrency(collection.totalCash)}</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">{t("bank_deposit")}</label>
            <input type="number" value={bankDeposit} onChange={e => setBankDeposit(e.target.value)}
              className="w-full px-4 py-3 text-xl font-bold text-center border-2 border-gray-200/50 bg-white/60 rounded-xl input-modern"
              placeholder="0" inputMode="numeric" />
          </div>

          {(parseFloat(bankDeposit) || 0) > collection.previousCashBalance + collection.totalCash && (
            <div className="glass-card border-l-4 border-l-red-500 rounded-xl p-3 text-sm text-red-600 font-semibold animate-scale-in">
              {lang === "hi" ? "बैंक जमा उपलब्ध नकद से अधिक है!" : "Bank deposit exceeds available cash!"}
            </div>
          )}

          <div className="bg-red-50/50 rounded-xl p-3">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{lang === "hi" ? "कुल खर्चा" : "Total Expenses"}</p>
            <p className="font-bold text-red-600 mt-0.5">{formatCurrency(totalExpenses)}</p>
          </div>

          <div className={cn("rounded-2xl p-5 text-center", cashInHand < 0 ? "bg-red-50/60" : "bg-gradient-to-br from-orange-50/60 to-amber-50/40")}>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{t("cash_balance")}</p>
            <p className={cn("text-3xl font-black mt-1", cashInHand < 0 ? "text-red-600" : "gradient-text")}>
              {formatCurrency(cashInHand)}
            </p>
            <p className="text-[10px] text-gray-300 mt-2">
              = {formatCurrency(collection.previousCashBalance)} + {formatCurrency(collection.totalCash)} - {formatCurrency(parseFloat(bankDeposit) || 0)} - {formatCurrency(totalExpenses)}
            </p>
            <p className="text-[10px] text-gray-300 mt-0.5">
              ({lang === "hi" ? "पिछला + नकद - बैंक - खर्चे" : "Prev + Cash - Bank - Expenses"})
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">{t("remarks")}</label>
            <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={2}
              className="w-full px-3 py-2.5 border-2 border-gray-200/50 bg-white/60 rounded-xl input-modern text-sm"
              placeholder={lang === "hi" ? "टिप्पणी..." : "Notes..."} />
          </div>
        </div>
      </div>

      {/* Save */}
      <button onClick={handleSave}
        className={cn("w-full py-4 text-lg font-bold rounded-xl transition-all shadow-lg hover:scale-[1.01] active:scale-[0.99]",
          saved
            ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-green-200/40"
            : "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-orange-200/40"
        )}>
        {saved ? (lang === "hi" ? "सेव हो गया!" : "Saved!") : t("save")}
      </button>
    </div>
  );
}
