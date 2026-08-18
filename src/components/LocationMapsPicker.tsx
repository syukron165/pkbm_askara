"use client";

import React, { useState } from "react";
import { MapPin, Navigation, ExternalLink, Loader2, Compass, CheckCircle2 } from "lucide-react";

interface LocationMapsPickerProps {
  address?: string;
  mapsUrl?: string;
  latitude?: number | null;
  longitude?: number | null;
  onChange?: (data: {
    mapsUrl: string;
    latitude: number | null;
    longitude: number | null;
  }) => void;
  readOnly?: boolean;
}

export default function LocationMapsPicker({
  address = "",
  mapsUrl = "",
  latitude = null,
  longitude = null,
  onChange,
  readOnly = false,
}: LocationMapsPickerProps) {
  const [detecting, setDetecting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Parse coordinates from string URL if pasted
  const parseCoordinatesFromUrl = (url: string) => {
    try {
      // Check for @lat,lng
      const matchAt = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (matchAt) {
        return { lat: parseFloat(matchAt[1]), lng: parseFloat(matchAt[2]) };
      }
      // Check for q=lat,lng or ll=lat,lng
      const matchQ = url.match(/[?&](?:q|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (matchQ) {
        return { lat: parseFloat(matchQ[1]), lng: parseFloat(matchQ[2]) };
      }
      // Check direct comma numbers: -6.1234, 106.1234
      const matchDirect = url.match(/^(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)$/);
      if (matchDirect) {
        return { lat: parseFloat(matchDirect[1]), lng: parseFloat(matchDirect[2]) };
      }
    } catch {}
    return null;
  };

  const handleUrlChange = (newUrl: string) => {
    const coords = parseCoordinatesFromUrl(newUrl.trim());
    if (coords && onChange) {
      onChange({
        mapsUrl: newUrl,
        latitude: coords.lat,
        longitude: coords.lng,
      });
    } else if (onChange) {
      onChange({
        mapsUrl: newUrl,
        latitude: latitude || null,
        longitude: longitude || null,
      });
    }
  };

  const handleGetCoordinates = () => {
    if (!navigator.geolocation) {
      setMsg("Geolocation tidak didukung pada perangkat ini.");
      return;
    }

    setDetecting(true);
    setMsg(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        const generatedUrl = `https://www.google.com/maps?q=${lat},${lng}`;

        if (onChange) {
          onChange({
            mapsUrl: generatedUrl,
            latitude: lat,
            longitude: lng,
          });
        }
        setDetecting(false);
        setMsg(`Koordinat GPS terdeteksi: ${lat}, ${lng}`);
        setTimeout(() => setMsg(null), 5000);
      },
      (err) => {
        setDetecting(false);
        let errorMsg = "Gagal mendeteksi lokasi.";
        if (err.code === err.PERMISSION_DENIED) {
          errorMsg = "Izin lokasi GPS ditolak oleh browser/pengguna.";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          errorMsg = "Informasi posisi GPS tidak tersedia.";
        } else if (err.code === err.TIMEOUT) {
          errorMsg = "Waktu pendeteksian lokasi habis.";
        }
        setMsg(errorMsg);
        setTimeout(() => setMsg(null), 5000);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const effectiveLat = latitude;
  const effectiveLng = longitude;
  const effectiveMapsUrl =
    mapsUrl ||
    (effectiveLat && effectiveLng
      ? `https://www.google.com/maps?q=${effectiveLat},${effectiveLng}`
      : address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
      : "");

  return (
    <div className="space-y-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 block">Titik Koordinat & Google Maps Lokasi</span>
            <span className="text-[10px] text-slate-400">Peta domisili & koordinat GPS untuk keperluan pendataan</span>
          </div>
        </div>

        {!readOnly && (
          <button
            type="button"
            onClick={handleGetCoordinates}
            disabled={detecting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition shadow-2xs shrink-0"
          >
            {detecting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Navigation className="w-3.5 h-3.5" />
            )}
            <span>{detecting ? "Mendeteksi GPS..." : "📍 Ambil Lokasi GPS Saya"}</span>
          </button>
        )}
      </div>

      {msg && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Input Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            Tautan Google Maps / Titik Koordinat
          </label>
          <input
            type="text"
            readOnly={readOnly}
            value={mapsUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://maps.google.com/?q=... atau -6.9175, 107.6191"
            className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none placeholder:text-slate-400"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            Lat, Long
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={
                effectiveLat && effectiveLng
                  ? `${effectiveLat}, ${effectiveLng}`
                  : "Belum disetel"
              }
              className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-600 select-all"
            />
            {effectiveMapsUrl && (
              <a
                href={effectiveMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl transition shrink-0"
                title="Buka di Google Maps"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Embed Mini Maps Preview */}
      {effectiveLat && effectiveLng ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-2xs relative">
          <iframe
            title="Peta Lokasi"
            width="100%"
            height="180"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            src={`https://maps.google.com/maps?q=${effectiveLat},${effectiveLng}&hl=id&z=15&output=embed`}
          />
          <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-700 flex items-center gap-1 shadow-2xs">
            <MapPin className="w-3 h-3 text-rose-500" />
            <span>Pin: {effectiveLat}, {effectiveLng}</span>
          </div>
        </div>
      ) : address ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-2xs relative">
          <iframe
            title="Peta Lokasi Berdasarkan Alamat"
            width="100%"
            height="160"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            src={`https://maps.google.com/maps?q=${encodeURIComponent(address + ", " + (mapsUrl ? "" : "Indonesia"))}&hl=id&z=14&output=embed`}
          />
          <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-700 flex items-center gap-1 shadow-2xs">
            <MapPin className="w-3 h-3 text-emerald-600" />
            <span>Peta Alamat: {address}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
