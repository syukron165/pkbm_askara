import fs from "fs";
import path from "path";
import * as cheerio from "cheerio";

const GURU_DIR = path.join(process.cwd(), "migration_data", "guru");
const SISWA_DIR = path.join(process.cwd(), "migration_data", "siswa");
const MANAJEMEN_DIR = path.join(process.cwd(), "migration_data", "manajemen");

function findHtmlFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const results: string[] = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      results.push(...findHtmlFiles(fullPath));
    } else if (item.isFile() && item.name.endsWith(".html")) {
      results.push(fullPath);
    }
  }
  return results;
}

function scanHtmlFile(filePath: string) {
  console.log(`\n========================================`);
  console.log(`🔍 Memeriksa file: ${filePath}`);
  console.log(`========================================`);

  const content = fs.readFileSync(filePath, "utf-8");
  const $ = cheerio.load(content);

  // Check for <table> in HTML (Standard Notion Database Export)
  const tables = $("table");
  if (tables.length > 0) {
    tables.each((tIdx, table) => {
      const headers: string[] = [];
      $(table)
        .find("thead th, tr:first-child th, tr:first-child td")
        .each((_, th) => {
          const hText = $(th).text().trim();
          if (hText) headers.push(hText);
        });

      const rowsCount = $(table).find("tbody tr").length || $(table).find("tr").length - 1;
      console.log(`📊 Tabel #${tIdx + 1}: Ditemukan ${rowsCount} baris data.`);
      console.log(`📋 Kolom Notion yang terdeteksi:`);
      headers.forEach((h, i) => console.log(`   ${i + 1}. [${h}]`));

      // Sample first row
      const firstRow: Record<string, string> = {};
      const sampleTr = $(table).find("tbody tr").first();
      sampleTr.find("td").each((cIdx, td) => {
        const colName = headers[cIdx] || `Kolom_${cIdx + 1}`;
        const valText = $(td).text().trim();
        const links: string[] = [];
        $(td).find("a").each((_, a) => {
          const href = $(a).attr("href");
          if (href) links.push(href);
        });
        firstRow[colName] = links.length > 0 ? `${valText} (Link: ${links.join(", ")})` : valText;
      });

      console.log(`\n💡 Contoh 1 Baris Sampel Data:`);
      console.log(JSON.stringify(firstRow, null, 2));
    });
  } else {
    // If Notion exported as individual page HTML files
    console.log(`ℹ️ Bukan format tabel single-file. Memeriksa properti halaman Notion...`);
    const pageTitle = $("title, h1.page-title, header h1").first().text().trim();
    console.log(`📄 Judul Halaman / Nama: ${pageTitle}`);

    const properties: Record<string, string> = {};
    $("table.properties tr, div.page-body table tr").each((_, tr) => {
      const th = $(tr).find("th").text().trim();
      const td = $(tr).find("td").text().trim();
      if (th && td) properties[th] = td;
    });

    if (Object.keys(properties).length > 0) {
      console.log(`📋 Properti yang terdeteksi:`, properties);
    }
  }
}

function runScan() {
  console.log("🚀 MEMULAI PEMINDAIAN FOLDER EXPORT NOTION...");

  const guruFiles = findHtmlFiles(GURU_DIR);
  const siswaFiles = findHtmlFiles(SISWA_DIR);
  const manajemenFiles = findHtmlFiles(MANAJEMEN_DIR);

  console.log(`\n📁 File HTML Ditemukan:`);
  console.log(`- Data Guru: ${guruFiles.length} file`);
  console.log(`- Data Siswa: ${siswaFiles.length} file`);
  console.log(`- Data Manajemen: ${manajemenFiles.length} file`);

  if (guruFiles.length === 0 && siswaFiles.length === 0 && manajemenFiles.length === 0) {
    console.log("\n⚠️ Belum ada file HTML yang diekstrak ke dalam folder migration_data/.");
    console.log("Silakan ekstrak folder zip Notion Anda ke:");
    console.log("1. migration_data/guru/");
    console.log("2. migration_data/siswa/");
    return;
  }

  for (const f of guruFiles) scanHtmlFile(f);
  for (const f of siswaFiles) scanHtmlFile(f);
  for (const f of manajemenFiles) scanHtmlFile(f);
}

runScan();
