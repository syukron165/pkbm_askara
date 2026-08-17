import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export interface ClassItem {
  id: string;
  name: string;
  level: "Paket A" | "Paket B" | "Paket C";
  academicYear: string;
  semester: "Ganjil" | "Genap";
  homeroom: string;
  homeroomNip?: string;
  room: string;
  capacity: number;
  studentsCount: number;
  studentsList: {
    id: string;
    nisn: string;
    name: string;
    gender: "L" | "P";
    phone: string;
  }[];
  description?: string;
}

let classesData: ClassItem[] = [
  {
    id: "cls-c-10",
    name: "Paket C - Kelas X Merdeka",
    level: "Paket C",
    academicYear: "2025/2026",
    semester: "Ganjil",
    homeroom: "Drs. Hendra Gunawan",
    homeroomNip: "197503152005011002",
    room: "Ruang Belajar Askara 1",
    capacity: 32,
    studentsCount: 28,
    studentsList: [
      { id: "s-1", nisn: "0081294812", name: "Budi Santoso", gender: "L", phone: "0812-3456-7890" },
      { id: "s-2", nisn: "0082211993", name: "Agung Pratama", gender: "L", phone: "0812-9988-7766" },
      { id: "s-3", nisn: "0084321908", name: "Putri Anggraini", gender: "P", phone: "0857-1122-3344" },
      { id: "s-4", nisn: "0085432191", name: "Rizky Ramadhan", gender: "L", phone: "0813-5566-7788" },
      { id: "s-5", nisn: "0086543212", name: "Zahra Maulida", gender: "P", phone: "0878-1234-5678" },
    ],
    description: "Rombel tingkat awal Paket C Kurikulum Merdeka Kesetaraan.",
  },
  {
    id: "cls-c-11",
    name: "Paket C - Kelas XI",
    level: "Paket C",
    academicYear: "2025/2026",
    semester: "Ganjil",
    homeroom: "Nurul Aini, S.Pd.",
    homeroomNip: "198206202008012010",
    room: "Ruang Belajar Askara 2",
    capacity: 30,
    studentsCount: 26,
    studentsList: [
      { id: "s-6", nisn: "0071234567", name: "Ahmad Fauzi", gender: "L", phone: "0856-1122-3344" },
      { id: "s-7", nisn: "0072345678", name: "Fitri Handayani", gender: "P", phone: "0813-4455-6677" },
    ],
    description: "Rombel tingkat menengah dengan fokus peminatan vokasi digital.",
  },
  {
    id: "cls-c-12",
    name: "Paket C - Kelas XII (Tingkat Akhir)",
    level: "Paket C",
    academicYear: "2025/2026",
    semester: "Ganjil",
    homeroom: "Dewi Anggraini, S.Kom.",
    homeroomNip: "199001052015012005",
    room: "Ruang Kolaborasi Askara",
    capacity: 28,
    studentsCount: 24,
    studentsList: [
      { id: "s-8", nisn: "0061234908", name: "Danang Wijaya", gender: "L", phone: "0812-7788-9900" },
      { id: "s-9", nisn: "0062345919", name: "Maya Safitri", gender: "P", phone: "0858-3344-5566" },
    ],
    description: "Persiapan Uji Kesetaraan Nasional dan Asesmen Akhir Kelulusan.",
  },
  {
    id: "cls-b-8",
    name: "Paket B - Kelas VIII Merdeka",
    level: "Paket B",
    academicYear: "2025/2026",
    semester: "Ganjil",
    homeroom: "Bambang Sutrisno, M.Si.",
    homeroomNip: "197912102006041003",
    room: "Ruang Belajar Askara 3",
    capacity: 28,
    studentsCount: 24,
    studentsList: [
      { id: "s-10", nisn: "0078912344", name: "Siti Rahmawati", gender: "P", phone: "0813-9876-5432" },
      { id: "s-11", nisn: "0079012355", name: "Fajar Nugraha", gender: "L", phone: "0812-6677-8899" },
    ],
    description: "Rombel Paket B setara SMP dengan penguatan sains dan literasi.",
  },
  {
    id: "cls-b-9",
    name: "Paket B - Kelas IX",
    level: "Paket B",
    academicYear: "2025/2026",
    semester: "Ganjil",
    homeroom: "Siti Rahmawati, S.Pd.",
    homeroomNip: "198504122010012015",
    room: "Ruang Belajar Askara 4",
    capacity: 25,
    studentsCount: 22,
    studentsList: [
      { id: "s-12", nisn: "0067891233", name: "Gilang Permana", gender: "L", phone: "0857-4433-2211" },
    ],
    description: "Rombel tingkat akhir persiapan lanjut ke Paket C atau SMK.",
  },
  {
    id: "cls-a-5",
    name: "Paket A - Kelas V & VI Unggul",
    level: "Paket A",
    academicYear: "2025/2026",
    semester: "Ganjil",
    homeroom: "Hj. Maryam, M.Pd.",
    homeroomNip: "197008171998032001",
    room: "Ruang Belajar Ceria",
    capacity: 25,
    studentsCount: 24,
    studentsList: [
      { id: "s-13", nisn: "0065432198", name: "Dewi Lestari", gender: "P", phone: "0877-5544-3322" },
      { id: "s-14", nisn: "0065432209", name: "Andi Saputra", gender: "L", phone: "0819-0011-2233" },
    ],
    description: "Rombel Paket A setara SD pembelajaran ramah anak dan literasi intensif.",
  },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get("level");
    const search = searchParams.get("search");

    let result = [...classesData];

    if (level && level !== "SEMUA") {
      result = result.filter((c) => c.level.toLowerCase() === level.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.homeroom.toLowerCase().includes(q) ||
          c.room.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({
      success: true,
      total: result.length,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memuat data kelas" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Hanya Admin yang dapat menambah kelas." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, level, academicYear, semester, homeroom, room, capacity, description } = body;

    if (!name || !level || !homeroom) {
      return NextResponse.json(
        { success: false, error: "Nama kelas, jenjang paket, dan wali kelas wajib diisi" },
        { status: 400 }
      );
    }

    const newClass: ClassItem = {
      id: `cls-${Date.now()}`,
      name: name.trim(),
      level: level || "Paket C",
      academicYear: academicYear || "2025/2026",
      semester: semester || "Ganjil",
      homeroom: homeroom.trim(),
      room: room || "Ruang Belajar Askara",
      capacity: Number(capacity) || 30,
      studentsCount: 0,
      studentsList: [],
      description: description || "Rombongan belajar resmi PKBM Askara",
    };

    classesData.unshift(newClass);

    return NextResponse.json({
      success: true,
      message: "Kelas & Rombel baru berhasil ditambahkan",
      data: newClass,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menyimpan data kelas" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Hanya Admin yang dapat mengubah kelas." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, name, level, academicYear, semester, homeroom, room, capacity, description } = body;

    const index = classesData.findIndex((c) => c.id === id);
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: "Kelas tidak ditemukan" },
        { status: 404 }
      );
    }

    classesData[index] = {
      ...classesData[index],
      name: name ? name.trim() : classesData[index].name,
      level: level || classesData[index].level,
      academicYear: academicYear || classesData[index].academicYear,
      semester: semester || classesData[index].semester,
      homeroom: homeroom ? homeroom.trim() : classesData[index].homeroom,
      room: room !== undefined ? room : classesData[index].room,
      capacity: capacity !== undefined ? Number(capacity) : classesData[index].capacity,
      description: description !== undefined ? description : classesData[index].description,
    };

    return NextResponse.json({
      success: true,
      message: "Data kelas & rombel berhasil diperbarui",
      data: classesData[index],
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memperbarui data kelas" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Hanya Admin yang dapat menghapus kelas." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Parameter ID wajib disertakan" },
        { status: 400 }
      );
    }

    const index = classesData.findIndex((c) => c.id === id);
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: "Kelas tidak ditemukan" },
        { status: 404 }
      );
    }

    const removed = classesData.splice(index, 1)[0];

    return NextResponse.json({
      success: true,
      message: `Kelas ${removed.name} berhasil dihapus`,
      data: removed,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menghapus data kelas" },
      { status: 500 }
    );
  }
}
