"use client";

import React, { useState, useEffect, useRef } from "react";
import { Landmark, MapPin, ChevronDown, Check, Sparkles, Building2, Radio } from "lucide-react";
import { DEFAULT_BRANCHES, BranchData } from "@/lib/branch";

interface BranchSelectorProps {
  userRole?: string;
  userBranchCode?: string | null;
}

export function BranchSelector({ userRole, userBranchCode }: BranchSelectorProps) {
  const [branches, setBranches] = useState<BranchData[]>([]);
  const [selectedBranchCode, setSelectedBranchCode] = useState<string>("ALL");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isSuperOrAdmin = userRole === "super_admin" || userRole === "admin" || userRole === "bendahara";

  useEffect(() => {
    // Load initial selection from localStorage
    const saved = localStorage.getItem("askara_active_branch");
    if (saved) {
      setSelectedBranchCode(saved);
    } else if (userBranchCode && !isSuperOrAdmin) {
      setSelectedBranchCode(userBranchCode);
    }

    // Fetch branches from API
    const fetchBranches = async () => {
      try {
        const res = await fetch("/api/cabang?active=true");
        const data = await res.json();
        if (data.success && Array.isArray(data.branches)) {
          setBranches(data.branches);
        } else {
          // Fallback to default
          setBranches(DEFAULT_BRANCHES as any);
        }
      } catch (err) {
        setBranches(DEFAULT_BRANCHES as any);
      }
    };

    fetchBranches();

    // Close on outside click
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userBranchCode, isSuperOrAdmin]);

  const handleSelectBranch = (code: string) => {
    setSelectedBranchCode(code);
    localStorage.setItem("askara_active_branch", code);
    setIsOpen(false);

    // Dispatch global event for other components to react
    window.dispatchEvent(
      new CustomEvent("askara_branch_changed", {
        detail: { branchCode: code },
      })
    );
  };

  const selectedBranch = branches.find((b) => b.code === selectedBranchCode);
  const displayLabel =
    selectedBranchCode === "ALL"
      ? "Semua Cabang (Pusat & Daerah)"
      : selectedBranch?.name || selectedBranchCode;

  if (!isSuperOrAdmin) {
    // Non-admin view: simple read-only location badge
    return (
      <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100/90 text-slate-700 rounded-full text-xs font-semibold border border-slate-200/80">
        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span className="truncate max-w-[140px]">{displayLabel}</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 text-xs font-semibold text-slate-800 transition active:scale-95"
      >
        <Landmark className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
        <span className="hidden sm:inline-block max-w-[130px] md:max-w-[160px] truncate text-left">
          {displayLabel}
        </span>
        <span className="sm:hidden text-[11px]">
          {selectedBranchCode === "ALL" ? "Semua" : selectedBranchCode}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-1">
          <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900">Pilih Rumah Belajar / Cabang</p>
              <p className="text-[10px] text-slate-400">Filter data multi-tenancy sistem</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200">
              {branches.length} Cabang
            </span>
          </div>

          <div className="p-1.5 space-y-1 max-h-64 overflow-y-auto">
            {/* Option: Semua Cabang */}
            <button
              onClick={() => handleSelectBranch("ALL")}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl font-medium transition ${
                selectedBranchCode === "ALL"
                  ? "bg-indigo-50 text-indigo-900 font-bold border border-indigo-200"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <p className="leading-tight">Semua Cabang / Rumah Belajar</p>
                  <p className="text-[10px] text-slate-400 font-normal">Tampilan agregat data pusat</p>
                </div>
              </div>
              {selectedBranchCode === "ALL" && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
            </button>

            {/* List Individual Branches */}
            {branches.map((b) => {
              const isSelected = selectedBranchCode === b.code;
              const isPusat = b.code === "ASKARA-PUSAT";

              return (
                <button
                  key={b.code}
                  onClick={() => handleSelectBranch(b.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl font-medium transition ${
                    isSelected
                      ? "bg-indigo-50 text-indigo-900 font-bold border border-indigo-200"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                        isPusat ? "bg-amber-100 text-amber-700" : "bg-teal-100 text-teal-700"
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-left">
                      <p className="leading-tight truncate max-w-[170px]">{b.name}</p>
                      <p className="text-[10px] text-slate-400 font-normal font-mono">
                        {b.code} &bull; {b.city}
                      </p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
