"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, AlertTriangle, Fuel, Loader2 } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/useLanguage";
import {
  getCurrentUser, getStore, getNozzlesForPump, getActiveShiftForNozzle,
  getFuelTypeById, startShift, getActiveShiftForEmployee, getEmployeeById,
  getLastClosingReading
} from "@/lib/store/data";
import ImageUpload from "@/components/ImageUpload";
import type { Pump, Nozzle } from "@/lib/store/types";

export default function StartShiftPage() {
  const [step, setStep] = useState(1);
  const [pumps, setPumps] = useState<Pump[]>([]);
  const [selectedPump, setSelectedPump] = useState<Pump | null>(null);
  const [nozzles, setNozzles] = useState<Nozzle[]>([]);
  const [selectedNozzle, setSelectedNozzle] = useState<Nozzle | null>(null);
  const [reading, setReading] = useState("");
  const [lastReading, setLastReading] = useState<number | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { lang, t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) { router.replace("/login"); return; }
    // Check if employee already has active shift
    const activeShift = getActiveShiftForEmployee(user.id);
    if (activeShift) {
      setError(lang === "en" ? "You already have an active shift. End it first." : "आपकी पहले से एक शिफ्ट चल रही है। पहले उसे समाप्त करें।");
    }
    const store = getStore();
    setPumps(store.pumps.filter(p => p.status === "active"));
  }, [router, lang]);

  const handleSelectPump = (pump: Pump) => {
    setSelectedPump(pump);
    setNozzles(getNozzlesForPump(pump.id).filter(n => n.status === "active"));
    setStep(2);
  };

  const handleSelectNozzle = (nozzle: Nozzle) => {
    const active = getActiveShiftForNozzle(nozzle.id);
    if (active) {
      const emp = getEmployeeById(active.employeeId);
      setError(lang === "en"
        ? `This nozzle is in use by ${emp?.name || "someone"}`
        : `यह नोज़ल ${emp?.name || "किसी"} द्वारा उपयोग में है`);
      return;
    }
    setError("");
    setSelectedNozzle(nozzle);
    // Auto-fill opening reading from last closing reading of this nozzle
    const prevReading = getLastClosingReading(nozzle.id);
    setLastReading(prevReading);
    if (prevReading !== null) {
      setReading(String(prevReading));
    }
    setStep(3);
  };

  const handleConfirm = () => {
    const user = getCurrentUser();
    if (!user || !selectedNozzle || submitting) return;
    setSubmitting(true);
    try {
      startShift(user.id, selectedNozzle.id, parseFloat(reading), photo);
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error starting shift");
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <Check className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-green-700">{t("shift_started")}!</h2>
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
        <h2 className="text-xl font-bold text-gray-800">{t("start_shift")}</h2>
      </div>

      {/* Steps indicator */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className={cn(
            "h-2 flex-1 rounded-full transition-colors",
            s <= step ? "bg-orange-500" : "bg-gray-200"
          )} />
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Step 1: Select Pump */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-gray-600 font-medium">{t("select_pump")}</p>
          <div className="grid grid-cols-2 gap-4">
            {pumps.map(pump => (
              <button
                key={pump.id}
                onClick={() => handleSelectPump(pump)}
                className="flex flex-col items-center gap-2 p-8 bg-white border-2 border-gray-200 rounded-2xl hover:border-orange-400 hover:bg-orange-50 transition-all shadow-sm"
              >
                <span className="text-4xl font-bold text-orange-600">{pump.pumpNumber}</span>
                <span className="text-sm text-gray-500">{pump.locationLabel}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Select Nozzle */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-gray-600 font-medium">
            {t("pump")} {selectedPump?.pumpNumber} → {t("select_nozzle")}
          </p>
          <div className="space-y-3">
            {nozzles.map(nozzle => {
              const fuel = getFuelTypeById(nozzle.fuelTypeId);
              const active = getActiveShiftForNozzle(nozzle.id);
              return (
                <button
                  key={nozzle.id}
                  onClick={() => handleSelectNozzle(nozzle)}
                  className={cn(
                    "w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left",
                    active
                      ? "border-red-200 bg-red-50 opacity-60"
                      : "border-gray-200 bg-white hover:border-orange-400 hover:bg-orange-50"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg",
                    fuel?.name === "Petrol" ? "bg-green-500" : "bg-yellow-500"
                  )}>
                    {nozzle.nozzleNumber}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      {t("nozzle")} {nozzle.nozzleNumber}
                    </p>
                    <p className="text-sm text-gray-500">
                      {lang === "hi" ? fuel?.nameHi : fuel?.name} — {formatCurrency(fuel?.currentPrice || 0)}/L
                    </p>
                    {active && (
                      <p className="text-xs text-red-500 mt-1 font-medium">
                        {lang === "en" ? "In use" : "उपयोग में"}
                      </p>
                    )}
                  </div>
                  <Fuel className={cn("w-5 h-5 ml-auto", fuel?.name === "Petrol" ? "text-green-500" : "text-yellow-500")} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3: Enter Reading + Photo */}
      {step === 3 && (
        <div className="space-y-6">
          <p className="text-gray-600 font-medium">{t("enter_reading")}</p>

          {/* Previous closing reading hint */}
          {lastReading !== null && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-500 font-medium">{lang === "hi" ? "पिछली क्लोज़िंग रीडिंग" : "Previous Closing Reading"}</p>
                <p className="text-lg font-bold text-blue-700">{lastReading}</p>
              </div>
              <span className="text-xs text-blue-400">{lang === "hi" ? "ऑटो-भरा" : "Auto-filled"} ✓</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">{t("opening_reading")}</label>
            <input
              type="number"
              value={reading}
              onChange={e => setReading(e.target.value)}
              className="w-full px-4 py-4 text-3xl font-bold text-center border-2 border-gray-200 rounded-2xl focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
              placeholder="00000.00"
              step="0.01"
              inputMode="decimal"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">{t("upload_photo")}</label>
            <ImageUpload onUpload={setPhoto} value={photo} />
          </div>

          {/* Warning if reading is less than previous closing */}
          {lastReading !== null && reading && parseFloat(reading) < lastReading && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600 font-medium">
              ⚠️ {lang === "hi"
                ? `रीडिंग पिछली क्लोज़िंग (${lastReading}) से कम है!`
                : `Reading is less than previous closing (${lastReading})!`}
            </div>
          )}

          <button
            onClick={() => { if (reading) setStep(4); else setError(lang === "en" ? "Enter reading" : "रीडिंग दर्ज करें"); }}
            disabled={!reading}
            className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white text-lg font-semibold rounded-xl transition-colors"
          >
            {t("next")} →
          </button>
        </div>
      )}

      {/* Step 4: Confirm */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="bg-white border-2 border-orange-200 rounded-2xl p-6 space-y-4">
            <h3 className="font-semibold text-lg text-gray-800">{t("confirm")}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">{t("pump")}</span>
                <span className="font-medium">#{selectedPump?.pumpNumber}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">{t("nozzle")}</span>
                <span className="font-medium">#{selectedNozzle?.nozzleNumber}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">{t("fuel_type")}</span>
                <span className="font-medium">{lang === "hi" ? getFuelTypeById(selectedNozzle?.fuelTypeId || "")?.nameHi : getFuelTypeById(selectedNozzle?.fuelTypeId || "")?.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">{t("price_per_liter")}</span>
                <span className="font-bold text-orange-600">₹{getFuelTypeById(selectedNozzle?.fuelTypeId || "")?.currentPrice || 0}/L</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">{t("opening_reading")}</span>
                <span className="font-bold text-lg">{reading}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">{t("upload_photo")}</span>
                <span className="font-medium">{photo ? "✓" : "✗"}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="w-full py-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white text-lg font-semibold rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2"
          >
            {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> {lang === "hi" ? "शुरू हो रही है..." : "Starting..."}</> : <>✓ {t("confirm")} {t("start_shift")}</>}
          </button>
        </div>
      )}
    </div>
  );
}
