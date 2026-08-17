export type SavingOwnerType = "GURU" | "MANAJEMEN" | "SISWA" | "ORANG_TUA";

export type SavingType =
  | "QURBAN"
  | "LIBURAN"
  | "PENDIDIKAN"
  | "SUKARELA"
  | "WISUDA"
  | "HARI_RAYA"
  | "KARYA_VOKASI";

export interface SavingAccountItem {
  id: string;
  accountNo: string;
  // Owner identity
  ownerType: SavingOwnerType;
  ownerName: string;
  ownerIdentifier?: string; // NIP (Guru), Jabatan (Manajemen), NISN (Siswa), Hubungan (Orang Tua)
  ownerPhone?: string;
  ownerEmail?: string;
  // Siswa-specific legacy fields
  studentId?: string;
  studentName?: string;
  nisn?: string;
  packetType?: string;
  parentName?: string;
  phone?: string;
  // Saving account details
  savingType: SavingType;
  savingName: string;
  targetAmount: number;
  currentBalance: number;
  status: "ACTIVE" | "TARGET_ACHIEVED" | "CLOSED";
  startDate: string;
  targetDate?: string;
  notes?: string;
  transactionsCount: number;
  createdAt: string;
}

export interface SavingTransactionItem {
  id: string;
  accountId: string;
  accountNo: string;
  ownerType?: SavingOwnerType;
  ownerName?: string;
  studentName?: string;
  savingName: string;
  transactionType: "SETOR" | "TARIK";
  amount: number;
  balanceAfter: number;
  date: string;
  receiptNumber: string;
  notes?: string;
  paymentMethod: "TUNAI" | "TRANSFER" | "QRIS";
  recordedByName: string;
  createdAt: string;
}

