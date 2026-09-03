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
  title: "BroStock Pro — VBE Agency Institutional Terminal",
  description: "Nền tảng phân tích định lượng, quét tín hiệu Alpha và dòng tiền phái sinh VN30F dành cho VBE Agency (vbe.com.vn).",
  keywords: ["chứng khoán", "phân tích định lượng", "VBE Agency", "VN30F", "cổ phiếu", "Alpha"],
  authors: [{ name: "VBE Agency", url: "https://vbe.com.vn" }],
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
