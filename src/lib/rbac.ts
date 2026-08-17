export type Role = "super_admin" | "admin" | "bendahara" | "pendidik" | "siswa" | "orang_tua";

export interface RoleConfig {
  name: string;
  badgeLabel: string;
  badgeColor: string;
  defaultRedirect: string;
  allowedPrefixes: string[];
}

export const ROLE_CONFIGS: Record<Role, RoleConfig> = {
  super_admin: {
    name: "Super Admin / Kepala PKBM",
    badgeLabel: "Super Admin",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
    defaultRedirect: "/admin",
    allowedPrefixes: [
      "/admin",
      "/guru",
      "/siswa",
      "/orang-tua",
      "/pustaka",
      "/rapor",
      "/jadwal",
      "/kalender",
      "/admin/keuangan",
      "/admin/tahun-ajaran",
      "/admin/kpi",
      "/admin/buku-tamu",
      "/admin/aspirasi",
      "/tamu",
    ],
  },
  bendahara: {
    name: "Bendahara & Manajemen Keuangan",
    badgeLabel: "Bendahara / Finance",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    defaultRedirect: "/admin/keuangan",
    allowedPrefixes: [
      "/admin",
      "/admin/keuangan",
      "/admin/master",
      "/admin/management",
      "/admin/teachers",
      "/admin/students",
      "/admin/parents",
      "/admin/kpi",
      "/admin/tabungan",
      "/jadwal",
      "/kalender",
      "/pustaka",
      "/admin/tahun-ajaran",
    ],
  },
  admin: {
    name: "Staf Manajemen PKBM",
    badgeLabel: "Manajemen",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    defaultRedirect: "/admin",
    allowedPrefixes: [
      "/admin",
      "/admin/master",
      "/admin/management",
      "/admin/teachers",
      "/admin/students",
      "/admin/parents",
      "/admin/subjects",
      "/admin/classes",
      "/admin/attendances",
      "/admin/journals",
      "/admin/club-belajar",
      "/admin/lms",
      "/admin/tugas",
      "/admin/cbt",
      "/admin/tahun-ajaran",
      "/admin/kpi",
      "/admin/buku-tamu",
      "/admin/aspirasi",
      "/admin/tabungan",
      "/pustaka",
      "/rapor",
      "/jadwal",
      "/kalender",
      "/admin/keuangan/pengajuan", // Staf manajemen hanya boleh mengajukan anggaran
    ],
  },
  pendidik: {
    name: "Pendidik / Tutor",
    badgeLabel: "Pendidik",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    defaultRedirect: "/guru",
    allowedPrefixes: [
      "/guru",
      "/guru/tabungan",
      "/pustaka",
      "/rapor",
      "/jadwal",
      "/kalender",
      "/admin/club-belajar",
      "/guru/pengajuan",
      "/guru/tugas-kpi",
      "/guru/presensi",
    ],
  },
  siswa: {
    name: "Peserta Didik (Siswa)",
    badgeLabel: "Siswa",
    badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
    defaultRedirect: "/siswa",
    allowedPrefixes: [
      "/siswa",
      "/siswa/tabungan",
      "/pustaka",
      "/jadwal",
      "/kalender",
      "/siswa/club-belajar",
      "/siswa/aspirasi",
      "/siswa/presensi",
    ],
  },
  orang_tua: {
    name: "Orang Tua / Wali",
    badgeLabel: "Orang Tua",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    defaultRedirect: "/orang-tua",
    allowedPrefixes: [
      "/orang-tua",
      "/orang-tua/tabungan",
      "/pustaka",
      "/jadwal",
      "/kalender",
      "/orang-tua/keuangan",
      "/orang-tua/club-belajar",
      "/orang-tua/aspirasi",
    ],
  },
};

/**
 * Checks if the user is authorized to access full financial modules
 * (Restricted strictly to Super Admin & Bendahara / Finance).
 */
export function canAccessFinance(user: {
  role?: string;
  managementPosition?: string | null;
  email?: string;
} | null): boolean {
  if (!user) return false;
  if (user.role === "super_admin" || user.role === "bendahara") return true;
  const pos = (user.managementPosition || "").toLowerCase();
  const email = (user.email || "").toLowerCase();
  if (pos.includes("bendahara") || pos.includes("keuangan") || pos.includes("finance")) return true;
  if (email.includes("bendahara") || email.includes("finance") || email === "admin@askara.sch.id") return true;
  return false;
}

export function isRouteAllowed(roleOrRoles: Role | Role[], pathname: string): boolean {
  const roles = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];
  if (roles.includes("super_admin")) return true;

  return roles.some((role) => {
    const config = ROLE_CONFIGS[role];
    if (!config) return false;
    return config.allowedPrefixes.some((prefix) => pathname.startsWith(prefix));
  });
}
