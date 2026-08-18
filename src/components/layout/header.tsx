"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  Bell,
  Calendar,
  User,
  ChevronDown,
  CheckCircle2,
  RefreshCw,
  Building2,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  Check,
} from "lucide-react";
import { AuthUser } from "@/lib/auth";
import { ROLE_CONFIGS, Role } from "@/lib/rbac";
import { NotificationBell } from "./NotificationBell";

interface HeaderProps {
  user: AuthUser;
}

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

  const handleSwitchRole = async (targetRole: Role) => {
    try {
      setIsSwitching(true);
      const res = await fetch("/api/auth/switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRole }),
      });
      const data = await res.json();
      if (data.success) {
        setShowDropdown(false);
        router.push(data.redirectUrl || (targetRole === "admin" ? "/admin" : "/guru"));
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to switch role:", err);
    } finally {
      setIsSwitching(false);
    }
  };

  const activeRole = user.activeRole || user.role;
  const isDualRole =
    user.role === "super_admin" ||
    user.isDualRole === true ||
    (Array.isArray(user.roles) && user.roles.includes("admin") && user.roles.includes("pendidik"));
  const roleConfig = ROLE_CONFIGS[activeRole] || ROLE_CONFIGS.admin;

  const todayStr = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 px-4 lg:px-8 flex items-center justify-between shadow-xs">
      {/* Left indicator: Date & Academic Year */}
      <div className="flex items-center space-x-3 pl-12 lg:pl-0">
        <div className="hidden sm:flex items-center space-x-2 text-xs font-medium text-slate-500 bg-slate-100/80 py-1.5 px-3 rounded-full">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span suppressHydrationWarning>{todayStr}</span>
        </div>
        <div className="hidden md:inline-block text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/70 px-2.5 py-1 rounded-full">
          T.A. 2025/2026 (Semester Ganjil)
        </div>
      </div>

      {/* Right User Controls & Dual Role Switcher */}
      <div className="flex items-center space-x-3">
        <NotificationBell />

        {/* Quick Role Switcher Button for dual-role users */}
        {isDualRole && (
          <div className="hidden md:flex items-center gap-2">
            {activeRole === "pendidik" ? (
              <button
                onClick={() => handleSwitchRole("admin")}
                disabled={isSwitching}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-xl text-xs font-bold transition shadow-2xs hover-lift"
                title="Beralih ke Mode Manajemen PKBM"
              >
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>{isSwitching ? "Beralih..." : "Beralih ke Manajemen"}</span>
              </button>
            ) : (
              <button
                onClick={() => handleSwitchRole("pendidik")}
                disabled={isSwitching}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-xl text-xs font-bold transition shadow-2xs hover-lift"
                title="Beralih ke Mode Mengajar / Tutor"
              >
                <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isSwitching ? "Beralih..." : "Beralih ke Mode Guru"}</span>
              </button>
            )}
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
                <span className="text-[10px] text-slate-500 font-semibold">{roleConfig.badgeLabel}</span>
                {isDualRole && (
                  <span className="text-[9px] px-1 py-0.2 bg-purple-50 text-purple-700 rounded font-bold border border-purple-200">
                    Ganda
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
                <div className="mt-1 flex items-center gap-1.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${roleConfig.badgeColor}`}>
                    {roleConfig.name}
                  </span>
                </div>
              </div>

              {/* Role Switcher in Dropdown for Dual-Role Personnels */}
              {isDualRole && (
                <div className="px-2 py-2 border-b border-slate-100 space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                    Beralih Peran (Role Switcher):
                  </p>

                  <button
                    onClick={() => handleSwitchRole("pendidik")}
                    disabled={isSwitching || activeRole === "pendidik"}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition ${
                      activeRole === "pendidik"
                        ? "bg-emerald-50 text-emerald-800 font-bold"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-emerald-600" />
                      <span>Mode Pendidik / Tutor</span>
                    </div>
                    {activeRole === "pendidik" && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>

                  <button
                    onClick={() => handleSwitchRole("admin")}
                    disabled={isSwitching || activeRole === "admin"}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition ${
                      activeRole === "admin"
                        ? "bg-indigo-50 text-indigo-800 font-bold"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-indigo-600" />
                      <span>Mode Manajemen & Admin</span>
                    </div>
                    {activeRole === "admin" && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </button>
                </div>
              )}

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
