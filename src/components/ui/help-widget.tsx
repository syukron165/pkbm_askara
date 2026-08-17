"use client";

import React, { useState, useEffect } from "react";
import { Headset, X, Phone, Mail, Clock, MessageCircle } from "lucide-react";

export function HelpWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-300 group"
        aria-label="Pusat Bantuan Call Center"
      >
        <Headset className="w-6 h-6 animate-pulse group-hover:animate-none" />
      </button>

      {/* Pop-up Overlay & Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-5 text-white flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold">Pusat Bantuan PKBM</h3>
                <p className="text-indigo-100 text-xs mt-1">
                  Kami siap membantu kendala sistem Anda
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white transition-colors p-1"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                Apabila Anda mengalami kendala saat login, mengakses kelas, atau proses lainnya, silakan hubungi tim IT (Call Center) kami:
              </p>

              <div className="space-y-3 mt-4">
                <a
                  href="https://wa.me/6281234567890"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors group"
                >
                  <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-800">WhatsApp (Cepat)</div>
                    <div className="text-sm font-semibold text-emerald-900">+62 812-3456-7890</div>
                  </div>
                </a>

                <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-500">Email Bantuan</div>
                    <div className="text-sm font-semibold text-slate-800">admin@askara.sch.id</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-500">Jam Layanan</div>
                    <div className="text-sm font-semibold text-slate-800">Senin - Jumat, 08:00 - 16:00</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
              <button
                onClick={() => setIsOpen(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 transition"
              >
                Tutup Jendela Bantuan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
