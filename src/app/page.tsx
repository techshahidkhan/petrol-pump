"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/store/data";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const user = getCurrentUser();
    if (user) router.replace("/dashboard");
    else router.replace("/login");
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-gray-400 text-lg">Loading...</div>
    </div>
  );
}
