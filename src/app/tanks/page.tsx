"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Droplets, Plus, ClipboardList } from "lucide-react";
import { cn, formatCurrency, formatLiters } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { getCurrentUser, getStore, getFuelTypeById, addTankReading, addRefill } from "@/lib/store/data";
import type { Tank, TankReading } from "@/lib/store/types";

export default function TanksPage() {
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [readings, setReadings] = useState<TankReading[]>([]);
  const [showRefill, setShowRefill] = useState<string | null>(null);
  const [showReading, setShowReading] = useState<string | null>(null);
  const [refillQty, setRefillQty] = useState("");
  const [readingForm, setReadingForm] = useState({ opening: "", closing: "", refill: "0", dispensed: "" });
  const { lang, t } = useLanguage();
  const router = useRouter();

  const load = () => {
    const store = getStore();
    setTanks(store.tanks);
    setReadings(store.tankReadings.sort((a, b) => b.date.localeCompare(a.date)));
  };

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== "admin") { router.replace("/login"); return; }
    load();
  }, [router]);

  const handleRefill = (tankId: string) => {
    if (!refillQty) return;
    addRefill(tankId, parseFloat(refillQty));
    setRefillQty("");
    setShowRefill(null);
    load();
  };

  const handleReading = (tankId: string) => {
    const today = new Date().toISOString().split("T")[0];
    addTankReading(tankId, today,
      parseFloat(readingForm.opening), parseFloat(readingForm.closing),
      parseFloat(readingForm.refill) || 0, parseFloat(readingForm.dispensed) || 0);
    setReadingForm({ opening: "", closing: "", refill: "0", dispensed: "" });
    setShowReading(null);
    load();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">{t("tanks")}</h2>

      <div className="grid gap-4 md:grid-cols-2">
        {tanks.map(tank => {
          const fuel = getFuelTypeById(tank.fuelTypeId);
          const pct = (tank.currentLevel / tank.capacityLiters) * 100;
          return (
            <div key={tank.id} className="bg-white rounded-2xl border shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center",
                    fuel?.name === "Petrol" ? "bg-green-100" : "bg-yellow-100")}>
                    <Droplets className={cn("w-5 h-5", fuel?.name === "Petrol" ? "text-green-600" : "text-yellow-600")} />
                  </div>
                  <div>
                    <p className="font-semibold">{lang === "hi" ? fuel?.nameHi : fuel?.name}</p>
                    <p className="text-xs text-gray-400">{formatCurrency(fuel?.currentPrice || 0)}/L</p>
                  </div>
                </div>
                <span className={cn("text-sm font-bold", pct < 20 ? "text-red-500" : pct < 50 ? "text-yellow-500" : "text-green-500")}>
                  {pct.toFixed(0)}%
                </span>
              </div>

              {/* Gauge */}
              <div className="space-y-1">
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all",
                    pct < 20 ? "bg-red-500" : pct < 50 ? "bg-yellow-500" : "bg-green-500")}
                    style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{formatLiters(tank.currentLevel)}</span>
                  <span>{formatLiters(tank.capacityLiters)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => { setShowRefill(showRefill === tank.id ? null : tank.id); setShowReading(null); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-100">
                  <Plus className="w-4 h-4" /> {t("refill")}
                </button>
                <button onClick={() => { setShowReading(showReading === tank.id ? null : tank.id); setShowRefill(null); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-orange-50 text-orange-600 rounded-xl text-sm font-medium hover:bg-orange-100">
                  <ClipboardList className="w-4 h-4" /> {lang === "en" ? "Record" : "रिकॉर्ड"}
                </button>
              </div>

              {/* Refill form */}
              {showRefill === tank.id && (
                <div className="flex gap-2">
                  <input type="number" value={refillQty} onChange={e => setRefillQty(e.target.value)}
                    placeholder="Liters" className="flex-1 px-3 py-2 border rounded-xl text-sm" inputMode="numeric" />
                  <button onClick={() => handleRefill(tank.id)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium">{t("save")}</button>
                </div>
              )}

              {/* Reading form */}
              {showReading === tank.id && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" value={readingForm.opening} onChange={e => setReadingForm({ ...readingForm, opening: e.target.value })}
                      placeholder={t("opening_stock")} className="px-3 py-2 border rounded-xl text-sm" />
                    <input type="number" value={readingForm.closing} onChange={e => setReadingForm({ ...readingForm, closing: e.target.value })}
                      placeholder={t("closing_stock")} className="px-3 py-2 border rounded-xl text-sm" />
                    <input type="number" value={readingForm.refill} onChange={e => setReadingForm({ ...readingForm, refill: e.target.value })}
                      placeholder={t("refill")} className="px-3 py-2 border rounded-xl text-sm" />
                    <input type="number" value={readingForm.dispensed} onChange={e => setReadingForm({ ...readingForm, dispensed: e.target.value })}
                      placeholder={lang === "en" ? "Dispensed" : "निकासी"} className="px-3 py-2 border rounded-xl text-sm" />
                  </div>
                  <button onClick={() => handleReading(tank.id)}
                    className="w-full py-2 bg-orange-500 text-white rounded-xl text-sm font-medium">{t("save")}</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Recent Readings */}
      {readings.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700">{lang === "en" ? "Recent Readings" : "हाल की रीडिंग"}</h3>
          {readings.slice(0, 10).map(r => {
            const tank = tanks.find(t => t.id === r.tankId);
            const fuel = tank ? getFuelTypeById(tank.fuelTypeId) : null;
            return (
              <div key={r.id} className="bg-white rounded-xl border p-3 flex justify-between items-center text-sm">
                <div>
                  <p className="font-medium">{lang === "hi" ? fuel?.nameHi : fuel?.name} — {r.date}</p>
                  <p className="text-xs text-gray-400">O: {r.openingStock} → C: {r.closingStock} | R: {r.refillQuantity} | D: {r.dispensed}</p>
                </div>
                <span className={cn("font-bold", Math.abs(r.variance) > 50 ? "text-red-600" : "text-green-600")}>
                  {r.variance > 0 ? "+" : ""}{r.variance.toFixed(1)}L
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
