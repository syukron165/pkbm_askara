import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

// Default schedule dataset for PKBM Kesetaraan (Paket A, Paket B, Paket C)
let schedulesData = [
  // --- PAKET C (Setara SMA) ---
  {
    id: "sch-c-1",
    classId: "class-paket-c-10",
    className: "Paket C - Kelas X Merdeka",
    packetType: "Paket C",
    subjectCode: "MAT-C10",
    subjectName: "Matematika Terapan",
    teacherName: "Drs. Hendra Gunawan",
    dayOfWeek: 1, // Senin
    dayName: "Senin",
    startTime: "08:00",
    endTime: "09:30",
    room: "Ruang Belajar Askara 1",
    type: "TATAP_MUKA", // TATAP_MUKA, ONLINE, MANDIRI
    onlineLink: null,
    notes: "Membawa modul matriks dan alat tulis lengkap",
  },
  {
    id: "sch-c-2",
    classId: "class-paket-c-10",
    className: "Paket C - Kelas X Merdeka",
    packetType: "Paket C",
    subjectCode: "IND-C10",
    subjectName: "Bahasa Indonesia",
    teacherName: "Siti Rahmawati, S.Pd.",
    dayOfWeek: 1, // Senin
    dayName: "Senin",
    startTime: "09:45",
    endTime: "11:15",
    room: "Ruang Belajar Askara 1",
    type: "TATAP_MUKA",
    onlineLink: null,
    notes: "Praktik menyusun teks argumentasi & resensi",
  },
  {
    id: "sch-c-3",
    classId: "class-paket-c-10",
    className: "Paket C - Kelas X Merdeka",
    packetType: "Paket C",
    subjectCode: "VOK-C10",
    subjectName: "Keterampilan Digital & Desain Grafis",
    teacherName: "Bayu Pratama, S.Kom.",
    dayOfWeek: 2, // Selasa
    dayName: "Selasa",
    startTime: "13:00",
    endTime: "15:00",
    room: "Lab Komputer & Multimedia",
    type: "TATAP_MUKA",
    onlineLink: null,
    notes: "Praktik pembuatan materi promosi UMKM",
  },
  {
    id: "sch-c-4",
    classId: "class-paket-c-10",
    className: "Paket C - Kelas X Merdeka",
    packetType: "Paket C",
    subjectCode: "ING-C10",
    subjectName: "Bahasa Inggris Komunikatif",
    teacherName: "Nurul Aini, M.Pd.",
    dayOfWeek: 3, // Rabu
    dayName: "Rabu",
    startTime: "08:30",
    endTime: "10:00",
    room: "Zoom Meeting Online",
    type: "ONLINE",
    onlineLink: "https://meet.google.com/ask-c10-ing",
    notes: "Sesi percakapan daring seputar wawancara kerja",
  },
  {
    id: "sch-c-5",
    classId: "class-paket-c-10",
    className: "Paket C - Kelas X Merdeka",
    packetType: "Paket C",
    subjectCode: "PPKN-C10",
    subjectName: "Pendidikan Pancasila & Kewarganegaraan",
    teacherName: "Drs. Hendra Gunawan",
    dayOfWeek: 4, // Kamis
    dayName: "Kamis",
    startTime: "09:00",
    endTime: "10:30",
    room: "Ruang Belajar Askara 1",
    type: "TATAP_MUKA",
    onlineLink: null,
    notes: "Diskusi kelompok hak dan kewajiban warga negara",
  },
  {
    id: "sch-c-6",
    classId: "class-paket-c-10",
    className: "Paket C - Kelas X Merdeka",
    packetType: "Paket C",
    subjectCode: "EKO-C10",
    subjectName: "Ekonomi & Kewirausahaan",
    teacherName: "Dewi Lestari, S.E.",
    dayOfWeek: 5, // Jumat
    dayName: "Jumat",
    startTime: "08:00",
    endTime: "09:30",
    room: "Ruang Belajar Askara 1",
    type: "TATAP_MUKA",
    onlineLink: null,
    notes: "Perencanaan bisnis mandiri bagi warga belajar",
  },
  {
    id: "sch-c-7",
    classId: "class-paket-c-10",
    className: "Paket C - Kelas X Merdeka",
    packetType: "Paket C",
    subjectCode: "IPA-C10",
    subjectName: "Sains & Lingkungan Hidup",
    teacherName: "Ir. Bambang Tri, M.Si.",
    dayOfWeek: 6, // Sabtu
    dayName: "Sabtu",
    startTime: "10:00",
    endTime: "12:00",
    room: "Ruang Kolaborasi / Outdoor",
    type: "TATAP_MUKA",
    onlineLink: null,
    notes: "Eksplorasi pengolahan limbah & kompos lingkungan",
  },

  // --- PAKET B (Setara SMP) ---
  {
    id: "sch-b-1",
    classId: "class-paket-b-8",
    className: "Paket B - Kelas VIII Mandiri",
    packetType: "Paket B",
    subjectCode: "IPA-B8",
    subjectName: "Ilmu Pengetahuan Alam (IPA)",
    teacherName: "Ir. Bambang Tri, M.Si.",
    dayOfWeek: 1, // Senin
    dayName: "Senin",
    startTime: "13:00",
    endTime: "14:30",
    room: "Ruang Belajar Askara 2",
    type: "TATAP_MUKA",
    onlineLink: null,
    notes: "Eksperimen sederhana sistem gerak dan kalor",
  },
  {
    id: "sch-b-2",
    classId: "class-paket-b-8",
    className: "Paket B - Kelas VIII Mandiri",
    packetType: "Paket B",
    subjectCode: "MAT-B8",
    subjectName: "Matematika",
    teacherName: "Drs. Hendra Gunawan",
    dayOfWeek: 2, // Selasa
    dayName: "Selasa",
    startTime: "08:30",
    endTime: "10:00",
    room: "Ruang Belajar Askara 2",
    type: "TATAP_MUKA",
    onlineLink: null,
    notes: "Aljabar & relasi fungsi kontekstual",
  },
  {
    id: "sch-b-3",
    classId: "class-paket-b-8",
    className: "Paket B - Kelas VIII Mandiri",
    packetType: "Paket B",
    subjectCode: "IPS-B8",
    subjectName: "Ilmu Pengetahuan Sosial (IPS)",
    teacherName: "Siti Rahmawati, S.Pd.",
    dayOfWeek: 3, // Rabu
    dayName: "Rabu",
    startTime: "10:15",
    endTime: "11:45",
    room: "Ruang Belajar Askara 2",
    type: "TATAP_MUKA",
    onlineLink: null,
    notes: "Keragaman potensi sumber daya kepulauan Indonesia",
  },
  {
    id: "sch-b-4",
    classId: "class-paket-b-8",
    className: "Paket B - Kelas VIII Mandiri",
    packetType: "Paket B",
    subjectCode: "VOK-B8",
    subjectName: "Keterampilan Menjahit & Tata Busana",
    teacherName: "Sri Wahyuni",
    dayOfWeek: 4, // Kamis
    dayName: "Kamis",
    startTime: "13:00",
    endTime: "15:30",
    room: "Ruang Vokasi & Keterampilan",
    type: "TATAP_MUKA",
    onlineLink: null,
    notes: "Pola dasar kemeja dan pengoperasian mesin jahit",
  },
  {
    id: "sch-b-5",
    classId: "class-paket-b-8",
    className: "Paket B - Kelas VIII Mandiri",
    packetType: "Paket B",
    subjectCode: "ING-B8",
    subjectName: "Bahasa Inggris Dasar",
    teacherName: "Nurul Aini, M.Pd.",
    dayOfWeek: 6, // Sabtu
    dayName: "Sabtu",
    startTime: "08:30",
    endTime: "10:00",
    room: "Google Meet",
    type: "ONLINE",
    onlineLink: "https://meet.google.com/ask-b8-ing",
    notes: "Vocabulary & Daily Conversations",
  },

  // --- PAKET A (Setara SD) ---
  {
    id: "sch-a-1",
    classId: "class-paket-a-5",
    className: "Paket A - Kelas V Unggul",
    packetType: "Paket A",
    subjectCode: "LIT-A5",
    subjectName: "Literasi Membaca & Menulis Kreatif",
    teacherName: "Siti Rahmawati, S.Pd.",
    dayOfWeek: 1, // Senin
    dayName: "Senin",
    startTime: "10:00",
    endTime: "11:30",
    room: "Ruang Belajar Ceria 1",
    type: "TATAP_MUKA",
    onlineLink: null,
    notes: "Membaca cerita inspiratif dan merangkum pesan moral",
  },
  {
    id: "sch-a-2",
    classId: "class-paket-a-5",
    className: "Paket A - Kelas V Unggul",
    packetType: "Paket A",
    subjectCode: "NUM-A5",
    subjectName: "Numerasi & Operasi Bilangan",
    teacherName: "Drs. Hendra Gunawan",
    dayOfWeek: 2, // Selasa
    dayName: "Selasa",
    startTime: "10:00",
    endTime: "11:30",
    room: "Ruang Belajar Ceria 1",
    type: "TATAP_MUKA",
    onlineLink: null,
    notes: "Pecahan, desimal, dan aplikasi belanja harian",
  },
  {
    id: "sch-a-3",
    classId: "class-paket-a-5",
    className: "Paket A - Kelas V Unggul",
    packetType: "Paket A",
    subjectCode: "SAI-A5",
    subjectName: "Ilmu Hayati & Lingkungan Sekitar",
    teacherName: "Ir. Bambang Tri, M.Si.",
    dayOfWeek: 4, // Kamis
    dayName: "Kamis",
    startTime: "10:00",
    endTime: "11:30",
    room: "Taman Belajar PKBM",
    type: "TATAP_MUKA",
    onlineLink: null,
    notes: "Pengamatan tanaman herbal dan siklus air",
  },
  {
    id: "sch-a-4",
    classId: "class-paket-a-5",
    className: "Paket A - Kelas V Unggul",
    packetType: "Paket A",
    subjectCode: "KTR-A5",
    subjectName: "Kriya Seni & Prakarya Mandiri",
    teacherName: "Bayu Pratama, S.Kom.",
    dayOfWeek: 6, // Sabtu
    dayName: "Sabtu",
    startTime: "13:00",
    endTime: "14:30",
    room: "Ruang Belajar Ceria 1",
    type: "TATAP_MUKA",
    onlineLink: null,
    notes: "Pembuatan kerajinan tangan dari bahan daur ulang",
  },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const packet = searchParams.get("packet");
    const day = searchParams.get("day");

    let result = [...schedulesData];

    if (packet && packet !== "SEMUA") {
      result = result.filter((s) => s.packetType.toLowerCase() === packet.toLowerCase());
    }

    if (day && day !== "SEMUA") {
      const dayNum = parseInt(day, 10);
      if (!isNaN(dayNum)) {
        result = result.filter((s) => s.dayOfWeek === dayNum);
      }
    }

    return NextResponse.json({
      success: true,
      total: result.length,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memuat jadwal" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "super_admin" && user.role !== "admin" && user.role !== "pendidik")) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Hanya Admin dan Guru yang dapat menambahkan jadwal." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      className,
      packetType,
      subjectName,
      teacherName,
      dayOfWeek,
      startTime,
      endTime,
      room,
      type,
      notes,
    } = body;

    if (!className || !packetType || !subjectName || !teacherName || !dayOfWeek || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, error: "Semua kolom wajib harus diisi" },
        { status: 400 }
      );
    }

    const dayNames = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
    const newSchedule = {
      id: `sch-${Date.now()}`,
      classId: `class-${packetType.toLowerCase().replace(/\s+/g, "-")}`,
      className,
      packetType,
      subjectCode: `${subjectName.substring(0, 3).toUpperCase()}-${packetType.charAt(packetType.length - 1)}`,
      subjectName,
      teacherName,
      dayOfWeek: Number(dayOfWeek),
      dayName: dayNames[Number(dayOfWeek)] || "Senin",
      startTime,
      endTime,
      room: room || "Ruang Belajar Askara",
      type: type || "TATAP_MUKA",
      onlineLink: type === "ONLINE" ? body.onlineLink || "https://meet.google.com/askara" : null,
      notes: notes || "Pertemuan KBM reguler",
    };

    schedulesData.unshift(newSchedule);

    return NextResponse.json({
      success: true,
      message: "Jadwal pelajaran berhasil ditambahkan",
      data: newSchedule,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menyimpan jadwal baru" },
      { status: 500 }
    );
  }
}
