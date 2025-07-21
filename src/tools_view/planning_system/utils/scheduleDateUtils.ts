// Fungsi untuk mendapatkan jumlah hari dalam bulan
export const getDaysInMonth = (month: number, year: number): number => {
  // month: 0-11 (Januari = 0, Februari = 1, dst.)
  return new Date(year, month + 1, 0).getDate();
};

// Fungsi untuk mendapatkan nama hari dalam bahasa Indonesia
export const getDayName = (day: number, month: number, year: number): string => {
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
  const months = [
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

  let monthIndex = -1;
  let year = new Date().getFullYear();

  // Cari bulan dalam scheduleName
  for (let i = 0; i < months.length; i++) {
    if (scheduleName.includes(months[i])) {
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
  const months = [
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

  // Parse scheduleName untuk mendapatkan bulan dan tahun
  let monthIndex = -1;
  let year = new Date().getFullYear();

  // Cari bulan dalam scheduleName
  for (let i = 0; i < months.length; i++) {
    if (scheduleName.includes(months[i])) {
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
    formattedDate: `${validDay} ${months[monthIndex]} ${year}`,
    isValid,
    dayName,
  };
};

// Fungsi untuk mendapatkan jumlah hari maksimal dalam bulan berdasarkan scheduleName
export const getMaxDaysInMonth = (scheduleName: string): number => {
  const months = [
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

  let monthIndex = -1;
  let year = new Date().getFullYear();

  // Cari bulan dalam scheduleName
  for (let i = 0; i < months.length; i++) {
    if (scheduleName.includes(months[i])) {
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