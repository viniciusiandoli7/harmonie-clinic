"use client";

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

  return (
    <div className="flex min-h-screen w-full">
      {!isFullScreenPage && (
        <div className="sticky top-0 hidden h-screen shrink-0 lg:block">
          <Sidebar />
        </div>
      )}

      <main className={`min-w-0 flex-1 ${isFullScreenPage ? "w-full" : ""}`}>
        <div className={isFullScreenPage ? "" : "mx-auto w-full max-w-[1500px] p-4 pt-24 sm:p-6 sm:pt-24 lg:p-8"}>
          {children}
        </div>
      </main>
    </div>
  );
}
