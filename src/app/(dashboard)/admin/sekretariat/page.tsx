"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  Plus,
  Search,
  Printer,
  X,
  CheckCircle2,
  Calendar,
  User,
  ShieldCheck,
  Building2,
  QrCode,
  Download,
  Filter,
  Sparkles,
  Award,
  GraduationCap,
  Send,
  Briefcase,
  Layers,
  ArrowRight,
  Eye,
  Trash2,
  ExternalLink,
  ChevronRight,
  FileCheck2,
  BookOpen,
  Users,
  Inbox,
  SendHorizontal,
  FileSpreadsheet,
  FileEdit,
  Building,
  Car,
  FilePlus,
  Lock,
  ArrowLeft,
  CheckSquare,
  HelpCircle,
  Save,
  BookmarkPlus,
  PenTool,
  RotateCcw,
  PlusCircle,
  Check,
  ChevronDown,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Table,
  Eraser,
  Heading1,
  Heading2,
  Type,
  UploadCloud,
  Paperclip,
  File,
  Loader2,
} from "lucide-react";
import { LetterCategoryCode, LETTER_CATEGORIES, LetterCategoryMeta, LetterItem } from "@/lib/surat-constants";

interface StudentLookupItem {
  id: string;
  name: string;
  nisn: string;
  nik: string;
  birthInfo: string;
  birthPlace: string;
  birthDate: string;
  packetType: string;
  address: string;
  parentName: string;
  phone: string;
}

interface TeacherLookupItem {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  nik: string;
  nip: string;
  position: string;
  address: string;
}

// 6 Core Popular Templates (90% Daily Use) + 1 Custom Free Canvas Card
const POPULAR_TEMPLATES = [
  {
    id: "SKET_SISWA_AKTIF",
    categoryCode: "SKet" as LetterCategoryCode,
    title: "Surat Keterangan Siswa Aktif Belajar",
    badge: "Paling Sering Digunakan",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    icon: GraduationCap,
    iconBg: "bg-emerald-500 text-white",
    desc: "Keterangan aktif warga belajar untuk pengajuan PIP, beasiswa, atau syarat instansi",
    targetType: "student",
    defaultData: {
      templateType: "SKET_AKTIF",
      purpose: "Persyaratan Pengajuan Program Indonesia Pintar (PIP) / Beasiswa Pendidikan",
      academicYear: "2026/2027",
    },
  },
  {
    id: "SKET_PENGALAMAN_KERJA",
    categoryCode: "SKet" as LetterCategoryCode,
    title: "Surat Keterangan Pengalaman Kerja Tutor",
    badge: "Portofolio Pendidik",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
    icon: Briefcase,
    iconBg: "bg-blue-600 text-white",
    desc: "Keterangan masa bakti, dedikasi, dan rekam jejak mengajar tutor/tenaga pendidik",
    targetType: "teacher",
    defaultData: {
      templateType: "SKET_PENGALAMAN_KERJA",
      periodStart: "01 Juli 2021",
      periodEnd: "30 Juni 2026",
      recommendation: "Selama bekerja pada PKBM Askara, yang bersangkutan telah menunjukkan dedikasi, integritas, dan kinerja yang sangat baik dalam mengajar dan membimbing warga belajar.",
      purpose: "Kelengkapan berkas portofolio sertifikasi pendidik / keperluan instansi terkait.",
    },
  },
  {
    id: "ST_TUGAS_DINAS",
    categoryCode: "ST" as LetterCategoryCode,
    title: "Surat Tugas Dinas / Pelatihan Guru",
    badge: "Dinas & Workshop",
    badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-300",
    icon: Car,
    iconBg: "bg-indigo-600 text-white",
    desc: "Penugasan guru/staf mengikuti bimtek kurikulum merdeka, workshop, atau dinas luar",
    targetType: "teacher",
    defaultData: {
      templateType: "SURAT_TUGAS",
      assignment: "Mengikuti Bimbingan Teknis Implementasi Kurikulum Merdeka & Modul P5 Non-Formal",
      location: "Balai Penjaminan Mutu Pendidikan (BPMP) Provinsi Jawa Barat",
      duration: "25 Agustus 2026 s.d. 27 Agustus 2026",
    },
  },
  {
    id: "SU_UNDANGAN_RAPAT",
    categoryCode: "SU" as LetterCategoryCode,
    title: "Surat Undangan Rapat Orang Tua & e-Rapor",
    badge: "Pertemuan Berjadwal",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
    icon: Send,
    iconBg: "bg-purple-600 text-white",
    desc: "Undangan resmi lengkap dengan tabel jadwal pertemuan, ruang, dan agenda",
    targetType: "general",
    defaultData: {
      templateType: "UNDANGAN_JADWAL",
      recipient: "Bapak/Ibu Orang Tua / Wali Murid Warga Belajar",
      recipientDetails: "Peserta Didik Paket A, Paket B, dan Paket C",
      openingSalam: "Bismillahirrohmanirrohim, Segala puji bagi Allah SWT yang senantiasa melimpahkan rahmat-Nya kepada kita semua.",
      bodyParagraph: "Dalam rangka meningkatkan mutu pembelajaran dan menyelaraskan evaluasi capaian hasil belajar siswa Semester Ganjil 2026/2027, kami mengundang Bapak/Ibu hadir pada pertemuan koordinasi yang akan dilaksanakan pada:",
      schedules: [
        { dayDate: "Sabtu, 29 Agustus 2026", time: "09.00 - 11.30 WIB", room: "Aula Utama PKBM Askara Gedebage", agenda: "Sosialisasi e-Rapor & CBT Warga Belajar Paket C" },
        { dayDate: "Minggu, 30 Agustus 2026", time: "09.00 - 11.30 WIB", room: "Aula Utama PKBM Askara Gedebage", agenda: "Evaluasi Pembelajaran & Program Vokasi Paket A & B" },
      ],
      closingNotes: "Mengingat pentingnya agenda ini untuk masa depan putra/putri kita, dimohon kehadiran Bapak/Ibu tepat pada waktunya.",
    },
  },
  {
    id: "SK_PENUNJUKAN",
    categoryCode: "SK" as LetterCategoryCode,
    title: "Surat Keputusan (SK) Pengangkatan / Tugas",
    badge: "Legalitas Lembaga",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
    icon: Award,
    iconBg: "bg-amber-600 text-white",
    desc: "SK resmi Kepala PKBM: Penunjukan Operator Dapodik/IT, Tutor Mengajar, atau Panitia",
    targetType: "teacher",
    defaultData: {
      templateType: "SK",
      tentang: "PENUNJUKAN OPERATOR PKBM ASKARA",
      tahunAjaran: "TAHUN AJARAN 2026/2027",
      menimbang: [
        "bahwa dalam rangka menunjang kelancaran pengelolaan administrasi, data pokok pendidikan (Dapodik/PDSP), dan sistem informasi di PKBM Askara, dipandang perlu menunjuk seorang Operator PKBM;",
        "bahwa untuk kepentingan sebagaimana dimaksud pada huruf a, dipandang perlu menetapkan Surat Keputusan Kepala PKBM Askara.",
      ],
      mengingat: [
        "Undang-Undang Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional;",
        "Peraturan Menteri Pendidikan Dasar dan Menengah Nomor 13 Tahun 2025 tentang Kurikulum Merdeka;",
        "Ketentuan Data Pokok Pendidikan (Dapodik) dan Pangkalan Data Sekolah dan Pendidikan (PDSP) Kementerian Pendidikan;",
      ],
      kesatuNama: "Ihsan Fadilah, S.TP",
      kesatuJabatan: "Operator PKBM Askara",
      kesatuUnitKerja: "PKBM Askara",
      keduaPeriode: "Sebagai Operator PKBM Askara terhitung mulai tanggal 13 Juli 2026 sampai dengan 12 Juli 2027.",
      ketigaTugas: "Melaksanakan pengelolaan data pokok pendidikan (input & pemutakhiran Dapodik/PDSP), pengelolaan data warga belajar, dan administrasi sistem informasi.",
      keempatBiaya: "Segala biaya yang timbul dibebankan pada anggaran operasional PKBM Askara.",
      kelimaPenutup: "Surat Keputusan ini mulai berlaku sejak tanggal ditetapkan.",
    },
  },
  {
    id: "SPN_PERNYATAAN_LEMBAGA",
    categoryCode: "SPn" as LetterCategoryCode,
    title: "Surat Pernyataan Lembaga (TTD Ganda)",
    badge: "Yayasan & Legalitas",
    badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
    icon: Building,
    iconBg: "bg-rose-600 text-white",
    desc: "Pernyataan keabsahan izin operasional DPMPTSP dengan TTD Ganda Yayasan & Kepala PKBM",
    targetType: "general",
    defaultData: {
      templateType: "PERNYATAAN_YAYASAN",
      foundationName: "Yayasan Cakrawala Askara Nusantara",
      foundationLeader: "Dr. H. Mulyadi Pratama, M.Pd.",
      headmasterName: "Arif Syarifudin, S.Pd",
      npsn: "P9998766",
      permitNumber: "0019/IPSPNFI/IX/2022/DPMTSP",
      statementText: "Menyatakan dengan sesungguhnya bahwa seluruh data sarana prasarana, tenaga pendidik, dan warga belajar yang diajukan untuk perpanjangan izin operasional adalah benar, sah, dan dapat dipertanggungjawabkan sesuai hukum yang berlaku.",
      isDualSignature: true,
    },
  },
  {
    id: "SURAT_KUSTOM",
    categoryCode: "SPm" as LetterCategoryCode,
    title: "Surat Full Kustom / Naskah Bebas",
    badge: "Word / Docs 100%",
    badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-300",
    icon: FileEdit,
    iconBg: "bg-slate-900 text-white",
    desc: "Kanvas naskah bebas seperti Google Docs / Word: atur teks, tabel, paragraf & gaya bebas 100%",
    targetType: "custom_word",
    defaultData: {
      templateType: "CUSTOM_FREE_WORD",
      customHtml: `
        <p style="text-align: justify; margin-bottom: 12px;"><strong>Kepada Yth.</strong><br>Pimpinan Lembaga Mitra / Orang Tua Murid / Pihak Terkait<br>di Tempat</p>
        <p style="text-align: justify; margin-bottom: 12px;">Dengan hormat,</p>
        <p style="text-align: justify; margin-bottom: 12px;">Sehubungan dengan pelaksanaan program peningkatan mutu pembelajaran dan pengembangan keterampilan vokasi bagi warga belajar Pusat Kegiatan Belajar Masyarakat (PKBM) Askara Tahun Ajaran 2026/2027, bersama surat ini kami bermaksud menyampaikan permohonan kemitraan dan koordinasi kegiatan.</p>
        <p style="text-align: justify; margin-bottom: 12px;">Adapun rincian kegiatan dan kebutuhan penunjang diuraikan pada tabel berikut:</p>
        <table border="1" style="width: 100%; border-collapse: collapse; margin: 14px 0; font-family: inherit; font-size: 12px;">
          <thead>
            <tr style="background-color: #f1f5f9;">
              <th style="padding: 6px 8px; border: 1px solid #475569; text-align: left;">No</th>
              <th style="padding: 6px 8px; border: 1px solid #475569; text-align: left;">Program / Uraian Kegiatan</th>
              <th style="padding: 6px 8px; border: 1px solid #475569; text-align: left;">Waktu Pelaksanaan</th>
              <th style="padding: 6px 8px; border: 1px solid #475569; text-align: left;">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 6px 8px; border: 1px solid #475569;">1</td>
              <td style="padding: 6px 8px; border: 1px solid #475569;">Pelatihan Vokasi Barista & Bisnis Kopi</td>
              <td style="padding: 6px 8px; border: 1px solid #475569;">September - Oktober 2026</td>
              <td style="padding: 6px 8px; border: 1px solid #475569;">Lab Praktik Vokasi</td>
            </tr>
            <tr>
              <td style="padding: 6px 8px; border: 1px solid #475569;">2</td>
              <td style="padding: 6px 8px; border: 1px solid #475569;">Kunjungan Industri & Magang Kerja</td>
              <td style="padding: 6px 8px; border: 1px solid #475569;">November 2026</td>
              <td style="padding: 6px 8px; border: 1px solid #475569;">Mitra Dunia Industri</td>
            </tr>
          </tbody>
        </table>
        <p style="text-align: justify; margin-bottom: 12px;">Demikian surat ini kami sampaikan. Atas perhatian, dukungan, dan kerja sama yang baik dari Bapak/Ibu, kami mengucapkan terima kasih.</p>
      `,
    },
  },
];

