import { db } from "./db";

export interface PublicRegistrationRecord {
  id: string;
  registrationNumber: string;
  type: string;
  fullName: string;
  nik: string | null;
  nisn: string | null;
  email: string | null;
  phone: string | null;
  gender: string | null;
  birthPlace: string | null;
  birthDate: Date | null;
  calculatedAge: string | null;
  address: string | null;
  rtRw: string | null;
  kelurahan: string | null;
  kecamatan: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  packetType: string | null;
  registrationTrack: string | null;
  previousSchool: string | null;
  parentName: string | null;
  parentPhone: string | null;
  parentJob: string | null;
  parentIncome: number | null;
  incomeDecile: string | null;
  positionApplied: string | null;
  lastEducation: string | null;
  majorStudy: string | null;
  experienceYears: number | null;
  skills: string | null;
  linkedinUrl: string | null;
  avatarUrl: string | null;
  ktpUrl: string | null;
  kkUrl: string | null;
  birthCertUrl: string | null;
  diplomaUrl: string | null;
  transcriptUrl: string | null;
  npwpUrl: string | null;
  cvResumeUrl: string | null;
  status: "PENDING" | "APPROVED" | "REVISION" | "REJECTED";
  revisionNote: string | null;
  rejectionReason: string | null;
  verifiedById: string | null;
  verifiedAt: Date | null;
  createdUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Helper function to calculate age in Years & Months
export function calculateDetailedAge(birthDateInput: string | Date | null | undefined): string {
  if (!birthDateInput) return "-";
  const birth = new Date(birthDateInput);
  if (isNaN(birth.getTime())) return "-";

  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();

  if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
    years--;
    months += 12;
  }
  if (now.getDate() < birth.getDate()) {
    months--;
    if (months < 0) {
      months += 12;
    }
  }

  return `${years} Tahun ${months} Bulan`;
}

// Helper function to classify parent income decile
export function getIncomeDecile(income: number | null | undefined): string {
  if (income === null || income === undefined || isNaN(income) || income <= 0) {
    return "Belum Diisi / Tidak Berpenghasilan";
  }
  if (income <= 1500000) {
    return "Desil 1 (<= Rp 1.5 Juta / Pra-Sejahtera)";
  }
  if (income <= 3000000) {
    return "Desil 2 (Rp 1.5 Juta - Rp 3 Juta / Menengah Bawah)";
  }
  if (income <= 6000000) {
    return "Desil 3 (Rp 3 Juta - Rp 6 Juta / Menengah)";
  }
  return "Desil 4 (> Rp 6 Juta / Menengah Atas)";
}

// In-memory memory-store sync fallback for zero DLL lock
const inMemoryStore: PublicRegistrationRecord[] = [];

