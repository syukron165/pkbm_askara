import fs from "fs";
import path from "path";
import * as cheerio from "cheerio";

const SISWA_HTML = path.join(
  process.cwd(),
  "migration_data",
  "siswa",
  "DAFTAR MURID PKBM ASKARA 3f49356311c3824fa655813fee59e05d.html"
);

function testParseSiswa() {
  const html = fs.readFileSync(SISWA_HTML, "utf-8");
  const $ = cheerio.load(html);

  // In Notion HTML table, the <thead> or first <tr> has the headers.
  // But wait! Sometimes Notion puts header cells in <th class="cell-title"> etc.
  const headers: string[] = [];
  $("table thead th, table thead td").each((_, el) => {
    headers.push($(el).text().trim());
  });

  if (headers.length === 0) {
    $("table tr").first().find("th, td").each((_, el) => {
      headers.push($(el).text().trim());
    });
  }

  console.log(`Found ${headers.length} headers.`);

  const rows: any[] = [];
  $("table tbody tr").each((rIdx, tr) => {
    // If no <tbody>, all <tr> except first
    const cells = $(tr).find("td");
    if (cells.length === 0) return;

    const rowObj: Record<string, { text: string; links: string[] }> = {};
    cells.each((cIdx, td) => {
      const colName = headers[cIdx] || `Col_${cIdx}`;
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
      rowObj[colName] = { text, links };
    });
    rows.push(rowObj);
  });

  console.log(`Parsed ${rows.length} student rows.`);
  console.log(`Sample parsed row #1:`);
  console.log({
    Nama: rows[0]["Nama"]?.text,
    ID: rows[0]["ID"]?.text,
    NISN: rows[0]["No. NISN"]?.text,
    NIK: rows[0]["No. NIK"]?.text,
    Program: rows[0]["Program"]?.text,
    Gender: rows[0]["Jenis Kelamin"]?.text,
    TempatLahir: rows[0]["Tempat Lahir"]?.text,
    TglLahir: rows[0]["Tanggal Lahir"]?.text,
    Alamat: rows[0]["Alamat lengkap"]?.text,
    Kecamatan: rows[0]["Kecamatan"]?.text,
    Kota: rows[0]["kota/kabupaten (1)"]?.text || rows[0]["kota/kabupaten"]?.text,
    HP: rows[0]["No Telp/Wa Siswa"]?.text || rows[0]["No Telp/Wa Aktif"]?.text,
    Ayah: rows[0]["Nama ayah"]?.text,
    Ibu: rows[0]["Nama lengkap Ibu Kandung"]?.text,
    FotoSiswa: rows[0]["Foto Siswa"]?.links,
    FotoKK: rows[0]["Foto kartu keluarga"]?.links,
    FotoAkta: rows[0]["foto akta lahir"]?.links,
    FotoIjazah: rows[0]["Foto ijazah SMP/SKL"]?.links || rows[0]["Foto Ijazah SD"]?.links,
  });

  console.log(`\nSample parsed row #2:`);
  console.log({
    Nama: rows[1]["Nama"]?.text,
    ID: rows[1]["ID"]?.text,
    NISN: rows[1]["No. NISN"]?.text,
    NIK: rows[1]["No. NIK"]?.text,
    Program: rows[1]["Program"]?.text,
    Gender: rows[1]["Jenis Kelamin"]?.text,
    TempatLahir: rows[1]["Tempat Lahir"]?.text,
    TglLahir: rows[1]["Tanggal Lahir"]?.text,
    Alamat: rows[1]["Alamat lengkap"]?.text,
    Kecamatan: rows[1]["Kecamatan"]?.text,
    Kota: rows[1]["kota/kabupaten (1)"]?.text || rows[1]["kota/kabupaten"]?.text,
    HP: rows[1]["No Telp/Wa Siswa"]?.text || rows[1]["No Telp/Wa Aktif"]?.text,
    Ayah: rows[1]["Nama ayah"]?.text,
    Ibu: rows[1]["Nama lengkap Ibu Kandung"]?.text,
    FotoSiswa: rows[1]["Foto Siswa"]?.links,
  });
}

testParseSiswa();
