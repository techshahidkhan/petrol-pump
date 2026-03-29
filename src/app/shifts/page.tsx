"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Filter, Eye, X } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { getCurrentUser, getStore, getEmployeeById, getNozzleById, getPumpById, getFuelTypeById, getPaymentForShift } from "@/lib/store/data";
import type { Shift } from "@/lib/store/types";

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);
  const [viewPhoto, setViewPhoto] = useState<{ open: string; close: string } | null>(null);
  const { lang, t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== "admin") { router.replace("/login"); return; }
    loadShifts();
  }, [router, dateFilter, filter]);

  const loadShifts = () => {
    const store = getStore();
    let filtered = store.shifts;
    if (dateFilter) filtered = filtered.filter(s => s.startedAt.startsWith(dateFilter));
    if (filter !== "all") filtered = filtered.filter(s => s.status === filter);
    setShifts(filtered.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">{t("shifts")}</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-white rounded-xl border px-3 py-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
            className="text-sm outline-none" />
        </div>
        <div className="flex gap-1 bg-white rounded-xl border p-1">
          {(["all", "active", "completed"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn("px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                filter === f ? "bg-orange-500 text-white" : "text-gray-500 hover:bg-gray-100")}>
              {t(f)}
            </button>
          ))}
        </div>
      </div>

      {/* Shifts list */}
      <div className="space-y-3">
        {shifts.length === 0 && (
          <div className="text-center py-12 text-gray-400">{t("no_data")}</div>
        )}
        {shifts.map(shift => {
          const emp = getEmployeeById(shift.employeeId);
          const nozzle = getNozzleById(shift.nozzleId);
          const pump = nozzle ? getPumpById(nozzle.pumpId) : null;
          const fuel = nozzle ? getFuelTypeById(nozzle.fuelTypeId) : null;
          const payment = getPaymentForShift(shift.id);
          const liters = shift.totalLiters || 0;
          const expected = shift.totalAmount || (liters * (fuel?.currentPrice || 0));
          const collected = payment?.totalCollected || 0;
          const disc = expected - collected;

          return (
            <div key={shift.id} className={cn(
              "bg-white rounded-2xl border p-4 shadow-sm",
              shift.status === "active" ? "border-blue-200" :
              Math.abs(disc) < 10 ? "border-green-200" :
              disc > 0 ? "border-red-200" : "border-yellow-200"
            )}>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="font-semibold text-gray-800">{emp?.name || "?"}</p>
                  <p className="text-sm text-gray-500">
                    {t("pump")} #{pump?.pumpNumber} → {t("nozzle")} #{nozzle?.nozzleNumber} ({lang === "hi" ? fuel?.nameHi : fuel?.name})
                    {shift.fuelRate > 0 && <span className="ml-1 text-gray-400">@ ₹{shift.fuelRate}/L</span>}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(shift.startedAt).toLocaleTimeString(lang === "hi" ? "hi-IN" : "en-IN", { hour: "2-digit", minute: "2-digit" })}
                    {shift.endedAt && ` — ${new Date(shift.endedAt).toLocaleTimeString(lang === "hi" ? "hi-IN" : "en-IN", { hour: "2-digit", minute: "2-digit" })}`}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <span className={cn("text-xs px-2 py-1 rounded-full font-medium",
                    shift.status === "active" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600")}>
                    {t(shift.status)}
                  </span>
                  {shift.status === "completed" && (
                    <>
                      <p className="text-sm font-bold">{liters.toFixed(1)} L</p>
                      <p className="text-sm font-medium text-gray-600">{formatCurrency(expected)}</p>
                    </>
                  )}
                </div>
              </div>

              {shift.status === "completed" && payment && (
                <div className="mt-3 pt-3 border-t flex items-center justify-between">
                  <div className="flex gap-3 text-xs">
                    {payment.cash > 0 && <span className="px-2 py-1 bg-green-50 text-green-600 rounded">Cash {formatCurrency(payment.cash)}</span>}
                    {payment.upi > 0 && <span className="px-2 py-1 bg-purple-50 text-purple-600 rounded">UPI {formatCurrency(payment.upi)}</span>}
                    {payment.card > 0 && <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded">Card {formatCurrency(payment.card)}</span>}
                    {payment.credit > 0 && <span className="px-2 py-1 bg-red-50 text-red-600 rounded">Credit {formatCurrency(payment.credit)}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {Math.abs(disc) > 10 && (
                      <span className={cn("text-xs font-bold", disc > 0 ? "text-red-600" : "text-yellow-600")}>
                        {disc > 0 ? `-${formatCurrency(disc)}` : `+${formatCurrency(Math.abs(disc))}`}
                      </span>
                    )}
                    {(shift.openingPhotoUrl || shift.closingPhotoUrl) && (
                      <button onClick={() => setViewPhoto({ open: shift.openingPhotoUrl || "", close: shift.closingPhotoUrl || "" })}
                        className="p-1.5 hover:bg-gray-100 rounded-lg">
                        <Eye className="w-4 h-4 text-gray-400" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {shift.status === "active" && (
                <div className="mt-3 pt-3 border-t text-sm text-gray-500">
                  {t("opening_reading")}: <span className="font-bold">{shift.openingReading}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Photo modal */}
      {viewPhoto && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setViewPhoto(null)}>
          <div className="bg-white rounded-2xl p-4 max-w-lg w-full space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">{lang === "en" ? "Meter Photos" : "मीटर फोटो"}</h3>
              <button onClick={() => setViewPhoto(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">{t("opening_reading")}</p>
                {viewPhoto.open ? <img src={viewPhoto.open} className="rounded-xl w-full" alt="Opening" /> : <div className="bg-gray-100 rounded-xl h-32 flex items-center justify-center text-gray-400 text-sm">No photo</div>}
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">{t("closing_reading")}</p>
                {viewPhoto.close ? <img src={viewPhoto.close} className="rounded-xl w-full" alt="Closing" /> : <div className="bg-gray-100 rounded-xl h-32 flex items-center justify-center text-gray-400 text-sm">No photo</div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
