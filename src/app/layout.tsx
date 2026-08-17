import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sistem Informasi PKBM Askara",
  description: "Platform digital terintegrasi untuk operasional Pusat Kegiatan Belajar Masyarakat (PKBM) Askara: Presensi, LMS, CBT, dan e-Rapor.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full" suppressHydrationWarning>
      <body
        className="min-h-full flex flex-col antialiased text-slate-900 bg-slate-50"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
