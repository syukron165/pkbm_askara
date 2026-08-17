"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  FileCheck,
  Plus,
  Clock,
  HelpCircle,
  CheckCircle2,
  Trash2,
  Layers,
  BookOpen,
  Calendar,
  Award,
  Search,
  X,
  Loader2,
  RefreshCw,
  Eye,
  AlertCircle,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  ListChecks,
  Upload,
  Download,
  FileSpreadsheet,
  Copy,
  Check,
  FileText,
  Palette,
  CheckSquare,
  Image as ImageIcon,
  Volume2,
  Music,
  ExternalLink,
} from "lucide-react";

interface AssessmentQuestion {
  id?: string;
  questionText: string;
  questionType: "MULTIPLE_CHOICE_4" | "MULTIPLE_CHOICE_5" | "ESSAY" | "KARYA";
  optionsJson?: string;
  options?: string[];
  correctOption: string;
  points: number;
  imageUrl?: string | null;
  audioUrl?: string | null;
}

interface AssessmentItem {
  id: string;
  title: string;
  type: string;
  durationMinutes: number;
  passingScore: number;
  startTime: string;
  endTime: string;
  isPublished: boolean;
  classId: string;
  subjectId: string;
  teacherId: string;
  teacher?: { id: string; name: string; role: string };
  class?: { id: string; name: string; level: string };
  subject?: { id: string; name: string; code: string };
  questions?: AssessmentQuestion[];
  sessions?: any[];
  createdAt: string;
}

