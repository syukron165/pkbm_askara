"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CetakSKPage() {
  const searchParams = useSearchParams();
  const teacherId = searchParams.get("id");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teacherId) return;

    // Fetch teacher and institution data
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/surat/sk-tutor?teacherId=${teacherId}`);
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        } else {
          alert("Gagal memuat data SK");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [teacherId]);

  if (!teacherId) return <div className="p-10 text-center">ID Tutor tidak ditemukan</div>;
  if (loading) return <div className="p-10 text-center">Memuat dokumen SK...</div>;
  if (!data) return <div className="p-10 text-center text-red-500">Gagal memuat dokumen SK.</div>;

  const { teacher, institution } = data;

  const printDocument = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 py-8">
      {/* ── Control Bar (Hide on Print) ── */}
      <div className="max-w-[210mm] mx-auto mb-6 flex items-center justify-between print:hidden">
        <Link
          href="/admin/teachers"
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </Link>
        <button
          onClick={printDocument}
          className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shadow-sm"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak SK</span>
        </button>
      </div>

      {/* ── Document Canvas (A4 Size) ── */}
      <div className="max-w-[210mm] min-h-[297mm] mx-auto bg-white shadow-xl print:shadow-none p-[20mm] text-slate-900 leading-snug font-serif text-sm relative">
        {/* Kop Surat */}
        <div className="flex items-center border-b-4 border-double border-slate-900 pb-4 mb-6">
          {institution.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={institution.logoUrl} alt="Logo" className="w-24 h-24 object-contain mr-6" />
          )}
          <div className="text-center flex-1">
            <h1 className="text-xl font-bold uppercase tracking-wide">YAYASAN PENDIDIKAN ASKARA</h1>
            <h2 className="text-2xl font-black uppercase mt-1 text-emerald-800">{institution.name}</h2>
            <p className="text-xs mt-1 font-sans">{institution.operationalPermit} | NPSN: {institution.npsn}</p>
            <p className="text-xs mt-0.5 font-sans">{institution.address}, {institution.village}, {institution.district}, {institution.city}</p>
            <p className="text-xs mt-0.5 font-sans">Telp: {institution.phone} | Email: {institution.email}</p>
          </div>
        </div>

        {/* Judul SK */}
        <div className="text-center mb-8">
          <h3 className="text-lg font-bold underline uppercase">SURAT KEPUTUSAN KEPALA PKBM</h3>
          <p className="mt-1 font-bold">Nomor: 800/SK-GURU/{new Date().getFullYear()}</p>
        </div>

        <div className="mb-4 text-justify">
          <p className="mb-2">Kepala {institution.name}, dengan ini menerangkan bahwa:</p>
          <table className="w-full ml-8 mb-4">
            <tbody>
              <tr>
                <td className="w-40 py-1">Nama Lengkap</td>
                <td className="w-4 text-center">:</td>
                <td className="font-bold">{teacher.name}</td>
              </tr>
              <tr>
                <td className="w-40 py-1">NIP / NIY</td>
                <td className="w-4 text-center">:</td>
                <td>{teacher.nip || "-"}</td>
              </tr>
              <tr>
                <td className="w-40 py-1">Jabatan / Peran</td>
                <td className="w-4 text-center">:</td>
                <td>{teacher.role}</td>
              </tr>
              <tr>
                <td className="w-40 py-1">Rombel / Kelas</td>
                <td className="w-4 text-center">:</td>
                <td>{teacher.classes}</td>
              </tr>
              <tr>
                <td className="w-40 py-1">Alamat</td>
                <td className="w-4 text-center">:</td>
                <td>{teacher.address || "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="text-justify mb-8 space-y-3">
          <p>
            Berdasarkan hasil evaluasi dan kebutuhan akademik {institution.name} Tahun Ajaran {institution.academicYear}, 
            maka yang bersangkutan ditugaskan sebagai <strong>{teacher.role}</strong> terhitung mulai tanggal ditetapkan surat keputusan ini.
          </p>
          <p>
            Tugas dan tanggung jawab pelaksana mengacu pada ketentuan kurikulum yang berlaku di lingkungan PKBM Askara. 
            Apabila di kemudian hari terdapat kekeliruan dalam keputusan ini, akan diadakan perbaikan sebagaimana mestinya.
          </p>
          <p>Demikian Surat Keputusan ini dibuat untuk dapat dilaksanakan dengan penuh tanggung jawab.</p>
        </div>

        {/* Signature Area */}
        <div className="flex justify-end mt-12">
          <div className="text-center w-64 relative">
            <p className="mb-1">{institution.city || "Jakarta"}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="font-bold mb-6">Kepala {institution.name}</p>
            
            {/* Tanda Tangan & Cap */}
            <div className="h-24 relative flex items-center justify-center">
               {institution.institutionStampUrl && (
                 // eslint-disable-next-line @next/next/no-img-element
                 <img src={institution.institutionStampUrl} alt="Cap" className="absolute left-0 w-24 opacity-80 mix-blend-multiply" />
               )}
               {institution.headmasterSignatureUrl && (
                 // eslint-disable-next-line @next/next/no-img-element
                 <img src={institution.headmasterSignatureUrl} alt="Tanda Tangan" className="absolute z-10 h-20 mix-blend-multiply" />
               )}
            </div>

            <p className="font-bold underline mt-2">{institution.headmasterName}</p>
            <p className="text-sm">NIP. {institution.headmasterNip || "-"}</p>
          </div>
        </div>

        <style jsx global>{`
          @media print {
            body {
              background: white;
            }
            @page {
              size: A4;
              margin: 0;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
