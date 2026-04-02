"use client";

import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import { Providers } from "@/components/Providers";
import { usePathname } from "next/navigation";

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700']
});

const cormorant = Cormorant_Garamond({ 
  subsets: ["latin"],
  variable: '--font-cormorant',
  weight: ['400', '500', '600', '700'] 
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${cormorant.variable} font-sans bg-harmonie-bg text-harmonie-dark antialiased`}>
        <Providers>
          <div className="flex min-h-screen">
            {/* Sidebar só ocupa espaço se não for página de login */}
            {!isLoginPage && (
              <div className="sticky top-0 h-screen shrink-0">
                <Sidebar />
              </div>
            )}
            
            {/* Main expande 100% no login, ou mantém o padding no dashboard */}
            <main className={`flex-1 min-w-0 ${isLoginPage ? 'w-full' : ''}`}>
              <div className={`${isLoginPage ? '' : 'mx-auto w-full max-w-7xl p-8'}`}>
                {children}
              </div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}