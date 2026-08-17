import type { Metadata } from "next";
import "./globals.css";
import Analytics from "@/components/Analytics";
import { HelpWidget } from "@/components/ui/help-widget";

export const metadata: Metadata = {
  metadataBase: new URL("https://pkbmaskara.sch.id"),
  title: {
    default: "Sistem Informasi PKBM Askara",
    template: "%s | PKBM Askara",
  },
  description: "Platform digital terintegrasi untuk operasional Pusat Kegiatan Belajar Masyarakat (PKBM) Askara: Presensi, LMS, CBT, dan e-Rapor.",
  keywords: ["PKBM", "Askara", "Kejar Paket", "Paket A", "Paket B", "Paket C", "Pendidikan Kesetaraan", "Sekolah Online", "LMS", "CBT"],
  authors: [{ name: "PKBM Askara" }],
  creator: "PKBM Askara",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://pkbmaskara.sch.id",
    title: "Sistem Informasi PKBM Askara",
    description: "Platform digital terintegrasi untuk operasional Pusat Kegiatan Belajar Masyarakat (PKBM) Askara.",
    siteName: "PKBM Askara",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sistem Informasi PKBM Askara",
    description: "Platform digital terintegrasi untuk operasional PKBM Askara.",
  },
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
        <Analytics />
        <HelpWidget />
      </body>
    </html>
  );
}
