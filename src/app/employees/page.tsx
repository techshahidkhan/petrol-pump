"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, X, Shield, User, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { getCurrentUser, getStore, addEmployee, updateEmployee } from "@/lib/store/data";
import type { Employee } from "@/lib/store/types";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", username: "", password: "", role: "employee" as "admin" | "employee" });
  const [editId, setEditId] = useState<string | null>(null);
  const { t } = useLanguage();
  const router = useRouter();

  const load = () => setEmployees(getStore().employees);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== "admin") { router.replace("/login"); return; }
    load();
  }, [router]);

  const handleAdd = () => {
    if (!form.name || !form.username || !form.password) return;
    addEmployee(form);
    setForm({ name: "", phone: "", username: "", password: "", role: "employee" });
    setShowAdd(false);
    load();
  };

  const handleResetPassword = (id: string) => {
    const newPw = prompt("Enter new password:");
    if (newPw) { updateEmployee(id, { password: newPw }); load(); }
  };

  const toggleActive = (id: string, current: boolean) => {
    updateEmployee(id, { active: !current });
    load();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">{t("employees")}</h2>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600">
          <UserPlus className="w-4 h-4" /> {t("add_employee")}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {employees.map(emp => (
          <div key={emp.id} className={cn("bg-white rounded-2xl border p-4 shadow-sm", !emp.active && "opacity-50")}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center",
                  emp.role === "admin" ? "bg-purple-100" : "bg-blue-100")}>
                  {emp.role === "admin" ? <Shield className="w-5 h-5 text-purple-600" /> : <User className="w-5 h-5 text-blue-600" />}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{emp.name}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Phone className="w-3 h-3" /> {emp.phone}
                  </div>
                </div>
              </div>
              <span className={cn("text-xs px-2 py-1 rounded-full font-medium",
                emp.role === "admin" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600")}>
                {t(emp.role)}
              </span>
            </div>
            <div className="mt-3 pt-3 border-t flex gap-2">
              <button onClick={() => handleResetPassword(emp.id)}
                className="flex-1 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-600 font-medium">
                {t("reset_password")}
              </button>
              <button onClick={() => toggleActive(emp.id, emp.active)}
                className={cn("flex-1 py-2 text-sm rounded-lg font-medium",
                  emp.active ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100")}>
                {emp.active ? "Deactivate" : "Activate"}
              </button>
            </div>
            <p className="text-xs text-gray-300 mt-2">@{emp.username}</p>
          </div>
        ))}
      </div>

      {/* Add Employee Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{t("add_employee")}</h3>
              <button onClick={() => setShowAdd(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder={t("name")} className="w-full px-4 py-3 border-2 rounded-xl text-sm focus:border-orange-400 outline-none" />
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder={t("phone")} className="w-full px-4 py-3 border-2 rounded-xl text-sm focus:border-orange-400 outline-none" />
              <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                placeholder={t("username")} className="w-full px-4 py-3 border-2 rounded-xl text-sm focus:border-orange-400 outline-none" />
              <input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder={t("password")} type="password" className="w-full px-4 py-3 border-2 rounded-xl text-sm focus:border-orange-400 outline-none" />
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as "admin" | "employee" })}
                className="w-full px-4 py-3 border-2 rounded-xl text-sm focus:border-orange-400 outline-none">
                <option value="employee">{t("employee")}</option>
                <option value="admin">{t("admin")}</option>
              </select>
            </div>
            <button onClick={handleAdd}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium">
              {t("add_employee")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
