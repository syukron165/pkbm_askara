"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Layers,
  Plus,
  Users,
  BookOpen,
  ChevronRight,
  Search,
  Download,
  Printer,
  Edit,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  MapPin,
  Calendar,
  UserCheck,
  UserPlus,
  Check,
  Filter,
  UserMinus,
  Info,
} from "lucide-react";
import { ClassItem, ClassStudentItem } from "@/app/api/classes/route";
import { TeacherItem } from "@/app/api/teachers/route";

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [unassignedStudents, setUnassignedStudents] = useState<ClassStudentItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState("SEMUA");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    level: "Paket C",
    academicYear: "2025/2026",
    semester: "Ganjil",
    homeroomTeacherId: "",
    room: "Ruang Belajar Askara 1",
    capacity: "30",
    description: "",
  });

  // Student Selection in Modal
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [filterPacketOnly, setFilterPacketOnly] = useState(true);
  const [modalTab, setModalTab] = useState<"info" | "students">("info");

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, []);

  const fetchClasses = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/classes");
      const data = await res.json();
      if (data.success && data.data) {
        setClasses(data.data);
        if (data.unassignedStudents) {
          setUnassignedStudents(data.unassignedStudents);
        }
      }
    } catch (e) {
      console.error("Gagal memuat kelas:", e);
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
    setFormData({
      name: "Paket C - Kelas X Merdeka",
      level: "Paket C",
      academicYear: "2025/2026",
      semester: "Ganjil",
      homeroomTeacherId: teachers.length > 0 ? teachers[0].id : "",
      room: "Ruang Belajar Askara 1",
      capacity: "30",
      description: "",
    });
    setSelectedStudentIds([]);
    setStudentSearch("");
    setFilterPacketOnly(true);
    setModalTab("info");
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (cls: ClassItem) => {
    setSelectedClass(cls);
    setFormData({
      name: cls.name,
      level: cls.level,
      academicYear: cls.academicYear,
      semester: cls.semester,
      homeroomTeacherId: cls.homeroomTeacherId || "",
      room: cls.room,
      capacity: cls.capacity.toString(),
      description: cls.description || "",
    });
    setSelectedStudentIds(cls.studentsList.map((s) => s.id));
    setStudentSearch("");
    setFilterPacketOnly(true);
    setModalTab("info");
    setIsEditModalOpen(true);
  };

  const handleOpenDetailModal = (cls: ClassItem) => {
    setSelectedClass(cls);
    setIsDetailModalOpen(true);
  };

  const handleOpenDeleteModal = (cls: ClassItem) => {
    setSelectedClass(cls);
    setIsDeleteModalOpen(true);
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          studentIds: selectedStudentIds,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAddModalOpen(false);
        fetchClasses();
        alert(`Kelas ${formData.name} berhasil dibuat dengan ${selectedStudentIds.length} siswa!`);
      } else {
        alert(data.error || "Gagal menambahkan kelas");
      }
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.message);
    }
  };

  const handleEditClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;
    try {
      const res = await fetch("/api/classes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedClass.id,
          ...formData,
          studentIds: selectedStudentIds,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsEditModalOpen(false);
        fetchClasses();
        alert("Data kelas dan daftar siswa berhasil diperbarui!");
      } else {
        alert(data.error || "Gagal memperbarui kelas");
      }
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.message);
    }
  };

  const handleDeleteClass = async () => {
    if (!selectedClass) return;
    try {
      const res = await fetch(`/api/classes?id=${selectedClass.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setIsDeleteModalOpen(false);
        fetchClasses();
        alert(data.message || "Kelas berhasil dihapus!");
      } else {
        alert(data.error || "Gagal menghapus kelas");
      }
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.message);
    }
  };

  // Available students pool for Add/Edit modal:
  // For Add: unassignedStudents only.
  // For Edit: selectedClass.studentsList + unassignedStudents.
  const availableStudentsPool = useMemo(() => {
    if (isEditModalOpen && selectedClass) {
      const enrolledIds = new Set(selectedClass.studentsList.map((s) => s.id));
      const pool = [...selectedClass.studentsList];
      unassignedStudents.forEach((st) => {
        if (!enrolledIds.has(st.id)) {
          pool.push(st);
        }
      });
      return pool;
    }
    return unassignedStudents;
  }, [isEditModalOpen, selectedClass, unassignedStudents]);

  // Filtered student candidates based on packet level and search term
  const filteredCandidates = useMemo(() => {
    return availableStudentsPool.filter((st) => {
      const matchesLevel =
        !filterPacketOnly ||
        !st.packetType ||
        st.packetType.toLowerCase().trim() === formData.level.toLowerCase().trim();

      const q = studentSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        st.name.toLowerCase().includes(q) ||
        st.nisn.toLowerCase().includes(q) ||
        (st.phone && st.phone.includes(q)) ||
        (st.studyModel && st.studyModel.toLowerCase().includes(q));

      return matchesLevel && matchesSearch;
    });
  }, [availableStudentsPool, filterPacketOnly, formData.level, studentSearch]);

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAllVisible = () => {
    const visibleIds = filteredCandidates.map((s) => s.id);
    setSelectedStudentIds((prev) => {
      const set = new Set([...prev, ...visibleIds]);
      return Array.from(set);
    });
  };

  const handleDeselectAllVisible = () => {
    const visibleIds = new Set(filteredCandidates.map((s) => s.id));
    setSelectedStudentIds((prev) => prev.filter((id) => !visibleIds.has(id)));
  };

  // Filtered dataset for Main Table
  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      const matchLevel =
        selectedLevel === "SEMUA" ||
        c.level.toLowerCase() === selectedLevel.toLowerCase();
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.homeroom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.room.toLowerCase().includes(searchQuery.toLowerCase());

      return matchLevel && matchSearch;
    });
  }, [classes, selectedLevel, searchQuery]);

  const totalStudents = useMemo(() => {
    return filteredClasses.reduce((acc, curr) => acc + curr.studentsCount, 0);
  }, [filteredClasses]);

  const exportCSV = () => {
    const headers = ["Nama Rombel", "Jenjang", "Tahun Ajaran", "Semester", "Wali Kelas", "Ruangan", "Kapasitas", "Jumlah Siswa"];
    const rows = filteredClasses.map((c) => [
      `"${c.name}"`,
      c.level,
      c.academicYear,
      c.semester,
      `"${c.homeroom}"`,
      `"${c.room}"`,
      c.capacity,
      c.studentsCount,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `data_kelas_rombel_askara_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
        <Link href="/admin" className="hover:text-slate-800 transition">
          Dashboard
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link href="/admin/master" className="hover:text-slate-800 transition">
          Data Master
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-emerald-700 font-bold">Kelas & Rombongan Belajar</span>
      </div>

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-soft">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Layers className="w-4 h-4" />
              <span>Struktur Rombongan Belajar (Rombel)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Data Kelas & Rombongan Belajar
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-3xl leading-relaxed">
              Kelola rombel belajar Paket A, B, C dengan integrasi pemilihan siswa otomatis. Siswa yang sudah masuk rombel akan terhubung langsung ke Data Siswa dan tidak dapat diduplikasi ke kelas lain.
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
              onClick={() => window.print()}
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
              <span>Tambah Kelas Baru</span>
            </button>
          </div>
        </div>

        {/* Quick Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Total Rombel</span>
            <p className="text-xl font-extrabold text-slate-900 mt-1">{classes.length} Rombel</p>
          </div>
          <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100">
            <span className="text-[11px] font-bold text-indigo-700 uppercase">Siswa Terdaftar di Kelas</span>
            <p className="text-xl font-extrabold text-indigo-900 mt-1">{totalStudents} Siswa</p>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-100">
            <span className="text-[11px] font-bold text-amber-700 uppercase">Siswa Belum Ada Kelas</span>
            <p className="text-xl font-extrabold text-amber-900 mt-1">{unassignedStudents.length} Siswa</p>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
            <span className="text-[11px] font-bold text-emerald-700 uppercase">Tahun Ajaran / Sem</span>
            <p className="text-xl font-extrabold text-emerald-900 mt-1">2025/2026 (Ganjil)</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-bold text-slate-400 uppercase mr-1">Jenjang:</span>
            {["SEMUA", "Paket A", "Paket B", "Paket C"].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  selectedLevel === lvl
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari rombel / wali kelas / ruang..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
            />
          </div>
        </div>
      </div>

      {/* Grid Rombel Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400">
            Memuat data kelas...
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400">
            Tidak ada rombongan belajar ditemukan.
          </div>
        ) : (
          filteredClasses.map((cls) => {
            const fillPercentage = Math.round((cls.studentsCount / cls.capacity) * 100);

            return (
              <div
                key={cls.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft hover-lift flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {cls.level}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">
                      {cls.academicYear} ({cls.semester})
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mt-3">{cls.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 flex items-center space-x-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Wali Kelas: <strong className="text-slate-800">{cls.homeroom}</strong></span>
                  </p>

                  <p className="text-xs text-slate-500 mt-1 flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Ruang: {cls.room}</span>
                  </p>

                  {/* Progress / Capacity Bar */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
                      <span className="flex items-center space-x-1">
                        <Users className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Keterisian Rombel</span>
                      </span>
                      <span>
                        <strong className="text-slate-900">{cls.studentsCount}</strong> / {cls.capacity} Siswa
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          fillPercentage >= 90
                            ? "bg-amber-500"
                            : fillPercentage >= 75
                            ? "bg-emerald-600"
                            : "bg-blue-600"
                        }`}
                        style={{ width: `${Math.min(fillPercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => handleOpenDetailModal(cls)}
                    className="text-emerald-700 font-bold hover:text-emerald-800 flex items-center space-x-1 text-xs"
                  >
                    <span>Daftar Siswa ({cls.studentsCount})</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEditModal(cls)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-slate-100 transition"
                      title="Edit Kelas & Anggota Siswa"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenDeleteModal(cls)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Hapus Kelas"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: Detail Siswa Rombel */}
      {isDetailModalOpen && selectedClass && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded">
                    {selectedClass.level}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{selectedClass.name}</h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Wali Kelas: {selectedClass.homeroom} • Ruang: {selectedClass.room} • Tahun: {selectedClass.academicYear} ({selectedClass.semester})
                </p>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-700" />
                  <span>Daftar Warga Belajar ({selectedClass.studentsCount} Siswa)</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-semibold">
                    Kapasitas: {selectedClass.capacity} Kursi
                  </span>
                  <button
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      handleOpenEditModal(selectedClass);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 bg-emerald-700 text-white rounded-lg hover:bg-emerald-600 transition"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Kelola Anggota</span>
                  </button>
                </div>
              </div>

              {selectedClass.studentsList.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-slate-100">
                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p>Belum ada siswa yang dimasukkan ke dalam rombel ini.</p>
                  <button
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      handleOpenEditModal(selectedClass);
                    }}
                    className="mt-3 text-xs font-bold text-emerald-700 hover:underline"
                  >
                    + Tambahkan Siswa Sekarang
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="p-3 font-bold">No</th>
                        <th className="p-3 font-bold">NISN</th>
                        <th className="p-3 font-bold">Nama Lengkap Siswa</th>
                        <th className="p-3 font-bold">Gender</th>
                        <th className="p-3 font-bold">Model Belajar</th>
                        <th className="p-3 font-bold">Kontak HP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedClass.studentsList.map((st, idx) => (
                        <tr key={st.id} className="hover:bg-slate-50">
                          <td className="p-3 text-slate-500 font-semibold">{idx + 1}</td>
                          <td className="p-3 font-mono font-bold text-slate-900">{st.nisn}</td>
                          <td className="p-3 font-bold text-slate-900">{st.name}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-[10px]">
                              {st.gender === "P" ? "Perempuan" : "Laki-laki"}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold text-[10px]">
                              {st.studyModel || "Reguler"}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 font-mono">{st.phone}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Tambah / Edit Kelas Baru dengan Pemilihan Siswa Terintegrasi */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {isAddModalOpen ? "Tambah Kelas & Rombel Baru" : `Edit Kelas: ${selectedClass?.name}`}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Isi data rombel dan pilih siswa yang belum terdaftar di kelas lain.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-2 mt-4 pb-2 border-b border-slate-100">
              <button
                type="button"
                onClick={() => setModalTab("info")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  modalTab === "info"
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>1. Informasi Rombel</span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab("students")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  modalTab === "students"
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>2. Pilih Anggota Siswa ({selectedStudentIds.length})</span>
              </button>
            </div>

            {/* Form Content */}
            <form
              onSubmit={isAddModalOpen ? handleAddClass : handleEditClass}
              className="flex-1 overflow-y-auto pt-4 space-y-4 text-xs pr-1"
            >
              {modalTab === "info" && (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Jenjang Program Kesetaraan <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formData.level}
                        onChange={(e) => {
                          const lvl = e.target.value;
                          setFormData({
                            ...formData,
                            level: lvl,
                            name: isAddModalOpen ? `${lvl} - Rombel Baru` : formData.name,
                          });
                        }}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                      >
                        <option value="Paket A">Paket A (Setara SD)</option>
                        <option value="Paket B">Paket B (Setara SMP)</option>
                        <option value="Paket C">Paket C (Setara SMA)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Nama Rombongan Belajar (Kelas) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Paket C - Kelas X Merdeka"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Tahun Ajaran</label>
                      <input
                        type="text"
                        required
                        value={formData.academicYear}
                        onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Semester</label>
                      <select
                        value={formData.semester}
                        onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                      >
                        <option value="Ganjil">Semester Ganjil</option>
                        <option value="Genap">Semester Genap</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Wali Kelas / Tutor Pembina <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.homeroomTeacherId}
                      onChange={(e) => setFormData({ ...formData, homeroomTeacherId: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                    >
                      <option value="" disabled>-- Pilih Guru / Tutor Pembina --</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.role || t.specialization || "Tutor"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Ruang Belajar</label>
                      <input
                        type="text"
                        placeholder="Contoh: Ruang Belajar Askara 1"
                        value={formData.room}
                        onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Target Kuota / Kapasitas</label>
                      <input
                        type="number"
                        min="5"
                        max="100"
                        required
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Catatan / Deskripsi Rombel</label>
                    <textarea
                      rows={2}
                      placeholder="Keterangan fokus pembelajaran rombel..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>

                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-emerald-900">Siswa yang akan didaftarkan:</span>
                      <p className="text-emerald-700 text-[11px]">{selectedStudentIds.length} Siswa dipilih</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModalTab("students")}
                      className="px-3 py-1.5 bg-emerald-700 text-white rounded-lg font-bold text-xs hover:bg-emerald-600"
                    >
                      Pilih Siswa &rarr;
                    </button>
                  </div>
                </div>
              )}

              {modalTab === "students" && (
                <div className="space-y-3.5">
                  {/* Notice Rules */}
                  <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl flex items-start gap-2.5 text-indigo-900">
                    <Info className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                    <div className="text-[11px] leading-relaxed">
                      <strong>Ketentuan Anggota Rombel:</strong> Siswa yang sudah terdaftar di rombel/kelas lain tidak muncul di daftar ini untuk mencegah duplikasi data. Siswa yang Anda pilih di sini akan otomatis mendapatkan nama rombel pada Data Siswa.
                    </div>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Cari nama / NISN / model belajar..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFilterPacketOnly(!filterPacketOnly)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition flex items-center gap-1 ${
                          filterPacketOnly
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : "bg-white text-slate-700 border-slate-300"
                        }`}
                      >
                        <Filter className="w-3 h-3" />
                        <span>Filter {formData.level} Saja</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSelectAllVisible}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-white text-slate-700 border border-slate-300 hover:bg-slate-100"
                      >
                        Pilih Semua ({filteredCandidates.length})
                      </button>

                      {selectedStudentIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedStudentIds([])}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Summary Bar */}
                  <div className="flex items-center justify-between text-xs px-1">
                    <span className="font-bold text-slate-700">
                      Menampilkan {filteredCandidates.length} kandidat siswa
                    </span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Terpilih: {selectedStudentIds.length} / {formData.capacity} Siswa
                    </span>
                  </div>

                  {/* Students Checkbox List */}
                  {filteredCandidates.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                      <Users className="w-8 h-8 mx-auto text-slate-300 mb-1.5" />
                      <p className="font-semibold">Tidak ada siswa yang tersedia</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {filterPacketOnly
                          ? `Semua siswa ${formData.level} sudah memiliki rombel, atau tidak cocok dengan filter pencarian.`
                          : "Semua siswa aktif sudah terdaftar di kelas lain."}
                      </p>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto divide-y divide-slate-100">
                      {filteredCandidates.map((st) => {
                        const isSelected = selectedStudentIds.includes(st.id);
                        return (
                          <div
                            key={st.id}
                            onClick={() => toggleStudentSelection(st.id)}
                            className={`p-2.5 flex items-center justify-between cursor-pointer transition ${
                              isSelected
                                ? "bg-emerald-50/70 hover:bg-emerald-50"
                                : "hover:bg-slate-50 bg-white"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                                  isSelected
                                    ? "bg-emerald-700 border-emerald-700 text-white"
                                    : "border-slate-300 bg-white"
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>

                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900">{st.name}</span>
                                  <span className="px-1.5 py-0.2 rounded bg-slate-100 text-[10px] font-semibold text-slate-600">
                                    {st.gender === "P" ? "P" : "L"}
                                  </span>
                                  <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-[10px] font-bold text-indigo-700 border border-indigo-100">
                                    {st.packetType || formData.level}
                                  </span>
                                  <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-[10px] font-semibold text-emerald-800">
                                    {st.studyModel || "Reguler"}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                  NISN: {st.nisn} • HP: {st.phone}
                                </div>
                              </div>
                            </div>

                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                isSelected
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "text-slate-400 hover:text-slate-600"
                              }`}
                            >
                              {isSelected ? "Masuk Rombel" : "+ Pilih"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Form Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  {selectedStudentIds.length} Siswa Terpilih
                </span>

                <div className="flex items-center space-x-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setIsEditModalOpen(false);
                    }}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-xl shadow-xs"
                  >
                    {isAddModalOpen ? "Simpan Kelas & Siswa" : "Simpan Perubahan"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Hapus */}
      {isDeleteModalOpen && selectedClass && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center space-x-3 text-rose-600 mb-3">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">Hapus Rombongan Belajar?</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus kelas <strong className="text-slate-900">{selectedClass.name}</strong>?
              Semua siswa di dalam rombel ini akan otomatis berstatus belum memiliki kelas.
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
                onClick={handleDeleteClass}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
              >
                Ya, Hapus Kelas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
