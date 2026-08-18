import fs from "fs";
import path from "path";
import * as cheerio from "cheerio";

const GURU_HTML = path.join(
  process.cwd(),
  "migration_data",
  "guru",
  "Database GTK & PTK Askara 0949356311c3835a9b8c01286d48f94e.html"
);

function testParseGtk() {
  const html = fs.readFileSync(GURU_HTML, "utf-8");
  const $ = cheerio.load(html);

  const headers: string[] = [];
  $("table thead th, table thead td").each((_, el) => {
    headers.push($(el).text().trim());
  });

  if (headers.length === 0) {
    $("table tr").first().find("th, td").each((_, el) => {
      headers.push($(el).text().trim());
    });
  }

  const rows: any[] = [];
  $("table tbody tr").each((rIdx, tr) => {
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

  console.log(`Parsed ${rows.length} GTK rows:\n`);
  rows.forEach((r, idx) => {
    console.log(`--- [GTK #${idx + 1}] ---`);
    console.log({
      Nama: r["Nama Lengkap"]?.text,
      JenisPTK: r["Jenis PTK"]?.text,
      Gender: r["Jenis Kelamin"]?.text,
      TempatLahir: r["Tempat Lahir"]?.text,
      TglLahir: r["Tanggal Lahir"]?.text,
      Email: r["Alamat Email"]?.text,
      HP: r["Nomor Telepon"]?.text,
      Pendidikan: r["Jenjang Pendidikan"]?.text,
      Jurusan: r["Jurusan"]?.text,
      Kampus: r["Kampus PTN/PTS"]?.text,
      FotoCloseUp: r["Foto Close Up"]?.links,
      FotoKTP: r["Foto KTP"]?.links,
      FotoKK: r["Foto KK"]?.links,
      FotoIjazah: r["Foto Ijazah"]?.links,
      Transkrip: r["Transkrip Nila"]?.links,
      Bank: r["Nama Bank"]?.text,
      NoRek: r["No Rekening Bank"]?.text,
    });
  });
}

testParseGtk();