// In-Memory global store with demo data for all roles (Guru, Manajemen, Siswa, Orang Tua)
export let savingAccountsStore: SavingAccountItem[] = [
  // 1. GURU / PENDIDIK
  {
    id: "tbg-guru-001",
    accountNo: "TBG-2026-G01",
    ownerType: "GURU",
    ownerName: "Drs. Hendra Gunawan",
    ownerIdentifier: "197503152005011002 (Tutor Matematika)",
    ownerPhone: "081298765432",
    ownerEmail: "guru@askara.sch.id",
    studentName: "Drs. Hendra Gunawan",
    savingType: "QURBAN",
    savingName: "Tabungan Qurban Sapi 1/7 Pendidik (Idul Adha 2027)",
    targetAmount: 3800000,
    currentBalance: 2200000,
    status: "ACTIVE",
    startDate: "2026-01-10",
    targetDate: "2027-05-25",
    notes: "Potongan berkala / setoran mandiri bulanan Rp 200.000",
    transactionsCount: 8,
    createdAt: "2026-01-10T08:00:00Z",
  },
  {
    id: "tbg-guru-002",
    accountNo: "TBG-2026-G02",
    ownerType: "GURU",
    ownerName: "Drs. Hendra Gunawan",
    ownerIdentifier: "197503152005011002 (Tutor Matematika)",
    ownerPhone: "081298765432",
    ownerEmail: "guru@askara.sch.id",
    studentName: "Drs. Hendra Gunawan",
    savingType: "LIBURAN",
    savingName: "Tabungan Family Gathering & Edu-Trip Guru 2026",
    targetAmount: 2000000,
    currentBalance: 2000000,
    status: "TARGET_ACHIEVED",
    startDate: "2026-02-01",
    targetDate: "2026-12-15",
    notes: "Target tercapai penuh untuk agenda liburan akhir tahun pendidik",
    transactionsCount: 5,
    createdAt: "2026-02-01T09:00:00Z",
  },

  // 2. MANAJEMEN / ADMIN & BENDAHARA
  {
    id: "tbg-adm-001",
    accountNo: "TBG-2026-M01",
    ownerType: "MANAJEMEN",
    ownerName: "Administrator Utama",
    ownerIdentifier: "Kepala Bagian Tata Usaha & IT",
    ownerPhone: "081234567890",
    ownerEmail: "admin@askara.sch.id",
    studentName: "Administrator Utama",
    savingType: "HARI_RAYA",
    savingName: "Tabungan Hari Raya Mandiri Staf Manajemen 2027",
    targetAmount: 3000000,
    currentBalance: 1500000,
    status: "ACTIVE",
    startDate: "2026-03-01",
    targetDate: "2027-03-20",
    notes: "Persiapan dana cadangan Idul Fitri lembaga",
    transactionsCount: 6,
    createdAt: "2026-03-01T10:00:00Z",
  },

  // 3. SISWA PKBM
  {
    id: "tbg-001",
    accountNo: "TBG-2026-001",
    ownerType: "SISWA",
    ownerName: "Budi Santoso",
    ownerIdentifier: "NISN: 0081294812",
    ownerPhone: "085612345678",
    ownerEmail: "siswa@askara.sch.id",
    studentName: "Budi Santoso",
    nisn: "0081294812",
    packetType: "Paket C",
    parentName: "Joko Santoso",
    phone: "085612345678",
    savingType: "QURBAN",
    savingName: "Tabungan Qurban Siswa Mandiri 1/7",
    targetAmount: 3500000,
    currentBalance: 1750000,
    status: "ACTIVE",
    startDate: "2026-01-15",
    targetDate: "2027-05-30",
    notes: "Setoran rutin Rp 150.000 / bulan",
    transactionsCount: 7,
    createdAt: "2026-01-15T08:00:00Z",
  },
  {
    id: "tbg-002",
    accountNo: "TBG-2026-002",
    ownerType: "SISWA",
    ownerName: "Budi Santoso",
    ownerIdentifier: "NISN: 0081294812",
    ownerPhone: "085612345678",
    ownerEmail: "siswa@askara.sch.id",
    studentName: "Budi Santoso",
    nisn: "0081294812",
    packetType: "Paket C",
    parentName: "Joko Santoso",
    phone: "085612345678",
    savingType: "LIBURAN",
    savingName: "Tabungan Study Tour & Vokasi Barista Jogja",
    targetAmount: 1200000,
    currentBalance: 1200000,
    status: "TARGET_ACHIEVED",
    startDate: "2026-02-01",
    targetDate: "2026-11-20",
    notes: "Target dana study tour vokasi tercapai penuh",
    transactionsCount: 6,
    createdAt: "2026-02-01T09:00:00Z",
  },
  {
    id: "tbg-003",
    accountNo: "TBG-2026-003",
    ownerType: "SISWA",
    ownerName: "Ahmad Fauzi",
    ownerIdentifier: "NISN: 0067890123",
    ownerPhone: "081512345678",
    studentName: "Ahmad Fauzi",
    nisn: "0067890123",
    packetType: "Paket B",
    parentName: "Fauzi Anwar",
    phone: "081512345678",
    savingType: "PENDIDIKAN",
    savingName: "Tabungan Persiapan Masuk Paket C & Kuliah",
    targetAmount: 5000000,
    currentBalance: 2450000,
    status: "ACTIVE",
    startDate: "2026-03-10",
    targetDate: "2028-06-30",
    notes: "Tabungan pendidikan jangka panjang",
    transactionsCount: 5,
    createdAt: "2026-03-10T10:30:00Z",
  },
  {
    id: "tbg-004",
    accountNo: "TBG-2026-004",
    ownerType: "SISWA",
    ownerName: "Dewi Lestari",
    ownerIdentifier: "NISN: 0098765432",
    ownerPhone: "081723456789",
    studentName: "Dewi Lestari",
    nisn: "0098765432",
    packetType: "Paket C",
    parentName: "Lestari",
    phone: "081723456789",
    savingType: "SUKARELA",
    savingName: "Tabungan Harian Sukarela Mandiri",
    targetAmount: 1000000,
    currentBalance: 620000,
    status: "ACTIVE",
    startDate: "2026-04-05",
    notes: "Menabung fleksibel tiap pekan",
    transactionsCount: 8,
    createdAt: "2026-04-05T11:00:00Z",
  },
  {
    id: "tbg-005",
    accountNo: "TBG-2026-005",
    ownerType: "SISWA",
    ownerName: "Rian Pratama",
    ownerIdentifier: "NISN: 0076543210",
    ownerPhone: "081834567890",
    studentName: "Rian Pratama",
    nisn: "0076543210",
    packetType: "Paket A",
    parentName: "Pratama Subagyo",
    phone: "081834567890",
    savingType: "WISUDA",
    savingName: "Tabungan Wisuda & Kelulusan Paket A",
    targetAmount: 800000,
    currentBalance: 500000,
    status: "ACTIVE",
    startDate: "2026-05-01",
    targetDate: "2027-06-15",
    notes: "Persiapan wisuda kelulusan kesetaraan",
    transactionsCount: 4,
    createdAt: "2026-05-01T13:00:00Z",
  },

  // 4. ORANG TUA / WALI MURID
  {
    id: "tbg-ortu-001",
    accountNo: "TBG-2026-P01",
    ownerType: "ORANG_TUA",
    ownerName: "Joko Santoso (Wali Murid)",
    ownerIdentifier: "Wali dari: Budi Santoso (Paket C)",
    ownerPhone: "081345678901",
    ownerEmail: "orangtua@askara.sch.id",
    studentName: "Joko Santoso",
    parentName: "Joko Santoso",
    savingType: "PENDIDIKAN",
    savingName: "Tabungan Dana Lanjutan Kuliah & Vokasi Anak",
    targetAmount: 10000000,
    currentBalance: 4500000,
    status: "ACTIVE",
    startDate: "2026-01-20",
    targetDate: "2027-08-30",
    notes: "Tabungan masa depan pendidikan putra kami Budi Santoso",
    transactionsCount: 6,
    createdAt: "2026-01-20T11:00:00Z",
  },
  {
    id: "tbg-ortu-002",
    accountNo: "TBG-2026-P02",
    ownerType: "ORANG_TUA",
    ownerName: "Joko Santoso (Wali Murid)",
    ownerIdentifier: "Wali dari: Budi Santoso (Paket C)",
    ownerPhone: "081345678901",
    ownerEmail: "orangtua@askara.sch.id",
    studentName: "Joko Santoso",
    parentName: "Joko Santoso",
    savingType: "QURBAN",
    savingName: "Tabungan Qurban Kambing Keluarga Santoso",
    targetAmount: 3200000,
    currentBalance: 3200000,
    status: "TARGET_ACHIEVED",
    startDate: "2026-02-15",
    targetDate: "2026-06-01",
    notes: "Lunas untuk 1 ekor kambing Qurban Idul Adha",
    transactionsCount: 4,
    createdAt: "2026-02-15T14:00:00Z",
  },
];

