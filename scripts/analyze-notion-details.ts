import fs from "fs";
import path from "path";
import * as cheerio from "cheerio";

const GURU_HTML = path.join(
  process.cwd(),
  "migration_data",
  "guru",
  "Database GTK & PTK Askara 0949356311c3835a9b8c01286d48f94e.html"
);

const SISWA_HTML = path.join(
  process.cwd(),
  "migration_data",
  "siswa",
  "DAFTAR MURID PKBM ASKARA 3f49356311c3824fa655813fee59e05d.html"
);

function analyzeGtk() {
  console.log("=== ANALISIS DATA GTK & PTK (GURU & MANAJEMEN) ===");
  if (!fs.existsSync(GURU_HTML)) {
    console.log("File GTK tidak ditemukan:", GURU_HTML);
    return;
  }
  const html = fs.readFileSync(GURU_HTML, "utf-8");
  const $ = cheerio.load(html);
  const headers: string[] = [];
  $("table thead th, table tr:first-child th, table tr:first-child td").each((_, el) => {
    headers.push($(el).text().trim());
  });
  console.log("Total Kolom GTK:", headers.length);
  console.log("Daftar Kolom GTK:", headers);

  const rows: any[] = [];
  $("table tbody tr").each((_, tr) => {
    const row: Record<string, any> = {};
    $(tr).find("td").each((cIdx, td) => {
      const col = headers[cIdx] || `Col_${cIdx}`;
      const text = $(td).text().trim();
      const links: string[] = [];
      $(td).find("a").each((_, a) => {
        const h = $(a).attr("href");
        if (h) links.push(h);
      });
      row[col] = { text, links };
    });
    if (Object.keys(row).length > 0) rows.push(row);
  });

  console.log("Total Baris GTK:", rows.length);
  console.log("\nRingkasan Semua Baris GTK (Nama & Jenis PTK):");
  rows.forEach((r, idx) => {
    const name = r["Nama Lengkap"]?.text || r[headers[1]]?.text || "-";
    const ptk = r["Jenis PTK"]?.text || "-";
    const email = r["Alamat Email"]?.text || "-";
    const hp = r["Nomor Telepon"]?.text || "-";
    console.log(`${idx + 1}. [${ptk}] ${name} | Email: ${email} | HP: ${hp}`);
  });
}

function analyzeSiswa() {
  console.log("\n=== ANALISIS DATA SISWA (MURID PKBM ASKARA) ===");
  if (!fs.existsSync(SISWA_HTML)) {
    console.log("File Siswa tidak ditemukan:", SISWA_HTML);
    return;
  }
  const html = fs.readFileSync(SISWA_HTML, "utf-8");
  const $ = cheerio.load(html);
  const headers: string[] = [];
  $("table thead th, table tr:first-child th, table tr:first-child td").each((_, el) => {
    headers.push($(el).text().trim());
  });
  console.log("Total Kolom Siswa:", headers.length);
  console.log("Daftar Kolom Siswa:", headers);

  const rows: any[] = [];
  $("table tbody tr").each((_, tr) => {
    const row: Record<string, any> = {};
    $(tr).find("td").each((cIdx, td) => {
      const col = headers[cIdx] || `Col_${cIdx}`;
      const text = $(td).text().trim();
      const links: string[] = [];
      $(td).find("a").each((_, a) => {
        const h = $(a).attr("href");
        if (h) links.push(h);
      });
      row[col] = { text, links };
    });
    if (Object.keys(row).length > 0) rows.push(row);
  });

  console.log("Total Baris Siswa:", rows.length);
  console.log("\nSampel 10 Baris Siswa (Nama, NISN, Program, HP):");
  rows.slice(0, 10).forEach((r, idx) => {
    const name = r["Nama Lengkap"]?.text || r[headers[0]]?.text || r[headers[1]]?.text || "-";
    const nisn = r["NISN"]?.text || "-";
    const program = r["Program"]?.text || "-";
    const hp = r["No Telp/Wa Siswa"]?.text || r["No Telp/Wa Aktif"]?.text || "-";
    console.log(`${idx + 1}. ${name} | NISN: ${nisn} | Program: ${program} | HP: ${hp}`);
  });
}

analyzeGtk();
analyzeSiswa();
