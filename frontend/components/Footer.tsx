import React from "react";
import Link from "next/link";
import { ShieldCheck, ExternalLink, Activity } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-gray-400 text-xs border-t border-slate-800 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand & Academy Column */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="font-black text-lg text-white tracking-wider">BROSTOCK PRO</span>
              <span className="bg-amber-500/20 text-amber-300 font-bold text-[10px] px-2 py-0.5 rounded border border-amber-500/30">Học viện FENWEALTH</span>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed max-w-md">
              Công cụ thiết bị đầu cuối phân tích định lượng (Quantitative Terminal) và sàng lọc cơ hội tích sản cổ phiếu, phát hiện dòng tiền thông minh trên thị trường chứng khoán Việt Nam. Đồng hành cùng học viên và nhà đầu tư tại <strong>Học viện FENWEALTH</strong> trên hành trình tự do tài chính & đầu tư tích sản thịnh vượng.
            </p>
            <div className="flex items-center gap-4 pt-1 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Hệ thống trực tuyến (Live)</span>
              </span>
              <span className="text-gray-600">•</span>
              <span className="text-gray-400">Đầu tư tích sản giá trị</span>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Hệ thống BroStock</h4>
            <ul className="space-y-1.5 text-xs">
              <li><Link href="/" className="hover:text-white transition">Bảng điều khiển (Dashboard)</Link></li>
              <li><Link href="/market" className="hover:text-white transition">Tổng quan thị trường</Link></li>
              <li><Link href="/alpha" className="hover:text-white transition text-amber-400 font-semibold">BroStock Alpha (Top 100)</Link></li>
              <li><Link href="/derivatives" className="hover:text-white transition text-emerald-400 font-semibold">Phái sinh VN30F Daily Bias</Link></li>
              <li><Link href="/doc" className="hover:text-white transition text-cyan-400">Tài liệu thuật toán (DOC)</Link></li>
            </ul>
          </div>

          {/* Compliance & Support Column */}
          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Học viện FENWEALTH</h4>
            <ul className="space-y-1.5 text-xs">
              <li><Link href="/portfolio" className="hover:text-white transition">Quản lý danh mục tích sản</Link></li>
              <li><Link href="/backtest" className="hover:text-white transition">Kiểm thử chiến lược (Backtest)</Link></li>
              <li><Link href="/doc" className="hover:text-white transition">Triết lý đầu tư tích sản</Link></li>
            </ul>
          </div>

        </div>

        {/* Regulatory Risk Disclaimer (Tuân thủ UBCKNN) */}
        <div className="bg-slate-950/70 p-4 rounded-lg border border-slate-800 text-[11px] text-gray-400 space-y-1.5 leading-relaxed">
          <div className="flex items-center gap-1.5 font-bold text-amber-400">
            <ShieldCheck size={14} />
            <span>CẢNH BÁO RỦI RO & MIỄN TRỪ TRÁCH NHIỆM PHÁP LÝ (UBCKNN):</span>
          </div>
          <p>
            Mọi dữ liệu, xếp hạng Alpha, điểm Conviction và phân tích trên nền tảng BroStock Pro được tính toán tự động bằng các mô hình toán học và định lượng (Quantitative Modeling) nhằm mục đích hỗ trợ tra cứu và học tập cho học viên Học viện FENWEALTH. Đây không cấu thành lời mời chào mua bán chứng khoán hay cam kết lợi nhuận ủy thác. Nhà đầu tư chịu trách nhiệm độc lập với mọi quyết định phân bổ vốn của mình.
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-3 text-[11px] text-gray-400">
          <div>
            © {new Date().getFullYear()} BroStock Pro — FENWEALTH Academy. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span>Phiên bản: <strong>2.6 Institutional</strong></span>
            <span>•</span>
            <span>Phí giao dịch tính chuẩn: <strong>0.4% Net</strong></span>
          </div>
        </div>

      </div>
    </footer>
  );
}
