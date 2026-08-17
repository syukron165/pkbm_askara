"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarCheck,
  BookOpen,
  Library,
  FileCheck,
  Award,
  Layers,
  Settings,
  HelpCircle,
  Menu,
  X,
  Sparkles,
  ClipboardList,
  BookMarked,
  BarChart3,
  HeartHandshake,
  CalendarDays,
  FolderKanban,
  ChevronDown,
  ChevronRight,
  Database,
  Banknote,
  Receipt,
  TrendingDown,
  FileSpreadsheet,
  CreditCard,
  Edit3,
  FileText,
  Building2,
  Coins,
  Trophy,
  Landmark,
  Monitor,
  // PRD V2 new icons
  CalendarRange,
  CircleDollarSign,
  Target,
  QrCode,
  MessageSquare,
  Send,
  PiggyBank,
  Mail,
  UserCheck,
} from "lucide-react";
import { Role, ROLE_CONFIGS, canAccessFinance } from "@/lib/rbac";
import { AuthUser } from "@/lib/auth";

interface SidebarProps {
  role: Role;
  userName: string;
  user?: AuthUser | null;
}

interface NavSubItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  children?: NavSubItem[];
}

export function Sidebar({ role, userName, user }: SidebarProps) {
  const pathname = usePathname();
  const isFinance = canAccessFinance(user || { role });
  const [isOpen, setIsOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    "Data Master": true,
    "Keuangan": false,
    "Club Belajar": false,
    "Pusat e-Rapor": false,
    "Entri e-Rapor": false,
    "Pemantauan Akademik": false,
    "Tahun Ajaran": false,
  });

  const toggleSubmenu = (menuLabel: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuLabel]: !prev[menuLabel],
    }));
  };

  // Automatically keep submenu open if current route matches one of its children
  useEffect(() => {
    if (
      pathname.startsWith("/admin/master") ||
      pathname.startsWith("/admin/management") ||
      pathname.startsWith("/admin/teachers") ||
      pathname.startsWith("/admin/students") ||
      pathname.startsWith("/admin/subjects") ||
      pathname.startsWith("/admin/classes")
    ) {
      setExpandedMenus((prev) => ({ ...prev, "Data Master": true }));
    }
    if (pathname.startsWith("/admin/keuangan")) {
      setExpandedMenus((prev) => ({ ...prev, "Keuangan": true }));
    }
    if (pathname.startsWith("/admin/club-belajar")) {
      setExpandedMenus((prev) => ({ ...prev, "Club Belajar": true }));
    }
    if (pathname.startsWith("/rapor")) {
      setExpandedMenus((prev) => ({
        ...prev,
        "Pusat e-Rapor": true,
        "Entri e-Rapor": true,
      }));
    }
    if (
      pathname.startsWith("/admin/lms") ||
      pathname.startsWith("/admin/tugas") ||
      pathname.startsWith("/admin/cbt")
    ) {
      setExpandedMenus((prev) => ({ ...prev, "Pemantauan Akademik": true }));
    }
    if (pathname.startsWith("/admin/tahun-ajaran")) {
      setExpandedMenus((prev) => ({ ...prev, "Tahun Ajaran": true }));
    }
  }, [pathname]);

  const getNavItems = (currentRole: Role): NavItem[] => {
    switch (currentRole) {
      case "super_admin":
      case "bendahara":
      case "admin":
        const adminItems: NavItem[] = [
          { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
          {
            label: "Data Master",
            href: "/admin/master",
            icon: FolderKanban,
            children: [
              { label: "Data Manajemen", href: "/admin/management", icon: Building2 },
              { label: "Data Guru", href: "/admin/teachers", icon: GraduationCap },
              { label: "Data Siswa", href: "/admin/students", icon: Users },
              { label: "Data Orang Tua", href: "/admin/parents", icon: Users },
              { label: "Data Mata Pelajaran", href: "/admin/subjects", icon: BookOpen },
              { label: "Data Kelas & Rombel", href: "/admin/classes", icon: Layers },
            ],
          },
          { label: "Jadwal & Kalender", href: "/jadwal", icon: CalendarDays },
          { label: "Presensi & Rekap", href: "/admin/attendances", icon: CalendarCheck },
          { label: "Jurnal Mengajar", href: "/admin/journals", icon: BookMarked },
        ];

        // RESTRICTION: Full Keuangan is ONLY for Super Admin & Bendahara / Finance
        if (isFinance) {
          adminItems.push({
            label: "Keuangan",
            href: "/admin/keuangan",
            icon: Banknote,
            badge: "Bendahara",
            children: [
              { label: "Dashboard Keuangan", href: "/admin/keuangan", icon: Banknote },
              { label: "Rekap SPP", href: "/admin/keuangan/spp", icon: Receipt },
              { label: "Pemasukan Non-SPP", href: "/admin/keuangan/pemasukan-lain", icon: Coins },
              { label: "Pengeluaran", href: "/admin/keuangan/pengeluaran", icon: TrendingDown },
              { label: "Pengajuan Biaya", href: "/admin/keuangan/pengajuan", icon: CircleDollarSign, badge: "V2" },
              { label: "Slip Gaji", href: "/admin/keuangan/slip-gaji", icon: FileText },
              { label: "Laporan Lengkap", href: "/admin/keuangan/laporan", icon: FileSpreadsheet },
            ],
          });
        } else {
          // General management personnel can only submit operational cost proposals
          adminItems.push({
            label: "Pengajuan Anggaran",
            href: "/admin/keuangan/pengajuan",
            icon: CircleDollarSign,
            badge: "Proposal",
          });
        }

        adminItems.push(
          {
            label: "Club Belajar",
            href: "/admin/club-belajar",
            icon: Trophy,
            children: [
              { label: "Dashboard Club Belajar", href: "/admin/club-belajar", icon: LayoutDashboard },
              { label: "Club Belajar PKBM Askara", href: "/admin/club-belajar/daftar", icon: Trophy },
              { label: "Kehadiran Siswa Club", href: "/admin/club-belajar/kehadiran", icon: CalendarCheck },
            ],
          },
          {
            label: "Pemantauan Akademik",
            href: "/admin/lms",
            icon: Monitor,
            children: [
              { label: "LMS Materi Belajar", href: "/admin/lms", icon: BookOpen },
              { label: "Tugas Mandiri Siswa", href: "/admin/tugas", icon: ClipboardList },
              { label: "Ujian CBT Online", href: "/admin/cbt", icon: FileCheck },
            ],
          },
          { label: "Pustaka Digital", href: "/pustaka", icon: Library },
          {
            label: "Pusat e-Rapor",
            href: "/rapor",
            icon: Award,
            children: [
              { label: "Lihat & Cetak e-Rapor", href: "/rapor", icon: Award },
              { label: "Edit Nilai & Catatan", href: "/rapor/edit", icon: Edit3 },
              { label: "Cover Depan Rapor", href: "/rapor/cover", icon: FileText },
              { label: "Kop & Head Lembaga", href: "/rapor/pengaturan", icon: Building2 },
            ],
          },
          // PRD V2 — Modul 1: Tahun Ajaran
          { label: "Data Tahun Ajaran", href: "/admin/tahun-ajaran", icon: CalendarRange },
          // PRD V2 — Modul 3: KPI
          { label: "Tugas & KPI", href: "/admin/kpi", icon: Target },
          // PRD V2 — Modul 4: Buku Tamu
          { label: "Buku Tamu Digital", href: "/admin/buku-tamu", icon: QrCode },
          // PRD V2 — Modul 5: Aspirasi
          { label: "Saran & Aspirasi", href: "/admin/aspirasi", icon: MessageSquare, badge: "Baru" },
          // Kesekretariatan & Persuratan Otomatis
          { label: "Kesekretariatan & Surat", href: "/admin/sekretariat", icon: Mail, badge: "Auto" },
          // Pendaftaran Mandiri & SPMB
          { label: "Verifikasi Pendaftar", href: "/admin/verifikasi-pendaftar", icon: UserCheck, badge: "SPMB" },
          // Tabungan Siswa & Ortu
          { label: "Tabungan Siswa & Ortu", href: "/admin/tabungan", icon: PiggyBank, badge: "Qurban" }
        );

        if (currentRole === "super_admin") {
          adminItems.push({
            label: "Pencatatan Aset",
            href: "/admin/aset",
            icon: Landmark,
            badge: "Super",
          });
        }

        adminItems.push({ label: "Kelola Pengguna", href: "/admin/users", icon: Settings });
        return adminItems;
      case "pendidik":
        return [
          { label: "Dashboard Guru", href: "/guru", icon: LayoutDashboard },
          { label: "Jadwal & Kalender", href: "/jadwal", icon: CalendarDays },
          { label: "Presensi Harian", href: "/guru/presensi", icon: CalendarCheck },
          { label: "Jurnal Mengajar", href: "/guru/jurnal", icon: BookMarked },
          { label: "LMS Materi & Tugas", href: "/guru/lms", icon: BookOpen },
          { label: "Asesmen & CBT", href: "/guru/cbt", icon: FileCheck },
          {
            label: "Club Belajar",
            href: "/admin/club-belajar",
            icon: Trophy,
            children: [
              { label: "Dashboard Club Belajar", href: "/admin/club-belajar", icon: LayoutDashboard },
              { label: "Profil & Anggota Club", href: "/admin/club-belajar/daftar", icon: Trophy },
              { label: "Presensi Pertemuan", href: "/admin/club-belajar/kehadiran", icon: CalendarCheck },
            ],
          },
          { label: "Rekap Nilai", href: "/guru/nilai", icon: BarChart3 },
          { label: "Pustaka Digital", href: "/pustaka", icon: Library },
          // PRD V2
          { label: "Pengajuan Biaya", href: "/guru/pengajuan", icon: CircleDollarSign },
          { label: "Tugas & KPI Saya", href: "/guru/tugas-kpi", icon: Target },
          { label: "Buku Tabungan Guru", href: "/guru/tabungan", icon: PiggyBank, badge: "Qurban" },
          {
            label: "Entri e-Rapor",
            href: "/rapor",
            icon: Award,
            children: [
              { label: "Lihat & Cetak e-Rapor", href: "/rapor", icon: Award },
              { label: "Input Nilai & Catatan", href: "/rapor/edit", icon: Edit3 },
              { label: "Cover Depan Rapor", href: "/rapor/cover", icon: FileText },
            ],
          },
        ];
      case "siswa":
        return [
          { label: "Beranda Siswa", href: "/siswa", icon: LayoutDashboard },
          { label: "Jadwal & Kalender", href: "/jadwal", icon: CalendarDays },
          { label: "Presensi Saya", href: "/siswa/presensi", icon: CalendarCheck },
          { label: "Materi Belajar", href: "/siswa/materi", icon: BookOpen },
          { label: "Tugas Mandiri", href: "/siswa/tugas", icon: ClipboardList },
          { label: "Ujian CBT Online", href: "/siswa/cbt", icon: FileCheck },
          { label: "Club Belajar", href: "/siswa/club-belajar", icon: Trophy },
          { label: "Buku Tabungan Siswa", href: "/siswa/tabungan", icon: PiggyBank, badge: "Mandiri" },
          { label: "Pustaka Digital", href: "/pustaka", icon: Library },
          { label: "e-Rapor & Capaian", href: "/siswa/rapor", icon: Award },
          // PRD V2 Modul 5
          { label: "Saran & Aspirasi", href: "/siswa/aspirasi", icon: MessageSquare, badge: "Baru" },
        ];
      case "orang_tua":
        return [
          { label: "Portal Wali Murid", href: "/orang-tua", icon: LayoutDashboard },
          { label: "Jadwal & Kalender", href: "/jadwal", icon: CalendarDays },
          { label: "Presensi Anak", href: "/orang-tua/presensi", icon: CalendarCheck },
          { label: "Nilai & Perkembangan", href: "/orang-tua/nilai", icon: BarChart3 },
          { label: "Club Belajar Anak", href: "/orang-tua/club-belajar", icon: Trophy },
          { label: "e-Rapor Anak", href: "/orang-tua/rapor", icon: Award },
          { label: "Pembayaran SPP", href: "/orang-tua/keuangan", icon: CreditCard, badge: "Tagihan" },
          { label: "Buku Tabungan Keluarga", href: "/orang-tua/tabungan", icon: PiggyBank, badge: "Pendidikan" },
          { label: "Pustaka Referensi", href: "/pustaka", icon: Library },
          // PRD V2 Modul 5
          { label: "Saran & Aspirasi", href: "/orang-tua/aspirasi", icon: MessageSquare, badge: "Baru" },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems(role);
  const roleConfig = ROLE_CONFIGS[role] || ROLE_CONFIGS.admin;

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="lg:hidden fixed top-3 left-3 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2.5 rounded-lg bg-white shadow-md border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
          aria-label="Toggle Navigation Menu"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Backdrop for Mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-5 border-b border-slate-800/80 bg-slate-950/40">
          <Link href="/" className="flex items-center space-x-2.5">
            <img
              src="/logo-dark.png"
              alt="PKBM Askara"
              style={{ height: "36px", width: "auto", maxHeight: "36px" }}
              className="h-9 max-h-9 w-auto object-contain rounded"
            />
          </Link>
        </div>

        {/* Role Badge & Dual-Role Switcher */}
        <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-900/60 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Akses Peran
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleConfig.badgeColor}`}
            >
              {roleConfig.badgeLabel}
            </span>
          </div>

          {/* Quick Dual-Role Switcher in Sidebar */}
          {(role === "super_admin" || role === "admin" || role === "pendidik") && (
            <div className="grid grid-cols-2 gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700/60 text-[11px] font-bold">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await fetch("/api/auth/switch-role", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ targetRole: "pendidik" }),
                    });
                    window.location.href = "/guru";
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className={`py-1 px-2 rounded-lg transition text-center flex items-center justify-center gap-1 ${
                  role === "pendidik"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                }`}
                title="Beralih ke Dashboard & Menu Mengajar"
              >
                <span>👨‍🏫 Guru</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  try {
                    await fetch("/api/auth/switch-role", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ targetRole: "admin" }),
                    });
                    window.location.href = "/admin";
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className={`py-1 px-2 rounded-lg transition text-center flex items-center justify-center gap-1 ${
                  role === "admin" || role === "super_admin"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                }`}
                title="Beralih ke Dashboard & Menu Manajemen"
              >
                <span>🏢 Manajemen</span>
              </button>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isChildActive =
              hasChildren &&
              item.children?.some(
                (child) => pathname === child.href || pathname.startsWith(child.href)
              );

            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" &&
                item.href !== "/guru" &&
                item.href !== "/siswa" &&
                item.href !== "/orang-tua" &&
                pathname.startsWith(item.href)) ||
              isChildActive;

            const isExpanded = expandedMenus[item.label] ?? false;
            const Icon = item.icon;

            if (hasChildren) {
              return (
                <div key={item.label} className="space-y-1">
                  <div
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer group ${
                      isActive
                        ? "bg-slate-800/90 text-white font-semibold"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                    onClick={() => toggleSubmenu(item.label)}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon
                        className={`w-4 h-4 transition-colors ${
                          isActive ? "text-emerald-400" : "text-slate-400 group-hover:text-white"
                        }`}
                      />
                      <Link
                        href={item.href}
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsOpen(false);
                        }}
                        className="hover:underline"
                      >
                        {item.label}
                      </Link>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSubmenu(item.label);
                      }}
                      className="p-1 text-slate-400 hover:text-white transition"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Submenu Items */}
                  {isExpanded && (
                    <div className="pl-6 pr-1 py-1 space-y-1 border-l-2 border-slate-800 ml-5">
                      {item.children?.map((child) => {
                        const isSubActive =
                          pathname === child.href || pathname.startsWith(child.href);
                        const SubIcon = child.icon;

                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                              isSubActive
                                ? "bg-emerald-600 text-white font-semibold shadow-xs"
                                : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                            }`}
                          >
                            <div className="flex items-center space-x-2.5">
                              <SubIcon
                                className={`w-3.5 h-3.5 transition-colors ${
                                  isSubActive ? "text-white" : "text-slate-400 group-hover:text-white"
                                }`}
                              />
                              <span>{child.label}</span>
                            </div>
                            {child.badge && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                                {child.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-sm font-semibold"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Card / Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-emerald-700/60 border border-emerald-500/40 flex items-center justify-center text-xs font-semibold text-emerald-200">
              {userName ? userName.substring(0, 2).toUpperCase() : "AD"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{userName || "Pengguna"}</p>
              <p className="text-[10px] text-slate-400 truncate">{roleConfig.name}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
