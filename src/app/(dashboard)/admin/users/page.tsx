import React from "react";
import { Settings, Plus, Search, Shield, KeyRound, UserCheck } from "lucide-react";
import ResetPasswordButton from "@/components/ResetPasswordButton";

import { db as prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const usersDb = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const users = usersDb.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.isActive ? "AKTIF" : "NON-AKTIF",
    lastLogin: u.updatedAt.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Pengguna & Hak Akses (RBAC)</h1>
          <p className="text-xs text-slate-500 mt-1">Kelola akun, peran, dan reset password pengguna sistem.</p>
        </div>
        <button className="inline-flex items-center space-x-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-sm">
          <Plus className="w-4 h-4" />
          <span>Tambah Akun Baru</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-soft p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 font-semibold border-b border-slate-100">
                <th className="pb-3 font-semibold">Nama Pengguna</th>
                <th className="pb-3 font-semibold">Alamat Email</th>
                <th className="pb-3 font-semibold">Peran (Role)</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Aktivitas Terakhir</th>
                <th className="pb-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition">
                  <td className="py-3 font-bold text-slate-800">{u.name}</td>
                  <td className="py-3 text-slate-500 font-mono">{u.email}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-800 border border-slate-200">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3 text-slate-500">{u.lastLogin}</td>
                  <td className="py-3 text-right">
                    <ResetPasswordButton userId={u.id} userEmail={u.email} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
