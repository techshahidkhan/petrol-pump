"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Fuel, ChevronDown, ChevronUp, Check, AlertTriangle } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/useLanguage";
import {
  getCurrentUser,
  getAllNozzlesWithStatus,
  getNozzleReadingChain,
  getEmployeeById,
  getPaymentForShift,
} from "@/lib/store/data";
import type { Shift } from "@/lib/store/types";

interface NozzleWithStatus {
  id: string;
  pumpId: string;
  nozzleNumber: number;
  fuelTypeId: string;
  status: "active" | "inactive";
  initialReading: number;
  pump: { id: string; pumpNumber: number; locationLabel: string; status: string } | undefined;
  fuel: { id: string; name: string; nameHi: string; currentPrice: number; unit: string } | undefined;
  currentReading: number;
  activeShift: Shift | undefined;
  activeEmployee: { id: string; name: string } | undefined;
}

export default function NozzlesPage() {
  const [nozzles, setNozzles] = useState<NozzleWithStatus[]>([]);
  const [expandedNozzle, setExpandedNozzle] = useState<string | null>(null);
  const [chainData, setChainData] = useState<{
    shifts: Shift[];
    isChainValid: boolean;
  } | null>(null);
  const { lang } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== "admin") {
      router.replace("/login");
      return;
    }
    loadNozzles();
  }, [router]);

  const loadNozzles = () => {
    const data = getAllNozzlesWithStatus();
    setNozzles(data as NozzleWithStatus[]);
  };

  const toggleExpand = (nozzleId: string) => {
    if (expandedNozzle === nozzleId) {
      setExpandedNozzle(null);
      setChainData(null);
      return;
    }
    setExpandedNozzle(nozzleId);
    const chain = getNozzleReadingChain(nozzleId);
    setChainData(chain);
  };

  // Group nozzles by pump
  const grouped = nozzles.reduce<Record<string, NozzleWithStatus[]>>((acc, n) => {
    const pumpKey = n.pump ? `${n.pump.pumpNumber}` : "?";
    if (!acc[pumpKey]) acc[pumpKey] = [];
    acc[pumpKey].push(n);
    return acc;
  }, {});

  const sortedPumpKeys = Object.keys(grouped).sort(
    (a, b) => Number(a) - Number(b)
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Fuel className="w-6 h-6 text-orange-500" />
        <h2 className="text-2xl font-bold text-gray-800">
          {lang === "hi" ? "नोज़ल और रीडिंग" : "Nozzles & Readings"}
        </h2>
      </div>

      {sortedPumpKeys.map((pumpKey) => {
        const pumpNozzles = grouped[pumpKey];
        const pump = pumpNozzles[0]?.pump;

        return (
          <div key={pumpKey} className="space-y-3">
            {/* Pump header */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                {lang === "hi" ? `पंप #${pumpKey}` : `Pump #${pumpKey}`}
              </span>
              {pump && (
                <span className="text-xs text-gray-400">
                  ({pump.locationLabel})
                </span>
              )}
            </div>

            {/* Nozzle cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {pumpNozzles.map((nozzle) => {
                const isExpanded = expandedNozzle === nozzle.id;
                const fuelName =
                  lang === "hi"
                    ? nozzle.fuel?.nameHi || nozzle.fuel?.name || "?"
                    : nozzle.fuel?.name || "?";
                const isPetrol =
                  nozzle.fuel?.name?.toLowerCase() === "petrol";
                const isActive = !!nozzle.activeShift;

                return (
                  <div key={nozzle.id} className={cn("col-span-1", isExpanded && "sm:col-span-2")}>
                    {/* Card */}
                    <button
                      onClick={() => toggleExpand(nozzle.id)}
                      className={cn(
                        "w-full text-left bg-white rounded-2xl border p-4 shadow-sm transition-all hover:shadow-md",
                        isActive ? "border-blue-200" : "border-gray-200"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1.5">
                          {/* Label: P1-N1 */}
                          <p className="text-lg font-bold text-gray-800">
                            P{pumpKey}-N{nozzle.nozzleNumber}
                          </p>

                          {/* Fuel badge */}
                          <span
                            className={cn(
                              "inline-block text-xs font-medium px-2.5 py-0.5 rounded-full",
                              isPetrol
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            )}
                          >
                            {fuelName}
                          </span>

                          {/* Status */}
                          <div className="pt-0.5">
                            {isActive ? (
                              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                {lang === "hi" ? "सक्रिय" : "Active"} -{" "}
                                {nozzle.activeEmployee?.name || "?"}
                              </span>
                            ) : (
                              <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                {lang === "hi" ? "निष्क्रिय" : "Idle"}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right side: reading + chevron */}
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-xs text-gray-400">
                              {lang === "hi" ? "वर्तमान रीडिंग" : "Current Reading"}
                            </p>
                            <p className="text-2xl font-bold text-gray-800 tabular-nums">
                              {nozzle.currentReading.toFixed(2)}
                            </p>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Expanded: reading chain */}
                    {isExpanded && chainData && (
                      <div className="mt-2 bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-3">
                        {/* Chain validation badge */}
                        <div className="flex items-center gap-2">
                          {chainData.isChainValid ? (
                            <span className="inline-flex items-center gap-1 text-sm font-medium text-green-700 bg-green-50 px-3 py-1 rounded-full">
                              <Check className="w-4 h-4" />
                              {lang === "hi" ? "चेन मान्य" : "Chain Valid"}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-sm font-medium text-red-700 bg-red-50 px-3 py-1 rounded-full">
                              <AlertTriangle className="w-4 h-4" />
                              {lang === "hi" ? "चेन टूटी हुई" : "Chain Broken"}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">
                            {chainData.shifts.length}{" "}
                            {lang === "hi" ? "शिफ्ट" : "shift(s)"}
                          </span>
                        </div>

                        {chainData.shifts.length === 0 ? (
                          <p className="text-sm text-gray-400 text-center py-4">
                            {lang === "hi"
                              ? "इस नोज़ल के लिए कोई शिफ्ट नहीं"
                              : "No shifts recorded for this nozzle"}
                          </p>
                        ) : (
                          <div className="overflow-x-auto -mx-4 px-4">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b">
                                  <th className="pb-2 pr-3 whitespace-nowrap">
                                    {lang === "hi" ? "दिनांक/समय" : "Date/Time"}
                                  </th>
                                  <th className="pb-2 pr-3 whitespace-nowrap">
                                    {lang === "hi" ? "कर्मचारी" : "Employee"}
                                  </th>
                                  <th className="pb-2 pr-3 whitespace-nowrap text-right">
                                    {lang === "hi" ? "ओपनिंग" : "Opening"}
                                  </th>
                                  <th className="pb-2 pr-3 whitespace-nowrap text-right">
                                    {lang === "hi" ? "क्लोज़िंग" : "Closing"}
                                  </th>
                                  <th className="pb-2 pr-3 whitespace-nowrap text-right">
                                    {lang === "hi" ? "लीटर" : "Liters"}
                                  </th>
                                  <th className="pb-2 pr-3 whitespace-nowrap text-right">
                                    {lang === "hi" ? "टेस्टिंग" : "Testing"}
                                  </th>
                                  <th className="pb-2 pr-3 whitespace-nowrap text-right">
                                    {lang === "hi" ? "बिक्री (L)" : "Sales (L)"}
                                  </th>
                                  <th className="pb-2 pr-3 whitespace-nowrap text-right">
                                    {lang === "hi" ? "दर" : "Rate"}
                                  </th>
                                  <th className="pb-2 whitespace-nowrap text-right">
                                    {lang === "hi" ? "राशि" : "Amount"}
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {chainData.shifts.map((shift, idx) => {
                                  const emp = getEmployeeById(shift.employeeId);
                                  const payment = getPaymentForShift(shift.id);
                                  const liters = shift.totalLiters ?? 0;
                                  const salesLiters = liters - (shift.testingQuantity || 0);
                                  const amount = shift.totalAmount ?? salesLiters * shift.fuelRate;

                                  // Chain break detection: this shift's opening should match prev shift's closing
                                  const nozzleObj = nozzles.find(
                                    (n) => n.id === nozzle.id
                                  );
                                  let expectedOpening =
                                    nozzleObj?.initialReading ?? 0;
                                  if (idx > 0) {
                                    const prev = chainData.shifts[idx - 1];
                                    expectedOpening =
                                      prev.closingReading ?? expectedOpening;
                                  }
                                  const isChainBroken =
                                    shift.openingReading !== expectedOpening;

                                  return (
                                    <tr
                                      key={shift.id}
                                      className={cn(
                                        "border-b last:border-0",
                                        isChainBroken && "bg-red-50"
                                      )}
                                    >
                                      <td className="py-2 pr-3 whitespace-nowrap text-gray-600">
                                        {new Date(shift.startedAt).toLocaleDateString(
                                          lang === "hi" ? "hi-IN" : "en-IN",
                                          {
                                            day: "2-digit",
                                            month: "short",
                                          }
                                        )}{" "}
                                        <span className="text-gray-400">
                                          {new Date(shift.startedAt).toLocaleTimeString(
                                            lang === "hi" ? "hi-IN" : "en-IN",
                                            {
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            }
                                          )}
                                        </span>
                                      </td>
                                      <td className="py-2 pr-3 whitespace-nowrap text-gray-700">
                                        {emp?.name || "?"}
                                      </td>
                                      <td
                                        className={cn(
                                          "py-2 pr-3 text-right tabular-nums font-medium",
                                          isChainBroken
                                            ? "text-red-600 font-bold"
                                            : "text-gray-700"
                                        )}
                                      >
                                        {shift.openingReading.toFixed(2)}
                                        {isChainBroken && (
                                          <AlertTriangle className="inline w-3.5 h-3.5 ml-1 text-red-500" />
                                        )}
                                      </td>
                                      <td className="py-2 pr-3 text-right tabular-nums text-gray-700">
                                        {shift.closingReading !== null
                                          ? shift.closingReading.toFixed(2)
                                          : "---"}
                                      </td>
                                      <td className="py-2 pr-3 text-right tabular-nums text-gray-700">
                                        {shift.status === "completed"
                                          ? liters.toFixed(2)
                                          : "---"}
                                      </td>
                                      <td className="py-2 pr-3 text-right tabular-nums text-gray-500">
                                        {shift.testingQuantity > 0
                                          ? shift.testingQuantity.toFixed(2)
                                          : "-"}
                                      </td>
                                      <td className="py-2 pr-3 text-right tabular-nums text-gray-700">
                                        {shift.status === "completed"
                                          ? salesLiters.toFixed(2)
                                          : "---"}
                                      </td>
                                      <td className="py-2 pr-3 text-right tabular-nums text-gray-500">
                                        {shift.fuelRate > 0
                                          ? `${shift.fuelRate.toFixed(2)}`
                                          : "-"}
                                      </td>
                                      <td className="py-2 text-right tabular-nums font-medium text-gray-800">
                                        {shift.status === "completed"
                                          ? formatCurrency(amount)
                                          : "---"}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
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
        <div className="text-center py-12 text-gray-400">
          {lang === "hi" ? "कोई नोज़ल नहीं मिला" : "No nozzles found"}
        </div>
      )}
    </div>
  );
}
