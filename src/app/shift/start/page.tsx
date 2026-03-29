"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, AlertTriangle, Fuel, Loader2, Lock } from "lucide-react";
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
    const prevReading = getLastClosingReading(nozzle.id);
    setLastReading(prevReading);
    if (prevReading !== null) {
      setReading(String(prevReading));
    } else {
      setReading("");
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-scale-in">
        <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-xl shadow-green-200/50">
          <Check className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-xl font-extrabold text-green-700">{t("shift_started")}!</h2>
        <p className="text-sm text-gray-400">{lang === "hi" ? "डैशबोर्ड पर जा रहे हैं..." : "Redirecting to dashboard..."}</p>
      </div>
    );
  }

  const isReadingLocked = lastReading !== null;

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        {step > 1 && (
          <button onClick={() => { setStep(step - 1); setError(""); }} className="p-2 hover:bg-white/60 rounded-xl transition-all">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
        )}
        <h2 className="text-xl font-extrabold text-gray-800 tracking-tight">{t("start_shift")}</h2>
      </div>

      {/* Steps indicator */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className={cn(
            "h-2 flex-1 rounded-full transition-all duration-300",
            s <= step ? "bg-gradient-to-r from-orange-400 to-amber-500 shadow-sm shadow-orange-200/50" : "bg-gray-200/60"
          )} />
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 glass-card border-l-4 border-l-red-500 text-red-700 px-4 py-3 rounded-xl text-sm font-medium animate-scale-in">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Step 1: Select Pump */}
      {step === 1 && (
        <div className="space-y-4 animate-slide-up">
          <p className="text-gray-500 font-semibold text-sm uppercase tracking-wide">{t("select_pump")}</p>
          <div className="grid grid-cols-2 gap-4">
            {pumps.map(pump => (
              <button
                key={pump.id}
                onClick={() => handleSelectPump(pump)}
                className="group flex flex-col items-center gap-3 p-8 glass-card rounded-2xl hover:bg-white/80 hover:scale-[1.03] active:scale-[0.97] transition-all hover:shadow-lg hover:shadow-orange-100/40"
              >
                <span className="text-5xl font-black gradient-text">{pump.pumpNumber}</span>
                <span className="text-sm text-gray-400 font-medium">{pump.locationLabel}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Select Nozzle */}
      {step === 2 && (
        <div className="space-y-4 animate-slide-up">
          <p className="text-gray-500 font-semibold text-sm">
            <span className="uppercase tracking-wide">{t("pump")} {selectedPump?.pumpNumber}</span> <span className="text-orange-400 mx-1">&rarr;</span> {t("select_nozzle")}
          </p>
          <div className="space-y-3">
            {nozzles.map(nozzle => {
              const fuel = getFuelTypeById(nozzle.fuelTypeId);
              const active = getActiveShiftForNozzle(nozzle.id);
              const isPetrol = fuel?.name === "Petrol";
              return (
                <button
                  key={nozzle.id}
                  onClick={() => handleSelectNozzle(nozzle)}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left border-l-4",
                    active
                      ? "glass-card border-l-red-400 opacity-60"
                      : cn("glass-card hover:scale-[1.01] hover:shadow-lg active:scale-[0.99]",
                          isPetrol ? "border-l-emerald-500 hover:shadow-emerald-100/40" : "border-l-amber-500 hover:shadow-amber-100/40")
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md",
                    isPetrol ? "bg-gradient-to-br from-emerald-400 to-green-500 shadow-emerald-200/50" : "bg-gradient-to-br from-amber-400 to-yellow-500 shadow-amber-200/50"
                  )}>
                    {nozzle.nozzleNumber}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">
                      {t("nozzle")} {nozzle.nozzleNumber}
                    </p>
                    <p className="text-sm text-gray-400 font-medium">
                      {lang === "hi" ? fuel?.nameHi : fuel?.name}
                    </p>
                    <p className="text-sm font-bold text-orange-600 mt-0.5">
                      {formatCurrency(fuel?.currentPrice || 0)}/L
                    </p>
                    {active && (
                      <p className="text-xs text-red-500 mt-1 font-semibold">
                        {lang === "en" ? "In use" : "उपयोग में"}
                      </p>
                    )}
                  </div>
                  <Fuel className={cn("w-5 h-5 ml-auto", isPetrol ? "text-emerald-400" : "text-amber-400")} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3: Enter Reading + Photo */}
      {step === 3 && (
        <div className="space-y-6 animate-slide-up">
          <p className="text-gray-500 font-semibold text-sm uppercase tracking-wide">{t("enter_reading")}</p>

          {isReadingLocked && (
            <div className="glass-card border-l-4 border-l-blue-400 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-400 font-semibold uppercase tracking-wide">{lang === "hi" ? "पिछली क्लोज़िंग रीडिंग" : "Previous Closing"}</p>
                <p className="text-xl font-extrabold text-blue-700 mt-0.5">{lastReading}</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-blue-400 bg-blue-50/60 px-2.5 py-1 rounded-full">
                <Lock className="w-3 h-3" />
                {lang === "hi" ? "लॉक" : "Locked"}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-500 mb-2">{t("opening_reading")}</label>
            <div className="relative">
              <input
                type="number"
                value={reading}
                onChange={e => { if (!isReadingLocked) setReading(e.target.value); }}
                readOnly={isReadingLocked}
                className={cn(
                  "w-full px-4 py-4 text-3xl font-extrabold text-center rounded-2xl outline-none transition-all",
                  isReadingLocked
                    ? "border-2 border-gray-200/60 bg-gray-50/80 text-gray-400 cursor-not-allowed"
                    : "border-2 border-gray-200/60 bg-white/60 input-modern"
                )}
                placeholder="00000.00"
                step="0.01"
                inputMode="decimal"
              />
              {isReadingLocked && (
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
              )}
            </div>
            {isReadingLocked && (
              <p className="text-xs text-gray-400 mt-1.5">
                {lang === "hi"
                  ? "पिछली क्लोज़िंग रीडिंग से ऑटो-सेट। बदला नहीं जा सकता।"
                  : "Auto-set from previous closing reading. Cannot be changed."}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-500 mb-2">{t("upload_photo")}</label>
            <ImageUpload onUpload={setPhoto} value={photo} />
          </div>

          <button
            onClick={() => { if (reading) setStep(4); else setError(lang === "en" ? "Enter reading" : "रीडिंग दर्ज करें"); }}
            disabled={!reading}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:from-gray-300 disabled:to-gray-300 text-white text-lg font-bold rounded-xl transition-all shadow-lg shadow-orange-200/40 hover:shadow-xl disabled:shadow-none hover:scale-[1.01] active:scale-[0.99]"
          >
            {t("next")} &rarr;
          </button>
        </div>
      )}

      {/* Step 4: Confirm */}
      {step === 4 && (
        <div className="space-y-6 animate-slide-up">
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-orange-400 to-amber-500" />
            <div className="p-6 space-y-4">
              <h3 className="font-bold text-lg text-gray-800">{t("confirm")}</h3>
              <div className="space-y-0">
                {[
                  { label: t("pump"), value: `#${selectedPump?.pumpNumber}` },
                  { label: t("nozzle"), value: `#${selectedNozzle?.nozzleNumber}` },
                  { label: t("fuel_type"), value: lang === "hi" ? getFuelTypeById(selectedNozzle?.fuelTypeId || "")?.nameHi : getFuelTypeById(selectedNozzle?.fuelTypeId || "")?.name },
                  { label: t("price_per_liter"), value: `${formatCurrency(getFuelTypeById(selectedNozzle?.fuelTypeId || "")?.currentPrice || 0)}/L`, highlight: true },
                  { label: t("opening_reading"), value: reading, bold: true, locked: isReadingLocked },
                  { label: t("upload_photo"), value: photo ? "Uploaded" : "Skipped" },
                ].map((row, i) => (
                  <div key={i} className={cn("flex justify-between py-3 text-sm", i < 5 && "border-b border-gray-100/60")}>
                    <span className="text-gray-400 font-medium">{row.label}</span>
                    <span className={cn(
                      "font-semibold flex items-center gap-1.5",
                      row.highlight ? "text-orange-600 font-bold" : row.bold ? "text-lg font-extrabold text-gray-800" : "text-gray-700"
                    )}>
                      {row.value}
                      {row.locked && <Lock className="w-3 h-3 text-gray-300" />}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-400 text-white text-lg font-bold rounded-xl transition-all shadow-lg shadow-green-200/50 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
          >
            {submitting
              ? <><Loader2 className="w-5 h-5 animate-spin" /> {lang === "hi" ? "शुरू हो रही है..." : "Starting..."}</>
              : <><Check className="w-5 h-5" /> {t("confirm")} {t("start_shift")}</>
            }
          </button>
        </div>
      )}
    </div>
  );
}
