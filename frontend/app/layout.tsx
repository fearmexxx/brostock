import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BroStock Pro",
  description: "Real-time Vietnam Stock Analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        <nav className="bg-[#1e3a8a] text-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center h-16 gap-8">
                    <div className="flex-shrink-0 font-bold text-xl tracking-wider">
                        BROSTOCK
                    </div>
                    <div className="hidden md:block">
                        <div className="flex items-baseline space-x-4">
                            <Link href="/" className="hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium">Dashboard</Link>
                            <Link href="/market" className="hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium">Market</Link>
                            <Link href="/portfolio" className="hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium">Portfolio</Link>
                            <Link href="/backtest" className="hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium">Backtest</Link>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
        <main>
            {children}
        </main>
      </body>
    </html>
  );
}
