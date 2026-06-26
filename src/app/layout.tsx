import type { Metadata, Viewport } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import AppShell from "@/components/layout/AppShell";
import { brand } from "@/lib/brand";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: brand.name,
    template: `%s | ${brand.name}`,
  },
  description: "Sistema privado de gestão clínica, financeiro, prontuário e relacionamento da Dra. Mariana Thomaz Carmona.",
  applicationName: brand.name,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-64.png", type: "image/png", sizes: "64x64" },
      { url: "/favicon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/favicon-180.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: brand.colors.primary,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${cormorant.variable} bg-brand-background font-sans text-brand-text antialiased`}>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
