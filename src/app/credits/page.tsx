"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Check, IndianRupee } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { getCurrentUser, getStore, settleCreditEntry } from "@/lib/store/data";
import type { CreditEntry } from "@/lib/store/types";

export default function CreditsPage() {
  const [credits, setCredits] = useState<CreditEntry[]>([]);
  const [filter, setFilter] = useState<"pending" | "settled" | "all">("pending");
  const { t } = useLanguage();
  const router = useRouter();

  const load = () => {
    const store = getStore();
    setCredits(store.creditEntries.sort((a, b) => (b.settled ? 0 : 1) - (a.settled ? 0 : 1)));
  };

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== "admin") { router.replace("/login"); return; }
    load();
  }, [router]);

  const handleSettle = (id: string) => {
    settleCreditEntry(id);
    load();
  };

  const filtered = credits.filter(c => {
    if (filter === "pending") return !c.settled;
    if (filter === "settled") return c.settled;
    return true;
  });

  const totalOutstanding = credits.filter(c => !c.settled).reduce((s, c) => s + c.amount, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">{t("credits")}</h2>

      {/* Total outstanding */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <IndianRupee className="w-6 h-6 text-red-500" />
          <div>
            <p className="text-sm text-gray-500">{t("pending")} {t("credits")}</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalOutstanding)}</p>
          </div>
        </div>
        <span className="text-sm text-gray-400">{credits.filter(c => !c.settled).length} entries</span>
      </div>

      {/* Filter */}
      <div className="flex gap-1 bg-white rounded-xl border p-1 w-fit">
        {(["pending", "settled", "all"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn("px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              filter === f ? "bg-orange-500 text-white" : "text-gray-500 hover:bg-gray-100")}>
            {t(f)}
          </button>
        ))}
      </div>

      {/* Credits list */}
      <div className="space-y-3">
        {filtered.length === 0 && <p className="text-center text-gray-400 py-8">{t("no_data")}</p>}
        {filtered.map(credit => (
          <div key={credit.id} className={cn("bg-white rounded-2xl border p-4 shadow-sm",
            credit.settled ? "border-green-200 opacity-70" : "border-red-200")}>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="font-semibold text-gray-800">{credit.customerName}</p>
                <p className="text-sm text-gray-500">{credit.vehicleNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-red-600">{formatCurrency(credit.amount)}</p>
                {credit.settled && (
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded-full">{t("settled")}</span>
                )}
              </div>
            </div>
            {!credit.settled && (
              <div className="mt-3 pt-3 border-t">
                <button onClick={() => handleSettle(credit.id)}
                  className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" /> {t("mark_settled")}
                </button>
              </div>
            )}
            {credit.settledAt && (
              <p className="text-xs text-gray-400 mt-2">
                Settled: {new Date(credit.settledAt).toLocaleDateString()}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
