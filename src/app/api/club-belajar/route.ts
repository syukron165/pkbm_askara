import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/club-belajar
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || undefined;
  const search = searchParams.get("search") || undefined;

  // Seed default study clubs if empty
  const count = await db.studyClub.count();
  if (count === 0) {
    const students = await db.student.findMany({
      take: 6,
      include: { user: true },
    });

    const club1 = await db.studyClub.create({
      data: {
        name: "Club Robotik & Coding AI",
        category: "TEKNOLOGI",
        description: "Wadah eksplorasi pemrograman web, mikrokontroler Arduino/ESP32, dan pemanfaatan kecerdasan buatan (AI) untuk solusi otomasi praktis.",
        visionGoals: "Mencetak talenta digital kesetaraan yang mampu merancang proyek IoT, robotika cerdas, dan aplikasi web mandiri.",
        mentorName: "Dewi Anggraini, S.Kom. (Tutor Vokasi & TI)",
        scheduleDay: "Sabtu",
        scheduleTime: "13:30 - 15:30 WIB",
        location: "Lab Komputer & Multimedia Askara",
        coverImage: "/uploads/cbt/sample-robotik.jpg",
        maxMembers: 30,
        isActive: true,
      },
    });

    const club2 = await db.studyClub.create({
      data: {
        name: "Club Barista & Kewirausahaan Kuliner",
        category: "VOKASI",
        description: "Pelatihan seni meracik kopi (manual brew & espresso), manajemen kedai kopi mandiri, dan kreasi produk kuliner siap jual.",
        visionGoals: "Membekali warga belajar dengan sertifikasi keahlian barista dan keterampilan wirausaha UMKM food & beverage.",
        mentorName: "Rian Pratama, S.E. (Praktisi Barista & Wirausaha)",
        scheduleDay: "Jumat",
        scheduleTime: "15:00 - 17:00 WIB",
        location: "Workshop Tata Boga & Cafe Vokasi Askara",
        coverImage: "/uploads/cbt/sample-barista.jpg",
        maxMembers: 25,
        isActive: true,
      },
    });

    const club3 = await db.studyClub.create({
      data: {
        name: "Club Desain Grafis & Digital Marketing",
        category: "VOKASI",
        description: "Penguasaan Canva, Figma, Adobe Illustrator, serta strategi pembuatan konten media sosial untuk branding produk lokal.",
        visionGoals: "Peserta mampu memproduksi portofolio desain kemasan produk, video promosi, dan mengelola kampanye iklan digital.",
        mentorName: "Ahmad Fauzi, S.Sn. (Desainer Grafis Profesional)",
        scheduleDay: "Kamis",
        scheduleTime: "14:00 - 16:00 WIB",
        location: "Ruang Kreatif Studio Askara",
        maxMembers: 30,
        isActive: true,
      },
    });

    const club4 = await db.studyClub.create({
      data: {
        name: "Club English Conversation & Public Speaking",
        category: "BAHASA",
        description: "Peningkatan kepercayaan diri berkomunikasi dalam Bahasa Inggris melalui debat terarah, pidato, podcast, dan simulasi wawancara kerja.",
        visionGoals: "Menciptakan komunitas aktif berbahasa Inggris untuk mendukung kesiapan karier global dan kerja profesional.",
        mentorName: "Nurul Aini, S.Pd., M.Hum.",
        scheduleDay: "Rabu",
        scheduleTime: "15:30 - 17:00 WIB",
        location: "Ruang Audio Visual Askara",
        maxMembers: 35,
        isActive: true,
      },
    });

    // Seed sample members if students exist
    if (students.length >= 3) {
      await db.studyClubMember.createMany({
        data: [
          { clubId: club1.id, studentId: students[0].id, role: "KETUA" },
          { clubId: club1.id, studentId: students[1].id, role: "SEKRETARIS" },
          { clubId: club1.id, studentId: students[2].id, role: "ANGGOTA" },
          { clubId: club2.id, studentId: students[1].id, role: "KETUA" },
          { clubId: club2.id, studentId: students[2].id, role: "BENDAHARA" },
        ],
      });
    }
  }

  const whereClause: any = {};
  if (category && category !== "SEMUA") whereClause.category = category;
  if (search) {
    whereClause.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
      { mentorName: { contains: search } },
      { location: { contains: search } },
    ];
  }

  const clubs = await db.studyClub.findMany({
    where: whereClause,
    include: {
      members: {
        include: {
          student: {
            include: { user: { select: { id: true, name: true, avatarUrl: true, email: true } } },
          },
        },
      },
      attendances: {
        orderBy: { meetingDate: "desc" },
        take: 5,
        include: {
          records: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ clubs });
}

// POST /api/club-belajar
// Body: { name, category, description, visionGoals, mentorName, scheduleDay, scheduleTime, location, coverImage, maxMembers, isActive }
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["super_admin", "admin", "pendidik"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    name,
    category,
    description,
    visionGoals,
    mentorName,
    scheduleDay,
    scheduleTime,
    location,
    coverImage,
    maxMembers,
    isActive,
  } = body;

  if (!name || !category || !mentorName || !scheduleDay) {
    return NextResponse.json(
      { error: "Nama club, kategori, nama pembina, dan hari jadwal wajib diisi" },
      { status: 400 }
    );
  }

  const club = await db.studyClub.create({
    data: {
      name,
      category: category || "VOKASI",
      description: description || null,
      visionGoals: visionGoals || null,
      mentorName,
      scheduleDay,
      scheduleTime: scheduleTime || "14:00 - 16:00 WIB",
      location: location || "Ruang Kelas PKBM Askara",
      coverImage: coverImage || null,
      maxMembers: maxMembers ? parseInt(maxMembers) : 30,
      isActive: isActive ?? true,
    },
    include: {
      members: true,
      attendances: true,
    },
  });

  return NextResponse.json({ club }, { status: 201 });
}

// PATCH /api/club-belajar?id=xxx
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["super_admin", "admin", "pendidik"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID club diperlukan" }, { status: 400 });

  const body = await req.json();
  const updated = await db.studyClub.update({
    where: { id },
    data: body,
    include: {
      members: true,
      attendances: true,
    },
  });

  return NextResponse.json({ club: updated });
}

// DELETE /api/club-belajar?id=xxx
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["super_admin", "admin", "pendidik"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID club diperlukan" }, { status: 400 });

  await db.studyClub.delete({ where: { id } });
  return NextResponse.json({ message: "Club belajar berhasil dihapus" });
}
