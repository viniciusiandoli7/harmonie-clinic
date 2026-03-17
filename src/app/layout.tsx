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
      <body>
        <div className="flex min-h-screen bg-[#FAF8F4]">
          <Sidebar />
          <main className="flex-1 bg-[#FAF8F4] overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}