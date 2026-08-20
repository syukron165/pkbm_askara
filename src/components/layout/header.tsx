"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  Calendar,
  ChevronDown,
  Building2,
  GraduationCap,
  ShieldCheck,
  Check,
  HeartHandshake,
  Wallet,
  BookOpen,
} from "lucide-react";
import { AuthUser } from "@/lib/auth";
import { ROLE_CONFIGS, Role } from "@/lib/rbac";
import { NotificationBell } from "./NotificationBell";

interface HeaderProps {
  user: AuthUser;
}

const ROLE_SWITCH_METAS: Record<
  string,
  { label: string; shortLabel: string; icon: React.ElementType; colorClass: string; bgClass: string }
> = {
  pendidik: {
    label: "Mode Pendidik / Tutor",
    shortLabel: "Guru",
    icon: GraduationCap,
    colorClass: "text-emerald-700 hover:bg-emerald-50",
    bgClass: "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200/80",
  },
  orang_tua: {
    label: "Mode Orang Tua / Wali",
    shortLabel: "Orang Tua",
    icon: HeartHandshake,
    colorClass: "text-amber-700 hover:bg-amber-50",
    bgClass: "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200/80",
  },
  admin: {
    label: "Mode Manajemen & Admin",
    shortLabel: "Manajemen",
    icon: Building2,
    colorClass: "text-indigo-700 hover:bg-indigo-50",
    bgClass: "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200/80",
  },
  bendahara: {
    label: "Mode Bendahara & Keuangan",
    shortLabel: "Bendahara",
    icon: Wallet,
    colorClass: "text-teal-700 hover:bg-teal-50",
    bgClass: "bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200/80",
  },
  siswa: {
    label: "Mode Peserta Didik",
    shortLabel: "Siswa",
    icon: BookOpen,
    colorClass: "text-blue-700 hover:bg-blue-50",
    bgClass: "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200/80",
  },
  super_admin: {
    label: "Mode Super Admin",
    shortLabel: "Super Admin",
    icon: ShieldCheck,
    colorClass: "text-purple-700 hover:bg-purple-50",
    bgClass: "bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200/80",
  },
};

export function Header({ user }: HeaderProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  const handleSwitchRole = async (targetRole: string) => {
    // Normalisasi 'guru' atau 'tutor' ke nama role standar 'pendidik'
    const normalizedTarget = targetRole === "guru" || targetRole === "tutor" ? "pendidik" : targetRole;
    if (isSwitching || normalizedTarget === user.activeRole) return;

    try {
      setIsSwitching(true);
      const res = await fetch("/api/auth/switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRole: normalizedTarget }),
      });
      const data = await res.json();
      if (res.ok && data.redirectUrl) {
        setShowDropdown(false);
        window.location.href = data.redirectUrl;
      } else {
        alert(data.error || "Gagal beralih peran");
      }
    } catch (err) {
      console.error("Failed to switch role:", err);
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setIsSwitching(false);
    }
  };

  const activeRole = (user.activeRole || user.role) as Role;

  // Mendukung parsing string koma (misal: "pendidik,admin,orang_tua")
  const rawUserRoles: string[] =
    user.role === "super_admin"
      ? ["super_admin", "admin", "bendahara", "pendidik", "orang_tua", "siswa"]
      : Array.from(
        new Set([
          activeRole,
          ...(Array.isArray(user.roles) ? user.roles : []),
          ...(user.role ? user.role.split(",") : []),
        ])
      ).map((r) => r.trim().toLowerCase());

  // Memetakan ke Role valid yang ada di RBAC
  const userRoles: Role[] = rawUserRoles
    .map((r) => (r === "guru" || r === "tutor" ? "pendidik" : r))
    .filter((r): r is Role => Boolean(ROLE_CONFIGS[r as Role]));

  const isDualRole = userRoles.length > 1 || user.role === "super_admin" || user.isDualRole === true;
  const otherRoles = userRoles.filter((r) => r !== activeRole);
  const roleConfig = ROLE_CONFIGS[activeRole] || ROLE_CONFIGS.admin;

  // Format tanggal Indonesia berbasis zona waktu Asia/Jakarta (WIB)
  const rawTodayStr = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const todayStr = rawTodayStr.charAt(0).toUpperCase() + rawTodayStr.slice(1);

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 px-4 lg:px-8 flex items-center justify-between shadow-xs">
      {/* Indicator Kiri: Tanggal & Tahun Ajaran */}
      <div className="flex items-center space-x-3 pl-12 lg:pl-0">
        <div className="hidden sm:flex items-center space-x-2 text-xs font-medium text-slate-500 bg-slate-100/80 py-1.5 px-3 rounded-full">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span suppressHydrationWarning>{todayStr}</span>
        </div>
        <div className="hidden md:inline-block text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/70 px-2.5 py-1 rounded-full">
          T.A. 2025/2026 (Semester Ganjil)
        </div>
      </div>

      {/* Area Kanan: Controls & Switcher */}
      <div className="flex items-center space-x-3">
        <NotificationBell />

        {/* Tampilkan SEMUA role pilihan selain role aktif tanpa pembatasan slice */}
        {isDualRole && otherRoles.length > 0 && (
          <div className="hidden md:flex items-center gap-2">
            {otherRoles.map((targetRole) => {
              const meta = ROLE_SWITCH_METAS[targetRole] || ROLE_SWITCH_METAS.admin;
              const Icon = meta.icon;
              return (
                <button
                  key={targetRole}
                  onClick={() => handleSwitchRole(targetRole)}
                  disabled={isSwitching}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-bold transition shadow-2xs hover-lift ${meta.bgClass}`}
                  title={`Beralih ke ${meta.label}`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{isSwitching ? "Beralih..." : `Beralih ke ${meta.shortLabel}`}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* User Profile Dropdown Button */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition border border-slate-200/60"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-700 flex items-center justify-center text-white text-xs font-bold shadow-xs">
              {user.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[130px]">
                {user.name}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[10px] text-slate-500 font-semibold">{roleConfig?.badgeLabel || user.role}</span>
                {isDualRole && (
                  <span className="text-[9px] px-1 py-0.2 bg-purple-50 text-purple-700 rounded font-bold border border-purple-200">
                    Ganda ({userRoles.length} Peran)
                  </span>
                )}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-1">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">{user.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${roleConfig?.badgeColor || "bg-slate-100 text-slate-800"}`}>
                    {roleConfig?.name || user.role}
                  </span>
                </div>
              </div>

              {/* List Role Switcher di dalam Dropdown */}
              {isDualRole && userRoles.length > 1 && (
                <div className="px-2 py-2 border-b border-slate-100 space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                    Beralih Peran (Role Switcher):
                  </p>

                  {userRoles.map((r) => {
                    const meta = ROLE_SWITCH_METAS[r] || ROLE_SWITCH_METAS.admin;
                    const Icon = meta.icon;
                    const isActive = activeRole === r;

                    return (
                      <button
                        key={r}
                        onClick={() => handleSwitchRole(r)}
                        disabled={isSwitching || isActive}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition ${isActive
                          ? "bg-slate-100 text-slate-900 font-bold border border-slate-200/80"
                          : `${meta.colorClass} hover:bg-slate-50`
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{meta.label}</span>
                        </div>
                        {isActive && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Action Logout */}
              <div className="px-2 py-1">
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{isLoggingOut ? "Keluar..." : "Keluar (Logout)"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}