export default function SekretariatPage() {
  // Navigation: "STUDIO" (Split-Screen) | "DASHBOARD"
  const [viewMode, setViewMode] = useState<"DASHBOARD" | "STUDIO">("DASHBOARD");
  const [dashboardTab, setDashboardTab] = useState<"BUAT_SURAT" | "AGENDA_SURAT">("BUAT_SURAT");

  // Data States
  const [letters, setLetters] = useState<LetterItem[]>([]);
  const [students, setStudents] = useState<StudentLookupItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherLookupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategoryCode, setSelectedCategoryCode] = useState("ALL");
  const [agendaSubTab, setAgendaSubTab] = useState<"ALL" | "SURAT_KELUAR" | "SURAT_MASUK" | "SK">("ALL");

  // Modal Surat Masuk
  const [showIncomingModal, setShowIncomingModal] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [incomingForm, setIncomingForm] = useState({
    sourceNumber: "",
    sender: "",
    title: "",
    receivedDate: new Date().toISOString().slice(0, 10),
    letterDate: new Date().toISOString().slice(0, 10),
    disposition: "",
    summary: "",
    attachmentName: "",
    attachmentUrl: "",
    attachmentSize: "",
  });

  // Split-Screen Studio State
  const [activeTemplateId, setActiveTemplateId] = useState<string>("SKET_SISWA_AKTIF");
  const [currentCategoryCode, setCurrentCategoryCode] = useState<LetterCategoryCode>("SKet");
  const [letterNumberPreview, setLetterNumberPreview] = useState<string>("049/SKet/PKBM-AK/VIII/2026");
  const [letterTitle, setLetterTitle] = useState<string>("Surat Keterangan Aktif Belajar Peserta Didik");
  const [recipientName, setRecipientName] = useState<string>("Budi Santoso");
  const [recipientDetails, setRecipientDetails] = useState<string>("NISN: 0081294812 • Paket C (Setara SMA)");
  const [letterDate, setLetterDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [cityPenetapan, setCityPenetapan] = useState<string>("Bandung");
  const [signerName, setSignerName] = useState<string>("Arif Syarifudin, S.Pd");
  const [signerRole, setSignerRole] = useState<string>("Kepala PKBM Askara");
  const [signerNip, setSignerNip] = useState<string>("19750914 200003 2 001");

  // Toggles
  const [withStampAndSignature, setWithStampAndSignature] = useState<boolean>(true); // [✓] Bubuhkan TTD & Stempel Basah
  const [withLetterheadKop, setWithLetterheadKop] = useState<boolean>(true); // [✓] Kop Surat Digital

  // Dynamic Content Data for Split-Screen Studio
  const [studioContent, setStudioContent] = useState<Record<string, any>>({
    templateType: "SKET_AKTIF",
    nisn: "0081294812",
    nik: "3273101205080001",
    birthInfo: "Jakarta, 12 Mei 2008",
    packetType: "Paket C (Setara SMA)",
    parentName: "Santoso Wijaya",
    purpose: "Persyaratan Pengajuan Program Indonesia Pintar (PIP) / Beasiswa Pendidikan",
    academicYear: "2026/2027",
  });

  // Custom Word / Docs Editable Ref
  const customWordCanvasRef = useRef<HTMLDivElement>(null);

  // Search/Lookup in Form
  const [lookupQuery, setLookupQuery] = useState("");
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const lookupRef = useRef<HTMLDivElement>(null);

  // Auto-generate letter number calculation when category or date changes
  const updateAutoLetterNumber = (catCode: LetterCategoryCode, dStr: string) => {
    const dateObj = new Date(dStr);
    const months = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
    const monthRoman = months[dateObj.getMonth()] || "VIII";
    const year = dateObj.getFullYear() || 2026;
    const count = letters.filter((l) => l.categoryCode === catCode).length + 1;
    const num = `${String(count).padStart(3, "0")}/${catCode}/PKBM-AK/${monthRoman}/${year}`;
    setLetterNumberPreview(num);
  };

  // Fetch initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [resLetters, resLookup] = await Promise.all([
        fetch("/api/surat"),
        fetch("/api/surat/lookup?type=all"),
      ]);

      const dataLetters = await resLetters.json();
      if (dataLetters.success) setLetters(dataLetters.letters);

      const dataLookup = await resLookup.json();
      if (dataLookup.success) {
        setStudents(dataLookup.students || []);
        setTeachers(dataLookup.teachers || []);
      }
    } catch (e) {
      console.error("Error fetching persuratan data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Close lookup dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (lookupRef.current && !lookupRef.current.contains(event.target as Node)) {
        setIsLookupOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle File Upload for Incoming Letter
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingFile(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload?folder=surat", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setIncomingForm((prev) => ({
          ...prev,
          attachmentUrl: data.url,
          attachmentName: data.originalName || file.name,
          attachmentSize: data.fileSizeFormatted || "",
        }));
      } else {
        alert(data.error || "Gagal mengunggah berkas surat masuk");
      }
    } catch (err) {
      console.error("Upload error", err);
      alert("Terjadi kesalahan saat mengunggah berkas");
    } finally {
      setUploadingFile(false);
    }
  };

  // Select a template card from dashboard
  const handleSelectTemplateCard = (templateId: string) => {
    const tmpl = POPULAR_TEMPLATES.find((t) => t.id === templateId) || POPULAR_TEMPLATES[0];
    setActiveTemplateId(tmpl.id);
    setCurrentCategoryCode(tmpl.categoryCode);
    setLetterTitle(tmpl.title);

    // Set sample default recipient based on template target
    if (tmpl.targetType === "student" && students.length > 0) {
      const s = students[0];
      setRecipientName(s.name);
      setRecipientDetails(`NISN: ${s.nisn} • ${s.packetType}`);
      setStudioContent({
        ...tmpl.defaultData,
        nisn: s.nisn,
        nik: s.nik,
        birthInfo: s.birthInfo,
        packetType: s.packetType,
        parentName: s.parentName,
        address: s.address,
      });
    } else if (tmpl.targetType === "teacher" && teachers.length > 0) {
      const t = teachers[0];
      setRecipientName(t.name);
      setRecipientDetails(t.position);
      setStudioContent({
        ...tmpl.defaultData,
        teacherName: t.name,
        nik: t.nik,
        position: t.position,
        address: t.address,
        kesatuNama: t.name,
        kesatuJabatan: t.position,
        kesatuUnitKerja: "PKBM Askara",
      });
    } else if (tmpl.id === "SURAT_KUSTOM") {
      setRecipientName("Pimpinan Lembaga Mitra / Pihak Terkait");
      setRecipientDetails("Mitra Kerja Sama PKBM Askara");
      setStudioContent({ ...tmpl.defaultData });
    } else {
      setRecipientName(tmpl.defaultData?.recipient || "Warga Belajar / Mitra Terkait");
      setRecipientDetails(tmpl.defaultData?.recipientDetails || "PKBM Askara");
      setStudioContent({ ...tmpl.defaultData });
    }

    updateAutoLetterNumber(tmpl.categoryCode, letterDate);
    setViewMode("STUDIO");
  };

  // Rich Text Formatting Commands (Google Docs / MS Word style)
  const execFormat = (cmd: string, val: string | undefined = undefined) => {
    document.execCommand(cmd, false, val);
    if (customWordCanvasRef.current) {
      setStudioContent({
        ...studioContent,
        customHtml: customWordCanvasRef.current.innerHTML,
      });
    }
  };

  // Select student from Auto-Complete lookup
  const handleSelectStudent = (s: StudentLookupItem) => {
    setRecipientName(s.name);
    setRecipientDetails(`NISN: ${s.nisn} • ${s.packetType}`);
    setStudioContent({
      ...studioContent,
      nisn: s.nisn,
      nik: s.nik,
      birthInfo: s.birthInfo,
      packetType: s.packetType,
      parentName: s.parentName,
      address: s.address,
    });
    setLookupQuery("");
    setIsLookupOpen(false);
  };

  // Select teacher from Auto-Complete lookup
  const handleSelectTeacher = (t: TeacherLookupItem) => {
    setRecipientName(t.name);
    setRecipientDetails(t.position);
    setStudioContent({
      ...studioContent,
      teacherName: t.name,
      staffName: t.name,
      nik: t.nik,
      nipNik: t.nip || t.nik,
      position: t.position,
      address: t.address,
      kesatuNama: t.name,
      kesatuJabatan: t.position,
      kesatuUnitKerja: "PKBM Askara",
    });
    setLookupQuery("");
    setIsLookupOpen(false);
  };

  // Save / Publish letter transaction
  const handlePublishLetter = async (triggerPrint: boolean = false) => {
    try {
      setSubmitting(true);
      const isSk = currentCategoryCode === "SK" || currentCategoryCode === "SKy";
      const categoryGroup = isSk ? "SK_LEMBAGA" : "SURAT_KELUAR";

      // If custom word canvas, grab latest HTML
      let finalContent = { ...studioContent };
      if (activeTemplateId === "SURAT_KUSTOM" && customWordCanvasRef.current) {
        finalContent.customHtml = customWordCanvasRef.current.innerHTML;
      }

      const res = await fetch("/api/surat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryCode: currentCategoryCode,
          category: categoryGroup,
          title: letterTitle,
          recipient: recipientName,
          recipientDetails: recipientDetails,
          date: letterDate,
          contentData: {
            ...finalContent,
            ditetapkanDi: cityPenetapan,
            withStampAndSignature,
            withLetterheadKop,
          },
          signerName,
          signerRole,
          signerNip,
        }),
      });

      const data = await res.json();
      if (data.success) {
        fetchData();
        if (triggerPrint) {
          setTimeout(() => {
            window.print();
          }, 300);
        } else {
          alert(`Surat "${letterTitle}" berhasil diterbitkan dan masuk ke Buku Agenda!`);
        }
      } else {
        alert(data.error || "Gagal menerbitkan surat");
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan sistem saat menerbitkan surat");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Save Incoming Letter
  const handleCreateIncoming = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch("/api/surat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryCode: "SB",
          category: "SURAT_MASUK",
          title: incomingForm.title,
          sourceNumber: incomingForm.sourceNumber,
          sender: incomingForm.sender,
          recipient: "Kepala PKBM Askara",
          date: incomingForm.letterDate,
          receivedDate: incomingForm.receivedDate,
          disposition: incomingForm.disposition,
          attachmentUrl: incomingForm.attachmentUrl || undefined,
          contentData: {
            templateType: "SURAT_MASUK",
            summary: incomingForm.summary,
            attachmentName: incomingForm.attachmentName,
            attachmentUrl: incomingForm.attachmentUrl,
            attachmentSize: incomingForm.attachmentSize,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowIncomingModal(false);
        setIncomingForm({
          sourceNumber: "",
          sender: "",
          title: "",
          receivedDate: new Date().toISOString().slice(0, 10),
          letterDate: new Date().toISOString().slice(0, 10),
          disposition: "",
          summary: "",
          attachmentName: "",
          attachmentUrl: "",
          attachmentSize: "",
        });
        fetchData();
        setDashboardTab("AGENDA_SURAT");
        setAgendaSubTab("SURAT_MASUK");
        alert("Surat masuk dan dokumen lampiran berhasil dicatat ke Buku Agenda!");
      } else {
        alert(data.error || "Gagal menyimpan surat masuk");
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan sistem");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLetter = async (id: string) => {
    if (!confirm("Hapus arsip surat ini dari Buku Agenda?")) return;
    try {
      const res = await fetch(`/api/surat?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  // Open existing letter from agenda in studio
  const handleOpenExistingLetterInStudio = (letter: LetterItem) => {
    setCurrentCategoryCode(letter.categoryCode);
    setLetterNumberPreview(letter.letterNumber);
    setLetterTitle(letter.title);
    setRecipientName(letter.recipient);
    setRecipientDetails(letter.recipientDetails || "");
    setLetterDate(letter.date);
    setCityPenetapan(letter.contentData?.ditetapkanDi || "Bandung");
    setSignerName(letter.signerName || "Arif Syarifudin, S.Pd");
    setSignerRole(letter.signerRole || "Kepala PKBM Askara");
    setSignerNip(letter.signerNip || "19750914 200003 2 001");
    setStudioContent(letter.contentData || {});
    setWithStampAndSignature(letter.contentData?.withStampAndSignature !== false);
    setWithLetterheadKop(letter.contentData?.withLetterheadKop !== false);
    setViewMode("STUDIO");
  };

  // Filter agenda letters
  const filteredAgendaLetters = letters.filter((l) => {
    let matchSubTab = true;
    if (agendaSubTab === "SURAT_KELUAR") matchSubTab = l.category === "SURAT_KELUAR";
    else if (agendaSubTab === "SURAT_MASUK") matchSubTab = l.category === "SURAT_MASUK";
    else if (agendaSubTab === "SK") matchSubTab = l.category === "SK_LEMBAGA";

    const matchCategory = selectedCategoryCode === "ALL" || l.categoryCode === selectedCategoryCode;
    const matchSearch =
      !search ||
      l.letterNumber.toLowerCase().includes(search.toLowerCase()) ||
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.recipient.toLowerCase().includes(search.toLowerCase()) ||
      (l.sender && l.sender.toLowerCase().includes(search.toLowerCase()));

    return matchSubTab && matchCategory && matchSearch;
  });

  const currentTemplate = POPULAR_TEMPLATES.find((t) => t.id === activeTemplateId) || POPULAR_TEMPLATES[0];

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* MODE 1: DASHBOARD UTAMA (Card Selector & Buku Agenda)                     */}
      {/* ========================================================================= */}
      {viewMode === "DASHBOARD" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-soft relative overflow-hidden">
            <div className="relative z-10 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-3 py-1 bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                  Kesekretariatan & Persuratan Digital • 3 Klik Selesai
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[11px] font-bold">
                  ⚡ Auto-Complete Database & Live A4 Preview
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Pusat Penerbitan Surat & Agenda Dinas Resmi
              </h1>
              <p className="mt-2 text-slate-300 text-xs sm:text-sm leading-relaxed">
                Pilih template surat yang sering digunakan di bawah untuk langsung membuka <strong>Studio Split-Screen</strong> (Form Cerdas di kiri dan Live Preview Dokumen A4 di kanan).
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 relative z-10">
              <button
                onClick={() => setDashboardTab("BUAT_SURAT")}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2 ${
                  dashboardTab === "BUAT_SURAT"
                    ? "bg-amber-500 text-slate-950 font-black shadow-md"
                    : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                }`}
              >
                <FilePlus className="w-4 h-4" />
                <span>Buat Surat Baru</span>
              </button>
              <button
                onClick={() => setDashboardTab("AGENDA_SURAT")}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2 ${
                  dashboardTab === "AGENDA_SURAT"
                    ? "bg-amber-500 text-slate-950 font-black shadow-md"
                    : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Buku Agenda Surat ({letters.length})</span>
              </button>
              <button
                onClick={() => setShowIncomingModal(true)}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2 ml-auto"
              >
                <Inbox className="w-4 h-4" />
                <span>Catat Surat Masuk & Upload Dokumen</span>
              </button>
            </div>
          </div>

          {/* TAB 1: GRID KARTU TEMPLATE POPULER (3-Klik Selesai) */}
          {dashboardTab === "BUAT_SURAT" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Pilih Jenis Surat Yang Ingin Dibuat:</span>
                  </h2>
                  <p className="text-xs text-slate-500">Klik salah satu template untuk masuk ke formulir pintar dengan data otomatis</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {POPULAR_TEMPLATES.map((tmpl) => {
                  const IconComp = tmpl.icon;
                  return (
                    <div
                      key={tmpl.id}
                      onClick={() => handleSelectTemplateCard(tmpl.id)}
                      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-indigo-500 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className={`w-10 h-10 rounded-xl ${tmpl.iconBg} flex items-center justify-center shadow-xs group-hover:scale-105 transition`}>
                            <IconComp className="w-5 h-5" />
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${tmpl.badgeColor}`}>
                            {tmpl.badge}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-mono font-bold rounded text-[10px]">
                              Kode: {tmpl.categoryCode}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition leading-snug">
                            {tmpl.title}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {tmpl.desc}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-700 group-hover:text-indigo-900">
                        <span>Buka Studio Surat</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: TABEL LOG RIWAYAT BUKU AGENDA SURAT */}
          {dashboardTab === "AGENDA_SURAT" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                {/* Sub-Filter Tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
                  <button
                    onClick={() => setAgendaSubTab("ALL")}
                    className={`px-3 py-1.5 rounded-lg transition ${agendaSubTab === "ALL" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    Semua ({letters.length})
                  </button>
                  <button
                    onClick={() => setAgendaSubTab("SURAT_KELUAR")}
                    className={`px-3 py-1.5 rounded-lg transition ${agendaSubTab === "SURAT_KELUAR" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    Surat Keluar ({letters.filter((l) => l.category === "SURAT_KELUAR").length})
                  </button>
                  <button
                    onClick={() => setAgendaSubTab("SURAT_MASUK")}
                    className={`px-3 py-1.5 rounded-lg transition ${agendaSubTab === "SURAT_MASUK" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    Surat Masuk ({letters.filter((l) => l.category === "SURAT_MASUK").length})
                  </button>
                  <button
                    onClick={() => setAgendaSubTab("SK")}
                    className={`px-3 py-1.5 rounded-lg transition ${agendaSubTab === "SK" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    SK Lembaga ({letters.filter((l) => l.category === "SK_LEMBAGA").length})
                  </button>
                </div>

                {/* Search & Category Filter */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari nomor, perihal, nama..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white transition w-48 sm:w-60"
                    />
                  </div>

                  <select
                    value={selectedCategoryCode}
                    onChange={(e) => setSelectedCategoryCode(e.target.value)}
                    className="border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold bg-slate-50 focus:bg-white transition"
                  >
                    <option value="ALL">Semua Kategori</option>
                    {LETTER_CATEGORIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        [{c.code}] {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-500 font-bold border-b border-slate-200 pb-2">
                      <th className="pb-3 font-semibold">No. Dokumen Agenda</th>
                      <th className="pb-3 font-semibold">Kategori & Perihal</th>
                      <th className="pb-3 font-semibold">Penerima / Pengirim</th>
                      <th className="pb-3 font-semibold">Tgl Terbit / Masuk</th>
                      <th className="pb-3 font-semibold text-center">Status / Disposisi</th>
                      <th className="pb-3 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAgendaLetters.map((l) => {
                      const attachUrl = l.attachmentUrl || l.contentData?.attachmentUrl;
                      const attachName = l.contentData?.attachmentName || (attachUrl ? "Dokumen_Lampiran.pdf" : null);

                      return (
                        <tr key={l.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3.5 font-mono font-bold text-indigo-950">
                            <span className="block">{l.letterNumber}</span>
                            {l.sourceNumber && l.category === "SURAT_MASUK" && (
                              <span className="text-[10px] text-slate-400 font-sans block">Asal: {l.sourceNumber}</span>
                            )}
                          </td>
                          <td className="py-3.5 max-w-xs">
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded text-[10px] inline-block mb-1 font-mono">
                              {l.categoryCode}
                            </span>
                            <span className="font-bold text-slate-900 block leading-tight">{l.title}</span>

                            {/* Dokumen Lampiran Uploaded Badge */}
                            {attachUrl && (
                              <div className="mt-1.5">
                                <a
                                  href={attachUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-[10px] font-bold transition shadow-2xs"
                                >
                                  <Paperclip className="w-3 h-3 text-indigo-600" />
                                  <span className="truncate max-w-[180px]">{attachName || "Lihat File Lampiran"}</span>
                                </a>
                              </div>
                            )}
                          </td>
                          <td className="py-3.5">
                            <span className="font-semibold text-slate-800 block">
                              {l.category === "SURAT_MASUK" ? (l.sender || l.recipient) : l.recipient}
                            </span>
                            <span className="text-[11px] text-slate-500">{l.recipientDetails || "-"}</span>
                          </td>
                          <td className="py-3.5 text-slate-600 whitespace-nowrap">
                            {l.category === "SURAT_MASUK" ? (l.receivedDate || l.date) : l.date}
                          </td>
                          <td className="py-3.5 text-center max-w-xs">
                            {l.category === "SURAT_MASUK" ? (
                              <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-semibold block text-left truncate">
                                {l.disposition || "Belum ada disposisi"}
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Terbit Resmi</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => handleOpenExistingLetterInStudio(l)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-2xs"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Buka / Cetak PDF</span>
                            </button>
                            <button
                              onClick={() => handleDeleteLetter(l.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Hapus Arsip"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredAgendaLetters.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          Belum ada arsip surat pada filter ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: SPLIT-SCREEN STUDIO (Kiri Form Pintar, Kanan Live Preview A4)     */}
      {/* ========================================================================= */}
      {viewMode === "STUDIO" && (
        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
          {/* Top Bar Header Studio */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode("DASHBOARD")}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Ganti Template</span>
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-mono font-bold text-xs">
                    {currentCategoryCode}
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    Studio Pembuatan {letterTitle}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-slate-500">
                  Nomor Auto: <strong>{letterNumberPreview}</strong>
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePublishLetter(false)}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition shadow-2xs"
              >
                <Save className="w-4 h-4 text-slate-500" />
                <span>Simpan ke Agenda Saja</span>
              </button>
              <button
                type="button"
                onClick={() => handlePublishLetter(true)}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>{submitting ? "Memproses..." : "Terbitkan & Cetak / Download PDF"}</span>
              </button>
            </div>
          </div>

          {/* MAIN SPLIT-SCREEN CONTAINER */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* ========================================================================= */}
            {/* SISI KIRI: SMART FORM INPUT & KONTROL DOKUMEN (Width: 5/12 atau 42%)       */}
            {/* ========================================================================= */}
            <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5 print:hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <PenTool className="w-4 h-4 text-indigo-600" />
                  <span>
                    {activeTemplateId === "SURAT_KUSTOM" ? "Pengaturan Dokumen Kustom" : "Formulir Pintar (Smart Form)"}
                  </span>
                </h3>
                <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Live Sync
                </span>
              </div>

              {/* 1. KHUSUS SURAT KUSTOM: PILIHAN 16 KODE KATEGORI DENGAN PENOMORAN OTOMATIS */}
              {activeTemplateId === "SURAT_KUSTOM" && (
                <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-2">
                  <label className="block text-xs font-bold text-indigo-950">
                    📂 Pilih Kategori Surat (Penomoran Otomatis):
                  </label>
                  <select
                    value={currentCategoryCode}
                    onChange={(e) => {
                      const code = e.target.value as LetterCategoryCode;
                      setCurrentCategoryCode(code);
                      updateAutoLetterNumber(code, letterDate);
                    }}
                    className="w-full border border-indigo-200 rounded-xl px-3 py-2 text-xs font-bold bg-white text-indigo-950 focus:ring-2 focus:ring-indigo-600"
                  >
                    {LETTER_CATEGORIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        [{c.code}] {c.name} — {c.description.slice(0, 38)}...
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] font-mono text-indigo-700 font-bold">
                    Nomor Terbit Otomatis: {letterNumberPreview}
                  </p>
                </div>
              )}

              {/* 2. SMART AUTO-COMPLETE / LOOKUP DARI DATABASE UNTUK PRESET */}
              {(currentTemplate.targetType === "student" || currentTemplate.targetType === "teacher") && (
                <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-2 relative" ref={lookupRef}>
                  <label className="block text-xs font-bold text-indigo-950 flex items-center justify-between">
                    <span>⚡ Tarik Data {currentTemplate.targetType === "student" ? "Siswa" : "Tutor / Pendidik"} dari Database:</span>
                    <span className="text-[10px] text-indigo-600 font-normal">Auto-Fill 1-Klik</span>
                  </label>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder={currentTemplate.targetType === "student" ? "Cari nama siswa / NISN..." : "Cari nama guru / NIK..."}
                      value={lookupQuery}
                      onFocus={() => setIsLookupOpen(true)}
                      onChange={(e) => {
                        setLookupQuery(e.target.value);
                        setIsLookupOpen(true);
                      }}
                      className="w-full pl-8 pr-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-600 transition"
                    />
                  </div>

                  {/* Dropdown Suggestions */}
                  {isLookupOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-56 overflow-y-auto divide-y divide-slate-100">
                      {currentTemplate.targetType === "student" &&
                        students
                          .filter((s) => !lookupQuery || s.name.toLowerCase().includes(lookupQuery.toLowerCase()) || s.nisn.includes(lookupQuery))
                          .map((s) => (
                            <div
                              key={s.id}
                              onClick={() => handleSelectStudent(s)}
                              className="p-2.5 hover:bg-indigo-50/80 cursor-pointer transition flex items-center justify-between"
                            >
                              <div>
                                <span className="font-bold text-slate-900 text-xs block">{s.name}</span>
                                <span className="text-[10px] text-slate-500 font-mono">NISN: {s.nisn} • {s.packetType}</span>
                              </div>
                              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded">
                                Pilih
                              </span>
                            </div>
                          ))}

                      {currentTemplate.targetType === "teacher" &&
                        teachers
                          .filter((t) => !lookupQuery || t.name.toLowerCase().includes(lookupQuery.toLowerCase()))
                          .map((t) => (
                            <div
                              key={t.id}
                              onClick={() => handleSelectTeacher(t)}
                              className="p-2.5 hover:bg-indigo-50/80 cursor-pointer transition flex items-center justify-between"
                            >
                              <div>
                                <span className="font-bold text-slate-900 text-xs block">{t.name}</span>
                                <span className="text-[10px] text-slate-500">{t.position}</span>
                              </div>
                              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded">
                                Pilih
                              </span>
                            </div>
                          ))}
                    </div>
                  )}
                </div>
              )}

              {/* 3. FIELD INPUT HEADER & METADATA */}
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Perihal / Judul Surat</label>
                  <input
                    type="text"
                    value={letterTitle}
                    onChange={(e) => setLetterTitle(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white transition"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Penerima / Nama Yang Dituju</label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Keterangan / Jabatan</label>
                    <input
                      type="text"
                      value={recipientDetails}
                      onChange={(e) => setRecipientDetails(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tanggal Surat</label>
                    <input
                      type="date"
                      value={letterDate}
                      onChange={(e) => {
                        setLetterDate(e.target.value);
                        updateAutoLetterNumber(currentCategoryCode, e.target.value);
                      }}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kota Penetapan</label>
                    <input
                      type="text"
                      value={cityPenetapan}
                      onChange={(e) => setCityPenetapan(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                    />
                  </div>
                </div>

                {/* Preset-specific Form Details for non-custom templates */}
                {activeTemplateId === "SKET_SISWA_AKTIF" && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Keperluan Penerbitan Surat</label>
                      <input
                        type="text"
                        value={studioContent.purpose || ""}
                        onChange={(e) => setStudioContent({ ...studioContent, purpose: e.target.value })}
                        placeholder="Contoh: Persyaratan Pengajuan Program Beasiswa Indonesia Pintar (PIP)"
                        className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Jenjang Paket</label>
                        <input
                          type="text"
                          value={studioContent.packetType || "Paket C (Setara SMA)"}
                          onChange={(e) => setStudioContent({ ...studioContent, packetType: e.target.value })}
                          className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Tahun Ajaran</label>
                        <input
                          type="text"
                          value={studioContent.academicYear || "2026/2027"}
                          onChange={(e) => setStudioContent({ ...studioContent, academicYear: e.target.value })}
                          className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTemplateId === "SKET_PENGALAMAN_KERJA" && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Tgl Mulai Bekerja</label>
                        <input
                          type="text"
                          value={studioContent.periodStart || "01 Juli 2021"}
                          onChange={(e) => setStudioContent({ ...studioContent, periodStart: e.target.value })}
                          className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Tgl Akhir Bekerja</label>
                        <input
                          type="text"
                          value={studioContent.periodEnd || "30 Juni 2026"}
                          onChange={(e) => setStudioContent({ ...studioContent, periodEnd: e.target.value })}
                          className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Catatan Kinerja & Rekomendasi</label>
                      <textarea
                        rows={2}
                        value={studioContent.recommendation || ""}
                        onChange={(e) => setStudioContent({ ...studioContent, recommendation: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs resize-none"
                      />
                    </div>
                  </div>
                )}

                {activeTemplateId === "ST_TUGAS_DINAS" && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama Tugas / Acara</label>
                      <input
                        type="text"
                        value={studioContent.assignment || ""}
                        onChange={(e) => setStudioContent({ ...studioContent, assignment: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Lokasi & Durasi Waktu</label>
                      <input
                        type="text"
                        value={studioContent.location || ""}
                        onChange={(e) => setStudioContent({ ...studioContent, location: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
                      />
                    </div>
                  </div>
                )}

                {activeTemplateId === "SK_PENUNJUKAN" && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Tentang SK</label>
                      <input
                        type="text"
                        value={studioContent.tentang || ""}
                        onChange={(e) => setStudioContent({ ...studioContent, tentang: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Masa Berlaku (Diktum Kedua)</label>
                      <input
                        type="text"
                        value={studioContent.keduaPeriode || ""}
                        onChange={(e) => setStudioContent({ ...studioContent, keduaPeriode: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Uraian Tugas (Diktum Ketiga)</label>
                      <textarea
                        rows={2}
                        value={studioContent.ketigaTugas || ""}
                        onChange={(e) => setStudioContent({ ...studioContent, ketigaTugas: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 4. TOGGLE CENTANG TTD, STEMPEL & KOP SURAT */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/50 cursor-pointer hover:bg-indigo-50 transition">
                  <input
                    type="checkbox"
                    checked={withStampAndSignature}
                    onChange={(e) => setWithStampAndSignature(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <div className="flex-1 text-xs">
                    <span className="font-bold text-indigo-950 block">✓ Bubuhkan TTD & Stempel Basah Resmi</span>
                    <span className="text-[10px] text-slate-500">Menyisipkan stempel biru PKBM Askara dan tanda tangan asli Kepala Sekolah</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition">
                  <input
                    type="checkbox"
                    checked={withLetterheadKop}
                    onChange={(e) => setWithLetterheadKop(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <div className="flex-1 text-xs">
                    <span className="font-bold text-slate-800 block">Tampilkan Kop Surat Digital</span>
                    <span className="text-[10px] text-slate-500">Hilangkan centang jika ingin mencetak di atas kertas kop fisik sekolah</span>
                  </div>
                </label>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* SISI KANAN: LIVE PREVIEW DOKUMEN A4 & WORD CANVAS (Width: 7/12 atau 58%) */}
            {/* ========================================================================= */}
            <div className="lg:col-span-7 bg-slate-200/80 p-4 sm:p-6 rounded-2xl border border-slate-300 shadow-inner flex flex-col items-center sticky top-4 print:p-0 print:m-0 print:border-none print:shadow-none print:bg-white">
              
              {/* GOOGLE DOCS / WORD FORMATTING TOOLBAR (Khusus Surat Kustom) */}
              {activeTemplateId === "SURAT_KUSTOM" && (
                <div className="w-full max-w-[720px] mb-3 bg-white p-2 rounded-xl border border-slate-300 shadow-xs flex flex-wrap items-center gap-1 text-slate-700 print:hidden z-10">
                  <div className="flex items-center gap-0.5 border-r border-slate-200 pr-1.5 mr-1">
                    <button
                      type="button"
                      onClick={() => execFormat("bold")}
                      className="p-1.5 hover:bg-slate-100 rounded-lg transition"
                      title="Tebal (Bold Ctrl+B)"
                    >
                      <Bold className="w-3.5 h-3.5 font-bold" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execFormat("italic")}
                      className="p-1.5 hover:bg-slate-100 rounded-lg transition"
                      title="Miring (Italic Ctrl+I)"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execFormat("underline")}
                      className="p-1.5 hover:bg-slate-100 rounded-lg transition"
                      title="Garis Bawah (Underline Ctrl+U)"
                    >
                      <Underline className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execFormat("strikeThrough")}
                      className="p-1.5 hover:bg-slate-100 rounded-lg transition"
                      title="Coretan (Strikethrough)"
                    >
                      <Strikethrough className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-0.5 border-r border-slate-200 pr-1.5 mr-1">
                    <button
                      type="button"
                      onClick={() => execFormat("justifyLeft")}
                      className="p-1.5 hover:bg-slate-100 rounded-lg transition"
                      title="Rata Kiri"
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execFormat("justifyCenter")}
                      className="p-1.5 hover:bg-slate-100 rounded-lg transition"
                      title="Rata Tengah"
                    >
                      <AlignCenter className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execFormat("justifyRight")}
                      className="p-1.5 hover:bg-slate-100 rounded-lg transition"
                      title="Rata Kanan"
                    >
                      <AlignRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execFormat("justifyFull")}
                      className="p-1.5 hover:bg-slate-100 rounded-lg transition"
                      title="Rata Kiri Kanan (Justify)"
                    >
                      <AlignJustify className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-0.5 border-r border-slate-200 pr-1.5 mr-1">
                    <button
                      type="button"
                      onClick={() => execFormat("insertOrderedList")}
                      className="p-1.5 hover:bg-slate-100 rounded-lg transition"
                      title="Daftar Angka (1, 2, 3)"
                    >
                      <ListOrdered className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execFormat("insertUnorderedList")}
                      className="p-1.5 hover:bg-slate-100 rounded-lg transition"
                      title="Daftar Titik (Bullet List)"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        execFormat(
                          "insertHTML",
                          '<table border="1" style="width:100%; border-collapse:collapse; margin:12px 0; font-size:12px;"><thead><tr style="background:#f1f5f9;"><th style="padding:6px; border:1px solid #475569;">No</th><th style="padding:6px; border:1px solid #475569;">Program / Agenda</th><th style="padding:6px; border:1px solid #475569;">Keterangan</th></tr></thead><tbody><tr><td style="padding:6px; border:1px solid #475569;">1</td><td style="padding:6px; border:1px solid #475569;">...</td><td style="padding:6px; border:1px solid #475569;">...</td></tr></tbody></table>'
                        )
                      }
                      className="p-1.5 hover:bg-slate-100 rounded-lg transition text-indigo-700 font-bold flex items-center gap-1 text-[11px]"
                      title="Sisipkan Tabel"
                    >
                      <Table className="w-3.5 h-3.5" />
                      <span>+ Tabel</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-0.5 ml-auto">
                    <button
                      type="button"
                      onClick={() => execFormat("removeFormat")}
                      className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-400 hover:text-slate-700"
                      title="Hapus Format (Clear Formatting)"
                    >
                      <Eraser className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Kertas Dokumen Formal A4 */}
              <div className="printable-document w-full max-w-[720px] bg-white p-8 sm:p-12 shadow-2xl rounded-xl border border-slate-300 text-slate-950 font-serif text-xs sm:text-[13px] leading-relaxed min-h-[900px] flex flex-col justify-between print:shadow-none print:border-none print:p-0 print:min-h-0 print:rounded-none">
                
                <div>
                  {/* Official Letterhead Kop */}
                  {withLetterheadKop && (
                    <div className="border-b-[3px] border-slate-950 pb-3 mb-6 relative">
                      <div className="flex items-center justify-center gap-4">
                        <img
                          src="/logo.png"
                          alt="Logo PKBM Askara"
                          className="h-20 w-auto object-contain shrink-0"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                        <div className="text-center font-serif">
                          <h3 className="text-xs sm:text-sm tracking-wider uppercase font-sans font-medium text-slate-800">
                            PUSAT KEGIATAN BELAJAR MASYARAKAT
                          </h3>
                          <h1 className="text-lg sm:text-xl font-black tracking-tight uppercase font-sans text-slate-950 mt-0.5">
                            PKBM ASKARA
                          </h1>
                          <p className="text-[11px] font-sans text-slate-700 mt-1 leading-tight">
                            NPSN: P9998766, Jl. Adiflora Raya No. 08 RT. 02/08 Kelurahan Rancabolang
                          </p>
                          <p className="text-[10px] font-sans text-slate-600 leading-tight">
                            Kecamatan Gedebage Kota Bandung - Jawa Barat. Telp. (022) 875 18584 / 085156560630, Email: pkbm.askara@gmail.com
                          </p>
                        </div>
                      </div>
                      <div className="border-b border-slate-950 mt-1" />
                    </div>
                  )}

                  {/* 1. DOCUMENT VIEW: SURAT FULL KUSTOM / GOOGLE DOCS CANVAS */}
                  {activeTemplateId === "SURAT_KUSTOM" ? (
                    <div className="space-y-4">
                      <div className="text-center mb-6">
                        <h2 className="text-base font-bold underline uppercase tracking-wide font-sans">
                          {letterTitle}
                        </h2>
                        <p className="text-xs font-sans font-bold text-slate-700 mt-1">
                          Nomor: {letterNumberPreview}
                        </p>
                      </div>

                      {/* Canvas HTML 100% Manual Editable like Word/Google Docs */}
                      <div
                        ref={customWordCanvasRef}
                        contentEditable={true}
                        suppressContentEditableWarning={true}
                        onBlur={(e) => {
                          setStudioContent({
                            ...studioContent,
                            customHtml: e.currentTarget.innerHTML,
                          });
                        }}
                        dangerouslySetInnerHTML={{
                          __html:
                            studioContent.customHtml ||
                            POPULAR_TEMPLATES.find((t) => t.id === "SURAT_KUSTOM")?.defaultData?.customHtml ||
                            "<p>Ketik naskah surat Anda di sini...</p>",
                        }}
                        className="outline-none focus:ring-1 focus:ring-indigo-400 p-2 rounded min-h-[350px] leading-relaxed cursor-text"
                        style={{ minHeight: "350px" }}
                      />
                    </div>
                  ) : activeTemplateId === "SKET_SISWA_AKTIF" ? (
                    /* 2. DOCUMENT VIEW: SURAT KETERANGAN SISWA AKTIF */
                    <div className="space-y-4 text-justify">
                      <div className="text-center mb-6">
                        <h2 className="text-base font-bold underline uppercase tracking-wide font-sans">
                          SURAT KETERANGAN AKTIF BELAJAR
                        </h2>
                        <p className="text-xs font-sans font-bold text-slate-700 mt-1">
                          Nomor: {letterNumberPreview}
                        </p>
                      </div>

                      <p>
                        Yang bertanda tangan di bawah ini Kepala Pusat Kegiatan Belajar Masyarakat (PKBM) Askara menerangkan bahwa:
                      </p>

                      <div className="pl-6 space-y-1 font-sans text-xs">
                        <div className="grid grid-cols-4">
                          <span className="font-semibold text-slate-600">Nama Siswa</span>
                          <span className="col-span-3 font-bold">: {recipientName}</span>
                        </div>
                        <div className="grid grid-cols-4">
                          <span className="font-semibold text-slate-600">NISN / Identitas</span>
                          <span className="col-span-3 font-bold">: {studioContent.nisn || "0081294812"}</span>
                        </div>
                        <div className="grid grid-cols-4">
                          <span className="font-semibold text-slate-600">Tempat, Tgl Lahir</span>
                          <span className="col-span-3">: {studioContent.birthInfo || "Jakarta, 12 Mei 2008"}</span>
                        </div>
                        <div className="grid grid-cols-4">
                          <span className="font-semibold text-slate-600">Nama Orang Tua</span>
                          <span className="col-span-3">: {studioContent.parentName || "Santoso Wijaya"}</span>
                        </div>
                        <div className="grid grid-cols-4">
                          <span className="font-semibold text-slate-600">Jenjang / Program</span>
                          <span className="col-span-3 font-semibold">: {studioContent.packetType || "Paket C (Setara SMA)"}</span>
                        </div>
                        <div className="grid grid-cols-4">
                          <span className="font-semibold text-slate-600">Tahun Ajaran</span>
                          <span className="col-span-3">: {studioContent.academicYear || "2026/2027"}</span>
                        </div>
                      </div>

                      <p>
                        Adalah benar peserta didik yang tercatat <strong>AKTIF</strong> mengikuti proses pembelajaran Pendidikan Kesetaraan pada PKBM Askara pada Tahun Ajaran {studioContent.academicYear || "2026/2027"}.
                      </p>

                      <p>
                        Surat keterangan ini diterbitkan dengan sebenarnya untuk dipergunakan sebagai: <em>{studioContent.purpose || "Persyaratan Pengajuan Program Beasiswa Indonesia Pintar (PIP)"}</em>.
                      </p>
                    </div>
                  ) : activeTemplateId === "SKET_PENGALAMAN_KERJA" ? (
                    /* 3. DOCUMENT VIEW: SURAT KETERANGAN PENGALAMAN KERJA TUTOR */
                    <div className="space-y-4 text-justify">
                      <div className="text-center mb-6">
                        <h2 className="text-base font-bold underline uppercase tracking-wide font-sans">
                          SURAT KETERANGAN PENGALAMAN KERJA
                        </h2>
                        <p className="text-xs font-sans font-bold text-slate-700 mt-1">
                          Nomor: {letterNumberPreview}
                        </p>
                      </div>

                      <p>
                        Yang bertanda tangan di bawah ini Kepala Pusat Kegiatan Belajar Masyarakat (PKBM) Askara menerangkan bahwa:
                      </p>

                      <div className="pl-6 space-y-1 font-sans text-xs">
                        <div className="grid grid-cols-4">
                          <span className="font-semibold text-slate-600">Nama Lengkap</span>
                          <span className="col-span-3 font-bold">: {recipientName}</span>
                        </div>
                        <div className="grid grid-cols-4">
                          <span className="font-semibold text-slate-600">NIK / Identitas</span>
                          <span className="col-span-3 font-mono">: {studioContent.nik || "3273105508890003"}</span>
                        </div>
                        <div className="grid grid-cols-4">
                          <span className="font-semibold text-slate-600">Jabatan / Penugasan</span>
                          <span className="col-span-3 font-bold">: {recipientDetails}</span>
                        </div>
                        <div className="grid grid-cols-4">
                          <span className="font-semibold text-slate-600">Alamat</span>
                          <span className="col-span-3">: {studioContent.address || "Bandung, Jawa Barat"}</span>
                        </div>
                      </div>

                      <p>
                        Adalah benar yang bersangkutan telah bekerja sebagai <strong>Tutor / Tenaga Pendidik</strong> pada Pusat Kegiatan Belajar Masyarakat (PKBM) Askara terhitung sejak tanggal <strong>{studioContent.periodStart || "01 Juli 2021"}</strong> sampai dengan <strong>{studioContent.periodEnd || "30 Juni 2026"}</strong>.
                      </p>

                      <p>
                        {studioContent.recommendation || "Selama bekerja pada PKBM Askara, yang bersangkutan telah menunjukkan dedikasi, loyalitas, dan integritas yang sangat baik serta tidak pernah melakukan pelanggaran disiplin kerja."}
                      </p>

                      <p>
                        Demikian Surat Keterangan Pengalaman Kerja ini dibuat dengan sebenarnya agar dapat dipergunakan sebagaimana mestinya.
                      </p>
                    </div>
                  ) : activeTemplateId === "ST_TUGAS_DINAS" ? (
                    /* 4. DOCUMENT VIEW: SURAT TUGAS DINAS */
                    <div className="space-y-4 text-justify">
                      <div className="text-center mb-6">
                        <h2 className="text-base font-bold underline uppercase tracking-wide font-sans">
                          SURAT TUGAS
                        </h2>
                        <p className="text-xs font-sans font-bold text-slate-700 mt-1">
                          Nomor: {letterNumberPreview}
                        </p>
                      </div>

                      <p>
                        Kepala Pusat Kegiatan Belajar Masyarakat (PKBM) Askara memberikan tugas kepada:
                      </p>

                      <div className="pl-6 space-y-1 font-sans text-xs">
                        <div className="grid grid-cols-4">
                          <span className="font-semibold text-slate-600">Nama Lengkap</span>
                          <span className="col-span-3 font-bold">: {recipientName}</span>
                        </div>
                        <div className="grid grid-cols-4">
                          <span className="font-semibold text-slate-600">Jabatan</span>
                          <span className="col-span-3 font-semibold">: {recipientDetails}</span>
                        </div>
                        <div className="grid grid-cols-4">
                          <span className="font-semibold text-slate-600">Unit Kerja</span>
                          <span className="col-span-3">: PKBM Askara Kota Bandung</span>
                        </div>
                      </div>

                      <p>
                        Untuk melaksanakan tugas: <strong>{studioContent.assignment || "Mengikuti Bimbingan Teknis Implementasi Kurikulum Merdeka"}</strong> yang berlokasi di <em>{studioContent.location || "Balai Penjaminan Mutu Pendidikan (BPMP) Jawa Barat"}</em> pada tanggal {studioContent.duration || "25 s.d. 27 Agustus 2026"}.
                      </p>

                      <p>
                        Demikian surat tugas ini dibuat untuk dilaksanakan dengan sebaik-baiknya dan penuh rasa tanggung jawab.
                      </p>
                    </div>
                  ) : activeTemplateId === "SK_PENUNJUKAN" ? (
                    /* 5. DOCUMENT VIEW: SURAT KEPUTUSAN (SK) */
                    <div className="space-y-4 text-justify">
                      <div className="text-center space-y-0.5 mb-5 font-sans">
                        <h2 className="text-sm sm:text-base font-bold uppercase tracking-wide">
                          SURAT KEPUTUSAN
                        </h2>
                        <h3 className="text-sm sm:text-base font-bold uppercase tracking-wide">
                          KEPALA PKBM ASKARA
                        </h3>
                        <p className="text-xs font-semibold text-slate-800">
                          Nomor: {letterNumberPreview}
                        </p>
                        <p className="text-xs font-bold uppercase tracking-widest pt-1">
                          TENTANG
                        </p>
                        <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-slate-950">
                          {studioContent.tentang || letterTitle}
                        </h4>
                        <p className="text-xs font-bold uppercase tracking-wide">
                          {studioContent.tahunAjaran || "TAHUN AJARAN 2026/2027"}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="font-bold">Menimbang :</p>
                        <ol className="list-none space-y-1 pl-6 text-xs">
                          {(studioContent.menimbang || [
                            "bahwa dalam rangka menunjang kelancaran pengelolaan administrasi di PKBM Askara, dipandang perlu menunjuk seorang personil;",
                            "bahwa untuk kepentingan tersebut dipandang perlu menetapkan Surat Keputusan Kepala PKBM Askara.",
                          ]).map((item: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="font-semibold">{String.fromCharCode(97 + idx)}.</span>
                              <span className="flex-1">{item}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      <div className="text-center font-bold font-sans pt-1">
                        <p>MEMUTUSKAN :</p>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <p className="font-bold">Menetapkan :</p>
                        <div className="flex items-start gap-2">
                          <span className="font-bold min-w-16 shrink-0">KESATU</span>
                          <div className="flex-1 space-y-0.5">
                            <span>: Menunjuk saudara/i tersebut di bawah ini:</span>
                            <div className="pl-4 space-y-0.5 mt-0.5 font-sans">
                              <div className="grid grid-cols-4">
                                <span className="font-semibold">Nama</span>
                                <span className="col-span-3 font-bold">: {recipientName}</span>
                              </div>
                              <div className="grid grid-cols-4">
                                <span className="font-semibold">Jabatan</span>
                                <span className="col-span-3">: {recipientDetails}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-2 pt-0.5">
                          <span className="font-bold min-w-16 shrink-0">KEDUA</span>
                          <span className="flex-1">: {studioContent.keduaPeriode || "Terhitung mulai tanggal 13 Juli 2026 sampai dengan 12 Juli 2027."}</span>
                        </div>

                        <div className="flex items-start gap-2 pt-0.5">
                          <span className="font-bold min-w-16 shrink-0">KETIGA</span>
                          <span className="flex-1">: {studioContent.ketigaTugas || "Melaksanakan tugas pokok administrasi dan sistem informasi."}</span>
                        </div>

                        <div className="flex items-start gap-2 pt-0.5">
                          <span className="font-bold min-w-16 shrink-0">KEEMPAT</span>
                          <span className="flex-1">: {studioContent.keempatBiaya || "Segala biaya yang timbul dibebankan pada anggaran operasional PKBM Askara."}</span>
                        </div>

                        <div className="flex items-start gap-2 pt-0.5">
                          <span className="font-bold min-w-16 shrink-0">KELIMA</span>
                          <span className="flex-1">: {studioContent.kelimaPenutup || "Surat Keputusan ini mulai berlaku sejak tanggal ditetapkan."}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* 6. DOCUMENT VIEW: SURAT UNDANGAN DENGAN TABEL */
                    <div className="space-y-4 text-justify">
                      <div className="flex justify-between items-start font-sans text-xs mb-4">
                        <div className="space-y-0.5">
                          <p><strong>Nomor</strong> : {letterNumberPreview}</p>
                          <p><strong>Lampiran</strong> : -</p>
                          <p><strong>Perihal</strong> : <u>{letterTitle}</u></p>
                        </div>
                        <div className="text-right">
                          <p>{cityPenetapan}, {new Date(letterDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                          <p className="mt-1">Kepada Yth.</p>
                          <p className="font-bold">{recipientName}</p>
                          <p className="text-slate-600">di Tempat</p>
                        </div>
                      </div>

                      <p>{studioContent.openingSalam || "Bismillahirrohmanirrohim, Segala puji bagi Allah SWT Tuhan semesta alam."}</p>
                      <p>{studioContent.bodyParagraph || "Dengan ini kami mengundang Bapak/Ibu hadir pada kegiatan koordinasi yang akan dilaksanakan pada:"}</p>

                      <div className="my-3 font-sans">
                        <table className="w-full border-collapse border border-slate-400 text-xs">
                          <thead>
                            <tr className="bg-slate-100">
                              <th className="border border-slate-400 p-2 text-left">Hari / Tanggal</th>
                              <th className="border border-slate-400 p-2 text-left">Waktu</th>
                              <th className="border border-slate-400 p-2 text-left">Tempat</th>
                              <th className="border border-slate-400 p-2 text-left">Agenda Kegiatan</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(studioContent.schedules || [
                              { dayDate: "Sabtu, 29 Agustus 2026", time: "09.00 - 11.30 WIB", room: "Aula Utama PKBM Askara", agenda: "Sosialisasi e-Rapor & CBT Paket C" },
                            ]).map((s: any, idx: number) => (
                              <tr key={idx}>
                                <td className="border border-slate-400 p-2 font-semibold">{s.dayDate}</td>
                                <td className="border border-slate-400 p-2 whitespace-nowrap">{s.time}</td>
                                <td className="border border-slate-400 p-2">{s.room}</td>
                                <td className="border border-slate-400 p-2">{s.agenda}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <p>{studioContent.closingNotes || "Mengingat pentingnya agenda ini, kami mohon kehadiran Bapak/Ibu tepat pada waktunya."}</p>
                    </div>
                  )}
                </div>

                {/* SIGNATURE & STAMP BLOCK (Selalu Dipertahankan) */}
                <div className="mt-12 pt-4 flex justify-end">
                  <div className="text-left font-sans min-w-[260px]">
                    <p className="text-xs text-slate-800">
                      Ditetapkan di: {cityPenetapan}
                    </p>
                    <p className="text-xs text-slate-800">
                      Pada tanggal: {new Date(letterDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    <p className="text-xs font-bold text-slate-900 mt-2">
                      {signerRole},
                    </p>

                    {/* Integrated Signature & Official Round Stamp */}
                    <div className="h-28 my-1 relative flex items-center">
                      {withStampAndSignature ? (
                        <>
                          <img
                            src="/stempel-askara.png"
                            alt="Stempel Resmi PKBM Askara"
                            className="absolute left-[-20px] top-[-5px] w-28 h-28 object-contain mix-blend-multiply pointer-events-none select-none z-0 rotate-[-6deg]"
                          />
                          <img
                            src="/ttd-kepala.png"
                            alt="Tanda Tangan Kepala PKBM Askara"
                            className="relative left-6 top-0 h-24 w-auto object-contain mix-blend-multiply z-10 pointer-events-none select-none"
                          />
                        </>
                      ) : (
                        <div className="h-24 flex items-center justify-center text-slate-400 text-xs italic">
                          (Tanda tangan basah & stempel fisik)
                        </div>
                      )}
                    </div>

                    <p className="text-xs font-bold text-slate-950 underline pt-1">
                      {signerName}
                    </p>
                    <p className="text-[10px] text-slate-500">NIP. {signerNip || "-"}</p>
                  </div>
                </div>

                {/* Validation Footer */}
                <div className="mt-8 pt-3 border-t border-slate-200 text-[10px] font-sans text-slate-400 flex items-center justify-between">
                  <span>Dokumen Resmi Sistem Informasi PKBM Askara</span>
                  <span className="font-mono">{letterNumberPreview}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL PENCATATAN SURAT MASUK & UPLOAD DOKUMEN                             */}
      {/* ========================================================================= */}
      {showIncomingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden my-auto border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Inbox className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Pencatatan Buku Agenda Surat Masuk</h3>
                  <p className="text-[11px] text-slate-500">Catat nomor surat, pengirim, disposisi, & upload dokumen fisik (PDF/Scan)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIncomingModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIncoming} className="p-5 space-y-3.5 text-xs overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor Surat Asal</label>
                  <input
                    type="text"
                    placeholder="Contoh: 421.2/1209-Disdik/2026"
                    value={incomingForm.sourceNumber}
                    onChange={(e) => setIncomingForm({ ...incomingForm, sourceNumber: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Instansi / Nama Pengirim</label>
                  <input
                    type="text"
                    placeholder="Contoh: Dinas Pendidikan Kota Bandung"
                    value={incomingForm.sender}
                    onChange={(e) => setIncomingForm({ ...incomingForm, sender: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Perihal / Isi Ringkas Surat</label>
                  <input
                    type="text"
                    placeholder="Contoh: Undangan Sosialisasi Akreditasi Lembaga 2026"
                    value={incomingForm.title}
                    onChange={(e) => setIncomingForm({ ...incomingForm, title: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Surat Tertera</label>
                  <input
                    type="date"
                    value={incomingForm.letterDate}
                    onChange={(e) => setIncomingForm({ ...incomingForm, letterDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Diterima Lembaga</label>
                  <input
                    type="date"
                    value={incomingForm.receivedDate}
                    onChange={(e) => setIncomingForm({ ...incomingForm, receivedDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Catatan Instruksi / Disposisi Kepala PKBM</label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Harap ditindaklanjuti bersama Operator PKBM dan siapkan dokumen instrumen."
                    value={incomingForm.disposition}
                    onChange={(e) => setIncomingForm({ ...incomingForm, disposition: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs resize-none"
                  />
                </div>

                {/* FITUR UPLOAD DOKUMEN SURAT MASUK */}
                <div className="sm:col-span-2 space-y-1.5 pt-1">
                  <label className="block font-bold text-slate-800 flex items-center justify-between">
                    <span>📎 Upload Berkas / Dokumen Scan Surat Masuk (PDF / Gambar)</span>
                    {incomingForm.attachmentUrl && (
                      <span className="text-emerald-600 font-bold text-[10px] flex items-center gap-1">
                        <Check className="w-3 h-3" /> Berkas Terunggah
                      </span>
                    )}
                  </label>

                  {!incomingForm.attachmentUrl ? (
                    <label className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/40 hover:bg-indigo-50/80 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition text-center group">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                        onChange={handleFileUpload}
                        disabled={uploadingFile}
                        className="hidden"
                      />
                      <div className="w-10 h-10 rounded-xl bg-white shadow-2xs flex items-center justify-center text-indigo-600 group-hover:scale-110 transition mb-2">
                        {uploadingFile ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <UploadCloud className="w-5 h-5" />
                        )}
                      </div>
                      <span className="font-bold text-indigo-950 text-xs block">
                        {uploadingFile ? "Mengunggah berkas ke server..." : "Klik atau seret file PDF / scan surat di sini"}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5">
                        Mendukung PDF, Word, JPG, PNG (Maks. 75 MB)
                      </span>
                    </label>
                  ) : (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center space-x-2.5 overflow-hidden">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <span className="font-bold text-slate-900 text-xs block truncate">
                            {incomingForm.attachmentName || "Dokumen_Surat_Masuk.pdf"}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {incomingForm.attachmentSize ? `${incomingForm.attachmentSize} • ` : ""}
                            <a
                              href={incomingForm.attachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 font-bold hover:underline"
                            >
                              Lihat Berkas Terunggah ↗
                            </a>
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setIncomingForm((prev) => ({
                            ...prev,
                            attachmentUrl: "",
                            attachmentName: "",
                            attachmentSize: "",
                          }))
                        }
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                        title="Hapus dan Ganti Berkas"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowIncomingModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingFile}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shadow-sm"
                >
                  {submitting ? "Menyimpan..." : "Simpan ke Agenda Masuk"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
