import fs from "fs";
import path from "path";
import * as cheerio from "cheerio";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const GURU_DIR = path.join(process.cwd(), "migration_data", "guru");
const SISWA_DIR = path.join(process.cwd(), "migration_data", "siswa");

const UPLOAD_GURU_DEST = path.join(process.cwd(), "public", "uploads", "notion", "guru");
const UPLOAD_SISWA_DEST = path.join(process.cwd(), "public", "uploads", "notion", "siswa");

if (!fs.existsSync(UPLOAD_GURU_DEST)) fs.mkdirSync(UPLOAD_GURU_DEST, { recursive: true });
if (!fs.existsSync(UPLOAD_SISWA_DEST)) fs.mkdirSync(UPLOAD_SISWA_DEST, { recursive: true });

function parseDate(str?: string): Date | null {
  if (!str) return null;
  const cleaned = str.trim();
  if (!cleaned) return null;
  const d = new Date(cleaned);
  if (!isNaN(d.getTime())) return d;
  // Try DD/MM/YYYY or DD-MM-YYYY
  const parts = cleaned.split(/[\/\-]/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const altD = new Date(year, month, day);
    if (!isNaN(altD.getTime())) return altD;
  }
  return null;
}

function copyLocalFile(sourceDir: string, destDir: string, link: string, urlPrefix: string, isDryRun: boolean): string {
  if (!link) return "";
  const trimmed = link.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  try {
    const decoded = decodeURIComponent(trimmed);
    const srcPath = path.join(sourceDir, decoded);
    if (fs.existsSync(srcPath) && fs.statSync(srcPath).isFile()) {
      const safeName = path.basename(decoded).replace(/[^a-zA-Z0-9._-]/g, "_");
      const targetPath = path.join(destDir, safeName);
      if (!isDryRun) {
        fs.copyFileSync(srcPath, targetPath);
      }
      return `${urlPrefix}/${safeName}`;
    }
  } catch (e) {
    // Ignore error
  }
  return trimmed;
}

function resolveFirstDoc(links: string[] | undefined, sourceDir: string, destDir: string, urlPrefix: string, isDryRun: boolean): string {
  if (!links || links.length === 0) return "";
  for (const l of links) {
    const res = copyLocalFile(sourceDir, destDir, l, urlPrefix, isDryRun);
    if (res) return res;
  }
  return "";
}

function normalizeGender(g?: string): "L" | "P" {
  if (!g) return "L";
  const upper = g.toUpperCase().trim();
  if (upper.startsWith("P") || upper.includes("PEREMPUAN") || upper.includes("WANITA")) return "P";
  return "L";
}

function normalizePacket(p?: string): "Paket A" | "Paket B" | "Paket C" {
  if (!p) return "Paket C";
  const upper = p.toUpperCase().trim();
  if (upper.includes("PAKET A") || upper.includes("SD")) return "Paket A";
  if (upper.includes("PAKET B") || upper.includes("SMP")) return "Paket B";
  return "Paket C";
}