const ASSESSMENT_TYPES = [
  { value: "UH", label: "UH - Ulangan Harian", color: "bg-blue-50 text-blue-800 border-blue-200" },
  { value: "PTS", label: "PTS - Penilaian Tengah Semester", color: "bg-purple-50 text-purple-800 border-purple-200" },
  { value: "PAS", label: "PAS - Penilaian Akhir Semester", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  { value: "TRYOUT", label: "TRYOUT - Ujian Mandiri / AKM", color: "bg-amber-50 text-amber-800 border-amber-200" },
];

const QUESTION_TYPES = [
  { value: "MULTIPLE_CHOICE_4", label: "Pilihan Ganda A - D", icon: CheckSquare, badgeColor: "bg-blue-50 text-blue-800 border-blue-200" },
  { value: "MULTIPLE_CHOICE_5", label: "Pilihan Ganda A - E", icon: ListChecks, badgeColor: "bg-purple-50 text-purple-800 border-purple-200" },
  { value: "ESSAY", label: "Esai / Uraian", icon: FileText, badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  { value: "KARYA", label: "Tugas Karya / Portofolio", icon: Palette, badgeColor: "bg-amber-50 text-amber-800 border-amber-200" },
];

const SAMPLE_TEXT_TEMPLATE = `1. [Pilihan Ganda A-D] Perhatikan gambar diagram sel tumbuhan di bawah ini. Bagian yang berfungsi mengatur seluruh aktivitas sel ditunjukkan oleh nomor...
[Gambar: /uploads/cbt/sample-diagram-sel.png]
A. 1 (Nukleus)
B. 2 (Mitokondria)
C. 3 (Vakuola)
D. 4 (Kloroplas)
Kunci: A
Poin: 25

2. [Pilihan Ganda A-E] Dengarkan rekaman percakapan berikut ini. Di manakah lokasi percakapan tersebut berlangsung?
[Audio: /uploads/cbt/sample-listening-english.mp3]
A. At the airport
B. In the library
C. In the hospital
D. At the train station
E. In the restaurant
Kunci: B
Poin: 25

3. [Esai] Jelaskan secara singkat tahapan daur air dan pengaruh perubahan iklim terhadap ketersediaan air bersih di perkotaan!
Kunci: Rubrik: Penjelasan evaporasi, kondensasi, presipitasi, dan dampak pemanasan global.
Poin: 25

4. [Karya] Buatlah satu rancangan laporan produk vokasi UMKM atau proposal usaha mandiri sederhana dalam format PDF atau foto karya nyata!
Kunci: Rubrik: Kreativitas, rencana anggaran biaya, dan kelayakan produk.
Poin: 25`;

export default function GuruCbtPage() {
  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("SEMUA");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Uploading State per Question
  const [uploadingImageIdx, setUploadingImageIdx] = useState<number | null>(null);
  const [uploadingAudioIdx, setUploadingAudioIdx] = useState<number | null>(null);

  // Import State
  const [importText, setImportText] = useState("");
  const [importMode, setImportMode] = useState<"text" | "file">("text");
  const [importAppendMode, setImportAppendMode] = useState<"replace" | "append">("replace");
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [parsedCount, setParsedCount] = useState<number | null>(null);
  const fileImportRef = useRef<HTMLInputElement>(null);

  // Form State
  const [form, setForm] = useState({
    title: "",
    type: "PTS",
    classId: "",
    subjectName: "",
    durationMinutes: "60",
    passingScore: "75",
    startTime: new Date().toISOString().slice(0, 10),
    endTime: new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10),
    isPublished: true,
    questions: [
      {
        questionText: "",
        questionType: "MULTIPLE_CHOICE_4" as "MULTIPLE_CHOICE_4" | "MULTIPLE_CHOICE_5" | "ESSAY" | "KARYA",
        optionA: "",
        optionB: "",
        optionC: "",
        optionD: "",
        optionE: "",
        correctOption: "A",
        points: "25",
        imageUrl: "" as string,
        audioUrl: "" as string,
      },
    ],
  });

  // Fetch Master Data (Classes)
  useEffect(() => {
    fetch("/api/classes")
      .then((r) => r.json())
      .then((d) => {
        const list = d.data || d.classes || [];
        setClasses(list);
        if (list.length > 0) setForm((p) => ({ ...p, classId: list[0].id }));
      })
      .catch(() => {});
  }, []);

  // Fetch Assessments
  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (typeFilter !== "SEMUA") params.append("type", typeFilter);

      const res = await fetch(`/api/cbt?${params.toString()}`);
      const data = await res.json();
      setAssessments(data.assessments || []);
    } catch {
      setAssessments([]);
    }
    setLoading(false);
  }, [search, typeFilter]);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setForm({
      title: "",
      type: "PTS",
      classId: classes.length > 0 ? classes[0].id : "",
      subjectName: "",
      durationMinutes: "60",
      passingScore: "75",
      startTime: new Date().toISOString().slice(0, 10),
      endTime: new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10),
      isPublished: true,
      questions: [
        {
          questionText: "Contoh Soal Pilihan Ganda: Tentukan hasil perhitungan berikut...",
          questionType: "MULTIPLE_CHOICE_4",
          optionA: "Pilihan Jawaban A",
          optionB: "Pilihan Jawaban B",
          optionC: "Pilihan Jawaban C",
          optionD: "Pilihan Jawaban D",
          optionE: "",
          correctOption: "A",
          points: "25",
          imageUrl: "",
          audioUrl: "",
        },
        {
          questionText: "Contoh Soal Esai: Uraikan pemahaman Anda mengenai materi ini...",
          questionType: "ESSAY",
          optionA: "",
          optionB: "",
          optionC: "",
          optionD: "",
          optionE: "",
          correctOption: "Rubrik: Kesesuaian konsep dan ketepatan contoh.",
          points: "25",
          imageUrl: "",
          audioUrl: "",
        },
      ],
    });
    setShowModal(true);
  };

  // Add Question to Form
  const handleAddQuestion = (type: "MULTIPLE_CHOICE_4" | "MULTIPLE_CHOICE_5" | "ESSAY" | "KARYA" = "MULTIPLE_CHOICE_4") => {
    setForm((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          questionText: "",
          questionType: type,
          optionA: "",
          optionB: "",
          optionC: "",
          optionD: "",
          optionE: "",
          correctOption: type === "ESSAY" || type === "KARYA" ? "Rubrik Penilaian" : "A",
          points: "25",
          imageUrl: "",
          audioUrl: "",
        },
      ],
    }));
  };

  // Remove Question
  const handleRemoveQuestion = (index: number) => {
    if (form.questions.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, idx) => idx !== index),
    }));
  };

  // Media Upload Handlers for Question Image / Audio
  const handleUploadQuestionImage = async (qIdx: number, file: File) => {
    if (!file) return;
    setUploadingImageIdx(qIdx);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload?folder=cbt", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setForm((prev) => {
          const nq = [...prev.questions];
          nq[qIdx].imageUrl = data.url;
          return { ...prev, questions: nq };
        });
      } else {
        alert(data.error || "Gagal mengunggah gambar");
      }
    } catch (err: any) {
      alert("Gagal mengunggah: " + err.message);
    } finally {
      setUploadingImageIdx(null);
    }
  };

  const handleUploadQuestionAudio = async (qIdx: number, file: File) => {
    if (!file) return;
    setUploadingAudioIdx(qIdx);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload?folder=cbt", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setForm((prev) => {
          const nq = [...prev.questions];
          nq[qIdx].audioUrl = data.url;
          return { ...prev, questions: nq };
        });
      } else {
        alert(data.error || "Gagal mengunggah berkas audio");
      }
    } catch (err: any) {
      alert("Gagal mengunggah: " + err.message);
    } finally {
      setUploadingAudioIdx(null);
    }
  };

  // ─── Parser Soal Teks & CSV (Mendukung A-D, A-E, Esai, Karya, Gambar, Audio)
  const parseQuestionsText = (text: string) => {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const parsed: Array<{
      questionText: string;
      questionType: "MULTIPLE_CHOICE_4" | "MULTIPLE_CHOICE_5" | "ESSAY" | "KARYA";
      optionA: string;
      optionB: string;
      optionC: string;
      optionD: string;
      optionE: string;
      correctOption: string;
      points: string;
      imageUrl: string;
      audioUrl: string;
    }> = [];

    // Strategy 1: CSV format
    if (text.includes(",") && lines[0].toLowerCase().includes("pertanyaan")) {
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(",").map((p) => p.replace(/^["']|["']$/g, "").trim());
        if (parts.length >= 6) {
          const hasE = parts.length >= 8 && parts[5] && parts[5].trim().length > 0;
          const typeStr = parts[1]?.toLowerCase() || "";
          let qType: any = hasE ? "MULTIPLE_CHOICE_5" : "MULTIPLE_CHOICE_4";
          if (typeStr.includes("esai") || typeStr.includes("essay")) qType = "ESSAY";
          if (typeStr.includes("karya") || typeStr.includes("project")) qType = "KARYA";

          parsed.push({
            questionText: parts[0] || `Soal ${i}`,
            questionType: qType,
            optionA: parts[2] || "",
            optionB: parts[3] || "",
            optionC: parts[4] || "",
            optionD: parts[5] || "",
            optionE: parts[6] || "",
            correctOption: (parts[hasE ? 7 : 6] || "A").toUpperCase(),
            points: parts[hasE ? 8 : 7] || "25",
            imageUrl: parts[9] || "",
            audioUrl: parts[10] || "",
          });
        }
      }
      if (parsed.length > 0) return parsed;
    }

    // Strategy 2: Block Parser by Numbering
    let currentQ: any = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isNewQuestion = /^(\d+[\.\)]|soal\s*\d+[\.:]?)/i.test(line);

      if (isNewQuestion) {
        if (currentQ && currentQ.questionText) {
          if (!currentQ.questionType) {
            if (currentQ.optionE) {
              currentQ.questionType = "MULTIPLE_CHOICE_5";
            } else if (currentQ.optionA && currentQ.optionB) {
              currentQ.questionType = "MULTIPLE_CHOICE_4";
            } else {
              currentQ.questionType = "ESSAY";
            }
          }
          parsed.push(currentQ);
        }

        let cleanText = line.replace(/^(\d+[\.\)]|soal\s*\d+[\.:]?)\s*/i, "");
        let qType: any = "MULTIPLE_CHOICE_4";

        if (/\[(esai|essay)\]/i.test(cleanText)) {
          qType = "ESSAY";
          cleanText = cleanText.replace(/\[(esai|essay)\]/i, "").trim();
        } else if (/\[(karya|proyek|project|praktik)\]/i.test(cleanText)) {
          qType = "KARYA";
          cleanText = cleanText.replace(/\[(karya|proyek|project|praktik)\]/i, "").trim();
        } else if (/\[(pilihan ganda a-e|pg a-e|a-e)\]/i.test(cleanText)) {
          qType = "MULTIPLE_CHOICE_5";
          cleanText = cleanText.replace(/\[(pilihan ganda a-e|pg a-e|a-e)\]/i, "").trim();
        } else if (/\[(pilihan ganda a-d|pg a-d|a-d)\]/i.test(cleanText)) {
          qType = "MULTIPLE_CHOICE_4";
          cleanText = cleanText.replace(/\[(pilihan ganda a-d|pg a-d|a-d)\]/i, "").trim();
        }

        currentQ = {
          questionText: cleanText,
          questionType: qType,
          optionA: "",
          optionB: "",
          optionC: "",
          optionD: "",
          optionE: "",
          correctOption: qType === "ESSAY" || qType === "KARYA" ? "Rubrik Penilaian" : "A",
          points: "25",
          imageUrl: "",
          audioUrl: "",
        };
      } else if (currentQ) {
        if (/^\[(gambar|image|foto)\s*[:=]\s*(.+)\]/i.test(line)) {
          const match = line.match(/^\[(gambar|image|foto)\s*[:=]\s*(.+)\]/i);
          if (match && match[2]) currentQ.imageUrl = match[2].trim();
        } else if (/^\[(audio|suara|listening|sound)\s*[:=]\s*(.+)\]/i.test(line)) {
          const match = line.match(/^\[(audio|suara|listening|sound)\s*[:=]\s*(.+)\]/i);
          if (match && match[2]) currentQ.audioUrl = match[2].trim();
        } else if (/^[aA][\.\)]\s*/i.test(line)) {
          currentQ.optionA = line.replace(/^[aA][\.\)]\s*/i, "");
        } else if (/^[bB][\.\)]\s*/i.test(line)) {
          currentQ.optionB = line.replace(/^[bB][\.\)]\s*/i, "");
        } else if (/^[cC][\.\)]\s*/i.test(line)) {
          currentQ.optionC = line.replace(/^[cC][\.\)]\s*/i, "");
        } else if (/^[dD][\.\)]\s*/i.test(line)) {
          currentQ.optionD = line.replace(/^[dD][\.\)]\s*/i, "");
        } else if (/^[eE][\.\)]\s*/i.test(line)) {
          currentQ.optionE = line.replace(/^[eE][\.\)]\s*/i, "");
          currentQ.questionType = "MULTIPLE_CHOICE_5";
        } else if (/^(kunci|jawaban|kunci jawaban|ans|key)\s*[:=]\s*(.+)/i.test(line)) {
          const match = line.match(/^(kunci|jawaban|kunci jawaban|ans|key)\s*[:=]\s*(.+)/i);
          if (match && match[2]) {
            currentQ.correctOption = match[2].trim();
          }
        } else if (/^(poin|bobot|skor|score)\s*[:=]\s*(\d+)/i.test(line)) {
          const match = line.match(/^(poin|bobot|skor|score)\s*[:=]\s*(\d+)/i);
          if (match && match[2]) {
            currentQ.points = match[2];
          }
        } else {
          if (!currentQ.optionA) {
            currentQ.questionText += " " + line;
          }
        }
      }
    }

    if (currentQ && currentQ.questionText) {
      if (!currentQ.questionType) {
        if (currentQ.optionE) {
          currentQ.questionType = "MULTIPLE_CHOICE_5";
        } else if (currentQ.optionA && currentQ.optionB) {
          currentQ.questionType = "MULTIPLE_CHOICE_4";
        } else {
          currentQ.questionType = "ESSAY";
        }
      }
      parsed.push(currentQ);
    }

    return parsed;
  };

  // Preview Parse on Text Change
  useEffect(() => {
    if (importText.trim()) {
      const res = parseQuestionsText(importText);
      setParsedCount(res.length);
    } else {
      setParsedCount(null);
    }
  }, [importText]);

  // Apply Imported Questions
  const handleApplyImport = () => {
    const parsed = parseQuestionsText(importText);
    if (parsed.length === 0) {
      alert("Tidak ada butir soal yang berhasil diekstrak. Pastikan format teks atau CSV sesuai panduan.");
      return;
    }

    if (importAppendMode === "replace") {
      setForm((prev) => ({
        ...prev,
        questions: parsed,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        questions: [...prev.questions, ...parsed],
      }));
    }

    setShowImportModal(false);
    setImportText("");
    alert(`Berhasil mengimpor ${parsed.length} butir soal ke dalam paket ujian!`);
  };

  // Copy Template
  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(SAMPLE_TEXT_TEMPLATE);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  // Download Sample CSV
  const handleDownloadCsvTemplate = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      encodeURIComponent(
        `Pertanyaan,Jenis Soal,Opsi A,Opsi B,Opsi C,Opsi D,Opsi E,Kunci Jawaban,Poin,Gambar URL,Audio URL\n` +
          `"Perhatikan gambar berikut, berapakah nilai x?","Pilihan Ganda A-D","10","12","15","18","","A","25","/uploads/cbt/diagram.png",""\n` +
          `"Dengarkan rekaman percakapan berikut ini:","Pilihan Ganda A-E","Opsi 1","Opsi 2","Opsi 3","Opsi 4","Opsi 5","B","25","","/uploads/cbt/audio.mp3"\n` +
          `"Jelaskan prinsip dasar pengelolaan sampah dengan sistem 3R!","Esai","","","","","","Rubrik: Reduce, Reuse, Recycle beserta contoh","25","",""\n` +
          `"Buatlah portofolio produk olahan pangan lokal bernilai jual!","Karya","","","","","","Rubrik: Inovasi rasa, kemasan, dan kelayakan usaha","25","",""`
      );
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", "template_soal_cbt_askara.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle File Upload for Import
  const handleFileUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setImportText(content);
        setImportMode("text");
      }
    };
    reader.readAsText(file);
  };

  // Submit Handler
  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formattedQuestions = form.questions.map((q) => {
        let optionsArray: string[] = [];
        if (q.questionType === "MULTIPLE_CHOICE_4") {
          optionsArray = [
            `A. ${q.optionA || "Pilihan A"}`,
            `B. ${q.optionB || "Pilihan B"}`,
            `C. ${q.optionC || "Pilihan C"}`,
            `D. ${q.optionD || "Pilihan D"}`,
          ];
        } else if (q.questionType === "MULTIPLE_CHOICE_5") {
          optionsArray = [
            `A. ${q.optionA || "Pilihan A"}`,
            `B. ${q.optionB || "Pilihan B"}`,
            `C. ${q.optionC || "Pilihan C"}`,
            `D. ${q.optionD || "Pilihan D"}`,
            `E. ${q.optionE || "Pilihan E"}`,
          ];
        } else {
          optionsArray = [];
        }

        return {
          questionText: q.questionText || "Pertanyaan Ujian",
          questionType: q.questionType,
          optionsJson: optionsArray.length > 0 ? JSON.stringify(optionsArray) : null,
          correctOption: q.correctOption || "A",
          points: parseFloat(q.points) || 10,
          imageUrl: q.imageUrl || null,
          audioUrl: q.audioUrl || null,
        };
      });

      const res = await fetch("/api/cbt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          type: form.type,
          classId: form.classId,
          subjectName: form.subjectName,
          durationMinutes: form.durationMinutes,
          passingScore: form.passingScore,
          startTime: form.startTime,
          endTime: form.endTime,
          isPublished: form.isPublished,
          questions: formattedQuestions,
        }),
      });

      const data = await res.json();
      if (res.ok && data.assessment) {
        setShowModal(false);
        fetchAssessments();
        alert("Paket ujian CBT baru berhasil dibuat!");
      } else {
        alert(data.error || "Gagal membuat paket ujian");
      }
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Publish Status
  const handleTogglePublish = async (assessment: AssessmentItem) => {
    try {
      const newStatus = !assessment.isPublished;
      const res = await fetch(`/api/cbt?id=${assessment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: newStatus }),
      });
      if (res.ok) {
        fetchAssessments();
      }
    } catch {}
  };

  // Delete Assessment
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus paket ujian "${title}"?`)) return;
    try {
      const res = await fetch(`/api/cbt?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchAssessments();
    } catch {}
  };

  const totalQuestions = assessments.reduce((sum, a) => sum + (a.questions?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2">
              <FileCheck className="w-4 h-4" />
              <span>Computer-Based Testing</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Asesmen & CBT (Computer-Based Test)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-2xl leading-relaxed">
              Rancang paket ujian online dengan soal multimedia (**Gambar, Diagram, & Audio Listening**), format **PG A-D, PG A-E, Esai**, dan **Tugas Karya**.
            </p>
          </div>

          {/* Tombol Buat Paket Ujian Baru */}
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center space-x-2 px-5 py-3 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Paket Ujian Baru</span>
          </button>
        </div>

        {/* Stats Strip */}
        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3">
            <p className="text-[11px] font-medium text-slate-500">Paket Ujian Aktif</p>
            <p className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">{assessments.length} Paket</p>
          </div>
          <div className="bg-indigo-50/60 border border-indigo-200/60 rounded-xl p-3">
            <p className="text-[11px] font-medium text-indigo-800">Total Butir Soal</p>
            <p className="text-base sm:text-lg font-bold text-indigo-900 mt-0.5">{totalQuestions} Soal</p>
          </div>
          <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-xl p-3">
            <p className="text-[11px] font-medium text-emerald-800">Dukungan Media</p>
            <p className="text-base sm:text-lg font-bold text-emerald-900 mt-0.5">Gambar & Audio Aktif</p>
          </div>
          <div className="bg-purple-50/60 border border-purple-200/60 rounded-xl p-3">
            <p className="text-[11px] font-medium text-purple-800">Import Massal</p>
            <p className="text-base sm:text-lg font-bold text-purple-900 mt-0.5">Teks / CSV Aktif</p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Cari judul ujian, mata pelajaran, atau kelas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
            {["SEMUA", "UH", "PTS", "PAS", "TRYOUT"].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  typeFilter === t
                    ? "bg-indigo-700 text-white shadow-xs font-bold"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Paket Ujian */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 bg-white rounded-2xl border border-slate-200 p-5 animate-pulse" />
          ))}
        </div>
      ) : assessments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-soft">
          <FileCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Belum ada paket ujian CBT</h3>
          <p className="text-xs text-slate-500 mt-1">
            Buat paket ujian baru untuk mempublikasikan soal online kepada siswa.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-700 text-white rounded-xl text-xs font-bold hover:bg-indigo-600 transition"
          >
            <Plus className="w-4 h-4" /> Buat Paket Ujian Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {assessments.map((t) => {
            const typeConfig =
              ASSESSMENT_TYPES.find((at) => at.value === t.type) || ASSESSMENT_TYPES[0];

            return (
              <div
                key={t.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-soft hover-lift flex flex-col justify-between transition group hover:border-indigo-300 space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
                        {t.class?.name || "Rombel"}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${typeConfig.color}`}>
                        {typeConfig.label.split(" - ")[0]}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        t.isPublished
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {t.isPublished ? "AKTIF" : "DRAF"}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-3 leading-snug group-hover:text-indigo-800 transition">
                    {t.title}
                  </h3>

                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Mapel: {t.subject?.name || "Mata Pelajaran"} • Tutor: {t.teacher?.name || "Pendidik"}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2.5 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <ListChecks className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Jumlah Soal: <strong>{t.questions?.length || 0} Butir</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Durasi: <strong>{t.durationMinutes} Menit</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      <span>
                        KKM Lulus: <strong>{t.passingScore}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Gambar & Audio: Aktif</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Bar Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() => {
                      setSelectedAssessment(t);
                      setShowDetailModal(true);
                    }}
                    className="text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-1 text-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Lihat Butir Soal ({t.questions?.length || 0})</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTogglePublish(t)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                        t.isPublished
                          ? "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                      }`}
                    >
                      {t.isPublished ? "Nonaktifkan" : "Publikasikan"}
                    </button>

                    <button
                      onClick={() => handleDelete(t.id, t.title)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Hapus Paket Ujian"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL BUAT PAKET UJIAN CBT BARU                              */}
      {/* ============================================================ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden my-auto border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Buat Paket Ujian CBT Baru
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sematkan Gambar diagram/rumus dan Audio listening pada butir soal
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleCreateAssessment} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
              {/* Judul Ujian */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Judul Paket Ujian CBT <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Penilaian Tengah Semester (PTS) Ganjil - Bahasa Inggris Listening & Grammar"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white transition"
                  required
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {/* Tipe Ujian */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jenis Asesmen <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white transition"
                  >
                    {ASSESSMENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Rombel / Kelas */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Rombel / Kelas <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.classId}
                    onChange={(e) => setForm({ ...form, classId: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white transition"
                    required
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mata Pelajaran */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mata Pelajaran <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Matematika, Bahasa Indonesia..."
                    value={form.subjectName}
                    onChange={(e) => setForm({ ...form, subjectName: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white transition"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                {/* Durasi Ujian */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Durasi Pengerjaan (Menit) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.durationMinutes}
                    onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white transition"
                    required
                  />
                </div>

                {/* KKM */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    Nilai Standar Kelulusan (KKM)
                  </label>
                  <input
                    type="number"
                    value={form.passingScore}
                    onChange={(e) => setForm({ ...form, passingScore: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Status Publikasi Langsung */}
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <input
                  type="checkbox"
                  id="isPublishedCheck"
                  checked={form.isPublished}
                  onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="isPublishedCheck" className="text-xs font-semibold text-slate-800 cursor-pointer">
                  Aktifkan & Publikasikan Langsung ke Siswa di Kelas Terpilih
                </label>
              </div>

              {/* ============================================================ */}
              {/* SECTION BUTIR SOAL + OPSI TIPE SOAL + GAMBAR & AUDIO         */}
              {/* ============================================================ */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <ListChecks className="w-4 h-4 text-indigo-600" />
                    Daftar Butir Soal ({form.questions.length} Butir)
                  </h4>

                  {/* Actions: Import Soal & Tambah Manual */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setShowImportModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-emerald-700" />
                      <span>📥 Import Soal (Teks / CSV)</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleAddQuestion("MULTIPLE_CHOICE_4")}
                        className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg text-[11px] font-bold transition"
                        title="Tambah Pilihan Ganda A-D"
                      >
                        + PG A-D
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddQuestion("MULTIPLE_CHOICE_5")}
                        className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg text-[11px] font-bold transition"
                        title="Tambah Pilihan Ganda A-E"
                      >
                        + PG A-E
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddQuestion("ESSAY")}
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-bold transition"
                        title="Tambah Soal Esai"
                      >
                        + Esai
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddQuestion("KARYA")}
                        className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-bold transition"
                        title="Tambah Tugas Karya / Portofolio"
                      >
                        + Karya
                      </button>
                    </div>
                  </div>
                </div>

                {form.questions.map((q, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded">
                          Nomor {idx + 1}
                        </span>

                        {/* Dropdown Jenis Soal */}
                        <select
                          value={q.questionType}
                          onChange={(e) => {
                            const nType = e.target.value as any;
                            setForm((prev) => {
                              const nq = [...prev.questions];
                              nq[idx].questionType = nType;
                              if (nType === "ESSAY" || nType === "KARYA") {
                                nq[idx].correctOption = "Rubrik Penilaian";
                              } else {
                                nq[idx].correctOption = "A";
                              }
                              return { ...prev, questions: nq };
                            });
                          }}
                          className="border border-slate-300 rounded-lg px-2 py-0.5 text-xs font-bold bg-white text-slate-800"
                        >
                          <option value="MULTIPLE_CHOICE_4">Pilihan Ganda (A - D)</option>
                          <option value="MULTIPLE_CHOICE_5">Pilihan Ganda (A - E)</option>
                          <option value="ESSAY">Esai / Uraian</option>
                          <option value="KARYA">Tugas Karya / Portofolio</option>
                        </select>
                      </div>

                      {form.questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(idx)}
                          className="text-rose-500 hover:text-rose-700 text-xs font-semibold self-end sm:self-auto"
                        >
                          Hapus Soal
                        </button>
                      )}
                    </div>

                    {/* TEKS PERTANYAAN */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {q.questionType === "KARYA"
                          ? "Instruksi / Lembar Kerja Tugas Karya / Praktik"
                          : q.questionType === "ESSAY"
                          ? "Teks Pertanyaan Esai / Uraian"
                          : "Teks Pertanyaan Pilihan Ganda"}
                      </label>
                      <textarea
                        rows={2}
                        placeholder={
                          q.questionType === "KARYA"
                            ? "Tuliskan instruksi pembuatan karya, spesifikasi produk, dan format pengumpulan..."
                            : q.questionType === "ESSAY"
                            ? "Tuliskan pertanyaan esai yang membutuhkan jawaban tertulis siswa..."
                            : "Tuliskan pertanyaan soal pilihan ganda..."
                        }
                        value={q.questionText}
                        onChange={(e) => {
                          const val = e.target.value;
                          setForm((prev) => {
                            const nq = [...prev.questions];
                            nq[idx].questionText = val;
                            return { ...prev, questions: nq };
                          });
                        }}
                        className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white transition resize-none"
                        required
                      />
                    </div>

                    {/* ============================================================ */}
                    {/* FITUR LAMPIRAN GAMBAR & AUDIO UNTUK SOAL                     */}
                    {/* ============================================================ */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-white border border-slate-200/80 rounded-xl">
                      {/* LAMPIRAN GAMBAR / DIAGRAM */}
                      <div>
                        <span className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Gambar / Diagram Soal (Opsional)</span>
                        </span>

                        {q.imageUrl ? (
                          <div className="relative group border border-slate-200 rounded-lg p-2 bg-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-2 truncate">
                              <img
                                src={q.imageUrl}
                                alt="Diagram Soal"
                                className="w-10 h-10 object-cover rounded border border-slate-300 shrink-0"
                              />
                              <span className="text-[11px] font-semibold text-slate-700 truncate">
                                {q.imageUrl.split("/").pop()}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setForm((prev) => {
                                  const nq = [...prev.questions];
                                  nq[idx].imageUrl = "";
                                  return { ...prev, questions: nq };
                                });
                              }}
                              className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                              title="Hapus Gambar"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex items-center justify-center gap-2 p-2.5 border border-dashed border-slate-300 hover:border-indigo-500 rounded-lg bg-slate-50/60 hover:bg-indigo-50/40 cursor-pointer transition text-[11px] text-slate-600 font-medium">
                            {uploadingImageIdx === idx ? (
                              <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                            ) : (
                              <ImageIcon className="w-4 h-4 text-indigo-600" />
                            )}
                            <span>{uploadingImageIdx === idx ? "Mengunggah..." : "Upload Gambar (JPG/PNG)"}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleUploadQuestionImage(idx, f);
                              }}
                            />
                          </label>
                        )}
                      </div>

                      {/* LAMPIRAN AUDIO LISTENING */}
                      <div>
                        <span className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                          <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Audio / Listening Soal (Opsional)</span>
                        </span>

                        {q.audioUrl ? (
                          <div className="border border-slate-200 rounded-lg p-2 bg-slate-50 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1 truncate">
                                <Music className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                {q.audioUrl.split("/").pop()}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setForm((prev) => {
                                    const nq = [...prev.questions];
                                    nq[idx].audioUrl = "";
                                    return { ...prev, questions: nq };
                                  });
                                }}
                                className="p-1 text-rose-500 hover:text-rose-700"
                                title="Hapus Audio"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <audio controls src={q.audioUrl} className="w-full h-7" />
                          </div>
                        ) : (
                          <label className="flex items-center justify-center gap-2 p-2.5 border border-dashed border-slate-300 hover:border-emerald-500 rounded-lg bg-slate-50/60 hover:bg-emerald-50/40 cursor-pointer transition text-[11px] text-slate-600 font-medium">
                            {uploadingAudioIdx === idx ? (
                              <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                            ) : (
                              <Volume2 className="w-4 h-4 text-emerald-600" />
                            )}
                            <span>{uploadingAudioIdx === idx ? "Mengunggah..." : "Upload Audio (MP3/WAV)"}</span>
                            <input
                              type="file"
                              accept="audio/*"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleUploadQuestionAudio(idx, f);
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* PILIHAN GANDA (A-D atau A-E) */}
                    {(q.questionType === "MULTIPLE_CHOICE_4" || q.questionType === "MULTIPLE_CHOICE_5") && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="font-bold text-slate-600">Pilihan A:</span>
                            <input
                              type="text"
                              placeholder="Jawaban A"
                              value={q.optionA}
                              onChange={(e) => {
                                const val = e.target.value;
                                setForm((prev) => {
                                  const nq = [...prev.questions];
                                  nq[idx].optionA = val;
                                  return { ...prev, questions: nq };
                                });
                              }}
                              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-xs mt-0.5"
                            />
                          </div>
                          <div>
                            <span className="font-bold text-slate-600">Pilihan B:</span>
                            <input
                              type="text"
                              placeholder="Jawaban B"
                              value={q.optionB}
                              onChange={(e) => {
                                const val = e.target.value;
                                setForm((prev) => {
                                  const nq = [...prev.questions];
                                  nq[idx].optionB = val;
                                  return { ...prev, questions: nq };
                                });
                              }}
                              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-xs mt-0.5"
                            />
                          </div>
                          <div>
                            <span className="font-bold text-slate-600">Pilihan C:</span>
                            <input
                              type="text"
                              placeholder="Jawaban C"
                              value={q.optionC}
                              onChange={(e) => {
                                const val = e.target.value;
                                setForm((prev) => {
                                  const nq = [...prev.questions];
                                  nq[idx].optionC = val;
                                  return { ...prev, questions: nq };
                                });
                              }}
                              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-xs mt-0.5"
                            />
                          </div>
                          <div>
                            <span className="font-bold text-slate-600">Pilihan D:</span>
                            <input
                              type="text"
                              placeholder="Jawaban D"
                              value={q.optionD}
                              onChange={(e) => {
                                const val = e.target.value;
                                setForm((prev) => {
                                  const nq = [...prev.questions];
                                  nq[idx].optionD = val;
                                  return { ...prev, questions: nq };
                                });
                              }}
                              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-xs mt-0.5"
                            />
                          </div>
                        </div>

                        {/* Opsi E hanya jika MULTIPLE_CHOICE_5 */}
                        {q.questionType === "MULTIPLE_CHOICE_5" && (
                          <div className="text-[11px]">
                            <span className="font-bold text-slate-600">Pilihan E:</span>
                            <input
                              type="text"
                              placeholder="Jawaban E"
                              value={q.optionE}
                              onChange={(e) => {
                                const val = e.target.value;
                                setForm((prev) => {
                                  const nq = [...prev.questions];
                                  nq[idx].optionE = val;
                                  return { ...prev, questions: nq };
                                });
                              }}
                              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-xs mt-0.5"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* ESAI ATAU KARYA (Rubrik / Kunci Penjelasan) */}
                    {(q.questionType === "ESSAY" || q.questionType === "KARYA") && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          {q.questionType === "KARYA" ? "Kriteria / Rubrik Penilaian Karya" : "Kunci Jawaban / Kata Kunci Penilaian Esai"}
                        </label>
                        <input
                          type="text"
                          placeholder={
                            q.questionType === "KARYA"
                              ? "Contoh Rubrik: Kelengkapan laporan, estetika kemasan produk, dan kreativitas (Maks 100)"
                              : "Contoh: Siswa harus menyebutkan 3 tahapan siklus air..."
                          }
                          value={q.correctOption}
                          onChange={(e) => {
                            const val = e.target.value;
                            setForm((prev) => {
                              const nq = [...prev.questions];
                              nq[idx].correctOption = val;
                              return { ...prev, questions: nq };
                            });
                          }}
                          className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-xs"
                        />
                      </div>
                    )}

                    {/* Bottom strip per butir soal: Kunci Jawaban & Bobot Poin */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                      <div className="flex items-center gap-2">
                        {q.questionType === "MULTIPLE_CHOICE_4" && (
                          <>
                            <span className="font-bold text-slate-700">Kunci Jawaban:</span>
                            <select
                              value={q.correctOption}
                              onChange={(e) => {
                                const val = e.target.value;
                                setForm((prev) => {
                                  const nq = [...prev.questions];
                                  nq[idx].correctOption = val;
                                  return { ...prev, questions: nq };
                                });
                              }}
                              className="border border-slate-300 rounded-lg px-2 py-1 bg-white font-bold text-indigo-700"
                            >
                              <option value="A">A</option>
                              <option value="B">B</option>
                              <option value="C">C</option>
                              <option value="D">D</option>
                            </select>
                          </>
                        )}

                        {q.questionType === "MULTIPLE_CHOICE_5" && (
                          <>
                            <span className="font-bold text-slate-700">Kunci Jawaban:</span>
                            <select
                              value={q.correctOption}
                              onChange={(e) => {
                                const val = e.target.value;
                                setForm((prev) => {
                                  const nq = [...prev.questions];
                                  nq[idx].correctOption = val;
                                  return { ...prev, questions: nq };
                                });
                              }}
                              className="border border-slate-300 rounded-lg px-2 py-1 bg-white font-bold text-purple-700"
                            >
                              <option value="A">A</option>
                              <option value="B">B</option>
                              <option value="C">C</option>
                              <option value="D">D</option>
                              <option value="E">E</option>
                            </select>
                          </>
                        )}

                        {q.questionType === "ESSAY" && (
                          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            📝 Penilaian Esai
                          </span>
                        )}

                        {q.questionType === "KARYA" && (
                          <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            🎨 Portofolio / Berkas Karya
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-500">Bobot Poin:</span>
                        <input
                          type="number"
                          value={q.points}
                          onChange={(e) => {
                            const val = e.target.value;
                            setForm((prev) => {
                              const nq = [...prev.questions];
                              nq[idx].points = val;
                              return { ...prev, questions: nq };
                            });
                          }}
                          className="w-14 border border-slate-300 rounded-lg px-2 py-1 bg-white text-center font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl font-bold transition shadow-sm disabled:opacity-60 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan Paket...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Simpan & Terbitkan Ujian</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL IMPORT SOAL (TEKS / EXCEL / CSV)                       */}
      {/* ============================================================ */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden my-auto border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Import Butir Soal CBT Cepat</h3>
                  <p className="text-xs text-slate-500">
                    Otomatis mengenali Pilihan Ganda A-D, PG A-E, Esai, Karya, serta Gambar dan Audio
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
              {/* Tool / Helper Strip */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                <span className="text-[11px] text-emerald-900 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Mendukung tag `[Gambar: url]`, `[Audio: url]`, `[Esai]`, dan `[Karya]`.
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyTemplate}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-bold transition"
                  >
                    {copiedTemplate ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedTemplate ? "Tersalin!" : "Salin Contoh Format"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadCsvTemplate}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-bold transition"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Unduh CSV</span>
                  </button>
                </div>
              </div>

              {/* Input Method Tabs */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setImportMode("text")}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition ${
                      importMode === "text"
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Tempel Teks Soal
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportMode("file")}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition ${
                      importMode === "file"
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Unggah Berkas (.csv / .txt)
                  </button>
                </div>

                {parsedCount !== null && (
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300">
                    ✅ {parsedCount} Butir Soal Terdeteksi
                  </span>
                )}
              </div>

              {importMode === "text" ? (
                <div>
                  <textarea
                    rows={9}
                    placeholder={`Tempel soal di sini, contoh:\n\n1. [Pilihan Ganda A-D] Perhatikan gambar diagram sel berikut:\n[Gambar: /uploads/cbt/sel.png]\nA. Nukleus\nB. Mitokondria\nC. Ribosom\nD. Vakuola\nKunci: A\nPoin: 25\n\n2. [Esai] Jelaskan konsep daur air!\nKunci: Rubrik penilaian proses daur air.\nPoin: 25`}
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50 focus:bg-white transition leading-relaxed resize-none"
                  />
                </div>
              ) : (
                <div
                  onClick={() => fileImportRef.current?.click()}
                  className="p-8 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl bg-slate-50 hover:bg-emerald-50/40 cursor-pointer text-center space-y-2 transition"
                >
                  <FileSpreadsheet className="w-10 h-10 text-emerald-700 mx-auto" />
                  <p className="font-bold text-slate-800">Klik untuk memilih berkas CSV atau TXT</p>
                  <p className="text-[11px] text-slate-400">Berkas soal akan langsung dianalisis otomatis</p>
                  <input
                    ref={fileImportRef}
                    type="file"
                    accept=".csv,.txt"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileUpload(f);
                    }}
                  />
                </div>
              )}

              {/* Mode Penambahan */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <span className="font-semibold text-slate-700 text-xs">Pilihan Penerapan Soal:</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                    <input
                      type="radio"
                      name="appendMode"
                      checked={importAppendMode === "replace"}
                      onChange={() => setImportAppendMode("replace")}
                      className="text-emerald-600"
                    />
                    <span>Gantikan Soal Saat Ini</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                    <input
                      type="radio"
                      name="appendMode"
                      checked={importAppendMode === "append"}
                      onChange={() => setImportAppendMode("append")}
                      className="text-emerald-600"
                    />
                    <span>Tambahkan ke Soal Saat Ini</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2.5 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100 transition text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApplyImport}
                disabled={!importText.trim() || parsedCount === 0}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold transition shadow-xs text-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Terapkan Import ({parsedCount || 0} Soal)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL LIHAT BUTIR SOAL                                       */}
      {/* ============================================================ */}
      {showDetailModal && selectedAssessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden my-auto border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {selectedAssessment.type} • {selectedAssessment.class?.name}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {selectedAssessment.title}
                </h3>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-800">
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center font-medium">
                <div>Durasi: <strong>{selectedAssessment.durationMinutes} Menit</strong></div>
                <div>KKM: <strong>{selectedAssessment.passingScore}</strong></div>
                <div>Soal: <strong>{selectedAssessment.questions?.length || 0} Butir</strong></div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">Daftar Butir Soal:</h4>
                {selectedAssessment.questions && selectedAssessment.questions.length > 0 ? (
                  selectedAssessment.questions.map((q, idx) => {
                    let options: string[] = [];
                    try {
                      options = q.optionsJson ? JSON.parse(q.optionsJson) : [];
                    } catch {}

                    const qTypeObj = QUESTION_TYPES.find((qt) => qt.value === q.questionType) || QUESTION_TYPES[0];

                    return (
                      <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-indigo-900">Soal {idx + 1}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${qTypeObj.badgeColor}`}>
                              {qTypeObj.label}
                            </span>
                          </div>
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                            {q.points} Poin
                          </span>
                        </div>

                        <p className="font-semibold text-slate-800 leading-relaxed whitespace-pre-line">{q.questionText}</p>

                        {/* GAMBAR SOAL */}
                        {q.imageUrl && (
                          <div className="p-2 bg-white rounded-lg border border-slate-200 inline-block max-w-sm">
                            <img
                              src={q.imageUrl}
                              alt={`Gambar Soal ${idx + 1}`}
                              className="max-h-48 rounded object-contain"
                            />
                          </div>
                        )}

                        {/* AUDIO SOAL */}
                        {q.audioUrl && (
                          <div className="p-2.5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1">
                            <span className="text-[10px] font-bold text-emerald-900 flex items-center gap-1">
                              <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
                              Audio Listening Soal
                            </span>
                            <audio controls src={q.audioUrl} className="w-full h-8" />
                          </div>
                        )}

                        {options.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 mt-2">
                            {options.map((opt, oIdx) => (
                              <div key={oIdx} className="p-2 rounded bg-white border border-slate-200 text-[11px]">
                                {opt}
                              </div>
                            ))}
                          </div>
                        ) : null}

                        <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                          <span>Kunci / Rubrik: <strong className="text-slate-900">{q.correctOption}</strong></span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-slate-400 italic">Belum ada butir soal pada paket ujian ini.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
