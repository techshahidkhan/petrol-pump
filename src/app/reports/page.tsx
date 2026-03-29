"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Share2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { getCurrentUser, getStore, getEmployeeById, getNozzleById, getPumpById, getFuelTypeById, getPaymentForShift } from "@/lib/store/data";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["#22c55e", "#a855f7", "#3b82f6", "#ef4444"];

export default function ReportsPage() {
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);
  const [paymentData, setPaymentData] = useState<{ name: string; value: number }[]>([]);
  const [nozzleData, setNozzleData] = useState<{ name: string; liters: number; amount: number }[]>([]);
  const [employeeData, setEmployeeData] = useState<{ name: string; shifts: number; liters: number; collected: number }[]>([]);
  const [totals, setTotals] = useState({ sales: 0, collected: 0, liters: 0 });
  const { lang, t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== "admin") { router.replace("/login"); return; }
    loadData();
  }, [router, dateFilter]);

  const loadData = () => {
    const store = getStore();
    const dayShifts = store.shifts.filter(s => s.startedAt.startsWith(dateFilter) && s.status === "completed");

    let totalCash = 0, totalUpi = 0, totalCard = 0, totalCredit = 0;
    let totalSales = 0, totalCollected = 0, totalLiters = 0;
    const nozzleMap = new Map<string, { liters: number; amount: number }>();
    const empMap = new Map<string, { shifts: number; liters: number; collected: number }>();

    for (const shift of dayShifts) {
      const liters = shift.totalLiters || 0;
      const nozzle = getNozzleById(shift.nozzleId);
      const fuel = nozzle ? getFuelTypeById(nozzle.fuelTypeId) : null;
      const amount = shift.totalAmount || (liters * (shift.fuelRate || fuel?.currentPrice || 0));
      const payment = getPaymentForShift(shift.id);

      totalLiters += liters;
      totalSales += amount;
      if (payment) {
        totalCash += payment.cash;
        totalUpi += payment.upi;
        totalCard += payment.card;
        totalCredit += payment.credit;
        totalCollected += payment.totalCollected;
      }

      // Nozzle data
      const pump = nozzle ? getPumpById(nozzle.pumpId) : null;
      const nKey = `P${pump?.pumpNumber}-N${nozzle?.nozzleNumber}`;
      const nExisting = nozzleMap.get(nKey) || { liters: 0, amount: 0 };
      nozzleMap.set(nKey, { liters: nExisting.liters + liters, amount: nExisting.amount + amount });

      // Employee data
      const emp = getEmployeeById(shift.employeeId);
      const eName = emp?.name || "?";
      const eExisting = empMap.get(eName) || { shifts: 0, liters: 0, collected: 0 };
      empMap.set(eName, {
        shifts: eExisting.shifts + 1,
        liters: eExisting.liters + liters,
        collected: eExisting.collected + (payment?.totalCollected || 0),
      });
    }

    setPaymentData([
      { name: "Cash", value: totalCash },
      { name: "UPI", value: totalUpi },
      { name: "Card", value: totalCard },
      { name: "Credit", value: totalCredit },
    ].filter(d => d.value > 0));

    setNozzleData(Array.from(nozzleMap.entries()).map(([name, d]) => ({ name, ...d })));
    setEmployeeData(Array.from(empMap.entries()).map(([name, d]) => ({ name, ...d })));
    setTotals({ sales: totalSales, collected: totalCollected, liters: totalLiters });
  };

  const shareWhatsApp = () => {
    const text = `📊 ${t("daily_summary")} - ${dateFilter}\n\n💰 ${t("todays_sales")}: ${formatCurrency(totals.sales)}\n⛽ ${t("liters_sold")}: ${totals.liters.toFixed(1)}L\n📥 ${t("total_collection")}: ${formatCurrency(totals.collected)}\n${totals.sales - totals.collected > 10 ? `⚠️ ${t("shortage")}: ${formatCurrency(totals.sales - totals.collected)}` : "✅ No shortage"}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">{t("reports")}</h2>
        <button onClick={shareWhatsApp}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600">
          <Share2 className="w-4 h-4" /> {t("share_whatsapp")}
        </button>
      </div>

      <div className="flex items-center gap-2 bg-white rounded-xl border px-3 py-2 w-fit">
        <Calendar className="w-4 h-4 text-gray-400" />
        <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="text-sm outline-none" />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-orange-50 rounded-2xl p-4 text-center">
          <p className="text-sm text-gray-500">{t("todays_sales")}</p>
          <p className="text-xl font-bold text-orange-600">{formatCurrency(totals.sales)}</p>
        </div>
        <div className="bg-blue-50 rounded-2xl p-4 text-center">
          <p className="text-sm text-gray-500">{t("liters_sold")}</p>
          <p className="text-xl font-bold text-blue-600">{totals.liters.toFixed(1)} L</p>
        </div>
        <div className="bg-green-50 rounded-2xl p-4 text-center">
          <p className="text-sm text-gray-500">{t("total_collection")}</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(totals.collected)}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Nozzle-wise bar chart */}
        <div className="bg-white rounded-2xl border p-4">
          <h3 className="font-semibold text-gray-700 mb-4">{t("nozzle_sales")}</h3>
          {nozzleData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={nozzleData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Bar dataKey="amount" fill="#f97316" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-center py-8">{t("no_data")}</p>}
        </div>

        {/* Payment modes pie */}
        <div className="bg-white rounded-2xl border p-4">
          <h3 className="font-semibold text-gray-700 mb-4">{t("payment_modes")}</h3>
          {paymentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={paymentData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                  {paymentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-center py-8">{t("no_data")}</p>}
        </div>
      </div>

      {/* Employee performance table */}
      {employeeData.length > 0 && (
        <div className="bg-white rounded-2xl border overflow-hidden">
          <div className="p-4 border-b"><h3 className="font-semibold text-gray-700">{t("employee_performance")}</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-500 font-medium">{t("name")}</th>
                  <th className="px-4 py-3 text-right text-gray-500 font-medium">{t("shifts")}</th>
                  <th className="px-4 py-3 text-right text-gray-500 font-medium">{t("total_liters")}</th>
                  <th className="px-4 py-3 text-right text-gray-500 font-medium">{t("total_collected")}</th>
                </tr>
              </thead>
              <tbody>
                {employeeData.map(e => (
                  <tr key={e.name} className="border-t">
                    <td className="px-4 py-3 font-medium">{e.name}</td>
                    <td className="px-4 py-3 text-right">{e.shifts}</td>
                    <td className="px-4 py-3 text-right">{e.liters.toFixed(1)} L</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(e.collected)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
