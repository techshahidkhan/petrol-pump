"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, RotateCcw, Fuel, AlertTriangle, Check, History } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { getCurrentUser, getStore, updateFuelPrice, resetStore, getPriceHistory, getEmployeeById } from "@/lib/store/data";
import type { FuelType, Pump, PriceChange } from "@/lib/store/types";

export default function SettingsPage() {
  const [fuelTypes, setFuelTypes] = useState<FuelType[]>([]);
  const [pumps, setPumps] = useState<Pump[]>([]);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<PriceChange[]>([]);
  const { lang, t } = useLanguage();
  const router = useRouter();

  const load = () => {
    const store = getStore();
    setFuelTypes(store.fuelTypes);
    setPumps(store.pumps);
    const p: Record<string, string> = {};
    store.fuelTypes.forEach(f => { p[f.id] = String(f.currentPrice); });
    setPrices(p);
    setHistory(getPriceHistory());
  };

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== "admin") { router.replace("/login"); return; }
    load();
  }, [router]);

  const savePrices = () => {
    for (const [id, price] of Object.entries(prices)) {
      updateFuelPrice(id, parseFloat(price));
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    load();
  };

  const handleReset = () => {
    if (confirm(lang === "en" ? "Reset all data? This cannot be undone!" : "सभी डेटा रीसेट करें? यह वापस नहीं होगा!")) {
      resetStore();
      load();
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h2 className="text-2xl font-bold text-gray-800">{t("settings")}</h2>

      {/* Fuel Prices */}
      <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Fuel className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold text-gray-700">{t("fuel_prices")}</h3>
        </div>
        <div className="space-y-3">
          {fuelTypes.map(fuel => (
            <div key={fuel.id} className="flex items-center gap-4">
              <div className="flex-1">
                <p className="font-medium text-gray-700">{lang === "hi" ? fuel.nameHi : fuel.name}</p>
                <p className="text-xs text-gray-400">{t("price_per_liter")}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">&#8377;</span>
                <input
                  type="number"
                  value={prices[fuel.id] || ""}
                  onChange={e => setPrices({ ...prices, [fuel.id]: e.target.value })}
                  className="w-32 px-3 py-2.5 border-2 rounded-xl text-lg font-bold text-right focus:border-orange-400 outline-none"
                  step="0.01"
                />
              </div>
            </div>
          ))}
        </div>
        <button onClick={savePrices}
          className={cn("w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors",
            saved ? "bg-green-500 text-white" : "bg-orange-500 hover:bg-orange-600 text-white")}>
          {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> {t("save")}</>}
        </button>
      </div>

      {/* Price History */}
      {history.length > 0 && (
        <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-700">{lang === "hi" ? "मूल्य इतिहास" : "Price History"}</h3>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {history.slice(0, 20).map(change => {
              const fuel = fuelTypes.find(f => f.id === change.fuelTypeId);
              const admin = getEmployeeById(change.changedBy);
              const dt = new Date(change.changedAt);
              return (
                <div key={change.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">{lang === "hi" ? fuel?.nameHi : fuel?.name}</span>
                    <span className="text-gray-400 ml-2 text-xs">
                      {dt.toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "short" })}
                      {" "}
                      {dt.toLocaleTimeString(lang === "hi" ? "hi-IN" : "en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {admin && <span className="text-gray-400 text-xs ml-1">({admin.name})</span>}
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-red-400 line-through">₹{change.oldPrice}</span>
                    <span className="text-gray-400">→</span>
                    <span className="font-bold text-green-600">₹{change.newPrice}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pumps Overview */}
      <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-4">
        <h3 className="font-semibold text-gray-700">{t("manage_pumps")}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {pumps.map(pump => (
            <div key={pump.id} className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">{pump.pumpNumber}</p>
              <p className="text-xs text-gray-400">{pump.locationLabel}</p>
              <span className={cn("text-xs px-2 py-0.5 rounded-full mt-2 inline-block",
                pump.status === "active" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600")}>
                {pump.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h3 className="font-semibold text-red-700">{lang === "en" ? "Danger Zone" : "खतरनाक क्षेत्र"}</h3>
        </div>
        <p className="text-sm text-red-600">{lang === "en" ? "Reset all data to demo defaults. All shifts, payments, and readings will be lost." : "सभी डेटा डेमो डिफॉल्ट पर रीसेट करें। सभी शिफ्ट, भुगतान और रीडिंग खो जाएंगी।"}</p>
        <button onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium">
          <RotateCcw className="w-4 h-4" /> {lang === "en" ? "Reset All Data" : "सभी डेटा रीसेट करें"}
        </button>
      </div>
    </div>
  );
}