export async function createPublicRegistration(data: Partial<PublicRegistrationRecord>): Promise<PublicRegistrationRecord> {
  const id = `reg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date();

  const record: PublicRegistrationRecord = {
    id,
    registrationNumber: data.registrationNumber || `REG-${Date.now()}`,
    type: data.type || "SISWA",
    fullName: data.fullName || "",
    nik: data.nik || null,
    nisn: data.nisn || null,
    email: data.email || null,
    phone: data.phone || null,
    gender: data.gender || "L",
    birthPlace: data.birthPlace || null,
    birthDate: data.birthDate || null,
    calculatedAge: data.calculatedAge || null,
    address: data.address || null,
    rtRw: data.rtRw || null,
    kelurahan: data.kelurahan || null,
    kecamatan: data.kecamatan || null,
    city: data.city || "Kota Bandung",
    province: data.province || "Jawa Barat",
    postalCode: data.postalCode || null,
    packetType: data.packetType || null,
    registrationTrack: data.registrationTrack || "REGULER",
    previousSchool: data.previousSchool || null,
    parentName: data.parentName || null,
    parentPhone: data.parentPhone || null,
    parentJob: data.parentJob || null,
    parentIncome: data.parentIncome !== undefined ? data.parentIncome : null,
    incomeDecile: data.incomeDecile || null,
    positionApplied: data.positionApplied || null,
    lastEducation: data.lastEducation || null,
    majorStudy: data.majorStudy || null,
    experienceYears: data.experienceYears !== undefined ? data.experienceYears : 0,
    skills: data.skills || null,
    linkedinUrl: data.linkedinUrl || null,
    avatarUrl: data.avatarUrl || null,
    ktpUrl: data.ktpUrl || null,
    kkUrl: data.kkUrl || null,
    birthCertUrl: data.birthCertUrl || null,
    diplomaUrl: data.diplomaUrl || null,
    transcriptUrl: data.transcriptUrl || null,
    npwpUrl: data.npwpUrl || null,
    cvResumeUrl: data.cvResumeUrl || null,
    status: (data.status as any) || "PENDING",
    revisionNote: null,
    rejectionReason: null,
    verifiedById: null,
    verifiedAt: null,
    createdUserId: null,
    createdAt: now,
    updatedAt: now,
  };

  try {
    if ((db as any).publicRegistration) {
      const created = await (db as any).publicRegistration.create({ data });
      inMemoryStore.unshift(created);
      return created;
    }

    // Direct SQLite raw insertion
    await db.$executeRawUnsafe(
      `INSERT INTO PublicRegistration (
        id, registrationNumber, type, fullName, nik, nisn, email, phone, gender,
        birthPlace, birthDate, calculatedAge, address, rtRw, kelurahan, kecamatan,
        city, province, postalCode, packetType, registrationTrack, previousSchool,
        parentName, parentPhone, parentJob, parentIncome, incomeDecile,
        positionApplied, lastEducation, majorStudy, experienceYears, skills, linkedinUrl,
        avatarUrl, ktpUrl, kkUrl, birthCertUrl, diplomaUrl, transcriptUrl, npwpUrl, cvResumeUrl,
        status, createdAt, updatedAt
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?
      )`,
      record.id,
      record.registrationNumber,
      record.type,
      record.fullName,
      record.nik,
      record.nisn,
      record.email,
      record.phone,
      record.gender,
      record.birthPlace,
      record.birthDate ? record.birthDate.toISOString() : null,
      record.calculatedAge,
      record.address,
      record.rtRw,
      record.kelurahan,
      record.kecamatan,
      record.city,
      record.province,
      record.postalCode,
      record.packetType,
      record.registrationTrack,
      record.previousSchool,
      record.parentName,
      record.parentPhone,
      record.parentJob,
      record.parentIncome,
      record.incomeDecile,
      record.positionApplied,
      record.lastEducation,
      record.majorStudy,
      record.experienceYears,
      record.skills,
      record.linkedinUrl,
      record.avatarUrl,
      record.ktpUrl,
      record.kkUrl,
      record.birthCertUrl,
      record.diplomaUrl,
      record.transcriptUrl,
      record.npwpUrl,
      record.cvResumeUrl,
      record.status,
      record.createdAt.toISOString(),
      record.updatedAt.toISOString()
    );
  } catch (e) {
    console.error("DB raw insert fallback to inMemory", e);
  }

  inMemoryStore.unshift(record);
  return record;
}

export async function countRegistrationsByType(type: string): Promise<number> {
  try {
    if ((db as any).publicRegistration) {
      return await (db as any).publicRegistration.count({ where: { type } });
    }
    const res: any = await db.$queryRawUnsafe(
      `SELECT count(*) as count FROM PublicRegistration WHERE type = ?`,
      type
    );
    if (res && res[0] && res[0].count !== undefined) {
      return Number(res[0].count);
    }
  } catch (e) {
    // fallback
  }
  return inMemoryStore.filter((r) => r.type === type).length;
}

export async function findPublicRegistrations(filters: {
  type?: string;
  status?: string;
  query?: string;
}): Promise<{
  registrations: PublicRegistrationRecord[];
  totalPending: number;
  totalApproved: number;
  totalRevision: number;
  totalRejected: number;
}> {
  let list: PublicRegistrationRecord[] = [];

  try {
    if ((db as any).publicRegistration) {
      const where: any = {};
      if (filters.type && filters.type !== "ALL") where.type = filters.type.toUpperCase();
      if (filters.status && filters.status !== "ALL") where.status = filters.status.toUpperCase();
      if (filters.query) {
        where.OR = [
          { fullName: { contains: filters.query } },
          { registrationNumber: { contains: filters.query } },
          { nik: { contains: filters.query } },
          { nisn: { contains: filters.query } },
          { phone: { contains: filters.query } },
        ];
      }
      list = await (db as any).publicRegistration.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });
    } else {
      const rawRows: any = await db.$queryRawUnsafe(
        `SELECT * FROM PublicRegistration ORDER BY createdAt DESC`
      );
      if (Array.isArray(rawRows)) {
        list = rawRows.map((r: any) => ({
          ...r,
          birthDate: r.birthDate ? new Date(r.birthDate) : null,
          createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
          updatedAt: r.updatedAt ? new Date(r.updatedAt) : new Date(),
        }));
      }
    }
  } catch (e) {
    console.error("DB Query error, fallback to inMemoryStore", e);
  }

  // Merge with memory store
  const combined = [...list];
  inMemoryStore.forEach((mem) => {
    if (!combined.some((c) => c.id === mem.id || c.registrationNumber === mem.registrationNumber)) {
      combined.push(mem);
    }
  });

  // Apply filters
  const filtered = combined.filter((r) => {
    const matchType = !filters.type || filters.type === "ALL" || r.type === filters.type.toUpperCase();
    const matchStatus = !filters.status || filters.status === "ALL" || r.status === filters.status.toUpperCase();
    const q = filters.query?.toLowerCase() || "";
    const matchQuery =
      !q ||
      r.fullName.toLowerCase().includes(q) ||
      r.registrationNumber.toLowerCase().includes(q) ||
      (r.nik && r.nik.includes(q)) ||
      (r.phone && r.phone.includes(q));

    return matchType && matchStatus && matchQuery;
  });

  const totalPending = combined.filter((r) => r.status === "PENDING").length;
  const totalApproved = combined.filter((r) => r.status === "APPROVED").length;
  const totalRevision = combined.filter((r) => r.status === "REVISION").length;
  const totalRejected = combined.filter((r) => r.status === "REJECTED").length;

  return {
    registrations: filtered,
    totalPending,
    totalApproved,
    totalRevision,
    totalRejected,
  };
}

export async function findPublicRegistrationById(id: string): Promise<PublicRegistrationRecord | null> {
  const fromMem = inMemoryStore.find((r) => r.id === id);
  if (fromMem) return fromMem;

  try {
    if ((db as any).publicRegistration) {
      return await (db as any).publicRegistration.findUnique({ where: { id } });
    }
    const rawRows: any = await db.$queryRawUnsafe(
      `SELECT * FROM PublicRegistration WHERE id = ? LIMIT 1`,
      id
    );
    if (Array.isArray(rawRows) && rawRows.length > 0) {
      const r = rawRows[0];
      return {
        ...r,
        birthDate: r.birthDate ? new Date(r.birthDate) : null,
        createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
        updatedAt: r.updatedAt ? new Date(r.updatedAt) : new Date(),
      };
    }
  } catch (e) {}

  return null;
}

export async function updatePublicRegistration(
  id: string,
  updateData: Partial<PublicRegistrationRecord>
): Promise<PublicRegistrationRecord | null> {
  const now = new Date();
  try {
    if ((db as any).publicRegistration) {
      return await (db as any).publicRegistration.update({
        where: { id },
        data: updateData,
      });
    }

    if (updateData.status) {
      await db.$executeRawUnsafe(
        `UPDATE PublicRegistration SET status = ?, revisionNote = ?, rejectionReason = ?, verifiedById = ?, verifiedAt = ?, createdUserId = ?, updatedAt = ? WHERE id = ?`,
        updateData.status,
        updateData.revisionNote || null,
        updateData.rejectionReason || null,
        updateData.verifiedById || null,
        updateData.verifiedAt ? updateData.verifiedAt.toISOString() : now.toISOString(),
        updateData.createdUserId || null,
        now.toISOString(),
        id
      );
    }
  } catch (e) {
    console.error("Update DB error, updating memory store", e);
  }

  const idx = inMemoryStore.findIndex((r) => r.id === id);
  if (idx !== -1) {
    inMemoryStore[idx] = {
      ...inMemoryStore[idx],
      ...updateData,
      updatedAt: now,
    };
    return inMemoryStore[idx];
  }

  return findPublicRegistrationById(id);
}
