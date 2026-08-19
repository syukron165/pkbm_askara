"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Download,
  Printer,
  ChevronRight,
  Layers,
  GraduationCap,
  Users,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Info,
  Clock,
  Award,
} from "lucide-react";
import { SubjectItem } from "@/app/api/subjects/route";
import { TeacherItem } from "@/app/api/teachers/route";

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPacket, setSelectedPacket] = useState("SEMUA");
  const [selectedCategory, setSelectedCategory] = useState("SEMUA");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<SubjectItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    packetType: "Paket C",
    category: "UMUM",
    skk: "3",
    kkm: "75",
    hoursPerWeek: "3",
    teacherId: "",
    teacherName: "Tim Pengajar",
    description: "",
  });

  useEffect(() => {
    fetchSubjects();
    fetchTeachers();
  }, []);

  const fetchSubjects = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/subjects");
      const data = await res.json();
      if (data.success && data.data) {
        setSubjects(data.data);
      }
    } catch (e) {
      console.error("Gagal memuat mata pelajaran:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await fetch("/api/teachers");
      const data = await res.json();
      if (data.success && data.data) {
        setTeachers(data.data);
      }
    } catch (e) {
      console.error("Gagal memuat data guru:", e);
    }
  };

  const handleOpenAddModal = () => {
    const defaultTeacher = teachers[0];
    setFormData({
      code: "",
      name: "",
      packetType: "Paket C",
      category: "UMUM",
      skk: "3",
      kkm: "75",
      hoursPerWeek: "3",
      teacherId: defaultTeacher?.id || "",
      teacherName: defaultTeacher?.name || "Tim Pengajar",
      description: "",
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (subject: SubjectItem) => {
    setSelectedSubject(subject);
    const matchedTeacher = teachers.find(
      (t) =>
        t.id === subject.teacherId ||
        t.name.toLowerCase() === subject.teacherName.toLowerCase()
    );
    setFormData({
      code: subject.code,
      name: subject.name,
      packetType: subject.packetType,
      category: subject.category || "UMUM",
      skk: String(subject.skk || 3),
      kkm: String(subject.kkm || 75),
      hoursPerWeek: String(subject.hoursPerWeek || 3),
      teacherId: matchedTeacher?.id || subject.teacherId || "",
      teacherName: subject.teacherName || matchedTeacher?.name || "Tim Pengajar",
      description: subject.description || "",
    });
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteModal = (subject: SubjectItem) => {
    setSelectedSubject(subject);
    setIsDeleteModalOpen(true);
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setIsAddModalOpen(false);
        fetchSubjects();
        alert("Mata pelajaran berhasil ditambahkan!");
      } else {
        alert(data.error || "Gagal menambahkan mata pelajaran");
      }
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.message);
    }
  };

  const handleEditSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) return;
    try {
      const res = await fetch("/api/subjects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedSubject.id,
          ...formData,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsEditModalOpen(false);
        fetchSubjects();
        alert("Mata pelajaran berhasil diperbarui!");
      } else {
        alert(data.error || "Gagal memperbarui mata pelajaran");
      }
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.message);
    }
  };

  const handleDeleteSubject = async () => {
    if (!selectedSubject) return;
    try {
      const res = await fetch(`/api/subjects?id=${selectedSubject.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setIsDeleteModalOpen(false);
        fetchSubjects();
        alert(data.message || "Mata pelajaran berhasil dihapus!");
      } else {
        alert(data.error || "Gagal menghapus mata pelajaran");
      }
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.message);
    }
  };

  // Filtered dataset
  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      const matchPacket =
        selectedPacket === "SEMUA" ||
        s.packetType.toLowerCase() === selectedPacket.toLowerCase();
      const matchCategory =
        selectedCategory === "SEMUA" || s.category === selectedCategory;
      const matchSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase());

      return matchPacket && matchCategory && matchSearch;
    });
  }, [subjects, selectedPacket, selectedCategory, searchQuery]);

  // Summary Metrics
  const totalSKK = useMemo(() => {
    return filteredSubjects.reduce((acc, curr) => acc + curr.skk, 0);
  }, [filteredSubjects]);

  const exportCSV = () => {
    const headers = ["Kode", "Nama Mapel", "Jenjang", "Kelompok", "SKK", "KKM", "Jam/Minggu", "Tutor"];
    const rows = filteredSubjects.map((s) => [
      s.code,
      `"${s.name}"`,
      s.packetType,
      s.category,
      s.skk,
      s.kkm,
      s.hoursPerWeek,
      `"${s.teacherName}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `data_mata_pelajaran_askara_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printDocument = () => {
    window.print();
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "UMUM":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "PEMINATAN":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "VOKASI":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "PEMBERDAYAAN":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
        <Link href="/admin" className="hover:text-slate-800 transition">
          Dashboard
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link href="/admin/master" className="hover:text-slate-800 transition">
          Data Master
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-emerald-700 font-bold">Data Mata Pelajaran</span>
      </div>

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-soft">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
              <BookOpen className="w-4 h-4" />
              <span>Kurikulum Kesetaraan Merdeka TA 2025/2026</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Data Mata Pelajaran & Kurikulum
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-3xl leading-relaxed">
              Manajemen struktur mata pelajaran, penetapan bobot SKK (Satuan Kredit Kompetensi), standar KKM, alokasi jam pembelajaran, dan penugasan tutor pengampu untuk program Paket A, Paket B, dan Paket C.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={exportCSV}
              className="inline-flex items-center space-x-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor CSV</span>
            </button>

            <button
              onClick={printDocument}
              className="inline-flex items-center space-x-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Mata Pelajaran</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Stat Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Total Mapel</span>
            <p className="text-xl font-extrabold text-slate-900 mt-1">{subjects.length}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100">
            <span className="text-[11px] font-bold text-indigo-700 uppercase">Paket C (SMA)</span>
            <p className="text-xl font-extrabold text-indigo-900 mt-1">
              {subjects.filter((s) => s.packetType === "Paket C").length} Mapel
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100">
            <span className="text-[11px] font-bold text-blue-700 uppercase">Paket B (SMP)</span>
            <p className="text-xl font-extrabold text-blue-900 mt-1">
              {subjects.filter((s) => s.packetType === "Paket B").length} Mapel
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
            <span className="text-[11px] font-bold text-emerald-700 uppercase">Paket A (SD)</span>
            <p className="text-xl font-extrabold text-emerald-900 mt-1">
              {subjects.filter((s) => s.packetType === "Paket A").length} Mapel
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
          {/* Packet Filter Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 lg:pb-0">
            <span className="text-xs font-bold text-slate-400 uppercase mr-1">Jenjang:</span>
            {["SEMUA", "Paket A", "Paket B", "Paket C"].map((pkt) => (
              <button
                key={pkt}
                onClick={() => setSelectedPacket(pkt)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  selectedPacket === pkt
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                }`}
              >
                {pkt}
              </button>
            ))}
          </div>

          {/* Search, Category, and View Mode */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1 sm:flex-initial">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari kode / mapel / tutor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
            >
              <option value="SEMUA">Semua Kelompok</option>
              <option value="UMUM">Kelompok Umum</option>
              <option value="PEMINATAN">Kelompok Peminatan</option>
              <option value="VOKASI">Vokasi & Keterampilan</option>
              <option value="PEMBERDAYAAN">Pemberdayaan</option>
            </select>

            {/* View Mode Toggle */}
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  viewMode === "table"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Tabel
              </button>
              <button
                onClick={() => setViewMode("cards")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  viewMode === "cards"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Kartu Silabus
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === "table" ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <th className="p-3.5 font-bold uppercase tracking-wider w-24">Kode</th>
                  <th className="p-3.5 font-bold uppercase tracking-wider">Mata Pelajaran</th>
                  <th className="p-3.5 font-bold uppercase tracking-wider w-28">Jenjang</th>
                  <th className="p-3.5 font-bold uppercase tracking-wider">Kelompok</th>
                  <th className="p-3.5 font-bold uppercase tracking-wider text-center w-20">SKK</th>
                  <th className="p-3.5 font-bold uppercase tracking-wider text-center w-20">KKM</th>
                  <th className="p-3.5 font-bold uppercase tracking-wider text-center w-24">Jam/Mgg</th>
                  <th className="p-3.5 font-bold uppercase tracking-wider">Tutor Pengampu</th>
                  <th className="p-3.5 font-bold uppercase tracking-wider text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      Memuat data mata pelajaran...
                    </td>
                  </tr>
                ) : filteredSubjects.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      Tidak ada mata pelajaran yang sesuai filter.
                    </td>
                  </tr>
                ) : (
                  filteredSubjects.map((subj) => (
                    <tr key={subj.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-mono font-bold text-emerald-800">
                        {subj.code}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">
                        {subj.name}
                        <span className="block text-[11px] text-slate-500 font-normal line-clamp-1 mt-0.5">
                          {subj.description}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] border border-slate-200">
                          {subj.packetType}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${getCategoryBadge(
                            subj.category
                          )}`}
                        >
                          {subj.category}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-bold text-slate-800">
                        {subj.skk} SKK
                      </td>
                      <td className="p-3.5 text-center font-bold text-emerald-700">
                        {subj.kkm}
                      </td>
                      <td className="p-3.5 text-center text-slate-600 font-medium">
                        {subj.hoursPerWeek} Jam
                      </td>
                      <td className="p-3.5 font-medium text-slate-800">
                        {subj.teacherName}
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => handleOpenEditModal(subj)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-slate-100 transition"
                            title="Edit Mapel"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDeleteModal(subj)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Hapus Mapel"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSubjects.map((subj) => (
            <div
              key={subj.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft hover-lift flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {subj.code}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${getCategoryBadge(
                      subj.category
                    )}`}
                  >
                    {subj.category}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{subj.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {subj.description}
                </p>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">JENJANG</span>
                    <span className="text-xs font-bold text-slate-800">{subj.packetType}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">BOBOT</span>
                    <span className="text-xs font-bold text-emerald-700">{subj.skk} SKK</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">STANDAR KKM</span>
                    <span className="text-xs font-bold text-indigo-700">{subj.kkm}</span>
                  </div>
                </div>

                <div className="mt-3 text-xs text-slate-600 flex items-center space-x-2">
                  <GraduationCap className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Tutor: <strong className="text-slate-800">{subj.teacherName}</strong></span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{subj.hoursPerWeek} Jam / Minggu</span>
                </span>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleOpenEditModal(subj)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-slate-100 transition"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenDeleteModal(subj)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: Tambah Mata Pelajaran */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Tambah Mata Pelajaran Baru</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubject} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kode Mapel</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: MAT-C10"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jenjang Paket</label>
                  <select
                    value={formData.packetType}
                    onChange={(e) => setFormData({ ...formData, packetType: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  >
                    <option value="Paket A">Paket A (Setara SD)</option>
                    <option value="Paket B">Paket B (Setara SMP)</option>
                    <option value="Paket C">Paket C (Setara SMA)</option>
                    <option value="Vokasi">Vokasi & Keterampilan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Mata Pelajaran</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Matematika Terapan & Bisnis"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kelompok Kurikulum</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  >
                    <option value="UMUM">Kelompok Umum</option>
                    <option value="PEMINATAN">Kelompok Peminatan</option>
                    <option value="VOKASI">Vokasi & Keterampilan</option>
                    <option value="PEMBERDAYAAN">Pemberdayaan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pendidik / Tutor</label>
                  <select
                    required
                    value={formData.teacherName}
                    onChange={(e) => {
                      const val = e.target.value;
                      const chosen = teachers.find((t) => t.name === val);
                      setFormData({
                        ...formData,
                        teacherName: val,
                        teacherId: chosen?.id || "",
                      });
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                  >
                    <option value="Tim Pengajar">👥 Tim Pengajar PKBM Askara</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name} ({t.role || t.specialization || "Tutor"})
                      </option>
                    ))}
                    {formData.teacherName &&
                      formData.teacherName !== "Tim Pengajar" &&
                      !teachers.some((t) => t.name === formData.teacherName) && (
                        <option value={formData.teacherName}>{formData.teacherName}</option>
                      )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bobot SKK</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={formData.skk}
                    onChange={(e) => setFormData({ ...formData, skk: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Standar KKM</label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    required
                    value={formData.kkm}
                    onChange={(e) => setFormData({ ...formData, kkm: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jam / Minggu</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    required
                    value={formData.hoursPerWeek}
                    onChange={(e) => setFormData({ ...formData, hoursPerWeek: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Silabus / Capaian Pembelajaran</label>
                <textarea
                  rows={3}
                  placeholder="Ringkasan materi inti dan kompetensi yang diharapkan..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-xl shadow-xs"
                >
                  Simpan Mapel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Mata Pelajaran */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Perbarui Mata Pelajaran</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubject} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kode Mapel</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jenjang Paket</label>
                  <select
                    value={formData.packetType}
                    onChange={(e) => setFormData({ ...formData, packetType: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  >
                    <option value="Paket A">Paket A (Setara SD)</option>
                    <option value="Paket B">Paket B (Setara SMP)</option>
                    <option value="Paket C">Paket C (Setara SMA)</option>
                    <option value="Vokasi">Vokasi & Keterampilan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Mata Pelajaran</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kelompok Kurikulum</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  >
                    <option value="UMUM">Kelompok Umum</option>
                    <option value="PEMINATAN">Kelompok Peminatan</option>
                    <option value="VOKASI">Vokasi & Keterampilan</option>
                    <option value="PEMBERDAYAAN">Pemberdayaan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pendidik / Tutor</label>
                  <select
                    required
                    value={formData.teacherName}
                    onChange={(e) => {
                      const val = e.target.value;
                      const chosen = teachers.find((t) => t.name === val);
                      setFormData({
                        ...formData,
                        teacherName: val,
                        teacherId: chosen?.id || "",
                      });
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                  >
                    <option value="Tim Pengajar">👥 Tim Pengajar PKBM Askara</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name} ({t.role || t.specialization || "Tutor"})
                      </option>
                    ))}
                    {formData.teacherName &&
                      formData.teacherName !== "Tim Pengajar" &&
                      !teachers.some((t) => t.name === formData.teacherName) && (
                        <option value={formData.teacherName}>{formData.teacherName}</option>
                      )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bobot SKK</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={formData.skk}
                    onChange={(e) => setFormData({ ...formData, skk: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Standar KKM</label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    required
                    value={formData.kkm}
                    onChange={(e) => setFormData({ ...formData, kkm: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jam / Minggu</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    required
                    value={formData.hoursPerWeek}
                    onChange={(e) => setFormData({ ...formData, hoursPerWeek: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Silabus</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-xl shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Hapus */}
      {isDeleteModalOpen && selectedSubject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center space-x-3 text-rose-600 mb-3">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">Hapus Mata Pelajaran?</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus mata pelajaran{" "}
              <strong className="text-slate-900">{selectedSubject.name} ({selectedSubject.code})</strong>?
              Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteSubject}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
              >
                Ya, Hapus Mapel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