// ─────────────────────────────────────────────────────────────
// 1. MIGRASI DATA GTK & PTK (GURU & MANAJEMEN)
// ─────────────────────────────────────────────────────────────
async function migrateGtk(isDryRun: boolean) {
  console.log("\n=======================================================");
  console.log(`🚀 [1/2] MEMPROSES MIGRASI DATA GTK & PTK (GURU & MANAJEMEN)`);
  console.log(`Mode: ${isDryRun ? "DRY-RUN (Simulasi saja)" : "EKSEKUSI (Menyimpan ke Database)"}`);
  console.log("=======================================================");

  const files = fs.readdirSync(GURU_DIR).filter((f) => f.endsWith(".html"));
  if (files.length === 0) {
    console.log("❌ Tidak ditemukan file HTML di folder migration_data/guru/");
    return;
  }

  const htmlPath = path.join(GURU_DIR, files[0]);
  const html = fs.readFileSync(htmlPath, "utf-8");
  const $ = cheerio.load(html);

  const headers: string[] = [];
  $("table thead th, table thead td, table tr:first-child th, table tr:first-child td").each((_, el) => {
    headers.push($(el).text().trim());
  });

  const rows: any[] = [];
  $("table tbody tr").each((_, tr) => {
    const cells = $(tr).find("td");
    if (cells.length === 0) return;
    const row: Record<string, { text: string; links: string[] }> = {};
    cells.each((cIdx, td) => {
      const col = headers[cIdx] || `Col_${cIdx}`;
      const text = $(td).text().trim();
      const links: string[] = [];
      $(td).find("a").each((_, a) => {
        const href = $(a).attr("href");
        if (href) links.push(href);
      });
      $(td).find("img").each((_, img) => {
        const src = $(img).attr("src");
        if (src) links.push(src);
      });
      row[col] = { text, links };
    });
    if (Object.keys(row).length > 0) rows.push(row);
  });

  console.log(`📋 Ditemukan ${rows.length} baris data GTK di Notion.`);
  let successCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const name = r["Nama Lengkap"]?.text || "";
    if (!name || name.length < 2) {
      skippedCount++;
      continue;
    }

    const emailRaw = r["Alamat Email"]?.text?.trim() || "";
    let email = emailRaw && emailRaw.includes("@")
      ? emailRaw.toLowerCase()
      : `gtk.${name.toLowerCase().replace(/[^a-z0-9]/g, "")}.${i + 1}@askara.sch.id`;

    if (!isDryRun) {
      const existingUserWithEmail = await prisma.user.findUnique({ where: { email } });
      if (existingUserWithEmail && existingUserWithEmail.name.toLowerCase() !== name.toLowerCase()) {
        email = `gtk.${name.toLowerCase().replace(/[^a-z0-9]/g, "")}.${i + 1}@askara.sch.id`;
      }
    }

    const phone = r["Nomor Telepon"]?.text?.trim() || "";
    const ptkType = r["Jenis PTK"]?.text?.trim() || "";
    const isPendidik =
      ptkType.toLowerCase().includes("guru") ||
      ptkType.toLowerCase().includes("tutor") ||
      ptkType.toLowerCase().includes("pendidik");

    const role = isPendidik ? "pendidik" : "admin";
    const regType = isPendidik ? "TUTOR" : "MANAJEMEN";

    const gender = normalizeGender(r["Jenis Kelamin"]?.text);
    const birthPlace = r["Tempat Lahir"]?.text || "Bandung";
    const birthDate = parseDate(r["Tanggal Lahir"]?.text);
    const nikRaw = r["NIK"]?.text?.replace(/[^0-9]/g, "") || r["No KTP"]?.text?.replace(/[^0-9]/g, "") || "";
    const nik = nikRaw && nikRaw !== "0" && nikRaw.length >= 10 ? nikRaw : null;

    const address = r["Alamat Lengkap"]?.text || "";
    const kecamatan = r["Kecamatan"]?.text || "";
    const city = r["Kabupaten/Kota"]?.text || "Kabupaten Bandung";
    const province = r["Propinsi"]?.text || "Jawa Barat";
    const postalCode = r["Kodepos"]?.text || "";

    const lastEducation = r["Jenjang Pendidikan"]?.text || "S1";
    const majorStudy = r["Jurusan"]?.text || "";
    const universityName = r["Kampus PTN/PTS"]?.text || "";

    const bankName = r["Nama Bank"]?.text || "";
    const bankAccountNumber = r["No Rekening Bank"]?.text || "";

    // Berkas Lampiran
    const avatarUrl = resolveFirstDoc(r["Foto Close Up"]?.links, GURU_DIR, UPLOAD_GURU_DEST, "/uploads/notion/guru", isDryRun);
    const ktpUrl = resolveFirstDoc(r["Foto KTP"]?.links, GURU_DIR, UPLOAD_GURU_DEST, "/uploads/notion/guru", isDryRun);
    const kkUrl = resolveFirstDoc(r["Foto KK"]?.links, GURU_DIR, UPLOAD_GURU_DEST, "/uploads/notion/guru", isDryRun);
    const diplomaUrl = resolveFirstDoc(r["Foto Ijazah"]?.links, GURU_DIR, UPLOAD_GURU_DEST, "/uploads/notion/guru", isDryRun);
    const transcriptUrl = resolveFirstDoc(r["Transkrip Nila"]?.links, GURU_DIR, UPLOAD_GURU_DEST, "/uploads/notion/guru", isDryRun);
    const npwpUrl = resolveFirstDoc(r["Foto NPWP"]?.links, GURU_DIR, UPLOAD_GURU_DEST, "/uploads/notion/guru", isDryRun);

    const regNumber = `REG-${regType}-${new Date().getFullYear()}${String(i + 1).padStart(3, "0")}`;

    console.log(`[${i + 1}/${rows.length}] ${regType} -> ${name} (${email}) | Posisi: ${ptkType || "Tutor"}`);

    if (!isDryRun) {
      const defaultPassword = await bcrypt.hash("askara123", 10);

      let userNik = nik;
      if (userNik) {
        const existingNik = await prisma.user.findUnique({ where: { nik: userNik } });
        if (existingNik && existingNik.email !== email) {
          userNik = null;
        }
      }

      // Upsert User
      const user = await prisma.user.upsert({
        where: { email },
        update: {
          name,
          role,
          phone: phone || undefined,
          gender,
          birthPlace,
          birthDate: birthDate || undefined,
          address: address || undefined,
          avatarUrl: avatarUrl || undefined,
          isActive: true,
        },
        create: {
          email,
          passwordHash: defaultPassword,
          name,
          role,
          phone: phone || undefined,
          nik: userNik || undefined,
          gender,
          birthPlace,
          birthDate: birthDate || undefined,
          address: address || undefined,
          avatarUrl: avatarUrl || undefined,
          isActive: true,
        },
      });

      // Upsert PublicRegistration
      const existingReg = await prisma.publicRegistration.findFirst({
        where: { createdUserId: user.id },
      });

      const regPayload = {
        registrationNumber: existingReg ? existingReg.registrationNumber : regNumber,
        type: regType,
        fullName: name,
        nik: nik || user.nik || null,
        email: user.email,
        phone: phone || null,
        gender,
        birthPlace,
        birthDate: birthDate || null,
        address: address || null,
        kecamatan: kecamatan || null,
        city: city || "Kabupaten Bandung",
        province: province || "Jawa Barat",
        postalCode: postalCode || null,
        positionApplied: ptkType || (isPendidik ? "Tutor" : "Staf Manajemen"),
        lastEducation,
        majorStudy,
        universityName,
        bankName,
        bankAccountNumber,
        avatarUrl: avatarUrl || null,
        ktpUrl: ktpUrl || null,
        kkUrl: kkUrl || null,
        diplomaUrl: diplomaUrl || null,
        transcriptUrl: transcriptUrl || null,
        npwpUrl: npwpUrl || null,
        status: "APPROVED",
        createdUserId: user.id,
      };

      if (existingReg) {
        await prisma.publicRegistration.update({
          where: { id: existingReg.id },
          data: regPayload,
        });
      } else {
        await prisma.publicRegistration.create({
          data: regPayload,
        });
      }
    }
    successCount++;
  }

  console.log(`\n✅ Selesai memproses GTK: ${successCount} berhasil diproses, ${skippedCount} dilewati.`);
}

