import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { canAccessFinance } from "@/lib/rbac";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, Lock, CircleDollarSign } from "lucide-react";

export default async function KeuanganLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const isFinanceAuthorized = canAccessFinance(user);

  // Note: /admin/keuangan/pengajuan is allowed for general management proposal submission.
  // Full accounting is guarded.
  return (
    <div>
      {!isFinanceAuthorized && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold">Akses Terbatas: Menu Keuangan Khusus Bendahara & Super Admin</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Staf manajemen umum dapat menggunakan halaman Pengajuan Biaya untuk mengajukan anggaran kegiatan.
              </p>
            </div>
          </div>
          <Link
            href="/admin/keuangan/pengajuan"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shrink-0 self-start sm:self-auto"
          >
            <CircleDollarSign className="w-3.5 h-3.5" />
            <span>Buka Pengajuan Biaya</span>
          </Link>
        </div>
      )}
      {children}
    </div>
  );
}
