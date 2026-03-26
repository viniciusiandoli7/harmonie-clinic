import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "Harmonie Clinic",
  description: "Sistema de gestão da clínica",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="bg-[#FAF8F3] text-[#111111] antialiased">
        <div className="flex min-h-screen bg-[#FAF8F3]">
          <div className="sticky top-0 h-screen shrink-0">
            <Sidebar />
          </div>

          <main className="min-w-0 flex-1 bg-[#FAF8F3]">
            <div className="mx-auto w-full max-w-[1560px]">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}