export let savingTransactionsStore: SavingTransactionItem[] = [
  {
    id: "trx-guru-001",
    accountId: "tbg-guru-001",
    accountNo: "TBG-2026-G01",
    ownerType: "GURU",
    ownerName: "Drs. Hendra Gunawan",
    studentName: "Drs. Hendra Gunawan",
    savingName: "Tabungan Qurban Sapi 1/7 Pendidik (Idul Adha 2027)",
    transactionType: "SETOR",
    amount: 300000,
    balanceAfter: 2200000,
    date: "2026-08-10",
    receiptNumber: "STR-2026/08-G01",
    notes: "Setoran rutin bulan Agustus 2026",
    paymentMethod: "TRANSFER",
    recordedByName: "Bendahara PKBM Askara",
    createdAt: "2026-08-10T09:00:00Z",
  },
  {
    id: "trx-001",
    accountId: "tbg-001",
    accountNo: "TBG-2026-001",
    ownerType: "SISWA",
    ownerName: "Budi Santoso",
    studentName: "Budi Santoso",
    savingName: "Tabungan Qurban Siswa Mandiri 1/7",
    transactionType: "SETOR",
    amount: 250000,
    balanceAfter: 1750000,
    date: "2026-08-12",
    receiptNumber: "STR-2026/08-001",
    notes: "Setoran rutin bulan Agustus 2026",
    paymentMethod: "TUNAI",
    recordedByName: "Bendahara PKBM Askara",
    createdAt: "2026-08-12T09:15:00Z",
  },
  {
    id: "trx-ortu-001",
    accountId: "tbg-ortu-001",
    accountNo: "TBG-2026-P01",
    ownerType: "ORANG_TUA",
    ownerName: "Joko Santoso (Wali Murid)",
    studentName: "Joko Santoso",
    savingName: "Tabungan Dana Lanjutan Kuliah & Vokasi Anak",
    transactionType: "SETOR",
    amount: 1000000,
    balanceAfter: 4500000,
    date: "2026-08-13",
    receiptNumber: "STR-2026/08-P01",
    notes: "Setoran tabungan pendidikan lanjutan anak",
    paymentMethod: "TRANSFER",
    recordedByName: "Bendahara PKBM Askara",
    createdAt: "2026-08-13T10:00:00Z",
  },
  {
    id: "trx-002",
    accountId: "tbg-002",
    accountNo: "TBG-2026-002",
    ownerType: "SISWA",
    ownerName: "Budi Santoso",
    studentName: "Budi Santoso",
    savingName: "Tabungan Study Tour & Vokasi Barista Jogja",
    transactionType: "SETOR",
    amount: 300000,
    balanceAfter: 1200000,
    date: "2026-08-14",
    receiptNumber: "STR-2026/08-002",
    notes: "Pelunasan target tabungan study tour",
    paymentMethod: "TRANSFER",
    recordedByName: "Bendahara PKBM Askara",
    createdAt: "2026-08-14T14:30:00Z",
  },
];
