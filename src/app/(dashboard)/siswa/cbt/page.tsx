"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  FileCheck,
  Clock,
  CheckCircle2,
  Award,
  AlertCircle,
  Play,
  RotateCcw,
  BookOpen,
  ArrowRight,
  ListChecks,
  FileText,
  Palette,
  Upload,
  CheckSquare,
  X,
  Loader2,
  Image as ImageIcon,
  Volume2,
  ExternalLink,
} from "lucide-react";

interface AssessmentQuestion {
  id: string;
  questionText: string;
  questionType: string;
  optionsJson?: string;
  correctOption: string;
  points: number;
  imageUrl?: string | null;
  audioUrl?: string | null;
}

interface AssessmentItem {
  id: string;
  title: string;
  type: string;
  durationMinutes: number;
  passingScore: number;
  startTime: string;
  endTime: string;
  isPublished: boolean;
  class?: { id: string; name: string };
  subject?: { id: string; name: string };
  questions?: AssessmentQuestion[];
}

export default function SiswaCbtPage() {
  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<AssessmentItem | null>(null);
  const [examStarted, setExamStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [karyaFiles, setKaryaFiles] = useState<Record<string, { url: string; name: string }>>({});
  const [submitted, setSubmitted] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [uploadingQId, setUploadingQId] = useState<string | null>(null);
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);
  const fileInputsRef = useRef<Record<string, HTMLInputElement | null>>({});

  // Fetch Published Assessments
  const fetchExams = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cbt");
      const data = await res.json();
      const list = (data.assessments || []).filter((a: AssessmentItem) => a.isPublished);
      setAssessments(list);
    } catch {
      setAssessments([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  // Timer Effect
  useEffect(() => {
    if (!examStarted || submitted || secondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [examStarted, submitted, secondsRemaining]);

  const handleStartExam = (exam: AssessmentItem) => {
    setSelectedExam(exam);
    setAnswers({});
    setKaryaFiles({});
    setSubmitted(false);
    setExamStarted(true);
    setSecondsRemaining((exam.durationMinutes || 60) * 60);
  };

  const handleAutoSubmit = () => {
    calculateScore();
    setSubmitted(true);
  };

  const calculateScore = () => {
    if (!selectedExam || !selectedExam.questions) return;
    let earned = 0;
    let max = 0;

    selectedExam.questions.forEach((q) => {
      max += q.points;
      const isMultipleChoice =
        q.questionType === "MULTIPLE_CHOICE_4" ||
        q.questionType === "MULTIPLE_CHOICE_5" ||
        q.questionType === "MULTIPLE_CHOICE";

      if (isMultipleChoice) {
        const studentAns = answers[q.id]; // e.g. "A"
        if (studentAns && studentAns.toUpperCase() === q.correctOption.toUpperCase()) {
          earned += q.points;
        }
      } else {
        // Essay / Project provisional points
        if (answers[q.id]?.trim() || karyaFiles[q.id]) {
          earned += q.points * 0.8;
        }
      }
    });

    const scaledScore = max > 0 ? Math.round((earned / max) * 100) : 0;
    setFinalScore(scaledScore);
    setTotalPoints(earned);
  };

  const handleSubmitExam = (e: React.FormEvent) => {
    e.preventDefault();
    calculateScore();
    setSubmitted(true);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Upload file for Karya
  const handleKaryaUpload = async (qId: string, file: File) => {
    if (!file) return;
    setUploadingQId(qId);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload?folder=cbt", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setKaryaFiles((prev) => ({
          ...prev,
          [qId]: { url: data.url, name: data.originalName || file.name },
        }));
      } else {
        alert(data.error || "Gagal mengunggah berkas karya");
      }
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.message);
    } finally {
      setUploadingQId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FileCheck className="w-6 h-6 text-indigo-700" />
          Ujian Berbasis Komputer (CBT Online)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Platform ujian daring mandiri dengan dukungan soal bergambar, audio listening, PG A-D/A-E, dan penugasan karya.
        </p>
      </div>

      {/* STATE 1: DAFTAR PAKET UJIAN CBT AKTIF */}
      {!examStarted && !submitted && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-800">Paket Ujian yang Siap Dikerjakan:</h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-40 bg-white rounded-2xl border border-slate-200 p-5 animate-pulse" />
              ))}
            </div>
          ) : assessments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-soft">
              <FileCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">Belum ada ujian aktif</h3>
              <p className="text-xs text-slate-500 mt-1">
                Paket ujian CBT yang diterbitkan oleh guru akan muncul di sini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assessments.map((exam) => (
                <div
                  key={exam.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft hover-lift flex flex-col justify-between space-y-4 transition hover:border-indigo-300"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {exam.type} • {exam.class?.name || "Rombel"}
                      </span>
                      <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {exam.durationMinutes} Menit
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mt-3 leading-snug">
                      {exam.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Mata Pelajaran: {exam.subject?.name || "Umum"}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <div>Jumlah Soal: <strong>{exam.questions?.length || 0} Butir</strong></div>
                      <div>KKM Kelulusan: <strong>{exam.passingScore}</strong></div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => handleStartExam(exam)}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-xs"
                    >
                      <Play className="w-4 h-4" />
                      <span>Mulai Ujian CBT</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STATE 2: SEDANG MENGERJAKAN UJIAN (COUNTDOWN & MULTIMEDIA QUESTIONS) */}
      {examStarted && !submitted && selectedExam && (
        <form onSubmit={handleSubmitExam} className="space-y-4">
          {/* Top Sticky Bar Timer */}
          <div className="sticky top-4 z-30 bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between border border-slate-800">
            <div>
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">
                {selectedExam.type} • {selectedExam.subject?.name}
              </span>
              <h3 className="text-xs sm:text-sm font-bold truncate max-w-md">
                {selectedExam.title}
              </h3>
            </div>

            <div className="flex items-center gap-2 bg-slate-800 px-3.5 py-1.5 rounded-xl border border-slate-700 font-mono text-sm font-bold text-amber-300">
              <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Sisa: {formatTimer(secondsRemaining)}</span>
            </div>
          </div>

          {/* List Soal dengan format Multi-Tipe & Media */}
          <div className="space-y-4">
            {selectedExam.questions && selectedExam.questions.length > 0 ? (
              selectedExam.questions.map((q, idx) => {
                let options: string[] = [];
                try {
                  options = q.optionsJson ? JSON.parse(q.optionsJson) : [];
                } catch {
                  options = ["A", "B", "C", "D"];
                }

                const isMC =
                  q.questionType === "MULTIPLE_CHOICE_4" ||
                  q.questionType === "MULTIPLE_CHOICE_5" ||
                  q.questionType === "MULTIPLE_CHOICE";

                const isEssay = q.questionType === "ESSAY";
                const isKarya = q.questionType === "KARYA";

                return (
                  <div
                    key={q.id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-soft space-y-3.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                          Nomor {idx + 1}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {isEssay
                            ? "Esai / Uraian"
                            : isKarya
                            ? "Tugas Karya / Portofolio"
                            : q.questionType === "MULTIPLE_CHOICE_5"
                            ? "Pilihan Ganda A-E"
                            : "Pilihan Ganda A-D"}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 font-bold">{q.points} Poin</span>
                    </div>

                    {/* Teks Pertanyaan */}
                    <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed whitespace-pre-line">
                      {q.questionText}
                    </p>

                    {/* GAMBAR SOAL (JIKA ADA) */}
                    {q.imageUrl && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 max-w-md">
                        <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                          <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Gambar / Diagram Soal:</span>
                        </span>
                        <img
                          src={q.imageUrl}
                          alt="Diagram Pertanyaan"
                          className="rounded-lg max-h-64 object-contain cursor-pointer hover:opacity-90 transition border border-slate-200 bg-white"
                          onClick={() => setPreviewImageModal(q.imageUrl || null)}
                        />
                        <p className="text-[10px] text-slate-400 italic">Klik gambar untuk memperbesar</p>
                      </div>
                    )}

                    {/* AUDIO SOAL / LISTENING (JIKA ADA) */}
                    {q.audioUrl && (
                      <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5 max-w-md">
                        <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">
                          <Volume2 className="w-4 h-4 text-emerald-700 animate-pulse" />
                          <span>Dengarkan Audio Listening Soal Ini:</span>
                        </span>
                        <audio controls src={q.audioUrl} className="w-full h-8" />
                      </div>
                    )}

                    {/* FORMAT 1 & 2: PILIHAN GANDA (A-D / A-E) */}
                    {isMC && (
                      <div className="space-y-2 pt-1">
                        {options.map((opt) => {
                          const optKey = opt.trim().charAt(0).toUpperCase(); // e.g. "A"
                          const isChecked = answers[q.id] === optKey;

                          return (
                            <label
                              key={opt}
                              className={`flex items-center space-x-3 p-3.5 rounded-xl border text-xs cursor-pointer transition select-none ${
                                isChecked
                                  ? "bg-indigo-50/80 border-indigo-400 font-bold text-indigo-950 shadow-xs"
                                  : "border-slate-200 bg-slate-50/40 hover:bg-slate-100/60"
                              }`}
                            >
                              <input
                                type="radio"
                                name={`q_${q.id}`}
                                checked={isChecked}
                                onChange={() => setAnswers({ ...answers, [q.id]: optKey })}
                                className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                              />
                              <span>{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* FORMAT 3: ESAI / URAIAN */}
                    {isEssay && (
                      <div className="space-y-1.5 pt-1">
                        <label className="block text-[11px] font-bold text-slate-600">
                          Jawaban Uraian Anda:
                        </label>
                        <textarea
                          rows={4}
                          placeholder="Ketikkan uraian jawaban lengkap Anda di sini..."
                          value={answers[q.id] || ""}
                          onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                          className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50 focus:bg-white transition leading-relaxed resize-none"
                        />
                      </div>
                    )}

                    {/* FORMAT 4: TUGAS KARYA / PORTOFOLIO */}
                    {isKarya && (
                      <div className="space-y-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Keterangan / Deskripsi Karya:
                          </label>
                          <textarea
                            rows={3}
                            placeholder="Jelaskan ringkasan konsep karya, bahan, atau tautan portofolio eksternal (jika ada)..."
                            value={answers[q.id] || ""}
                            onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                            className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50 focus:bg-white transition leading-relaxed resize-none"
                          />
                        </div>

                        {/* Upload Berkas Karya */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Lampirkan Berkas / Foto / Laporan Karya (PDF, JPG, PNG):
                          </label>

                          {karyaFiles[q.id] ? (
                            <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-semibold">
                              <div className="flex items-center gap-2 truncate">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span className="truncate">{karyaFiles[q.id].name}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setKaryaFiles((prev) => {
                                    const n = { ...prev };
                                    delete n[q.id];
                                    return n;
                                  });
                                }}
                                className="p-1 text-rose-500 hover:text-rose-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div
                              onClick={() => fileInputsRef.current[q.id]?.click()}
                              className="p-4 border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-xl bg-slate-50 hover:bg-amber-50/40 cursor-pointer text-center space-y-1 transition text-xs"
                            >
                              {uploadingQId === q.id ? (
                                <div className="flex items-center justify-center gap-2 py-1">
                                  <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
                                  <span className="font-semibold text-slate-700">Mengunggah berkas karya...</span>
                                </div>
                              ) : (
                                <>
                                  <Upload className="w-5 h-5 text-amber-600 mx-auto" />
                                  <p className="font-bold text-slate-800">Klik untuk mengunggah dokumen karya</p>
                                  <p className="text-[10px] text-slate-400">PDF, Foto, Dokumen Presentasi (Maks 50 MB)</p>
                                </>
                              )}
                              <input
                                ref={(el) => {
                                  fileInputsRef.current[q.id] = el;
                                }}
                                type="file"
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) handleKaryaUpload(q.id, f);
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-center text-slate-500">Tidak ada butir soal.</p>
            )}
          </div>

          {/* Submit Exam Button */}
          <div className="pt-4 flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-soft">
            <span className="text-xs text-slate-500">
              Terjawab / Terisi: <strong>{Object.keys(answers).length + Object.keys(karyaFiles).length}</strong> dari{" "}
              <strong>{selectedExam.questions?.length || 0}</strong> butir
            </span>

            <button
              type="submit"
              className="px-6 py-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              Selesaikan & Kirim Jawaban CBT
            </button>
          </div>
        </form>
      )}

      {/* STATE 3: HASIL UJIAN & NILAI (AUTO-GRADED) */}
      {submitted && selectedExam && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-10 shadow-soft text-center space-y-5 animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">Ujian Berhasil Diserahkan!</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Jawaban pilihan ganda, esai, dan berkas karya Anda pada {selectedExam.title} telah tersimpan di sistem CBT PKBM Askara.
            </p>
          </div>

          {/* Score Box */}
          <div className="p-6 bg-emerald-50 border-2 border-emerald-300 rounded-2xl inline-block max-w-sm w-full space-y-1">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              Nilai Skor CBT Sementara
            </span>
            <p className="text-4xl font-black text-emerald-900">{finalScore} / 100</p>
            <p className="text-xs text-emerald-700 font-semibold pt-1">
              {finalScore >= (selectedExam.passingScore || 75)
                ? "🎉 Selamat! Anda telah mencapai KKM kelulusan."
                : "⚠️ Nilai akhir akan disesuaikan setelah guru memeriksa jawaban esai & karya Anda."}
            </p>
          </div>

          <div className="pt-4 flex justify-center gap-3">
            <button
              onClick={() => {
                setExamStarted(false);
                setSubmitted(false);
                setSelectedExam(null);
                fetchExams();
              }}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              Kembali ke Daftar Ujian CBT
            </button>
          </div>
        </div>
      )}

      {/* MODAL ZOOM GAMBAR SOAL */}
      {previewImageModal && (
        <div
          onClick={() => setPreviewImageModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[85vh] bg-white p-2 rounded-2xl shadow-2xl overflow-hidden">
            <button
              onClick={() => setPreviewImageModal(null)}
              className="absolute top-4 right-4 p-1.5 bg-slate-900/70 hover:bg-slate-900 text-white rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImageModal}
              alt="Pratinjau Diagram Soal"
              className="max-h-[80vh] w-auto rounded-xl object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
}
