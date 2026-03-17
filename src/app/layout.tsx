import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TenderPro - Hubungkan Kontraktor & Pemilik Proyek Terpercaya",
  description: "Platform terpercaya untuk menghubungkan kontraktor profesional dengan pemilik proyek. Temukan proyek terbaik dan kontraktor berkualitas untuk kebutuhan konstruksi Anda.",
  keywords: ["TenderPro", "Kontraktor", "Proyek Konstruksi", "Tender", "Renovasi", "Pembangunan", "Indonesia"],
  authors: [{ name: "TenderPro Team" }],
  icons: {
    icon: "/logo.png",
  },
  openGraph: {
    title: "TenderPro - Hubungkan Kontraktor & Pemilik Proyek Terpercaya",
    description: "Platform terpercaya untuk menghubungkan kontraktor profesional dengan pemilik proyek.",
    url: "https://tenderpro.id",
    siteName: "TenderPro",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TenderPro - Hubungkan Kontraktor & Pemilik Proyek Terpercaya",
    description: "Platform terpercaya untuk menghubungkan kontraktor profesional dengan pemilik proyek.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
