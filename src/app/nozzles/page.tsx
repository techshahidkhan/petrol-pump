"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Fuel, ChevronDown, ChevronUp, Check, AlertTriangle } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/useLanguage";
import {
  getCurrentUser, getAllNozzlesWithStatus, getNozzleReadingChain,
  getEmployeeById, getPaymentForShift,
} from "@/lib/store/data";
import type { Shift } from "@/lib/store/types";

interface NozzleWithStatus {
  id: string; pumpId: string; nozzleNumber: number; fuelTypeId: string;
  status: "active" | "inactive"; initialReading: number;
  pump: { id: string; pumpNumber: number; locationLabel: string; status: string } | undefined;
  fuel: { id: string; name: string; nameHi: string; currentPrice: number; unit: string } | undefined;
  currentReading: number; activeShift: Shift | undefined;
  activeEmployee: { id: string; name: string } | undefined;
}

export default function NozzlesPage() {
  const [nozzles, setNozzles] = useState<NozzleWithStatus[]>([]);
  const [expandedNozzle, setExpandedNozzle] = useState<string | null>(null);
  const [chainData, setChainData] = useState<{ shifts: Shift[]; isChainValid: boolean } | null>(null);
  const { lang } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== "admin") { router.replace("/login"); return; }
    loadNozzles();
  }, [router]);

  const loadNozzles = () => {
    setNozzles(getAllNozzlesWithStatus() as NozzleWithStatus[]);
  };

  const toggleExpand = (nozzleId: string) => {
    if (expandedNozzle === nozzleId) { setExpandedNozzle(null); setChainData(null); return; }
    setExpandedNozzle(nozzleId);
    setChainData(getNozzleReadingChain(nozzleId));
  };

  const grouped = nozzles.reduce<Record<string, NozzleWithStatus[]>>((acc, n) => {
    const key = n.pump ? `${n.pump.pumpNumber}` : "?";
    if (!acc[key]) acc[key] = [];
    acc[key].push(n);
    return acc;
  }, {});

  const sortedKeys = Object.keys(grouped).sort((a, b) => Number(a) - Number(b));

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-200/40">
          <Fuel className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-gray-800 tracking-tight">
            {lang === "hi" ? "नोज़ल और रीडिंग" : "Nozzles & Readings"}
          </h2>
          <p className="text-xs text-gray-400 font-medium">{lang === "hi" ? "मशीन-वार रीडिंग चेन" : "Machine-wise reading chain"}</p>
        </div>
      </div>

      {sortedKeys.map(pumpKey => {
        const pumpNozzles = grouped[pumpKey];
        const pump = pumpNozzles[0]?.pump;

        return (
          <div key={pumpKey} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-100/60 px-3 py-1 rounded-full">
                {lang === "hi" ? `पंप #${pumpKey}` : `Pump #${pumpKey}`}
              </span>
              {pump && <span className="text-[10px] text-gray-300">{pump.locationLabel}</span>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 stagger">
              {pumpNozzles.map(nozzle => {
                const isExpanded = expandedNozzle === nozzle.id;
                const fuelName = lang === "hi" ? nozzle.fuel?.nameHi || nozzle.fuel?.name || "?" : nozzle.fuel?.name || "?";
                const isPetrol = nozzle.fuel?.name?.toLowerCase() === "petrol";
                const isActive = !!nozzle.activeShift;

                return (
                  <div key={nozzle.id} className={cn("col-span-1", isExpanded && "sm:col-span-2")}>
                    <button
                      onClick={() => toggleExpand(nozzle.id)}
                      className={cn(
                        "w-full text-left glass-card rounded-2xl p-4 transition-all hover-lift border-l-4",
                        isPetrol ? "border-l-emerald-500" : "border-l-amber-500",
                        isActive && "ring-1 ring-blue-200/50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <p className="text-lg font-extrabold text-gray-800">P{pumpKey}-N{nozzle.nozzleNumber}</p>
                          <span className={cn(
                            "inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full",
                            isPetrol ? "bg-emerald-100/80 text-emerald-700" : "bg-amber-100/80 text-amber-700"
                          )}>{fuelName}</span>
                          <div>
                            {isActive ? (
                              <span className="inline-flex items-center text-xs font-semibold text-blue-600 bg-blue-50/80 px-2.5 py-1 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5 animate-pulse" />
                                {lang === "hi" ? "सक्रिय" : "Active"} - {nozzle.activeEmployee?.name || "?"}
                              </span>
                            ) : (
                              <span className="text-xs font-medium text-gray-300 bg-gray-100/60 px-2.5 py-1 rounded-full">
                                {lang === "hi" ? "निष्क्रिय" : "Idle"}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                              {lang === "hi" ? "रीडिंग" : "Reading"}
                            </p>
                            <p className="text-2xl font-black text-gray-800 tabular-nums">{nozzle.currentReading.toFixed(2)}</p>
                          </div>
                          {isExpanded
                            ? <ChevronUp className="w-5 h-5 text-gray-300 flex-shrink-0" />
                            : <ChevronDown className="w-5 h-5 text-gray-300 flex-shrink-0" />
                          }
                        </div>
                      </div>
                    </button>

                    {isExpanded && chainData && (
                      <div className="mt-2 glass-card rounded-2xl overflow-hidden animate-scale-in">
                        <div className={cn("h-1", isPetrol ? "bg-gradient-to-r from-emerald-400 to-green-500" : "bg-gradient-to-r from-amber-400 to-yellow-500")} />
                        <div className="p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            {chainData.isChainValid ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50/80 px-3 py-1.5 rounded-full">
                                <Check className="w-3.5 h-3.5" /> {lang === "hi" ? "चेन मान्य" : "Chain Valid"}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-50/80 px-3 py-1.5 rounded-full">
                                <AlertTriangle className="w-3.5 h-3.5" /> {lang === "hi" ? "चेन टूटी" : "Chain Broken"}
                              </span>
                            )}
                            <span className="text-[10px] text-gray-300 font-medium">{chainData.shifts.length} {lang === "hi" ? "शिफ्ट" : "shift(s)"}</span>
                          </div>

                          {chainData.shifts.length === 0 ? (
                            <p className="text-sm text-gray-300 text-center py-6 font-medium">
                              {lang === "hi" ? "इस नोज़ल के लिए कोई शिफ्ट नहीं" : "No shifts recorded for this nozzle"}
                            </p>
                          ) : (
                            <div className="overflow-x-auto -mx-4 px-4">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="text-left text-[10px] text-gray-400 font-semibold uppercase tracking-wider border-b border-gray-100/50">
                                    <th className="pb-2 pr-3">{lang === "hi" ? "दिनांक" : "Date"}</th>
                                    <th className="pb-2 pr-3">{lang === "hi" ? "कर्मचारी" : "Employee"}</th>
                                    <th className="pb-2 pr-3 text-right">{lang === "hi" ? "ओपनिंग" : "Open"}</th>
                                    <th className="pb-2 pr-3 text-right">{lang === "hi" ? "क्लोज़िंग" : "Close"}</th>
                                    <th className="pb-2 pr-3 text-right">{lang === "hi" ? "लीटर" : "Ltrs"}</th>
                                    <th className="pb-2 pr-3 text-right">{lang === "hi" ? "टेस्ट" : "Test"}</th>
                                    <th className="pb-2 pr-3 text-right">{lang === "hi" ? "बिक्री" : "Sales"}</th>
                                    <th className="pb-2 pr-3 text-right">{lang === "hi" ? "दर" : "Rate"}</th>
                                    <th className="pb-2 text-right">{lang === "hi" ? "राशि" : "Amt"}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {chainData.shifts.map((shift, idx) => {
                                    const emp = getEmployeeById(shift.employeeId);
                                    const liters = shift.totalLiters ?? 0;
                                    const salesLiters = liters - (shift.testingQuantity || 0);
                                    const amount = shift.totalAmount ?? salesLiters * shift.fuelRate;
                                    let expectedOpening = nozzle.initialReading ?? 0;
                                    if (idx > 0) {
                                      const prev = chainData.shifts[idx - 1];
                                      expectedOpening = prev.closingReading ?? expectedOpening;
                                    }
                                    const isChainBroken = shift.openingReading !== expectedOpening;

                                    return (
                                      <tr key={shift.id} className={cn(
                                        "border-b border-gray-100/30 last:border-0",
                                        isChainBroken ? "bg-red-50/60" : idx % 2 === 0 ? "bg-gray-50/20" : ""
                                      )}>
                                        <td className="py-2 pr-3 whitespace-nowrap text-gray-500">
                                          {new Date(shift.startedAt).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { day: "2-digit", month: "short" })}
                                          <span className="text-gray-300 ml-1">
                                            {new Date(shift.startedAt).toLocaleTimeString(lang === "hi" ? "hi-IN" : "en-IN", { hour: "2-digit", minute: "2-digit" })}
                                          </span>
                                        </td>
                                        <td className="py-2 pr-3 whitespace-nowrap text-gray-600 font-medium">{emp?.name || "?"}</td>
                                        <td className={cn("py-2 pr-3 text-right tabular-nums font-medium",
                                          isChainBroken ? "text-red-600 font-bold" : "text-gray-600")}>
                                          {shift.openingReading.toFixed(2)}
                                          {isChainBroken && <AlertTriangle className="inline w-3 h-3 ml-1 text-red-500" />}
                                        </td>
                                        <td className="py-2 pr-3 text-right tabular-nums text-gray-600">
                                          {shift.closingReading !== null ? shift.closingReading.toFixed(2) : "---"}
                                        </td>
                                        <td className="py-2 pr-3 text-right tabular-nums text-gray-500">
                                          {shift.status === "completed" ? liters.toFixed(2) : "---"}
                                        </td>
                                        <td className="py-2 pr-3 text-right tabular-nums text-gray-300">
                                          {shift.testingQuantity > 0 ? shift.testingQuantity.toFixed(2) : "-"}
                                        </td>
                                        <td className="py-2 pr-3 text-right tabular-nums text-blue-600 font-medium">
                                          {shift.status === "completed" ? salesLiters.toFixed(2) : "---"}
                                        </td>
                                        <td className="py-2 pr-3 text-right tabular-nums text-gray-400">
                                          {shift.fuelRate > 0 ? formatCurrency(shift.fuelRate) : "-"}
                                        </td>
                                        <td className="py-2 text-right tabular-nums font-bold text-gray-700">
                                          {shift.status === "completed" ? formatCurrency(amount) : "---"}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {nozzles.length === 0 && (
        <div className="text-center py-16 text-gray-300 font-medium">
          {lang === "hi" ? "कोई नोज़ल नहीं मिला" : "No nozzles found"}
        </div>
      )}
    </div>
  );
}
