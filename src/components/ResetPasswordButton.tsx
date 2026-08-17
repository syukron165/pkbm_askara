"use client";

import React, { useState } from "react";

export default function ResetPasswordButton({ userId, userEmail }: { userId: string, userEmail: string }) {
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!confirm(`Kirim email reset password ke ${userEmail}?`)) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Email reset password berhasil dikirim!");
      } else {
        alert(data.error || "Gagal mengirim email reset password");
      }
    } catch (e) {
      alert("Terjadi kesalahan sistem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleReset} 
      disabled={loading}
      className="text-xs font-semibold text-emerald-700 hover:underline disabled:opacity-50"
    >
      {loading ? "Mengirim..." : "Reset Password"}
    </button>
  );
}
