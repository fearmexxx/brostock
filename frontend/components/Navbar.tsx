"use client"

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Menu, 
  X, 
  TrendingUp, 
  BarChart3, 
  Award, 
  Zap, 
  Briefcase, 
  RotateCcw, 
  BookOpen, 
  ExternalLink 
} from "lucide-react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "Bảng điều khiển", icon: TrendingUp },
    { href: "/market", label: "Thị trường", icon: BarChart3 },
    { href: "/alpha", label: "Alpha", icon: Award, highlight: "text-amber-300 font-extrabold" },
    { href: "/derivatives", label: "Phái sinh", icon: Zap, highlight: "text-emerald-300 font-extrabold" },
    { href: "/portfolio", label: "Danh mục", icon: Briefcase },
    { href: "/backtest", label: "Kiểm thử", icon: RotateCcw },
    { href: "/doc", label: "Thuật toán (DOC)", icon: BookOpen, highlight: "text-cyan-300 font-bold" },
  ];

  return (
    <nav className="bg-[#1e3a8a] text-white shadow-md sticky top-0 z-50 border-b border-blue-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Agency Branding */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="font-black text-xl tracking-wider text-white group-hover:text-amber-300 transition">
                BROSTOCK
              </span>
            </Link>
            
            <div 
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400/15 text-amber-300 border border-amber-400/40 shadow-sm"
              title="Học viện FENWEALTH — Đầu tư tích sản & Quản trị tài chính"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              <span>Học viện FENWEALTH</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold tracking-wide transition-colors ${
                    isActive 
                      ? "bg-blue-800 text-white shadow-inner" 
                      : link.highlight 
                        ? `${link.highlight} hover:bg-blue-800/60` 
                        : "text-blue-100 hover:bg-blue-700/70 hover:text-white"
                  }`}
                >
                  <Icon size={14} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-blue-200 hover:text-white hover:bg-blue-800 focus:outline-none transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#172554] border-t border-blue-800 px-4 pt-2 pb-4 space-y-1 animate-in slide-in-from-top-2 duration-150">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-semibold transition ${
                  isActive 
                    ? "bg-blue-800 text-white font-bold" 
                    : link.highlight
                      ? `${link.highlight} hover:bg-blue-900`
                      : "text-blue-100 hover:bg-blue-900 hover:text-white"
                }`}
              >
                <Icon size={16} />
                <span>{link.label}</span>
              </Link>
            );
          })}
          
          <div className="pt-3 mt-2 border-t border-blue-900/80 flex items-center justify-between text-xs text-amber-200/80 px-2">
            <span>Học viện FENWEALTH</span>
            <span className="text-[11px] text-blue-200 font-normal">Đầu tư tích sản</span>
          </div>
        </div>
      )}
    </nav>
  );
}
