// Konstanta untuk nama bulan
export const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

// Mock data untuk part selection
export const mockData = [
  {
    part: "29N Muffler",
    customer: "Sakura",
    timePerPcs: 257,
    cycle1: 14,
    cycle7: 98,
    cycle35: 49,
  },
];

// Fungsi untuk mendapatkan jumlah hari dalam bulan
export const getDaysInMonth = (month: number, year: number): number => {
  // month: 0-11 (Januari = 0, Februari = 1, dst.)
  return new Date(year, month + 1, 0).getDate();
};

// Fungsi untuk mendapatkan nama hari dalam bahasa Indonesia
export const getDayName = (
  day: number,
  month: number,
  year: number,
): string => {
  const dayNames = [
    "Minggu",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
  ];
  const date = new Date(year, month, day);
  return dayNames[date.getDay()];
};

// Fungsi untuk mengecek apakah hari adalah weekend
export const isWeekend = (day: number, scheduleName: string): boolean => {
  let monthIndex = -1;
  let year = new Date().getFullYear();

  // Cari bulan dalam scheduleName
  for (let i = 0; i < MONTHS.length; i++) {
    if (scheduleName.includes(MONTHS[i])) {
      monthIndex = i;
      break;
    }
  }

  // Extract tahun menggunakan regex
  const yearMatch = scheduleName.match(/(\d{4})/);
  if (yearMatch && yearMatch[1]) {
    year = parseInt(yearMatch[1]);
  }

  // Jika bulan tidak ditemukan, gunakan default
  if (monthIndex === -1) {
    monthIndex = 6; // Juli sebagai default
    year = 2025;
  }

  const date = new Date(year, monthIndex, day);
  const dayOfWeek = date.getDay(); // 0 = Minggu, 6 = Sabtu
  return dayOfWeek === 0 || dayOfWeek === 6;
};

// Fungsi untuk memformat tanggal dengan validasi
export const formatValidDate = (
  day: number,
  scheduleName: string,
): { formattedDate: string; isValid: boolean; dayName: string } => {
  // Parse scheduleName untuk mendapatkan bulan dan tahun
  let monthIndex = -1;
  let year = new Date().getFullYear();

  // Cari bulan dalam scheduleName
  for (let i = 0; i < MONTHS.length; i++) {
    if (scheduleName.includes(MONTHS[i])) {
      monthIndex = i;
      break;
    }
  }

  // Extract tahun menggunakan regex
  const yearMatch = scheduleName.match(/(\d{4})/);
  if (yearMatch && yearMatch[1]) {
    year = parseInt(yearMatch[1]);
  }

  // Jika bulan tidak ditemukan, gunakan default
  if (monthIndex === -1) {
    monthIndex = 6; // Juli sebagai default
    year = 2025;
  }

  const maxDays = getDaysInMonth(monthIndex, year);
  const isValid = day >= 1 && day <= maxDays;
  const validDay = isValid ? day : Math.min(day, maxDays);
  const dayName = getDayName(validDay, monthIndex, year);

  return {
    formattedDate: `${validDay} ${MONTHS[monthIndex]} ${year}`,
    isValid,
    dayName,
  };
};

// Fungsi untuk mendapatkan jumlah hari maksimal dalam bulan berdasarkan scheduleName
export const getMaxDaysInMonth = (scheduleName: string): number => {
  let monthIndex = -1;
  let year = new Date().getFullYear();

  // Cari bulan dalam scheduleName
  for (let i = 0; i < MONTHS.length; i++) {
    if (scheduleName.includes(MONTHS[i])) {
      monthIndex = i;
      break;
    }
  }

  // Extract tahun menggunakan regex
  const yearMatch = scheduleName.match(/(\d{4})/);
  if (yearMatch && yearMatch[1]) {
    year = parseInt(yearMatch[1]);
  }

  // Jika bulan tidak ditemukan, gunakan default
  if (monthIndex === -1) {
    monthIndex = 6; // Juli sebagai default
    year = 2025;
  }

  return getDaysInMonth(monthIndex, year);
};

// Fungsi untuk generate schedule name dari month dan year
export const getScheduleName = (month: number, year: number): string => {
  return `${MONTHS[month]} ${year}`;
};

// Fungsi untuk parse schedule name ke month dan year
export const parseScheduleName = (
  scheduleName: string,
): { month: number; year: number } => {
  let monthIndex = 6; // Default Juli
  let year = new Date().getFullYear();

  // Cari bulan dalam scheduleName
  for (let i = 0; i < MONTHS.length; i++) {
    if (scheduleName.includes(MONTHS[i])) {
      monthIndex = i;
      break;
    }
  }

  // Extract tahun menggunakan regex
  const yearMatch = scheduleName.match(/(\d{4})/);
  if (yearMatch && yearMatch[1]) {
    year = parseInt(yearMatch[1]);
  }

  return { month: monthIndex, year };
};
