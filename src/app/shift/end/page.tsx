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
  const [step, setStep] = useState(0); // 0 = shift selection (if multiple), 1-3 = existing steps
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
      setStep(0); // show selection screen
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <Check className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-green-700">{t("shift_ended")}!</h2>
        <p className="text-gray-500">{formatCurrency(totalCollected)} {t("total_collected")}</p>
      </div>
    );
  }

  if (activeShifts.length === 0 && !shift) {
    return (
      <div className="max-w-lg mx-auto mt-10">
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center">
          <AlertTriangle className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
          <p className="text-yellow-700 font-medium">{error || t("no_active_shift")}</p>
        </div>
      </div>
    );
  }

  /* Step 0: Multi-shift selection screen */
  if (step === 0 && activeShifts.length > 1) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-800">
            {lang === "hi" ? "कौन सी शिफ्ट समाप्त करें?" : "Which shift to end?"}
          </h2>
        </div>
        <p className="text-sm text-gray-500">
          {lang === "hi"
            ? `आपकी ${activeShifts.length} सक्रिय शिफ्ट हैं। एक चुनें।`
            : `You have ${activeShifts.length} active shifts. Select one.`}
        </p>
        <div className="space-y-3">
          {activeShifts.map(s => {
            const n = getNozzleById(s.nozzleId);
            const p = n ? getPumpById(n.pumpId) : null;
            const f = n ? getFuelTypeById(n.fuelTypeId) : null;
            return (
              <button
                key={s.id}
                onClick={() => selectShift(s)}
                className="w-full text-left bg-white border-2 border-gray-200 hover:border-orange-400 rounded-2xl p-4 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-800">
                      {t("pump")} #{p?.pumpNumber} → {t("nozzle")} #{n?.nozzleNumber}
                    </p>
                    <p className="text-sm text-gray-500">
                      {lang === "hi" ? f?.nameHi : f?.name} @ ₹{s.fuelRate}/L
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{lang === "hi" ? "ओपनिंग रीडिंग" : "Opening"}</p>
                    <p className="font-bold text-lg text-gray-700">{s.openingReading}</p>
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
      <div className="max-w-lg mx-auto mt-10">
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center">
          <AlertTriangle className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
          <p className="text-yellow-700 font-medium">{error || t("no_active_shift")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        {step > 1 && (
          <button onClick={() => { setStep(step - 1); setError(""); }} className="p-2 hover:bg-gray-100 rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        {step === 1 && activeShifts.length > 1 && (
          <button onClick={() => { setShift(null); setStep(0); setError(""); setClosing(""); setTestingLiters("0"); setPhoto(null); }} className="p-2 hover:bg-gray-100 rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h2 className="text-xl font-bold text-gray-800">{t("end_shift")}</h2>
      </div>

      {/* Steps indicator */}
      <div className="flex gap-2">
        {[1, 2, 3].map(s => (
          <div key={s} className={cn("h-2 flex-1 rounded-full", s <= step ? "bg-red-500" : "bg-gray-200")} />
        ))}
      </div>

      {/* Shift info bar */}
      <div className="bg-gray-50 rounded-xl p-3 text-sm flex justify-between">
        <span>{t("pump")} #{pump?.pumpNumber} → {t("nozzle")} #{nozzle?.nozzleNumber}</span>
        <span className="font-medium">{lang === "hi" ? fuel?.nameHi : fuel?.name} @ ₹{shift.fuelRate}/L</span>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Step 1: Closing reading + testing qty + photo */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">{t("opening_reading")}</label>
            <p className="text-2xl font-bold text-gray-400">{shift.openingReading}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">{t("closing_reading")}</label>
            <input
              type="number"
              value={closing}
              onChange={e => { setClosing(e.target.value); setError(""); }}
              className={cn(
                "w-full px-4 py-4 text-3xl font-bold text-center border-2 rounded-2xl focus:ring-2 outline-none",
                isReadingError
                  ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                  : "border-gray-200 focus:border-red-400 focus:ring-red-100"
              )}
              placeholder="00000.00"
              step="0.01"
              inputMode="decimal"
            />
          </div>

          {/* Testing Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">
              {lang === "hi" ? "टेस्टिंग मात्रा (L)" : "Testing Qty (L)"}
            </label>
            <input
              type="number"
              value={testingLiters}
              onChange={e => setTestingLiters(e.target.value)}
              className="w-full px-4 py-3 text-lg font-bold text-center border-2 border-gray-200 rounded-2xl focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none"
              placeholder="0"
              step="0.01"
              min="0"
              inputMode="decimal"
            />
          </div>

          {/* Reading error warning */}
          {isReadingError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600 font-medium">
              ⚠️ {lang === "hi"
                ? `क्लोज़िंग रीडिंग ओपनिंग (${shift.openingReading}) से कम है!`
                : `Closing reading is less than opening (${shift.openingReading})!`}
            </div>
          )}

          {isClosingValid && !isReadingError && (
            <div className="bg-blue-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t("total_liters")}</span>
                <span className="font-bold text-blue-700">{totalLiters.toFixed(2)} L</span>
              </div>
              {testingNum > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{lang === "hi" ? "टेस्टिंग मात्रा" : "Testing Qty"}</span>
                  <span className="font-medium text-gray-500">-{testingNum.toFixed(2)} L</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{lang === "hi" ? "बिक्री लीटर" : "Sales Liters"}</span>
                <span className="font-bold text-blue-700">{salesLiters.toFixed(2)} L</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t("price_per_liter")}</span>
                <span className="font-medium text-gray-600">₹{shift.fuelRate}/L</span>
              </div>
              <div className="flex justify-between text-sm border-t border-blue-200 pt-2">
                <span className="text-gray-500">{t("total_amount")}</span>
                <span className="font-bold text-blue-700">{formatCurrency(expectedAmount)}</span>
              </div>
              <p className="text-xs text-blue-400 text-right">{salesLiters.toFixed(2)} L × ₹{shift.fuelRate} = {formatCurrency(expectedAmount)}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">{t("upload_photo")}</label>
            <ImageUpload onUpload={setPhoto} value={photo} />
          </div>
          <button
            onClick={handleStep1Next}
            disabled={!isClosingValid || isReadingError}
            className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white text-lg font-semibold rounded-xl"
          >
            {t("next")} →
          </button>
        </div>
      )}

      {/* Step 2: Payment breakdown */}
      {step === 2 && (
        <div className="space-y-5">
          <p className="text-gray-600 font-medium">{t("payment_breakdown")}</p>
          <div className="bg-orange-50 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-500">{t("total_amount")} ({salesLiters.toFixed(2)}L × ₹{shift.fuelRate})</p>
            <p className="text-3xl font-bold text-orange-600">{formatCurrency(expectedAmount)}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: t("cash"), value: cash, set: setCash },
              { label: t("upi"), value: upi, set: setUpi },
              { label: t("card"), value: card, set: setCard },
              { label: t("credit"), value: creditAmount, set: setCreditAmount, readOnly: creditRows.length > 0 },
            ].map(field => (
              <div key={field.label}>
                <label className="block text-sm font-medium text-gray-500 mb-1">{field.label}</label>
                <input
                  type="number"
                  value={field.value}
                  onChange={e => field.set(e.target.value)}
                  readOnly={"readOnly" in field && field.readOnly}
                  className="w-full px-3 py-3 text-lg font-bold border-2 border-gray-200 rounded-xl focus:border-orange-400 outline-none"
                  placeholder="0"
                  inputMode="numeric"
                />
              </div>
            ))}
          </div>

          {/* Credit entries */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-500">{t("credit")} {t("customer_name")}</p>
            {creditRows.map((row, i) => (
              <div key={i} className="flex items-center gap-2 bg-red-50 rounded-lg p-2 text-sm">
                <span className="flex-1">{row.customerName} ({row.vehicleNumber})</span>
                <span className="font-bold">{formatCurrency(row.amount)}</span>
                <button onClick={() => removeCreditRow(i)} className="text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <div className="grid grid-cols-3 gap-2">
              <input value={newCredit.customerName} onChange={e => setNewCredit({ ...newCredit, customerName: e.target.value })}
                placeholder={t("customer_name")} className="px-2 py-2 border rounded-lg text-sm" />
              <input value={newCredit.vehicleNumber} onChange={e => setNewCredit({ ...newCredit, vehicleNumber: e.target.value })}
                placeholder={t("vehicle_number")} className="px-2 py-2 border rounded-lg text-sm" />
              <div className="flex gap-1">
                <input value={newCredit.amount} onChange={e => setNewCredit({ ...newCredit, amount: e.target.value })}
                  placeholder="₹" type="number" className="px-2 py-2 border rounded-lg text-sm flex-1" />
                <button onClick={addCreditRow} className="px-2 bg-orange-500 text-white rounded-lg"><Plus className="w-4 h-4" /></button>
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              {lang === "hi" ? "टिप्पणी" : "Remarks"}
            </label>
            <textarea
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              className="w-full px-3 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-400 outline-none text-sm"
              rows={3}
              placeholder={lang === "hi" ? "कोई टिप्पणी लिखें (वैकल्पिक)" : "Add any remarks (optional)"}
            />
          </div>

          {/* Discrepancy display */}
          <div className={cn(
            "rounded-xl p-4 text-center",
            Math.abs(discrepancy) < 10 ? "bg-green-50" : discrepancy > 0 ? "bg-red-50" : "bg-yellow-50"
          )}>
            <p className="text-sm text-gray-500">{t("discrepancy")}</p>
            <p className={cn(
              "text-2xl font-bold",
              Math.abs(discrepancy) < 10 ? "text-green-600" : discrepancy > 0 ? "text-red-600" : "text-yellow-600"
            )}>
              {discrepancy > 0 ? "-" : discrepancy < 0 ? "+" : ""}{formatCurrency(Math.abs(discrepancy))}
              {discrepancy > 10 && <span className="text-sm ml-1">({lang === "en" ? "SHORT" : "कमी"})</span>}
              {discrepancy < -10 && <span className="text-sm ml-1">({lang === "en" ? "EXCESS" : "अधिक"})</span>}
              {Math.abs(discrepancy) < 10 && <span className="text-sm ml-1">✓</span>}
            </p>
          </div>

          <button
            onClick={() => setStep(3)}
            className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white text-lg font-semibold rounded-xl"
          >
            {t("next")} →
          </button>
        </div>
      )}

      {/* Step 3: Final confirm */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-white border-2 border-red-200 rounded-2xl p-6 space-y-3">
            <h3 className="font-semibold text-lg text-gray-800">{t("confirm")}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b"><span className="text-gray-500">{t("opening_reading")}</span><span className="font-medium">{shift.openingReading}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-gray-500">{t("closing_reading")}</span><span className="font-bold text-lg">{closing}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-gray-500">{t("total_liters")}</span><span className="font-bold">{totalLiters.toFixed(2)} L</span></div>
              {testingNum > 0 && (
                <div className="flex justify-between py-2 border-b"><span className="text-gray-500">{lang === "hi" ? "टेस्टिंग मात्रा" : "Testing Qty"}</span><span className="font-medium">-{testingNum.toFixed(2)} L</span></div>
              )}
              <div className="flex justify-between py-2 border-b"><span className="text-gray-500">{lang === "hi" ? "बिक्री लीटर" : "Sales Liters"}</span><span className="font-bold">{salesLiters.toFixed(2)} L</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-gray-500">{t("price_per_liter")}</span><span className="font-medium">₹{shift.fuelRate}/L</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-gray-500">{t("total_amount")}</span><span className="font-bold">{formatCurrency(expectedAmount)}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-gray-500">{t("cash")}</span><span>{formatCurrency(parseFloat(cash) || 0)}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-gray-500">{t("upi")}</span><span>{formatCurrency(parseFloat(upi) || 0)}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-gray-500">{t("card")}</span><span>{formatCurrency(parseFloat(card) || 0)}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-gray-500">{t("credit")}</span><span>{formatCurrency(parseFloat(creditAmount) || 0)}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-gray-500">{t("total_collected")}</span><span className="font-bold">{formatCurrency(totalCollected)}</span></div>
              <div className={cn("flex justify-between py-2 font-bold",
                Math.abs(discrepancy) < 10 ? "text-green-600" : discrepancy > 0 ? "text-red-600" : "text-yellow-600"
              )}>
                <span>{t("discrepancy")}</span>
                <span>{discrepancy > 0 ? "-" : discrepancy < 0 ? "+" : ""}{formatCurrency(Math.abs(discrepancy))}</span>
              </div>
              {remarks && (
                <div className="flex justify-between py-2 border-t">
                  <span className="text-gray-500">{lang === "hi" ? "टिप्पणी" : "Remarks"}</span>
                  <span className="text-right max-w-[60%] text-gray-700">{remarks}</span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="w-full py-4 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white text-lg font-semibold rounded-xl shadow-lg flex items-center justify-center gap-2"
          >
            {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> {lang === "hi" ? "सबमिट हो रहा है..." : "Submitting..."}</> : <>✓ {t("confirm")} {t("end_shift")}</>}
          </button>
        </div>
      )}
    </div>
  );
}
