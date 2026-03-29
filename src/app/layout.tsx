import type { Metadata } from "next";
import "./globals.css";
import LayoutShell from "@/components/LayoutShell";

export const metadata: Metadata = {
  title: "Petrol Pump Manager",
  description: "Petrol Pump Shift Management System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-slate-50 via-orange-50/30 to-amber-50/20 min-h-screen antialiased">
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
