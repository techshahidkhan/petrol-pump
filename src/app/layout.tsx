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
      <body className="bg-gray-50 min-h-screen">
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
