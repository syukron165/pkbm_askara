/**
 * Branch (Rumah Belajar / Cabang) Utility & Geofencing Helpers
 * PKBM Askara Multi-Tenancy Architecture
 */

export interface BranchData {
  id: string;
  code: string;
  name: string;
  address: string;
  city: string;
  province: string;
  phone?: string | null;
  managerName?: string | null;
  latitude: number | null;
  longitude: number | null;
  radiusMeters: number;
  isActive: boolean;
  notes?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  _count?: {
    users?: number;
    students?: number;
    classes?: number;
    assets?: number;
    expenseRequests?: number;
  };
}

export const DEFAULT_BRANCHES: Omit<BranchData, "id" | "_count">[] = [
  {
    code: "ASKARA-PUSAT",
    name: "PKBM Askara Pusat (Gedebage)",
    address: "Jl. Adiflora Raya No. 8, Rancabolang, Gedebage",
    city: "Kota Bandung",
    province: "Jawa Barat",
    phone: "0812-3456-7890",
    managerName: "Prof. Arif Syarifudin, S.Pd.",
    latitude: -6.953412,
    longitude: 107.689451,
    radiusMeters: 150,
    isActive: true,
    notes: "Kampus Induk, Pusat Administrasi & Workshop Utama CBT/Vokasi",
  },
  {
    code: "RB-CIPARAY",
    name: "Rumah Belajar Ciparay",
    address: "Jl. Raya Laswi No. 142, Ciparay",
    city: "Kabupaten Bandung",
    province: "Jawa Barat",
    phone: "0821-9876-5432",
    managerName: "Drs. Hendra Gunawan",
    latitude: -7.034512,
    longitude: 107.712345,
    radiusMeters: 100,
    isActive: true,
    notes: "Sentra Pembelajaran Kesetaraan & Vokasi Agrobisnis/Kuliner",
  },
  {
    code: "RB-CIMAHI",
    name: "Rumah Belajar Cimahi",
    address: "Jl. Kolonel Masturi No. 67, Cimahi Tengah",
    city: "Kota Cimahi",
    province: "Jawa Barat",
    phone: "0857-1122-3344",
    managerName: "Siti Rahmawati, S.Pd.",
    latitude: -6.872341,
    longitude: 107.541298,
    radiusMeters: 120,
    isActive: true,
    notes: "Sentra Pelatihan Komputer Digital & Desain Grafis",
  },
  {
    code: "RB-LEMBANG",
    name: "Rumah Belajar Lembang",
    address: "Jl. Raya Lembang No. 210, Lembang",
    city: "Kabupaten Bandung Barat",
    province: "Jawa Barat",
    phone: "0813-5566-7788",
    managerName: "Dewi Anggraini, S.Kom.",
    latitude: -6.818921,
    longitude: 107.618732,
    radiusMeters: 150,
    isActive: true,
    notes: "Sentra Vokasi Ekowisata & Keterampilan Bahasa Asing",
  },
];

/**
 * Calculates distance in meters between two GPS coordinates using the Haversine formula
 */
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radius of Earth in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Validates whether a device's GPS position falls within the branch radius
 */
export function validateGeofence(
  deviceLat: number,
  deviceLon: number,
  branchLat: number,
  branchLon: number,
  radiusMeters: number
): { isWithinRadius: boolean; distanceMeters: number; maxAllowedRadius: number } {
  const distance = calculateHaversineDistanceMeters(deviceLat, deviceLon, branchLat, branchLon);
  return {
    isWithinRadius: distance <= radiusMeters,
    distanceMeters: distance,
    maxAllowedRadius: radiusMeters,
  };
}
