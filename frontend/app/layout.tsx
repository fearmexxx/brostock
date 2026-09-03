import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GlobalHUD } from "@/components/GlobalHUD";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BroStock Pro — FENWEALTH Terminal Đầu Tư Tích Sản",
  description: "Nền tảng phân tích định lượng, sàng lọc cổ phiếu Alpha và dòng tiền phái sinh VN30F thuộc Học viện FENWEALTH — Đầu tư tích sản & Quản trị tài chính thịnh vượng.",
  keywords: ["chứng khoán", "đầu tư tích sản", "FENWEALTH", "tích sản cổ phiếu", "VN30F", "cổ phiếu", "Alpha"],
  authors: [{ name: "Học viện FENWEALTH" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 flex flex-col min-h-screen`}
      >
        <GlobalHUD />
        <Navbar />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
