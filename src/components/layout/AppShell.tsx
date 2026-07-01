"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const isPublicSignaturePage =
    pathname.startsWith("/consent/") ||
    pathname.startsWith("/contracts/") ||
    pathname.startsWith("/assinar/") ||
    pathname.startsWith("/assinar-contrato/");
  const isFullScreenPage = isLoginPage || isPublicSignaturePage;

  useEffect(() => {
    if (isFullScreenPage) return;

    fetch("/api/system/repair", { cache: "no-store" }).catch(() => {
      // A tela não deve quebrar se a verificação automática falhar.
    });
  }, [isFullScreenPage]);

  return (
    <div className="flex min-h-screen w-full">
      {!isFullScreenPage && <Sidebar />}

      <main className={`min-w-0 flex-1 ${isFullScreenPage ? "w-full" : ""}`}>
        <div className={isFullScreenPage ? "" : "mx-auto w-full max-w-[1500px] p-4 pb-28 pt-24 sm:p-6 sm:pb-28 sm:pt-28 lg:p-8"}>
          {children}
        </div>
      </main>
    </div>
  );
}
