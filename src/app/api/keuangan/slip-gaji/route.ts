import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch real active staff (Guru & Manajemen)
    const staffUsers = await db.user.findMany({
      where: {
        role: { in: ["pendidik", "admin", "super_admin", "SUPER_ADMIN", "pendidik,admin", "admin,pendidik"] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        nik: true,
      },
      orderBy: { name: "asc" },
    });

    const staffEmails = staffUsers.map((u) => u.email);

    const registrations = await db.publicRegistration.findMany({
      where: {
        email: { in: staffEmails, mode: "insensitive" },
      },
      select: {
        email: true,
        fullName: true,
        nik: true,
        phone: true,
        positionApplied: true,
        bankName: true,
        bankAccountNumber: true,
        lastEducation: true,
      },
    });

    const regMap = new Map<string, (typeof registrations)[0]>();
    registrations.forEach((r) => {
      if (r.email) regMap.set(r.email.toLowerCase(), r);
    });

    const employees = staffUsers.map((u) => {
      const reg = regMap.get(u.email.toLowerCase());
      const posApplied = reg?.positionApplied || "";

      let type: "GTY_TETAP" | "HONORER_GTT" | "MANAJEMEN" = "GTY_TETAP";
      let position = "Pendidik & Tutor";
      let department = "Akademik & Pengajaran";

      if (posApplied.includes("Tidak Tetap") || posApplied.includes("Honorer")) {
        type = "HONORER_GTT";
        position = "Tutor Honorer (GTT)";
        department = "Akademik & Pengajaran";
      } else if (posApplied.includes("Tetap")) {
        type = "GTY_TETAP";
        position = "Guru Tetap Yayasan (GTY)";
        department = "Akademik & Pengajaran";
      } else if (u.role === "admin" || u.role.includes("admin") || posApplied.includes("Manajemen") || posApplied.includes("Tendik")) {
        type = "MANAJEMEN";
        position = posApplied || (u.role === "super_admin" ? "Kepala PKBM / Yayasan" : "Staf Manajemen & TU");
        department = "Manajemen & Tata Usaha";
      } else if (u.role === "pendidik") {
        type = "GTY_TETAP";
        position = "Guru / Tutor Pendidik";
        department = "Akademik & Pengajaran";
      }

      if (u.role === "pendidik,admin" || u.role === "admin,pendidik") {
        position = "Pendidik & Staf Manajemen";
        department = "Akademik & Manajemen";
      }

      const nip = reg?.nik || u.nik || `PEG-${u.id.slice(-6).toUpperCase()}`;

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        nip,
        position,
        type,
        department,
        phone: u.phone || reg?.phone || "-",
        bankName: reg?.bankName || "-",
        bankAccount: reg?.bankAccountNumber || "-",
        education: reg?.lastEducation || "-",
      };
    });

    // 2. Fetch all salary slips from DB
    const slips = await db.salarySlip.findMany({
      orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
    });

    const employeeMap = new Map(employees.map((e) => [e.id, e]));

    const parsedSlips = slips.map((s) => {
      let allowances = [];
      let deductions = [];

      try {
        allowances = JSON.parse(s.allowances || "[]");
      } catch {
        allowances = [];
      }

      try {
        deductions = JSON.parse(s.deductions || "[]");
      } catch {
        deductions = [];
      }

      const emp = employeeMap.get(s.employeeId) || {
        id: s.employeeId,
        name: "Pegawai Tidak Ditemukan",
        email: "-",
        nip: "-",
        position: "Staf",
        type: "GTY_TETAP" as const,
        department: "Lembaga",
        phone: "-",
        bankName: "-",
        bankAccount: "-",
        education: "-",
      };

      return {
        ...s,
        allowances,
        deductions,
        employee: emp,
        issuedDate: s.issuedDate ? s.issuedDate.toISOString() : undefined,
      };
    });

    return NextResponse.json({
      success: true,
      data: parsedSlips,
      employees,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memuat slip gaji" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !["super_admin", "SUPER_ADMIN", "admin", "admin,pendidik", "pendidik,admin"].includes(user.role)) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const body = await request.json();
    const {
      employeeId,
      month,
      year,
      baseSalary = 0,
      allowances = [],
      deductions = [],
      status = "DRAFT",
      notes,
      issuedDate,
    } = body;

    if (!employeeId || !month || !year) {
      return NextResponse.json(
        { error: "Pegawai, Bulan, dan Tahun wajib diisi" },
        { status: 400 }
      );
    }

    const slip = await db.salarySlip.create({
      data: {
        employeeId,
        month: Number(month),
        year: Number(year),
        baseSalary: Number(baseSalary),
        allowances: JSON.stringify(allowances),
        deductions: JSON.stringify(deductions),
        status: status || "DRAFT",
        notes: notes || null,
        issuedDate: issuedDate ? new Date(issuedDate) : status === "DITERBITKAN" ? new Date() : null,
      },
    });

    const parsedSlip = {
      ...slip,
      allowances: JSON.parse(slip.allowances),
      deductions: JSON.parse(slip.deductions),
      issuedDate: slip.issuedDate ? slip.issuedDate.toISOString() : undefined,
    };

    return NextResponse.json({ success: true, data: parsedSlip });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal membuat slip gaji" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !["super_admin", "SUPER_ADMIN", "admin", "admin,pendidik", "pendidik,admin"].includes(user.role)) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const body = await request.json();
    const { id, employeeId, month, year, baseSalary, allowances, deductions, status, notes, issuedDate } = body;

    if (!id) {
      return NextResponse.json({ error: "ID slip gaji diperlukan" }, { status: 400 });
    }

    const updateData: any = {};
    if (employeeId !== undefined) updateData.employeeId = employeeId;
    if (month !== undefined) updateData.month = Number(month);
    if (year !== undefined) updateData.year = Number(year);
    if (baseSalary !== undefined) updateData.baseSalary = Number(baseSalary);
    if (allowances !== undefined) updateData.allowances = JSON.stringify(allowances);
    if (deductions !== undefined) updateData.deductions = JSON.stringify(deductions);
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (issuedDate !== undefined) {
      updateData.issuedDate = issuedDate ? new Date(issuedDate) : null;
    } else if (status === "DITERBITKAN") {
      updateData.issuedDate = new Date();
    }

    const slip = await db.salarySlip.update({
      where: { id },
      data: updateData,
    });

    const parsedSlip = {
      ...slip,
      allowances: JSON.parse(slip.allowances),
      deductions: JSON.parse(slip.deductions),
      issuedDate: slip.issuedDate ? slip.issuedDate.toISOString() : undefined,
    };

    return NextResponse.json({ success: true, data: parsedSlip });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memperbarui slip gaji" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  return PUT(request);
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !["super_admin", "SUPER_ADMIN", "admin", "admin,pendidik", "pendidik,admin"].includes(user.role)) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });

    await db.salarySlip.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Slip gaji berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal hapus slip gaji" },
      { status: 500 }
    );
  }
}
