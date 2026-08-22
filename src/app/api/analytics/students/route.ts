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
    const filterAcademicYear = searchParams.get("academicYear");
    const filterBranch = searchParams.get("branchCode");
    const filterProgram = searchParams.get("packetType");

    // Fetch branches
    const branches = await db.branch.findMany({
      orderBy: { code: "asc" },
    });

    // Fetch all students with relations
    const allStudents = await db.student.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            gender: true,
            birthDate: true,
            birthPlace: true,
            address: true,
            phone: true,
            branchCode: true,
          },
        },
        enrollments: {
          include: {
            class: true,
          },
        },
        branch: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();

    // Helper: calculate age in years from birthDate
    const getAge = (birthDate: Date | string | null | undefined): number | null => {
      if (!birthDate) return null;
      const bDate = new Date(birthDate);
      if (isNaN(bDate.getTime())) return null;
      let age = now.getFullYear() - bDate.getFullYear();
      const m = now.getMonth() - bDate.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < bDate.getDate())) {
        age--;
      }
      return age >= 0 && age <= 100 ? age : null;
    };

    // Helper: extract city or regency from address string
    const extractDomicile = (address: string | null | undefined): string => {
      if (!address || address === "-") return "Kota Bandung";
      const lower = address.toLowerCase();
      if (lower.includes("kab. bandung barat") || lower.includes("bandung barat") || lower.includes("kbb") || lower.includes("lembang") || lower.includes("padalarang")) {
        return "Kab. Bandung Barat";
      }
      if (lower.includes("kab. bandung") || lower.includes("kabupaten bandung") || lower.includes("ciparay") || lower.includes("baleendah") || lower.includes("majalaya") || lower.includes("soreang") || lower.includes("cicalengka") || lower.includes("rancaekek") || lower.includes("cileunyi") || lower.includes("cikoneng")) {
        return "Kab. Bandung";
      }
      if (lower.includes("cimahi") || lower.includes("cibeber") || lower.includes("leuwigajah")) {
        return "Kota Cimahi";
      }
      if (lower.includes("sumedang") || lower.includes("jatinangor")) {
        return "Kab. Sumedang";
      }
      if (lower.includes("garut")) {
        return "Kab. Garut";
      }
      if (lower.includes("jakarta") || lower.includes("dki")) {
        return "DKI Jakarta";
      }
      return "Kota Bandung";
    };

    // Filter students if searchParams are provided
    let filteredStudents = allStudents;
    if (filterBranch && filterBranch !== "ALL") {
      filteredStudents = filteredStudents.filter(
        (s) => s.branchCode === filterBranch || s.user?.branchCode === filterBranch
      );
    }
    if (filterProgram && filterProgram !== "ALL") {
      filteredStudents = filteredStudents.filter((s) => s.packetType === filterProgram);
    }
    if (filterAcademicYear && filterAcademicYear !== "ALL") {
      filteredStudents = filteredStudents.filter((s) => {
        const enrYear = s.enrollments[0]?.class?.academicYear;
        return enrYear === filterAcademicYear;
      });
    }

    const totalStudents = filteredStudents.length;

    // 1. Total Peserta Didik per Tahun Ajaran (Numerik & Chart)
    const academicYearMap = new Map<string, { total: number; paketA: number; paketB: number; paketC: number }>();
    const defaultYears = ["2024/2025", "2025/2026", "2026/2027"];
    defaultYears.forEach((y) => academicYearMap.set(y, { total: 0, paketA: 0, paketB: 0, paketC: 0 }));

    filteredStudents.forEach((s) => {
      const cls = s.enrollments[0]?.class;
      const year = cls?.academicYear || "2025/2026";
      const current = academicYearMap.get(year) || { total: 0, paketA: 0, paketB: 0, paketC: 0 };
      current.total += 1;
      if (s.packetType === "Paket A") current.paketA += 1;
      else if (s.packetType === "Paket B") current.paketB += 1;
      else if (s.packetType === "Paket C") current.paketC += 1;
      academicYearMap.set(year, current);
    });

    const byAcademicYear = Array.from(academicYearMap.entries()).map(([academicYear, data]) => ({
      academicYear,
      total: data.total,
      paketA: data.paketA,
      paketB: data.paketB,
      paketC: data.paketC,
    }));

    // 2. Total Peserta Didik Berdasarkan Jenis Kelamin (Pie Chart)
    let maleCount = 0;
    let femaleCount = 0;
    let otherGender = 0;

    filteredStudents.forEach((s) => {
      const g = (s.gender || s.user?.gender || "L").toUpperCase();
      if (g === "L" || g === "LAKI-LAKI" || g === "MALE") {
        maleCount += 1;
      } else if (g === "P" || g === "PEREMPUAN" || g === "FEMALE") {
        femaleCount += 1;
      } else {
        otherGender += 1;
      }
    });

    const byGender = {
      male: maleCount,
      female: femaleCount,
      other: otherGender,
      malePercentage: totalStudents > 0 ? Math.round((maleCount / totalStudents) * 1000) / 10 : 0,
      femalePercentage: totalStudents > 0 ? Math.round((femaleCount / totalStudents) * 1000) / 10 : 0,
    };

    // 3. Total Peserta Didik Berdasarkan Jenis Program (Bar Chart)
    let paketACount = 0;
    let paketBCount = 0;
    let paketCCount = 0;
    let vokasiCount = 0;

    filteredStudents.forEach((s) => {
      const p = s.packetType || "Paket C";
      if (p === "Paket A") paketACount += 1;
      else if (p === "Paket B") paketBCount += 1;
      else if (p === "Paket C") paketCCount += 1;
      else vokasiCount += 1;
    });

    const byProgram = [
      {
        program: "Paket A (Setara SD)",
        shortName: "Paket A",
        count: paketACount,
        percentage: totalStudents > 0 ? Math.round((paketACount / totalStudents) * 1000) / 10 : 0,
        color: "#10b981", // emerald
      },
      {
        program: "Paket B (Setara SMP)",
        shortName: "Paket B",
        count: paketBCount,
        percentage: totalStudents > 0 ? Math.round((paketBCount / totalStudents) * 1000) / 10 : 0,
        color: "#0284c7", // sky
      },
      {
        program: "Paket C (Setara SMA)",
        shortName: "Paket C",
        count: paketCCount,
        percentage: totalStudents > 0 ? Math.round((paketCCount / totalStudents) * 1000) / 10 : 0,
        color: "#8b5cf6", // purple
      },
    ];

    if (vokasiCount > 0) {
      byProgram.push({
        program: "Program Khusus / Vokasi",
        shortName: "Vokasi",
        count: vokasiCount,
        percentage: totalStudents > 0 ? Math.round((vokasiCount / totalStudents) * 1000) / 10 : 0,
        color: "#f59e0b",
      });
    }

    // 4. Total Peserta Didik Berdasarkan Cabang / Rumah Belajar (Grouped Bar Chart)
    const branchMap = new Map<string, { branchName: string; total: number; paketA: number; paketB: number; paketC: number }>();
    
    // Seed branch map with known branches
    branches.forEach((b) => {
      branchMap.set(b.code, {
        branchName: b.name.replace("PKBM Askara ", "").replace("Rumah Belajar ", "RB "),
        total: 0,
        paketA: 0,
        paketB: 0,
        paketC: 0,
      });
    });

    if (!branchMap.has("ASKARA-PUSAT")) {
      branchMap.set("ASKARA-PUSAT", { branchName: "Pusat Gedebage", total: 0, paketA: 0, paketB: 0, paketC: 0 });
    }

    filteredStudents.forEach((s) => {
      const code = s.branchCode || s.branch?.code || "ASKARA-PUSAT";
      const branchObj = branchMap.get(code) || {
        branchName: s.branch?.name || code,
        total: 0,
        paketA: 0,
        paketB: 0,
        paketC: 0,
      };

      branchObj.total += 1;
      if (s.packetType === "Paket A") branchObj.paketA += 1;
      else if (s.packetType === "Paket B") branchObj.paketB += 1;
      else if (s.packetType === "Paket C") branchObj.paketC += 1;

      branchMap.set(code, branchObj);
    });

    const byBranch = Array.from(branchMap.entries())
      .map(([branchCode, data]) => ({
        branchCode,
        branchName: data.branchName,
        total: data.total,
        paketA: data.paketA,
        paketB: data.paketB,
        paketC: data.paketC,
      }))
      .sort((a, b) => b.total - a.total);

    // 5 & 6. Jumlah Peserta Didik Berdasarkan Usia & Rentang Usia Sekolah (> 5 thn s/d < 25 thn)
    let schoolAgeCount = 0; // 6 <= age <= 24 (usia > 5 dan < 25)
    let underAgeCount = 0;  // age <= 5
    let adultAgeCount = 0;  // age >= 25
    let unknownAgeCount = 0;

    const ageBrackets = [
      { label: "6 - 10 Tahun", min: 6, max: 10, count: 0, isSchoolAge: true, color: "#10b981" },
      { label: "11 - 15 Tahun", min: 11, max: 15, count: 0, isSchoolAge: true, color: "#06b6d4" },
      { label: "16 - 20 Tahun", min: 16, max: 20, count: 0, isSchoolAge: true, color: "#3b82f6" },
      { label: "21 - 24 Tahun", min: 21, max: 24, count: 0, isSchoolAge: true, color: "#8b5cf6" },
      { label: "25 - 30 Tahun", min: 25, max: 30, count: 0, isSchoolAge: false, color: "#f59e0b" },
      { label: "31 - 40 Tahun", min: 31, max: 40, count: 0, isSchoolAge: false, color: "#f97316" },
      { label: "> 40 Tahun", min: 41, max: 120, count: 0, isSchoolAge: false, color: "#ef4444" },
    ];

    const ageFrequencies: Record<number, number> = {};

    filteredStudents.forEach((s) => {
      const birth = s.birthDate || s.user?.birthDate;
      const age = getAge(birth);

      if (age === null) {
        // Estimate age based on packet if birthDate is missing
        let estimatedAge = 17;
        if (s.packetType === "Paket A") estimatedAge = 10;
        else if (s.packetType === "Paket B") estimatedAge = 14;
        else if (s.packetType === "Paket C") estimatedAge = 18;

        schoolAgeCount += 1;
        const bracket = ageBrackets.find((b) => estimatedAge >= b.min && estimatedAge <= b.max);
        if (bracket) bracket.count += 1;
        ageFrequencies[estimatedAge] = (ageFrequencies[estimatedAge] || 0) + 1;
        return;
      }

      ageFrequencies[age] = (ageFrequencies[age] || 0) + 1;

      // Rentang > 5 tahun s/d < 25 tahun (6..24 thn)
      if (age > 5 && age < 25) {
        schoolAgeCount += 1;
      } else if (age <= 5) {
        underAgeCount += 1;
      } else {
        adultAgeCount += 1;
      }

      const bracket = ageBrackets.find((b) => age >= b.min && age <= b.max);
      if (bracket) {
        bracket.count += 1;
      } else if (age <= 5) {
        underAgeCount += 1;
      }
    });

    const ageRangeAnalysis = {
      schoolAgeCount, // > 5 thn s/d < 25 thn
      schoolAgePercentage: totalStudents > 0 ? Math.round((schoolAgeCount / totalStudents) * 1000) / 10 : 0,
      adultAgeCount, // >= 25 thn
      adultAgePercentage: totalStudents > 0 ? Math.round((adultAgeCount / totalStudents) * 1000) / 10 : 0,
      underAgeCount,
      brackets: ageBrackets,
    };

    // 7. Jumlah Peserta Didik Berdasarkan Domisili
    const domicileMap = new Map<string, number>();

    filteredStudents.forEach((s) => {
      const addr = s.address || s.user?.address;
      const city = extractDomicile(addr);
      domicileMap.set(city, (domicileMap.get(city) || 0) + 1);
    });

    const byDomicile = Array.from(domicileMap.entries())
      .map(([region, count]) => ({
        region,
        count,
        percentage: totalStudents > 0 ? Math.round((count / totalStudents) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Lightweight student list for preview table
    const sampleList = filteredStudents.slice(0, 50).map((s) => ({
      id: s.id,
      name: s.user?.name || "Peserta Didik",
      nisn: s.nisn || "-",
      gender: s.gender || s.user?.gender || "L",
      packetType: s.packetType,
      age: getAge(s.birthDate || s.user?.birthDate) ?? 17,
      branchName: s.branch?.name || "Pusat Gedebage",
      domicile: extractDomicile(s.address || s.user?.address),
      status: s.status,
    }));

    return NextResponse.json({
      summary: {
        totalStudents,
        schoolAgeCount,
        adultAgeCount,
        maleCount,
        femaleCount,
        paketACount,
        paketBCount,
        paketCCount,
        branchesCount: branches.length,
      },
      byAcademicYear,
      byGender,
      byProgram,
      byBranch,
      ageRangeAnalysis,
      byDomicile,
      sampleList,
      branches,
    });
  } catch (error) {
    console.error("Error in GET /api/analytics/students:", error);
    return NextResponse.json({ error: "Gagal memuat analitik siswa" }, { status: 500 });
  }
}
