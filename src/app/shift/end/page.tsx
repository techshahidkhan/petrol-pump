"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, AlertTriangle, Plus, Trash2, Loader2 } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/useLanguage";
import {
  getCurrentUser, getActiveShiftsForEmployee, getNozzleById, getPumpById,
  getFuelTypeById, endShift
} from "@/lib/store/data";
import ImageUpload from "@/components/ImageUpload";
import type { Shift } from "@/lib/store/types";

interface CreditRow {
  customerName: string;
  vehicleNumber: string;
  amount: number;
}

export default function EndShiftPage() {
  const [activeShifts, setActiveShifts] = useState<Shift[]>([]);
  const [shift, setShift] = useState<Shift | null>(null);
  const [closing, setClosing] = useState("");
  const [testingLiters, setTestingLiters] = useState("0");
  const [photo, setPhoto] = useState<string | null>(null);
  const [cash, setCash] = useState("");
  const [upi, setUpi] = useState("");
  const [card, setCard] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [creditRows, setCreditRows] = useState<CreditRow[]>([]);
  const [newCredit, setNewCredit] = useState({ customerName: "", vehicleNumber: "", amount: "" });
  const [remarks, setRemarks] = useState("");
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { lang, t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) { router.replace("/login"); return; }
    const shifts = getActiveShiftsForEmployee(user.id);
    if (shifts.length === 0) {
      setError(lang === "en" ? "No active shift found" : "कोई सक्रिय शिफ्ट नहीं");
      return;
    }
    setActiveShifts(shifts);
    if (shifts.length === 1) {
      setShift(shifts[0]);
      setStep(1);
    } else {
      setStep(0);
    }
  }, [router, lang]);

  const selectShift = (s: Shift) => {
    setShift(s);
    setStep(1);
  };

  const nozzle = shift ? getNozzleById(shift.nozzleId) : null;
  const pump = nozzle ? getPumpById(nozzle.pumpId) : null;
  const fuel = nozzle ? getFuelTypeById(nozzle.fuelTypeId) : null;

  const closingNum = parseFloat(closing);
  const testingNum = parseFloat(testingLiters) || 0;
  const isClosingValid = closing !== "" && !isNaN(closingNum);
  const totalLiters = isClosingValid ? closingNum - (shift?.openingReading || 0) : 0;
  const salesLiters = Math.max(0, totalLiters - testingNum);
  const isReadingError = isClosingValid && closingNum < (shift?.openingReading || 0);
  const expectedAmount = salesLiters * (shift?.fuelRate || fuel?.currentPrice || 0);
  const totalCollected = (parseFloat(cash) || 0) + (parseFloat(upi) || 0) + (parseFloat(card) || 0) + (parseFloat(creditAmount) || 0);
  const discrepancy = expectedAmount - totalCollected;

  const addCreditRow = () => {
    if (newCredit.customerName && newCredit.amount) {
      setCreditRows([...creditRows, { ...newCredit, amount: parseFloat(newCredit.amount) }]);
      const newTotal = creditRows.reduce((s, r) => s + r.amount, 0) + parseFloat(newCredit.amount);
      setCreditAmount(String(newTotal));
      setNewCredit({ customerName: "", vehicleNumber: "", amount: "" });
    }
  };

  const removeCreditRow = (idx: number) => {
    const updated = creditRows.filter((_, i) => i !== idx);
    setCreditRows(updated);
    setCreditAmount(String(updated.reduce((s, r) => s + r.amount, 0) || ""));
  };

  const handleStep1Next = () => {
    if (!isClosingValid) {
      setError(lang === "en" ? "Enter a valid closing reading" : "सही क्लोज़िंग रीडिंग दर्ज करें");
      return;
    }
    if (isReadingError) {
      setError(lang === "en"
        ? `Closing reading (${closingNum}) cannot be less than opening (${shift?.openingReading})`
        : `क्लोज़िंग रीडिंग (${closingNum}) ओपनिंग (${shift?.openingReading}) से कम नहीं हो सकती`);
      return;
    }
    setError("");
    setStep(2);
  };

  const handleConfirm = () => {
    if (!shift || submitting) return;
    setSubmitting(true);
    try {
      endShift(
        shift.id,
        closingNum,
        photo,
        {
          cash: parseFloat(cash) || 0,
          upi: parseFloat(upi) || 0,
          card: parseFloat(card) || 0,
          credit: parseFloat(creditAmount) || 0,
        },
        testingNum,
        remarks,
        creditRows.length > 0 ? creditRows : undefined
      );
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error");
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-scale-in">
        <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-xl shadow-green-200/50">
          <Check className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-xl font-extrabold text-green-700">{t("shift_ended")}!</h2>
        <p className="text-gray-400 font-medium">{formatCurrency(totalCollected)} {t("total_collected")}</p>
      </div>
    );
  }

  if (activeShifts.length === 0 && !shift) {
    return (
      <div className="max-w-lg mx-auto mt-10 animate-fade-in">
        <div className="glass-card border-l-4 border-l-amber-400 rounded-2xl p-6 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <p className="text-amber-700 font-semibold">{error || t("no_active_shift")}</p>
        </div>
      </div>
    );
  }

  /* Step 0: Multi-shift selection */
  if (step === 0 && activeShifts.length > 1) {
    return (
      <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
        <h2 className="text-xl font-extrabold text-gray-800 tracking-tight">
          {lang === "hi" ? "कौन सी शिफ्ट समाप्त करें?" : "Which shift to end?"}
        </h2>
        <p className="text-sm text-gray-400 font-medium">
          {lang === "hi"
            ? `आपकी ${activeShifts.length} सक्रिय शिफ्ट हैं। एक चुनें।`
            : `You have ${activeShifts.length} active shifts. Select one.`}
        </p>
        <div className="space-y-3 stagger">
          {activeShifts.map(s => {
            const n = getNozzleById(s.nozzleId);
            const p = n ? getPumpById(n.pumpId) : null;
            const f = n ? getFuelTypeById(n.fuelTypeId) : null;
            const isPetrol = f?.name === "Petrol";
            return (
              <button
                key={s.id}
                onClick={() => selectShift(s)}
                className={cn(
                  "w-full text-left glass-card rounded-2xl p-4 transition-all hover:scale-[1.01] active:scale-[0.99] border-l-4",
                  isPetrol ? "border-l-emerald-500 hover:shadow-emerald-100/40" : "border-l-amber-500 hover:shadow-amber-100/40"
                )}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-800">
                      {t("pump")} #{p?.pumpNumber} &rarr; {t("nozzle")} #{n?.nozzleNumber}
                    </p>
                    <p className="text-sm text-gray-400 font-medium">
                      {lang === "hi" ? f?.nameHi : f?.name} @ {formatCurrency(s.fuelRate)}/L
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{lang === "hi" ? "ओपनिंग" : "Opening"}</p>
                    <p className="font-extrabold text-lg text-gray-700">{s.openingReading}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (!shift) {
    return (
      <div className="max-w-lg mx-auto mt-10 animate-fade-in">
        <div className="glass-card border-l-4 border-l-amber-400 rounded-2xl p-6 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <p className="text-amber-700 font-semibold">{error || t("no_active_shift")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        {step > 1 && (
          <button onClick={() => { setStep(step - 1); setError(""); }} className="p-2 hover:bg-white/60 rounded-xl transition-all">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
        )}
        {step === 1 && activeShifts.length > 1 && (
          <button onClick={() => { setShift(null); setStep(0); setError(""); setClosing(""); setTestingLiters("0"); setPhoto(null); }} className="p-2 hover:bg-white/60 rounded-xl transition-all">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
        )}
        <h2 className="text-xl font-extrabold text-gray-800 tracking-tight">{t("end_shift")}</h2>
      </div>

      {/* Steps */}
      <div className="flex gap-2">
        {[1, 2, 3].map(s => (
          <div key={s} className={cn(
            "h-2 flex-1 rounded-full transition-all duration-300",
            s <= step ? "bg-gradient-to-r from-red-400 to-rose-500 shadow-sm shadow-red-200/50" : "bg-gray-200/60"
          )} />
        ))}
      </div>

      {/* Shift info */}
      <div className="glass-card rounded-xl p-3 text-sm flex justify-between items-center">
        <span className="font-medium text-gray-600">{t("pump")} #{pump?.pumpNumber} &rarr; {t("nozzle")} #{nozzle?.nozzleNumber}</span>
        <span className="font-bold text-orange-600 bg-orange-50/60 px-2.5 py-1 rounded-full text-xs">
          {lang === "hi" ? fuel?.nameHi : fuel?.name} @ {formatCurrency(shift.fuelRate)}/L
        </span>
      </div>

      {error && (
        <div className="flex items-center gap-2 glass-card border-l-4 border-l-red-500 text-red-700 px-4 py-3 rounded-xl text-sm font-medium animate-scale-in">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Step 1: Closing reading */}
      {step === 1 && (
        <div className="space-y-6 animate-slide-up">
          <div className="glass-card rounded-xl p-3">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{t("opening_reading")}</p>
            <p className="text-2xl font-extrabold text-gray-300">{shift.openingReading}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-500 mb-2">{t("closing_reading")}</label>
            <input
              type="number"
              value={closing}
              onChange={e => { setClosing(e.target.value); setError(""); }}
              className={cn(
                "w-full px-4 py-4 text-3xl font-extrabold text-center rounded-2xl outline-none transition-all",
                isReadingError
                  ? "border-2 border-red-400 bg-red-50/30 text-red-600"
                  : "border-2 border-gray-200/60 bg-white/60 input-modern"
              )}
              placeholder="00000.00"
              step="0.01"
              inputMode="decimal"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-500 mb-2">
              {lang === "hi" ? "टेस्टिंग मात्रा (L)" : "Testing Qty (L)"}
            </label>
            <input
              type="number"
              value={testingLiters}
              onChange={e => setTestingLiters(e.target.value)}
              className="w-full px-4 py-3 text-lg font-bold text-center border-2 border-gray-200/60 bg-white/60 rounded-2xl input-modern"
              placeholder="0"
              step="0.01"
              min="0"
              inputMode="decimal"
            />
          </div>

          {isReadingError && (
            <div className="glass-card border-l-4 border-l-red-500 rounded-xl p-3 text-sm text-red-600 font-semibold animate-scale-in">
              {lang === "hi"
                ? `क्लोज़िंग रीडिंग ओपनिंग (${shift.openingReading}) से कम है!`
                : `Closing reading is less than opening (${shift.openingReading})!`}
            </div>
          )}

          {isClosingValid && !isReadingError && (
            <div className="glass-card rounded-2xl overflow-hidden animate-scale-in">
              <div className="h-1 bg-gradient-to-r from-blue-400 to-indigo-500" />
              <div className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 font-medium">{t("total_liters")}</span>
                  <span className="font-bold text-blue-700">{totalLiters.toFixed(2)} L</span>
                </div>
                {testingNum > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">{lang === "hi" ? "टेस्टिंग" : "Testing"}</span>
                    <span className="font-medium text-gray-400">-{testingNum.toFixed(2)} L</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 font-medium">{lang === "hi" ? "बिक्री लीटर" : "Sales"}</span>
                  <span className="font-bold text-blue-700">{salesLiters.toFixed(2)} L</span>
                </div>
                <div className="flex justify-between text-sm border-t border-gray-100/60 pt-2 mt-1">
                  <span className="text-gray-400 font-medium">{t("total_amount")}</span>
                  <span className="font-extrabold text-blue-700 text-lg">{formatCurrency(expectedAmount)}</span>
                </div>
                <p className="text-[10px] text-gray-300 text-right">{salesLiters.toFixed(2)} L x {formatCurrency(shift.fuelRate)}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-500 mb-2">{t("upload_photo")}</label>
            <ImageUpload onUpload={setPhoto} value={photo} />
          </div>

          <button
            onClick={handleStep1Next}
            disabled={!isClosingValid || isReadingError}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:from-gray-300 disabled:to-gray-300 text-white text-lg font-bold rounded-xl transition-all shadow-lg shadow-orange-200/40 disabled:shadow-none hover:scale-[1.01] active:scale-[0.99]"
          >
            {t("next")} &rarr;
          </button>
        </div>
      )}

      {/* Step 2: Payment breakdown */}
      {step === 2 && (
        <div className="space-y-5 animate-slide-up">
          <p className="text-gray-500 font-semibold text-sm uppercase tracking-wide">{t("payment_breakdown")}</p>

          {/* Expected amount hero */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-orange-400 to-amber-500" />
            <div className="p-5 text-center">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{t("total_amount")} ({salesLiters.toFixed(2)}L x {formatCurrency(shift.fuelRate)})</p>
              <p className="text-4xl font-black gradient-text mt-1">{formatCurrency(expectedAmount)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: t("cash"), value: cash, set: setCash, color: "border-l-emerald-500", bg: "bg-emerald-50/30" },
              { label: t("upi"), value: upi, set: setUpi, color: "border-l-purple-500", bg: "bg-purple-50/30" },
              { label: t("card"), value: card, set: setCard, color: "border-l-blue-500", bg: "bg-blue-50/30" },
              { label: t("credit"), value: creditAmount, set: setCreditAmount, readOnly: creditRows.length > 0, color: "border-l-red-500", bg: "bg-red-50/30" },
            ].map(field => (
              <div key={field.label} className={cn("rounded-xl border-l-4 p-3", field.color, field.bg)}>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">{field.label}</label>
                <input
                  type="number"
                  value={field.value}
                  onChange={e => field.set(e.target.value)}
                  readOnly={"readOnly" in field && field.readOnly}
                  className="w-full px-3 py-2.5 text-lg font-bold border-2 border-gray-200/50 bg-white/60 rounded-xl input-modern"
                  placeholder="0"
                  inputMode="numeric"
                />
              </div>
            ))}
          </div>

          {/* Credit entries */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t("credit")} {t("customer_name")}</p>
            {creditRows.map((row, i) => (
              <div key={i} className="flex items-center gap-2 glass-card border-l-4 border-l-red-400 rounded-xl p-3 text-sm animate-scale-in">
                <span className="flex-1 font-medium text-gray-700">{row.customerName} <span className="text-gray-400">({row.vehicleNumber})</span></span>
                <span className="font-bold text-red-600">{formatCurrency(row.amount)}</span>
                <button onClick={() => removeCreditRow(i)} className="text-red-400 p-1.5 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <div className="grid grid-cols-3 gap-2">
              <input value={newCredit.customerName} onChange={e => setNewCredit({ ...newCredit, customerName: e.target.value })}
                placeholder={t("customer_name")} className="px-3 py-2.5 border-2 border-gray-200/50 bg-white/60 rounded-xl text-sm input-modern" />
              <input value={newCredit.vehicleNumber} onChange={e => setNewCredit({ ...newCredit, vehicleNumber: e.target.value })}
                placeholder={t("vehicle_number")} className="px-3 py-2.5 border-2 border-gray-200/50 bg-white/60 rounded-xl text-sm input-modern" />
              <div className="flex gap-1.5">
                <input value={newCredit.amount} onChange={e => setNewCredit({ ...newCredit, amount: e.target.value })}
                  placeholder="₹" type="number" className="px-3 py-2.5 border-2 border-gray-200/50 bg-white/60 rounded-xl text-sm flex-1 input-modern" />
                <button onClick={addCreditRow} className="px-3 bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-xl shadow-md shadow-orange-200/40 hover:scale-105 active:scale-95 transition-transform"><Plus className="w-4 h-4" /></button>
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
              {lang === "hi" ? "टिप्पणी" : "Remarks"}
            </label>
            <textarea
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              className="w-full px-3 py-3 border-2 border-gray-200/50 bg-white/60 rounded-xl input-modern text-sm"
              rows={3}
              placeholder={lang === "hi" ? "कोई टिप्पणी लिखें (वैकल्पिक)" : "Add any remarks (optional)"}
            />
          </div>

          {/* Discrepancy */}
          <div className={cn(
            "glass-card rounded-2xl p-5 text-center",
            Math.abs(discrepancy) < 10 ? "border-green-200/50" : discrepancy > 0 ? "border-red-200/50" : "border-amber-200/50"
          )}>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{t("discrepancy")}</p>
            <p className={cn(
              "text-3xl font-black mt-1",
              Math.abs(discrepancy) < 10 ? "text-green-600" : discrepancy > 0 ? "text-red-600" : "text-amber-600"
            )}>
              {discrepancy > 0 ? "-" : discrepancy < 0 ? "+" : ""}{formatCurrency(Math.abs(discrepancy))}
            </p>
            <p className={cn(
              "text-xs font-semibold mt-0.5",
              Math.abs(discrepancy) < 10 ? "text-green-500" : discrepancy > 0 ? "text-red-500" : "text-amber-500"
            )}>
              {discrepancy > 10 ? (lang === "en" ? "SHORT" : "कमी") : discrepancy < -10 ? (lang === "en" ? "EXCESS" : "अधिक") : (lang === "en" ? "MATCHED" : "मिलान")}
            </p>
          </div>

          <button
            onClick={() => setStep(3)}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-lg font-bold rounded-xl transition-all shadow-lg shadow-orange-200/40 hover:scale-[1.01] active:scale-[0.99]"
          >
            {t("next")} &rarr;
          </button>
        </div>
      )}

      {/* Step 3: Final confirm */}
      {step === 3 && (
        <div className="space-y-6 animate-slide-up">
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-red-400 to-rose-500" />
            <div className="p-6 space-y-0">
              <h3 className="font-bold text-lg text-gray-800 mb-3">{t("confirm")}</h3>
              {[
                { label: t("opening_reading"), value: String(shift.openingReading) },
                { label: t("closing_reading"), value: closing, bold: true },
                { label: t("total_liters"), value: `${totalLiters.toFixed(2)} L` },
                ...(testingNum > 0 ? [{ label: lang === "hi" ? "टेस्टिंग" : "Testing", value: `-${testingNum.toFixed(2)} L` }] : []),
                { label: lang === "hi" ? "बिक्री" : "Sales", value: `${salesLiters.toFixed(2)} L` },
                { label: t("price_per_liter"), value: `${formatCurrency(shift.fuelRate)}/L` },
                { label: t("total_amount"), value: formatCurrency(expectedAmount), highlight: true },
                { label: t("cash"), value: formatCurrency(parseFloat(cash) || 0) },
                { label: t("upi"), value: formatCurrency(parseFloat(upi) || 0) },
                { label: t("card"), value: formatCurrency(parseFloat(card) || 0) },
                { label: t("credit"), value: formatCurrency(parseFloat(creditAmount) || 0) },
                { label: t("total_collected"), value: formatCurrency(totalCollected), bold: true },
              ].map((row, i, arr) => (
                <div key={i} className={cn("flex justify-between py-2.5 text-sm", i < arr.length - 1 && "border-b border-gray-100/50")}>
                  <span className="text-gray-400 font-medium">{row.label}</span>
                  <span className={cn(
                    "font-semibold",
                    row.highlight ? "text-orange-600 font-bold" : row.bold ? "font-extrabold text-gray-800" : "text-gray-700"
                  )}>{row.value}</span>
                </div>
              ))}
              <div className={cn("flex justify-between py-3 mt-1 font-extrabold text-lg border-t-2",
                Math.abs(discrepancy) < 10 ? "text-green-600 border-green-200/50" : discrepancy > 0 ? "text-red-600 border-red-200/50" : "text-amber-600 border-amber-200/50"
              )}>
                <span>{t("discrepancy")}</span>
                <span>{discrepancy > 0 ? "-" : discrepancy < 0 ? "+" : ""}{formatCurrency(Math.abs(discrepancy))}</span>
              </div>
              {remarks && (
                <div className="flex justify-between py-2.5 border-t border-gray-100/50 text-sm">
                  <span className="text-gray-400">{lang === "hi" ? "टिप्पणी" : "Remarks"}</span>
                  <span className="text-right max-w-[60%] text-gray-600">{remarks}</span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="w-full py-4 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 disabled:from-gray-400 disabled:to-gray-400 text-white text-lg font-bold rounded-xl transition-all shadow-lg shadow-red-200/50 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
          >
            {submitting
              ? <><Loader2 className="w-5 h-5 animate-spin" /> {lang === "hi" ? "सबमिट हो रहा है..." : "Submitting..."}</>
              : <><Check className="w-5 h-5" /> {t("confirm")} {t("end_shift")}</>
            }
          </button>
        </div>
      )}
    </div>
  );
}
