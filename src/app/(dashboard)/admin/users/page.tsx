"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  UserPlus,
  Search,
  Shield,
  ShieldCheck,
  KeyRound,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  Mail,
  Phone,
  GraduationCap,
  HeartHandshake,
  Building,
  Wallet,
  Sparkles,
  Layers,
  Filter,
  UserCheck,
  ExternalLink,
  ChevronRight,
  User,
  SlidersHorizontal,
} from "lucide-react";

type RoleTab = "all" | "siswa" | "orang_tua" | "tutor" | "manajemen";
type StatusFilter = "all" | "active" | "inactive";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  roleCategory: "siswa" | "tutor" | "orang_tua" | "manajemen";
  phone: string;
  nik: string;
  gender: string;
  address: string;
  avatarUrl: string | null;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  studentInfo?: {
    id: string;
    nisn: string;
    packetType: string;
    studyModel: string;
    status: string;
    currentClass: string;
  } | null;
  parentInfo?: {
    id: string;
    relationship: string;
    job: string;
  } | null;
}

interface StatsData {
  totalUsers: number;
  totalSiswa: number;
  totalTutor: number;
  totalOrangTua: number;
  totalManajemen: number;
  totalActive: number;
  totalInactive: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [stats, setStats] = useState<StatsData>({
    totalUsers: 0,
    totalSiswa: 0,
    totalTutor: 0,
    totalOrangTua: 0,
    totalManajemen: 0,
    totalActive: 0,
    totalInactive: 0,
  });

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<RoleTab>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Feedback toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  // Form Add State
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "siswa",
    phone: "",
    nik: "",
    gender: "L",
    address: "",
    isActive: true,
    packetType: "Paket C",
    studyModel: "Reguler",
    nisn: "",
    relationship: "ORANG_TUA",
    job: "",
  });

  // Form Edit State
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "siswa",
    phone: "",
    nik: "",
    gender: "L",
    address: "",
    isActive: true,
    newPassword: "",
  });

  // Reset Password State
  const [resetPasswordVal, setResetPasswordVal] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch users data
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeTab !== "all") params.append("role", activeTab);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (searchQuery.trim()) params.append("q", searchQuery.trim());

      const res = await fetch(`/api/users?${params.toString()}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setUsers(data.users || []);
        if (data.stats) setStats(data.stats);
      } else {
        showToast(data.error || "Gagal memuat data pengguna", "error");
      }
    } catch (err: any) {
      console.error(err);
      showToast("Kesalahan koneksi ke server", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 200);
    return () => clearTimeout(timer);
  }, [activeTab, statusFilter, searchQuery]);

  // Handle Toggle Active Status
  const handleToggleStatus = async (user: UserItem) => {
    const nextStatus = !user.isActive;
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, isActive: nextStatus }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(data.message);
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, isActive: nextStatus } : u))
        );
        setStats((prev) => ({
          ...prev,
          totalActive: nextStatus ? prev.totalActive + 1 : prev.totalActive - 1,
          totalInactive: nextStatus ? prev.totalInactive - 1 : prev.totalInactive + 1,
        }));
      } else {
        showToast(data.error || "Gagal mengubah status", "error");
      }
    } catch (err) {
      showToast("Terjadi kesalahan jaringan", "error");
    }
  };

  // Handle Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(data.message);
        setIsAddModalOpen(false);
        setAddForm({
          name: "",
          email: "",
          password: "",
          role: "siswa",
          phone: "",
          nik: "",
          gender: "L",
          address: "",
          isActive: true,
          packetType: "Paket C",
          studyModel: "Reguler",
          nisn: "",
          relationship: "ORANG_TUA",
          job: "",
        });
        fetchUsers();
      } else {
        showToast(data.error || "Gagal membuat pengguna", "error");
      }
    } catch (err) {
      showToast("Terjadi kesalahan jaringan", "error");
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (user: UserItem) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone === "-" ? "" : user.phone,
      nik: user.nik === "-" ? "" : user.nik,
      gender: user.gender === "-" ? "L" : user.gender,
      address: user.address === "-" ? "" : user.address,
      isActive: user.isActive,
      newPassword: "",
    });
    setIsEditModalOpen(true);
  };

  // Handle Submit Edit
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedUser.id,
          ...editForm,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(data.message);
        setIsEditModalOpen(false);
        fetchUsers();
      } else {
        showToast(data.error || "Gagal memperbarui pengguna", "error");
      }
    } catch (err) {
      showToast("Terjadi kesalahan jaringan", "error");
    }
  };

  // Open Reset Password Modal
  const handleOpenResetPassword = (user: UserItem) => {
    setSelectedUser(user);
    setResetPasswordVal("");
    setCopiedPass(false);
    setShowPassword(true);
    setIsResetPasswordModalOpen(true);
  };

  // Generate random password
  const handleGenerateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";
    let pass = "";
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setResetPasswordVal(pass);
  };

  // Handle Submit Reset Password
  const handleSubmitResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!resetPasswordVal || resetPasswordVal.length < 6) {
      showToast("Kata sandi baru minimal 6 karakter", "error");
      return;
    }

    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedUser.id,
          newPassword: resetPasswordVal,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(`Kata sandi untuk ${selectedUser.name} berhasil diubah!`);
        setIsResetPasswordModalOpen(false);
      } else {
        showToast(data.error || "Gagal mengubah kata sandi", "error");
      }
    } catch (err) {
      showToast("Terjadi kesalahan jaringan", "error");
    }
  };

  // Open Delete Modal
  const handleOpenDelete = (user: UserItem) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  // Handle Confirm Delete
  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    try {
      const res = await fetch(`/api/users?id=${selectedUser.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(data.message);
        setIsDeleteModalOpen(false);
        fetchUsers();
      } else {
        showToast(data.error || "Gagal menghapus pengguna", "error");
      }
    } catch (err) {
      showToast("Terjadi kesalahan jaringan", "error");
    }
  };

  // Copy password to clipboard
  const handleCopyPassword = () => {
    if (!resetPasswordVal) return;
    navigator.clipboard.writeText(resetPasswordVal);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2500);
  };

  // Helpers for role badges
  const getRoleBadge = (role: string) => {
    const r = role.toLowerCase();
    if (r.includes("admin") && r.includes("pendidik")) {
      return {
        label: "Dual Role (Guru & Manajemen)",
        bg: "bg-teal-100 text-teal-900 border-teal-200",
        icon: Sparkles,
      };
    }

    switch (r) {
      case "super_admin":
        return {
          label: "Super Admin",
          bg: "bg-purple-100 text-purple-900 border-purple-200",
          icon: Shield,
        };
      case "admin":
        return {
          label: "Administrator",
          bg: "bg-blue-100 text-blue-900 border-blue-200",
          icon: Building,
        };
      case "bendahara":
        return {
          label: "Bendahara",
          bg: "bg-teal-100 text-teal-900 border-teal-200",
          icon: Wallet,
        };
      case "pendidik":
      case "guru":
      case "tutor":
        return {
          label: "Pendidik / Tutor",
          bg: "bg-emerald-100 text-emerald-900 border-emerald-200",
          icon: Users,
        };
      case "siswa":
        return {
          label: "Peserta Didik",
          bg: "bg-indigo-100 text-indigo-900 border-indigo-200",
          icon: GraduationCap,
        };
      case "orang_tua":
      case "orangtua":
        return {
          label: "Orang Tua / Wali",
          bg: "bg-amber-100 text-amber-900 border-amber-200",
          icon: HeartHandshake,
        };
      default:
        return {
          label: role.toUpperCase(),
          bg: "bg-slate-100 text-slate-800 border-slate-200",
          icon: User,
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-bold transition-all duration-300 animate-slide-up ${
            toast.type === "success"
              ? "bg-emerald-900 text-white border-emerald-700 shadow-emerald-900/30"
              : "bg-rose-900 text-white border-rose-700 shadow-rose-900/30"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Role-Based Access Control (RBAC)</span>
            </span>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-semibold">
              Multi-Role Terpadu
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Manajemen Pengguna & Hak Akses
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Kelola seluruh akun pengguna terdaftar, status keaktifan, pengaturan kata sandi, serta hak akses peran sistem (Siswa, Orang Tua, Tutor, Manajemen).
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={fetchUsers}
            disabled={loading}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl border border-slate-200 transition shadow-2xs"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-600" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white font-bold rounded-2xl text-xs transition flex items-center gap-2 shadow-md hover:shadow-lg"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Pengguna Baru</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div
          onClick={() => setActiveTab("all")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === "all"
              ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-800/30"
              : "bg-white text-slate-800 border-slate-200/80 hover:bg-slate-50 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] uppercase font-bold tracking-wider ${activeTab === "all" ? "text-slate-400" : "text-slate-500"}`}>
              Semua Pengguna
            </span>
            <Users className={`w-4 h-4 ${activeTab === "all" ? "text-slate-300" : "text-slate-400"}`} />
          </div>
          <p className="text-2xl font-black">{stats.totalUsers}</p>
          <p className={`text-[10px] mt-1 ${activeTab === "all" ? "text-emerald-400" : "text-emerald-700"} font-semibold`}>
            {stats.totalActive} Akun Aktif
          </p>
        </div>

        <div
          onClick={() => setActiveTab("siswa")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === "siswa"
              ? "bg-indigo-700 text-white border-indigo-700 shadow-md ring-2 ring-indigo-600/30"
              : "bg-white text-slate-800 border-slate-200/80 hover:bg-indigo-50/50 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] uppercase font-bold tracking-wider ${activeTab === "siswa" ? "text-indigo-200" : "text-indigo-600"}`}>
              Peserta Didik (Siswa)
            </span>
            <GraduationCap className={`w-4 h-4 ${activeTab === "siswa" ? "text-indigo-200" : "text-indigo-600"}`} />
          </div>
          <p className="text-2xl font-black">{stats.totalSiswa}</p>
          <p className={`text-[10px] mt-1 ${activeTab === "siswa" ? "text-indigo-100" : "text-slate-500"}`}>
            Paket A, B, C & Kursus
          </p>
        </div>

        <div
          onClick={() => setActiveTab("tutor")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === "tutor"
              ? "bg-emerald-700 text-white border-emerald-700 shadow-md ring-2 ring-emerald-600/30"
              : "bg-white text-slate-800 border-slate-200/80 hover:bg-emerald-50/50 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] uppercase font-bold tracking-wider ${activeTab === "tutor" ? "text-emerald-200" : "text-emerald-600"}`}>
              Tutor / Guru
            </span>
            <Users className={`w-4 h-4 ${activeTab === "tutor" ? "text-emerald-200" : "text-emerald-600"}`} />
          </div>
          <p className="text-2xl font-black">{stats.totalTutor}</p>
          <p className={`text-[10px] mt-1 ${activeTab === "tutor" ? "text-emerald-100" : "text-slate-500"}`}>
            Pendidik Kesetaraan
          </p>
        </div>

        <div
          onClick={() => setActiveTab("orang_tua")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === "orang_tua"
              ? "bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-500/30"
              : "bg-white text-slate-800 border-slate-200/80 hover:bg-amber-50/50 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] uppercase font-bold tracking-wider ${activeTab === "orang_tua" ? "text-amber-200" : "text-amber-600"}`}>
              Orang Tua / Wali
            </span>
            <HeartHandshake className={`w-4 h-4 ${activeTab === "orang_tua" ? "text-amber-200" : "text-amber-600"}`} />
          </div>
          <p className="text-2xl font-black">{stats.totalOrangTua}</p>
          <p className={`text-[10px] mt-1 ${activeTab === "orang_tua" ? "text-amber-100" : "text-slate-500"}`}>
            Akun Wali Terhubung
          </p>
        </div>

        <div
          onClick={() => setActiveTab("manajemen")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === "manajemen"
              ? "bg-blue-700 text-white border-blue-700 shadow-md ring-2 ring-blue-600/30"
              : "bg-white text-slate-800 border-slate-200/80 hover:bg-blue-50/50 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] uppercase font-bold tracking-wider ${activeTab === "manajemen" ? "text-blue-200" : "text-blue-600"}`}>
              Manajemen & TU
            </span>
            <Building className={`w-4 h-4 ${activeTab === "manajemen" ? "text-blue-200" : "text-blue-600"}`} />
          </div>
          <p className="text-2xl font-black">{stats.totalManajemen}</p>
          <p className={`text-[10px] mt-1 ${activeTab === "manajemen" ? "text-blue-100" : "text-slate-500"}`}>
            Admin & Staf Operasional
          </p>
        </div>
      </div>

      {/* Main Content Card: Tabs, Search Toolbar, & Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft overflow-hidden">
        {/* Role Navigation Tabs */}
        <div className="border-b border-slate-200/80 px-4 pt-3 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "all"
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Semua Pengguna</span>
              <span className={`px-1.5 py-0.2 text-[10px] rounded-md font-extrabold ${activeTab === "all" ? "bg-emerald-800 text-emerald-100" : "bg-slate-200 text-slate-700"}`}>
                {stats.totalUsers}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("siswa")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "siswa"
                  ? "bg-indigo-700 text-white shadow-sm"
                  : "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Siswa</span>
              <span className={`px-1.5 py-0.2 text-[10px] rounded-md font-extrabold ${activeTab === "siswa" ? "bg-indigo-800 text-indigo-100" : "bg-slate-200 text-slate-700"}`}>
                {stats.totalSiswa}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("orang_tua")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "orang_tua"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Orang Tua</span>
              <span className={`px-1.5 py-0.2 text-[10px] rounded-md font-extrabold ${activeTab === "orang_tua" ? "bg-amber-700 text-amber-100" : "bg-slate-200 text-slate-700"}`}>
                {stats.totalOrangTua}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("tutor")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "tutor"
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Tutor / Guru</span>
              <span className={`px-1.5 py-0.2 text-[10px] rounded-md font-extrabold ${activeTab === "tutor" ? "bg-emerald-800 text-emerald-100" : "bg-slate-200 text-slate-700"}`}>
                {stats.totalTutor}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("manajemen")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "manajemen"
                  ? "bg-blue-700 text-white shadow-sm"
                  : "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Manajemen & Staf</span>
              <span className={`px-1.5 py-0.2 text-[10px] rounded-md font-extrabold ${activeTab === "manajemen" ? "bg-blue-800 text-blue-100" : "bg-slate-200 text-slate-700"}`}>
                {stats.totalManajemen}
              </span>
            </button>
          </div>
        </div>

        {/* Toolbar: Instant Search & Status Filter */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Quick Search */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, email, no. HP, NIK, NISN..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-[11px] font-bold text-slate-400">Status:</span>
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  statusFilter === "all"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("active")}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  statusFilter === "active"
                    ? "bg-white text-emerald-800 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Aktif ({stats.totalActive})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("inactive")}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  statusFilter === "inactive"
                    ? "bg-white text-rose-800 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Non-Aktif ({stats.totalInactive})
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100 bg-slate-50/50">
                <th className="py-3.5 px-4 font-bold">Pengguna & Identitas</th>
                <th className="py-3.5 px-4 font-bold">Email & Kontak</th>
                <th className="py-3.5 px-4 font-bold">Peran (Role)</th>
                <th className="py-3.5 px-4 font-bold">Informasi Terkait</th>
                <th className="py-3.5 px-4 font-bold text-center">Status Akun</th>
                <th className="py-3.5 px-4 font-bold text-right">Aksi Kelola</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                    <span>Memuat data pengguna...</span>
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((u) => {
                  const roleBadge = getRoleBadge(u.role);
                  const Icon = roleBadge.icon;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition">
                      {/* 1. Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0 shadow-2xs">
                            {u.avatarUrl ? (
                              <img
                                src={u.avatarUrl}
                                alt={u.name}
                                className="w-full h-full object-cover rounded-xl"
                              />
                            ) : (
                              u.name.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{u.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              NIK: {u.nik || "-"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Email & Phone */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-slate-700 font-mono text-[11px]">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[170px]" title={u.email}>
                              {u.email}
                            </span>
                          </div>
                          {u.phone && u.phone !== "-" && (
                            <a
                              href={`https://wa.me/${u.phone.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-emerald-700 font-mono font-semibold hover:underline flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3 text-emerald-600" />
                              <span>{u.phone}</span>
                            </a>
                          )}
                        </div>
                      </td>

                      {/* 3. Role Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border shadow-2xs ${roleBadge.bg}`}
                        >
                          <Icon className="w-3 h-3 shrink-0" />
                          <span>{roleBadge.label}</span>
                        </span>
                      </td>

                      {/* 4. Contextual Info */}
                      <td className="py-3.5 px-4 text-[11px]">
                        {u.studentInfo ? (
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-800 block">
                              {u.studentInfo.packetType} • {u.studentInfo.studyModel}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              Rombel: <strong>{u.studentInfo.currentClass}</strong>
                            </span>
                          </div>
                        ) : u.parentInfo ? (
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-800 block">
                              {u.parentInfo.relationship}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              Pekerjaan: {u.parentInfo.job || "-"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-[10px]">
                            ID: {u.id.slice(0, 8)}...
                          </span>
                        )}
                      </td>

                      {/* 5. Status Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold transition shadow-2xs border ${
                            u.isActive
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-rose-50 hover:text-rose-800 hover:border-rose-200"
                              : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200"
                          }`}
                          title="Klik untuk ubah status keaktifan"
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              u.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                            }`}
                          />
                          <span>{u.isActive ? "AKTIF" : "NON-AKTIF"}</span>
                        </button>
                      </td>

                      {/* 6. Quick Action Buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenResetPassword(u)}
                            className="p-2 bg-slate-50 hover:bg-amber-50 text-slate-500 hover:text-amber-700 rounded-xl border border-slate-200 hover:border-amber-200 transition shadow-2xs"
                            title="Reset / Ubah Kata Sandi"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(u)}
                            className="p-2 bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-700 rounded-xl border border-slate-200 hover:border-indigo-200 transition shadow-2xs"
                            title="Edit Data & Hak Akses"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenDelete(u)}
                            className="p-2 bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-xl border border-slate-200 hover:border-rose-200 transition shadow-2xs"
                            title="Hapus Akun Pengguna"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 space-y-2">
                    <Users className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="font-semibold text-slate-600">
                      Tidak ditemukan akun pengguna yang cocok dengan kriteria.
                    </p>
                    {(searchQuery || statusFilter !== "all" || activeTab !== "all") && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setActiveTab("all");
                          setStatusFilter("all");
                        }}
                        className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-xs hover:bg-emerald-100 transition"
                      >
                        Reset Semua Filter
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL 1: TAMBAH PENGGUNA BARU ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Tambah Akun Pengguna Baru</h3>
                  <p className="text-xs text-slate-500">Penetapan peran (RBAC) dan kredensial akses sistem.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Lengkap Pengguna <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    placeholder="Contoh: Budi Prasetyo, S.Pd."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Alamat Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    placeholder="nama@askara.sch.id"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kata Sandi (Password) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    placeholder="Min. 6 karakter"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Peran / Hak Akses (Role) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                  >
                    <option value="siswa">🎓 Peserta Didik (Siswa)</option>
                    <option value="pendidik">👨‍🏫 Pendidik / Tutor Guru</option>
                    <option value="orang_tua">👨‍👩‍👧 Orang Tua / Wali</option>
                    <option value="admin">🏢 Administrator</option>
                    <option value="bendahara">💼 Bendahara Keuangan</option>
                    <option value="admin,pendidik">⚡ Dual Role (Guru & Manajemen)</option>
                    <option value="super_admin">👑 Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    type="tel"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIK (KTP / KIA)</label>
                  <input
                    type="text"
                    value={addForm.nik}
                    onChange={(e) => setAddForm({ ...addForm, nik: e.target.value })}
                    placeholder="16 digit NIK"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={addForm.gender}
                    onChange={(e) => setAddForm({ ...addForm, gender: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>

                {/* Contextual fields for Siswa */}
                {addForm.role === "siswa" && (
                  <>
                    <div>
                      <label className="block font-bold text-indigo-800 mb-1">Jenjang Paket</label>
                      <select
                        value={addForm.packetType}
                        onChange={(e) => setAddForm({ ...addForm, packetType: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-indigo-50/50 border border-indigo-200 rounded-xl text-indigo-900 font-bold focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                      >
                        <option value="Paket A">Paket A (Setara SD)</option>
                        <option value="Paket B">Paket B (Setara SMP)</option>
                        <option value="Paket C">Paket C (Setara SMA)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-indigo-800 mb-1">Model Belajar</label>
                      <select
                        value={addForm.studyModel}
                        onChange={(e) => setAddForm({ ...addForm, studyModel: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-indigo-50/50 border border-indigo-200 rounded-xl text-indigo-900 font-bold focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                      >
                        <option value="Reguler">Reguler</option>
                        <option value="Home Schooling">Home Schooling</option>
                        <option value="Kursus">Kursus</option>
                        <option value="Privat">Privat</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Contextual fields for Orang Tua */}
                {addForm.role === "orang_tua" && (
                  <>
                    <div>
                      <label className="block font-bold text-amber-800 mb-1">Hubungan Keluarga</label>
                      <select
                        value={addForm.relationship}
                        onChange={(e) => setAddForm({ ...addForm, relationship: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-amber-50/50 border border-amber-200 rounded-xl text-amber-900 font-bold focus:ring-2 focus:ring-amber-600 focus:bg-white"
                      >
                        <option value="AYAH">Ayah Kandung</option>
                        <option value="IBU">Ibu Kandung</option>
                        <option value="WALI">Wali Murid</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-amber-800 mb-1">Pekerjaan</label>
                      <input
                        type="text"
                        value={addForm.job}
                        onChange={(e) => setAddForm({ ...addForm, job: e.target.value })}
                        placeholder="Contoh: Wiraswasta / Karyawan"
                        className="w-full px-3.5 py-2.5 bg-amber-50/50 border border-amber-200 rounded-xl text-amber-900 font-medium focus:ring-2 focus:ring-amber-600 focus:bg-white"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md transition"
                >
                  Simpan & Buat Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: EDIT PENGGUNA & HAK AKSES ── */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-800">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Edit Pengguna & Hak Akses</h3>
                  <p className="text-xs text-slate-500">Perbarui identitas, peran, dan status akun.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hak Akses Peran (Role)</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                  >
                    <option value="siswa">🎓 Siswa</option>
                    <option value="pendidik">👨‍🏫 Pendidik / Tutor</option>
                    <option value="orang_tua">👨‍👩‍👧 Orang Tua / Wali</option>
                    <option value="admin">🏢 Administrator</option>
                    <option value="bendahara">💼 Bendahara</option>
                    <option value="admin,pendidik">⚡ Dual Role (Guru & Manajemen)</option>
                    <option value="super_admin">👑 Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor WhatsApp</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Keaktifan</label>
                  <select
                    value={editForm.isActive ? "true" : "false"}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === "true" })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                  >
                    <option value="true">🟢 Aktif</option>
                    <option value="false">🔴 Non-Aktif / Suspend</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Ubah Kata Sandi (Kosongkan jika tidak ingin diubah)
                </label>
                <input
                  type="password"
                  value={editForm.newPassword}
                  onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                  placeholder="Masukkan kata sandi baru (min. 6 karakter)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-md transition"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: RESET KATA SANDI CEPAT ── */}
      {isResetPasswordModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Reset Kata Sandi</h3>
                  <p className="text-xs text-slate-500">Akun: {selectedUser.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsResetPasswordModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitResetPassword} className="space-y-4 text-xs">
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-1 text-amber-900">
                <p className="font-bold">Informasi Akun:</p>
                <p>Email: <strong className="font-mono">{selectedUser.email}</strong></p>
                <p>Role: <strong>{selectedUser.role.toUpperCase()}</strong></p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-700">Kata Sandi Baru</label>
                  <button
                    type="button"
                    onClick={handleGenerateRandomPassword}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Buat Password Acak</span>
                  </button>
                </div>

                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={resetPasswordVal}
                    onChange={(e) => setResetPasswordVal(e.target.value)}
                    placeholder="Min. 6 karakter"
                    className="w-full pl-9 pr-20 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                  />
                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    {resetPasswordVal && (
                      <button
                        type="button"
                        onClick={handleCopyPassword}
                        className="p-1 text-slate-400 hover:text-emerald-700 rounded-lg hover:bg-slate-200 transition"
                        title="Salin Password"
                      >
                        {copiedPass ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsResetPasswordModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md transition"
                >
                  Simpan Kata Sandi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 4: KONFIRMASI HAPUS PENGGUNA ── */}
      {isDeleteModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-200 p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Hapus Akun Pengguna?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Apakah Anda yakin ingin menghapus akun <strong>{selectedUser.name}</strong> ({selectedUser.email})? Tindakan ini bersifat permanen.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-2.5 text-xs">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md transition"
              >
                Ya, Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
