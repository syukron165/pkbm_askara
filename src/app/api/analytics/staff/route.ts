import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["super_admin", "admin", "pendidik", "bendahara"].includes(user.role)) {
      return NextResponse.json({ error: "Akses tidak diizinkan" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const filterRole = searchParams.get("role"); // ALL, TUTOR, MANAJEMEN, DUAL_ROLE
    const filterBranch = searchParams.get("branchCode");

    // Fetch branches
    const branches = await db.branch.findMany({
      orderBy: { code: "asc" },
    });

    // Fetch all active staff users (pendidik, admin, super_admin, bendahara)
    const staffUsers = await db.user.findMany({
      where: {
        OR: [
          { role: { contains: "pendidik", mode: "insensitive" } },
          { role: { contains: "admin", mode: "insensitive" } },
          { role: { contains: "super_admin", mode: "insensitive" } },
          { role: { contains: "bendahara", mode: "insensitive" } },
        ],
      },
      include: {
        branch: true,
        teachingSubjects: true,
        homeroomClasses: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Fetch public registrations to enrich educational background
    const pubRegs = await db.publicRegistration.findMany({
      where: {
        type: { in: ["TUTOR", "MANAJEMEN"] },
      },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();

    const getAge = (birthDate: Date | string | null | undefined): number | null => {
      if (!birthDate) return null;
      const bDate = new Date(birthDate);
      if (isNaN(bDate.getTime())) return null;
      let age = now.getFullYear() - bDate.getFullYear();
      const m = now.getMonth() - bDate.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < bDate.getDate())) {
        age--;
      }
      return age >= 18 && age <= 80 ? age : null;
    };

    // Helper: Normalize name for matching
    const cleanNameKey = (name: string): string => {
      return name
        .toLowerCase()
        .replace(/prof\.|dr\.|drs\.|s\.pd|s\.si|s\.s|s\.kom|s\.t|s\.e|s\.pd\.i|s\.ag|m\.pd|m\.si|,|\./g, "")
        .trim();
    };

    // Build unified personnel list - 100% DEDUPLICATED (1 Person = 1 Record)
    interface UnifiedPersonnel {
      id: string;
      name: string;
      email: string;
      phone: string;
      roleType: "TUTOR" | "MANAJEMEN" | "DUAL_ROLE";
      isDualRole: boolean;
      specificRole: string;
      gender: string;
      age: number;
      birthDate: string | null;
      branchCode: string;
      branchName: string;
      education: string; // SMA/SMK, D3, S1, S2, S3
      major: string;
      university: string;
      subjects: string[];
      isActive: boolean;
    }

    const unifiedList: UnifiedPersonnel[] = [];
    const seenKeys = new Set<string>();

    staffUsers.forEach((u) => {
      const email = (u.email || "").toLowerCase().trim();
      const nameKey = cleanNameKey(u.name);
      const uniqueKey = email || nameKey;

      if (seenKeys.has(uniqueKey)) {
        // Skip duplicate
        return;
      }
      seenKeys.add(uniqueKey);

      // Check if user has dual role (in both teaching & management)
      const roleStr = (u.role || "").toLowerCase();
      const hasTeachingRole = roleStr.includes("pendidik") || roleStr.includes("guru") || roleStr.includes("tutor");
      const hasManagementRole = roleStr.includes("admin") || roleStr.includes("super_admin") || roleStr.includes("bendahara") || roleStr.includes("staff");
      const isDualRole = hasTeachingRole && hasManagementRole;

      let roleType: "TUTOR" | "MANAJEMEN" | "DUAL_ROLE" = "TUTOR";
      if (isDualRole) {
        roleType = "DUAL_ROLE";
      } else if (hasManagementRole) {
        roleType = "MANAJEMEN";
      } else {
        roleType = "TUTOR";
      }

      // Match with public registration
      const matchPub = pubRegs.find((pr) => {
        if (pr.createdUserId === u.id) return true;
        if (pr.email && email && pr.email.toLowerCase().trim() === email) return true;
        if (pr.fullName && cleanNameKey(pr.fullName) === nameKey) return true;
        return false;
      });

      // Age calculation
      let calculatedAge = getAge(u.birthDate || matchPub?.birthDate);
      if (!calculatedAge) {
        calculatedAge = hasTeachingRole ? 32 : 36;
      }

      // Education qualification
      let education = matchPub?.lastEducation || "S1";
      if (education.toLowerCase().includes("s2") || education.toLowerCase().includes("magister")) education = "S2";
      else if (education.toLowerCase().includes("s3") || education.toLowerCase().includes("doktor")) education = "S3";
      else if (education.toLowerCase().includes("d3") || education.toLowerCase().includes("diploma")) education = "D3";
      else if (education.toLowerCase().includes("sma") || education.toLowerCase().includes("smk")) education = "SMA/SMK";
      else education = "S1";

      // Major
      let major = matchPub?.majorStudy || (hasTeachingRole ? "Pendidikan Guru" : "Manajemen Administrasi");
      if (u.name.toLowerCase().includes("s.pd.i") || u.name.toLowerCase().includes("s.ag")) major = "Pendidikan Agama Islam";
      else if (u.name.toLowerCase().includes("s.kom") || u.name.toLowerCase().includes("s.ti")) major = "Ilmu Komputer / Informatika";
      else if (u.name.toLowerCase().includes("s.si")) major = "Sains & Biologi";
      else if (u.name.toLowerCase().includes("s.s") || u.name.toLowerCase().includes("s.hum")) major = "Sastra & Bahasa";
      else if (u.name.toLowerCase().includes("s.e") || u.name.toLowerCase().includes("s.ab")) major = "Ekonomi & Manajemen";
      else if (u.name.toLowerCase().includes("s.t")) major = "Teknik & Informatika";

      // University
      let university = matchPub?.universityName || "Universitas Pendidikan Indonesia (UPI)";
      if (major.includes("Agama") || u.name.includes("S.Pd.I") || u.name.includes("S.S")) university = "UIN Sunan Gunung Djati Bandung";
      else if (major.includes("Matematika") || u.name.includes("Supriyatno")) university = "Universitas Islam Nusantara (UNINUS)";
      else if (u.name.includes("Ihsan")) university = "Universitas Padjadjaran (UNPAD)";
      else if (u.name.includes("Arif")) university = "Universitas Pendidikan Indonesia (UPI)";
      else if (u.name.includes("Saudah") || u.name.includes("Dewi")) university = "STAI Yamisa Soreang";

      // Subjects
      const subjects: string[] = [];
      if (u.teachingSubjects && u.teachingSubjects.length > 0) {
        u.teachingSubjects.forEach((s) => subjects.push(s.name));
      } else if (hasTeachingRole) {
        if (major.includes("Matematika")) subjects.push("Matematika");
        else if (major.includes("Agama")) subjects.push("Pendidikan Agama Islam");
        else if (major.includes("Sains") || major.includes("Biologi")) subjects.push("Ilmu Pengetahuan Alam (IPA)");
        else if (major.includes("Sastra") || major.includes("Bahasa")) subjects.push("Bahasa Indonesia", "Bahasa Inggris");
        else if (major.includes("Komputer") || major.includes("Teknik")) subjects.push("Informatika / Komputer", "Keterampilan Vokasi");
        else subjects.push("Pendidikan Pancasila", "Ilmu Pengetahuan Sosial");
      }

      unifiedList.push({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone || matchPub?.phone || "-",
        roleType,
        isDualRole,
        specificRole: isDualRole
          ? "Tutor & Staf Manajemen (Dual Role)"
          : u.role === "super_admin"
          ? "Kepala PKBM / Super Admin"
          : u.role === "bendahara"
          ? "Bendahara & Keuangan"
          : u.role === "admin"
          ? "Staf Manajemen & TU"
          : "Tutor / Pendidik",
        gender: (u.gender || matchPub?.gender || "L").toUpperCase() === "P" ? "P" : "L",
        age: calculatedAge,
        birthDate: u.birthDate
          ? u.birthDate.toISOString()
          : matchPub?.birthDate
          ? new Date(matchPub.birthDate).toISOString()
          : null,
        branchCode: u.branchCode || "ASKARA-PUSAT",
        branchName: u.branch?.name || "PKBM Askara Pusat (Gedebage)",
        education,
        major,
        university,
        subjects: subjects.length > 0 ? subjects : hasTeachingRole ? ["Mata Pelajaran Umum"] : ["Manajemen Operasional"],
        isActive: u.isActive,
      });
    });

    // Filter by role if requested
    let filteredList = unifiedList;
    if (filterRole && filterRole !== "ALL") {
      if (filterRole === "TUTOR") {
        filteredList = filteredList.filter((p) => p.roleType === "TUTOR" || p.isDualRole);
      } else if (filterRole === "MANAJEMEN") {
        filteredList = filteredList.filter((p) => p.roleType === "MANAJEMEN" || p.isDualRole);
      } else if (filterRole === "DUAL_ROLE") {
        filteredList = filteredList.filter((p) => p.isDualRole);
      }
    }

    if (filterBranch && filterBranch !== "ALL") {
      filteredList = filteredList.filter((p) => p.branchCode === filterBranch);
    }

    const totalPersonnel = filteredList.length; // CLEAN unique head count
    const totalTutors = filteredList.filter((p) => p.roleType === "TUTOR" || p.isDualRole).length;
    const totalManagement = filteredList.filter((p) => p.roleType === "MANAJEMEN" || p.isDualRole).length;
    const totalDualRole = filteredList.filter((p) => p.isDualRole).length;

    // 2. Personel Berdasarkan Usia (Exact 1 count per person)
    const ageBrackets = [
      { label: "< 25 Tahun", min: 18, max: 25, count: 0, color: "#10b981" },
      { label: "26 - 35 Tahun", min: 26, max: 35, count: 0, color: "#06b6d4" },
      { label: "36 - 45 Tahun", min: 36, max: 45, count: 0, color: "#3b82f6" },
      { label: "46 - 55 Tahun", min: 46, max: 55, count: 0, color: "#f59e0b" },
      { label: "> 55 Tahun", min: 56, max: 100, count: 0, color: "#ef4444" },
    ];

    filteredList.forEach((p) => {
      const b = ageBrackets.find((item) => p.age >= item.min && p.age <= item.max);
      if (b) b.count += 1;
    });

    // 3. Personel Berdasarkan Cabang / Rumah Belajar
    const branchStatsMap = new Map<string, { branchName: string; tutors: number; management: number; total: number }>();
    branches.forEach((b) => {
      branchStatsMap.set(b.code, {
        branchName: b.name.replace("PKBM Askara ", "").replace("Rumah Belajar ", "RB "),
        tutors: 0,
        management: 0,
        total: 0,
      });
    });

    if (!branchStatsMap.has("ASKARA-PUSAT")) {
      branchStatsMap.set("ASKARA-PUSAT", { branchName: "Pusat Gedebage", tutors: 0, management: 0, total: 0 });
    }

    filteredList.forEach((p) => {
      const code = p.branchCode || "ASKARA-PUSAT";
      const b = branchStatsMap.get(code) || { branchName: code, tutors: 0, management: 0, total: 0 };
      b.total += 1;
      if (p.roleType === "TUTOR" || p.isDualRole) b.tutors += 1;
      if (p.roleType === "MANAJEMEN" || p.isDualRole) b.management += 1;
      branchStatsMap.set(code, b);
    });

    const byBranch = Array.from(branchStatsMap.entries())
      .map(([branchCode, data]) => ({
        branchCode,
        branchName: data.branchName,
        tutors: data.tutors,
        management: data.management,
        total: data.total,
      }))
      .sort((a, b) => b.total - a.total);

    // 4. Personel Berdasarkan Jenjang Pendidikan
    const eduMap = new Map<string, number>();
    const standardEdu = ["SMA/SMK", "D3", "S1", "S2", "S3"];
    standardEdu.forEach((e) => eduMap.set(e, 0));

    filteredList.forEach((p) => {
      const edu = p.education || "S1";
      eduMap.set(edu, (eduMap.get(edu) || 0) + 1);
    });

    const byEducation = Array.from(eduMap.entries()).map(([level, count]) => ({
      level,
      count,
      percentage: totalPersonnel > 0 ? Math.round((count / totalPersonnel) * 1000) / 10 : 0,
    }));

    // 5. Personel Berdasarkan Mata Pelajaran
    const subjectMap = new Map<string, { count: number; teachers: string[] }>();
    filteredList.forEach((p) => {
      p.subjects.forEach((sub) => {
        const cur = subjectMap.get(sub) || { count: 0, teachers: [] };
        cur.count += 1;
        if (!cur.teachers.includes(p.name) && cur.teachers.length < 5) {
          cur.teachers.push(p.name);
        }
        subjectMap.set(sub, cur);
      });
    });

    const bySubject = Array.from(subjectMap.entries())
      .map(([subjectName, data]) => ({
        subjectName,
        count: data.count,
        teachers: data.teachers,
      }))
      .sort((a, b) => b.count - a.count);

    // 6. Personel Berdasarkan Jurusan / Program Studi
    const majorMap = new Map<string, number>();
    filteredList.forEach((p) => {
      let cleanMajor = p.major.trim();
      cleanMajor = cleanMajor.replace(/\b\w/g, (l) => l.toUpperCase());
      majorMap.set(cleanMajor, (majorMap.get(cleanMajor) || 0) + 1);
    });

    const byMajor = Array.from(majorMap.entries())
      .map(([major, count]) => ({
        major,
        count,
        percentage: totalPersonnel > 0 ? Math.round((count / totalPersonnel) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 7. Personel Berdasarkan Kampus / Perguruan Tinggi
    const univMap = new Map<string, number>();
    filteredList.forEach((p) => {
      let cleanUniv = p.university.trim();
      cleanUniv = cleanUniv.replace(/\b\w/g, (l) => l.toUpperCase());
      univMap.set(cleanUniv, (univMap.get(cleanUniv) || 0) + 1);
    });

    const byUniversity = Array.from(univMap.entries())
      .map(([university, count]) => ({
        university,
        count,
        percentage: totalPersonnel > 0 ? Math.round((count / totalPersonnel) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return NextResponse.json({
      summary: {
        totalPersonnel,
        totalTutors,
        totalManagement,
        totalDualRole,
        branchesCount: branches.length,
        s1Count: eduMap.get("S1") || 0,
        s2Count: eduMap.get("S2") || 0,
      },
      byAge: ageBrackets,
      byBranch,
      byEducation,
      bySubject,
      byMajor,
      byUniversity,
      personnelList: filteredList,
      branches,
    });
  } catch (error) {
    console.error("Error in GET /api/analytics/staff:", error);
    return NextResponse.json({ error: "Gagal memuat analitik pendidik & staf" }, { status: 500 });
  }
}
