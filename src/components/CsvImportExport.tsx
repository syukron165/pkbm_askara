"use client";

import React, { useRef, useState } from "react";
import { Download, Upload, Loader2 } from "lucide-react";
import Papa from "papaparse";

interface CsvImportExportProps {
  onImport: (data: any[]) => void;
  exportData: any[];
  exportFilename: string;
  templateHeaders: string[];
}

export default function CsvImportExport({
  onImport,
  exportData,
  exportFilename,
  templateHeaders,
}: CsvImportExportProps) {
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    // Standardize export format
    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = exportFilename;
    a.click();
  };

  const handleDownloadTemplate = () => {
    const csv = Papa.unparse([templateHeaders]);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `template_import_${exportFilename}`;
    a.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setImporting(false);
        if (results.errors.length > 0) {
          alert(`Terdapat kesalahan saat membaca file: ${results.errors[0].message}`);
        } else {
          onImport(results.data);
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
      error: (err) => {
        setImporting(false);
        alert(`Gagal membaca file CSV: ${err.message}`);
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
    });
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleImport}
        className="hidden"
      />

      <div className="flex bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
        <button
          onClick={handleDownloadTemplate}
          className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 transition border-r border-slate-300"
          title="Download Template CSV"
        >
          Template
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition border-r border-slate-300"
        >
          {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          <span>Import</span>
        </button>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>
    </div>
  );
}
