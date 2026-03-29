"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Play, Square, List, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { getCurrentUser } from "@/lib/store/data";
import type { Employee } from "@/lib/store/types";

const employeeNav = [
  { href: "/dashboard", icon: LayoutDashboard, label: "dashboard" },
  { href: "/shift/start", icon: Play, label: "start_shift" },
  { href: "/shift/end", icon: Square, label: "end_shift" },
];

const adminNav = [
  { href: "/dashboard", icon: LayoutDashboard, label: "dashboard" },
  { href: "/collections", icon: FileSpreadsheet, label: "daily_summary" },
  { href: "/shifts", icon: List, label: "shifts" },
  { href: "/reports", icon: List, label: "reports" },
];

export default function BottomNav() {
  const [user, setUser] = useState<Employee | null>(null);
  const pathname = usePathname();
  const { t } = useLanguage();

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const items = user?.role === "admin" ? adminNav : employeeNav;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden z-40">
      <div className="flex justify-around items-center py-2">
        {items.map(item => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg min-w-[64px]",
                active ? "text-orange-600" : "text-gray-400"
              )}
            >
              <item.icon className={cn("w-6 h-6", active && "text-orange-500")} />
              <span className="text-[10px] font-medium">{t(item.label)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
