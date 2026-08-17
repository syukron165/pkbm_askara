import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const MAX_SIZE_BYTES = 75 * 1024 * 1024; // 75 MB for library, audio & video documents

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/ogg",
  "audio/x-m4a",
  "audio/m4a",
  "audio/aac",
  "audio/flac",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/ogg",
  "video/mpeg",
  "video/3gpp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/epub+zip",
  "application/zip",
  "application/x-zip-compressed",
];

const EXT_MAP: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
  "audio/mpeg": ".mp3",
  "audio/mp3": ".mp3",
  "audio/wav": ".wav",
  "audio/ogg": ".ogg",
  "audio/x-m4a": ".m4a",
  "audio/m4a": ".m4a",
  "audio/aac": ".aac",
  "audio/flac": ".flac",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
  "video/ogg": ".ogv",
  "video/mpeg": ".mpeg",
  "video/3gpp": ".3gp",
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "application/vnd.ms-powerpoint": ".ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
  "application/epub+zip": ".epub",
  "application/zip": ".zip",
  "application/x-zip-compressed": ".zip",
};

function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

function getMediaType(mimeType: string): "IMAGE" | "AUDIO" | "VIDEO" | "DOCUMENT" {
  if (mimeType.startsWith("image/")) return "IMAGE";
  if (mimeType.startsWith("audio/")) return "AUDIO";
  if (mimeType.startsWith("video/")) return "VIDEO";
  return "DOCUMENT";
}

// POST /api/upload?folder=pustaka|keuangan|jurnal|materi|cbt|surat|pendaftaran
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const folder = searchParams.get("folder") || "keuangan";
  const isPublicRegistration = folder === "pendaftaran";

  if (!isPublicRegistration) {
    const user = await getCurrentUser();
    if (!user || !["super_admin", "admin", "pendidik", "siswa", "orang_tua"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    // Sanitize folder name
    const safeFolder = ["keuangan", "pustaka", "jurnal", "materi", "cbt", "surat", "pendaftaran"].includes(folder) ? folder : "umum";

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Format file tidak didukung. Gunakan Foto (JPG/PNG/WEBP), Audio (MP3/WAV/M4A), Video (MP4/WEBM), atau Dokumen PDF/Word." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Ukuran file melebihi batas 75 MB" },
        { status: 400 }
      );
    }

    let ext = EXT_MAP[file.type] || "";
    if (!ext && file.name.includes(".")) {
      ext = `.${file.name.split(".").pop()?.toLowerCase()}`;
    }

    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    const safeBaseName = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 30);
    const filename = `${timestamp}-${safeBaseName}-${random}${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads", safeFolder);
    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(path.join(uploadDir, filename), buffer);

    const url = `/uploads/${safeFolder}/${filename}`;
    const fileSizeFormatted = formatBytes(file.size);
    const mediaType = getMediaType(file.type);

    return NextResponse.json(
      {
        url,
        filename,
        originalName: file.name,
        fileSize: file.size,
        fileSizeFormatted,
        mimeType: file.type,
        mediaType,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[upload] error:", err);
    return NextResponse.json({ error: "Gagal mengunggah file" }, { status: 500 });
  }
}