// ─────────────────────────────────────────────────────────────
// 2. MIGRASI DATA SISWA (MURID PKBM ASKARA)
// ─────────────────────────────────────────────────────────────
async function migrateSiswa(isDryRun: boolean) {
  console.log("\n=======================================================");
  console.log(`🚀 [2/2] MEMPROSES MIGRASI DATA PESERTA DIDIK (SISWA)`);
  console.log(`Mode: ${isDryRun ? "DRY-RUN (Simulasi saja)" : "EKSEKUSI (Menyimpan ke Database)"}`);
  console.log("=======================================================");

  const files = fs.readdirSync(SISWA_DIR).filter((f) => f.endsWith(".html"));
  if (files.length === 0) {
    console.log("❌ Tidak ditemukan file HTML di folder migration_data/siswa/");
    return;
  }

  const htmlPath = path.join(SISWA_DIR, files[0]);
  const html = fs.readFileSync(htmlPath, "utf-8");
  const $ = cheerio.load(html);

  const headers: string[] = [];
  $("table thead th, table thead td, table tr:first-child th, table tr:first-child td").each((_, el) => {
    headers.push($(el).text().trim());
  });

  const rows: any[] = [];
  $("table tbody tr").each((_, tr) => {
    const cells = $(tr).find("td");
    if (cells.length === 0) return;
    const row: Record<string, { text: string; links: string[] }> = {};
    cells.each((cIdx, td) => {
      const col = headers[cIdx] || `Col_${cIdx}`;
      const text = $(td).text().trim();
      const links: string[] = [];
      $(td).find("a").each((_, a) => {
        const href = $(a).attr("href");
        if (href) links.push(href);
      });
      $(td).find("img").each((_, img) => {
        const src = $(img).attr("src");
        if (src) links.push(src);
      });
      row[col] = { text, links };
    });
    if (Object.keys(row).length > 0) rows.push(row);
  });

  console.log(`📋 Ditemukan ${rows.length} baris data Murid di Notion.`);
  let successCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const name = r["Nama"]?.text || "";
    if (!name || name.length < 2) {
      skippedCount++;
      continue;
    }

    const nisnRaw = r["No. NISN"]?.text?.replace(/[^0-9]/g, "") || "";
    const nisn = nisnRaw && nisnRaw !== "0" && nisnRaw.length >= 4 ? nisnRaw : null;

    const nikRaw = r["No. NIK"]?.text?.replace(/[^0-9]/g, "") || "";
    const nik = nikRaw && nikRaw !== "0" && nikRaw.length >= 10 ? nikRaw : null;
    const gender = normalizeGender(r["Jenis Kelamin"]?.text);
    const packetType = normalizePacket(r["Program"]?.text);

    const emailRaw = r["E-Mail Ibu"]?.text || r["E-Mail Ayah"]?.text || "";
    let email = emailRaw && emailRaw.includes("@")
      ? emailRaw.toLowerCase().trim()
      : nisn
      ? `siswa.${nisn}@askara.sch.id`
      : `siswa.${name.toLowerCase().replace(/[^a-z0-9]/g, "")}.${i + 1}@askara.sch.id`;

    // Avoid duplicate email collision with another user
    if (!isDryRun) {
      const existingUserWithEmail = await prisma.user.findUnique({ where: { email } });
      if (existingUserWithEmail && existingUserWithEmail.name.toLowerCase() !== name.toLowerCase()) {
        email = `siswa.${name.toLowerCase().replace(/[^a-z0-9]/g, "")}.${i + 1}@askara.sch.id`;
      }
    }

    const phone = r["No Telp/Wa Siswa"]?.text || r["No Telp/Wa Aktif"]?.text || "";
    const birthPlace = r["Tempat Lahir"]?.text || "Bandung";
    const birthDate = parseDate(r["Tanggal Lahir"]?.text);
    const religion = r["Agama"]?.text || "Islam";

    // Alamat
    const address = r["Alamat lengkap"]?.text || "";
    const rt = r["RT"]?.text || "";
    const rw = r["RW"]?.text || "";
    const rtRw = rt || rw ? `RT ${rt}/RW ${rw}` : "";
    const kelurahan = r["Kelurahan/desa"]?.text || "";
    const kecamatan = r["Kecamatan"]?.text || "";
    const city = r["kota/kabupaten (1)"]?.text || r["kota/kabupaten"]?.text || "Kabupaten Bandung";
    const province = "Jawa Barat";
    const postalCode = r["Kode Pos"]?.text || "";

    // Data Orang Tua
    const fatherName = r["Nama ayah"]?.text || "";
    const fatherJob = r["Pekerjaan ayah"]?.text || r["Pekerjaan Ayah"]?.text || "";
    const fatherIncome = r["Penghasilan Ayah"]?.text || r["Rerarata Penghasilan Orang Tua Siswa Perbulannya"]?.text || "";

    const motherName = r["Nama lengkap Ibu Kandung"]?.text || "";
    const motherJob = r["Pekerjaan Ibu"]?.text || "";
    const motherIncome = r["Penghasilan Ibu"]?.text || r["Penghasilan ibu"]?.text || "";

    const guardianName = r["Nama wali"]?.text || "";
    const guardianJob = r["Pekerjaan wali"]?.text || "";

    const parentName = fatherName || motherName || guardianName || "Orang Tua Siswa";

    // Asal Sekolah & Fisik
    const previousSchool = r["Asal sekolah smp"]?.text || r["Asal sekolah SD"]?.text || r["Sekolah Asal"]?.text || "";
    const previousSchoolAddress = r["Alamat sekolah SMP"]?.text || r["Alamat Sekolah SD"]?.text || "";
    const mutationFrom = r["Pindah Sekolah Dari"]?.text || "";
    const heightCm = parseFloat(r["Tinggi Badan"]?.text || "160") || 160;
    const weightKg = parseFloat(r["Berat Badan"]?.text || "50") || 50;

    // Dokumen Siswa
    const avatarUrl = resolveFirstDoc(r["Foto Siswa"]?.links, SISWA_DIR, UPLOAD_SISWA_DEST, "/uploads/notion/siswa", isDryRun);
    const kkUrl = resolveFirstDoc(r["Foto kartu keluarga"]?.links, SISWA_DIR, UPLOAD_SISWA_DEST, "/uploads/notion/siswa", isDryRun);
    const birthCertUrl = resolveFirstDoc(r["foto akta lahir"]?.links, SISWA_DIR, UPLOAD_SISWA_DEST, "/uploads/notion/siswa", isDryRun);
    const diplomaUrl = resolveFirstDoc(
      [...(r["Foto ijazah SMP/SKL"]?.links || []), ...(r["Foto Ijazah SD"]?.links || [])],
      SISWA_DIR,
      UPLOAD_SISWA_DEST,
      "/uploads/notion/siswa",
      isDryRun
    );
    const parentKtpUrl = resolveFirstDoc(
      [...(r["Foto Ktp ayah"]?.links || []), ...(r["Foto KTP Ibu"]?.links || [])],
      SISWA_DIR,
      UPLOAD_SISWA_DEST,
      "/uploads/notion/siswa",
      isDryRun
    );

    const regNumber = `REG-SISWA-${new Date().getFullYear()}${String(i + 1).padStart(4, "0")}`;

    console.log(`[${i + 1}/${rows.length}] SISWA -> ${name} | ${packetType} | NISN: ${nisn || "-"}`);

    if (!isDryRun) {
      const defaultPassword = await bcrypt.hash(nisn || "askara123", 10);

      // Check NIK uniqueness for User
      let userNik = nik;
      if (userNik) {
        const existingNik = await prisma.user.findUnique({ where: { nik: userNik } });
        if (existingNik && existingNik.email !== email) {
          userNik = null;
        }
      }

      // Upsert User for Student
      const user = await prisma.user.upsert({
        where: { email },
        update: {
          name,
          phone: phone || undefined,
          gender,
          birthPlace,
          birthDate: birthDate || undefined,
          address: address || undefined,
          avatarUrl: avatarUrl || undefined,
          isActive: true,
        },
        create: {
          email,
          passwordHash: defaultPassword,
          name,
          role: "siswa",
          phone: phone || undefined,
          nik: userNik || undefined,
          gender,
          birthPlace,
          birthDate: birthDate || undefined,
          address: address || undefined,
          avatarUrl: avatarUrl || undefined,
          isActive: true,
        },
      });

      // Check NISN uniqueness for Student
      let studentNisn = nisn;
      if (studentNisn) {
        const existingNisn = await prisma.student.findUnique({ where: { nisn: studentNisn } });
        if (existingNisn && existingNisn.userId !== user.id) {
          studentNisn = null;
        }
      }

      // Upsert Student Profile
      const student = await prisma.student.upsert({
        where: { userId: user.id },
        update: {
          nisn: studentNisn || undefined,
          nik: userNik || user.nik || undefined,
          gender,
          birthPlace,
          birthDate: birthDate || undefined,
          address: address || undefined,
          packetType,
          status: "ACTIVE",
        },
        create: {
          userId: user.id,
          nisn: studentNisn || undefined,
          nik: userNik || user.nik || undefined,
          gender,
          birthPlace,
          birthDate: birthDate || undefined,
          address: address || undefined,
          packetType,
          status: "ACTIVE",
        },
      });

      // Upsert PublicRegistration
      const existingReg = await prisma.publicRegistration.findFirst({
        where: { createdUserId: user.id },
      });

      const regPayload = {
        registrationNumber: existingReg ? existingReg.registrationNumber : regNumber,
        type: "SISWA",
        fullName: name,
        nik: nik || user.nik || null,
        nisn: nisn || null,
        email: user.email,
        phone: phone || null,
        gender,
        birthPlace,
        birthDate: birthDate || null,
        address: address || null,
        rtRw: rtRw || null,
        kelurahan: kelurahan || null,
        kecamatan: kecamatan || null,
        city: city || "Kabupaten Bandung",
        province: province || "Jawa Barat",
        postalCode: postalCode || null,
        packetType,
        registrationTrack: "REGULER",
        previousSchool: previousSchool || null,
        previousSchoolAddress: previousSchoolAddress || null,
        mutationFrom: mutationFrom || null,
        parentName: parentName || null,
        parentPhone: phone || null,
        parentJob: fatherJob || motherJob || guardianJob || null,
        fatherIncome: fatherIncome || null,
        motherIncome: motherIncome || null,
        motherName: motherName || null,
        guardianName: guardianName || null,
        religion: religion || "Islam",
        heightCm,
        weightKg,
        avatarUrl: avatarUrl || null,
        parentKtpUrl: parentKtpUrl || null,
        kkUrl: kkUrl || null,
        birthCertUrl: birthCertUrl || null,
        diplomaUrl: diplomaUrl || null,
        status: "APPROVED",
        createdUserId: user.id,
      };

      if (existingReg) {
        await prisma.publicRegistration.update({
          where: { id: existingReg.id },
          data: regPayload,
        });
      } else {
        await prisma.publicRegistration.create({
          data: regPayload,
        });
      }
    }
    successCount++;
  }

  console.log(`\n✅ Selesai memproses Siswa: ${successCount} berhasil diproses, ${skippedCount} dilewati.`);
}

async function main() {
  const isDryRun = !process.argv.includes("--execute");
  console.log("=======================================================");
  console.log("🏁 MIGRATOR DATA NOTION -> DATABASE PKBM ASKARA");
  console.log("=======================================================");

  await migrateGtk(isDryRun);
  await migrateSiswa(isDryRun);

  if (isDryRun) {
    console.log("\n💡 INFO: Ini adalah mode DRY-RUN (simulasi). Tidak ada data database yang diubah.");
    console.log("Untuk mengeksekusi impor ke database nyata, jalankan:");
    console.log("npx tsx scripts/migrate-notion.ts --execute");
  } else {
    console.log("\n🎉 SELURUH DATA NOTION BERHASIL DIIMPOR KE DATABASE PKBM ASKARA!");
  }
}

main()
  .catch((err) => {
    console.error("❌ Terjadi Error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
