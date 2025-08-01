# Perubahan Warna dan Refactor ScheduleTableView

## 📋 Ringkasan Perubahan

### 1. **Pengelompokan Warna Baru**

#### **Manpower** (Kategori Terpisah)

- **Light Theme**: `bg-slate-200` / `text-slate-800`
- **Dark Theme**: `bg-slate-700` / `text-slate-200`

#### **Hasil Produksi** (Dipisah menjadi 2 Grup)

**Grup 1 - Hasil Produksi (Hijau)**

- JAM PRODUKSI (CYCLETIME)
- HASIL PRODUKSI AKTUAL (PCS)
- **Light Theme**: `bg-emerald-100` / `text-emerald-900`
- **Dark Theme**: `bg-emerald-900/30` / `text-emerald-200`

**Grup 2 - Hasil Produksi (Ungu)**

- AKUMULASI HASIL PRODUKSI AKTUAL (PCS)
- JAM PRODUKSI AKTUAL
- **Light Theme**: `bg-violet-100` / `text-violet-900`
- **Dark Theme**: `bg-violet-900/30` / `text-violet-200`

#### **Kategori Lainnya**

- **Stock/Delivery**: Biru
- **Planning**: Kuning (amber)
- **Overtime**: Merah muda (rose)
- **Actual Stock**: Biru langit (sky)

### 2. **Dukungan Dark Theme**

Semua warna sekarang mendukung dark theme dengan:

- **Opacity/Transparency** untuk background
- **Warna teks yang kontras** untuk readability
- **Konsistensi** dengan design system

### 3. **Refactor Struktur**

#### **File Utils Baru**

```
utils/
├── scheduleColorUtils.tsx    # Warna dan pengelompokan
├── scheduleDataUtils.tsx     # Logika data baris
├── scheduleCalcUtils.tsx     # Perhitungan (existing)
└── scheduleDateUtils.tsx     # Utils tanggal (existing)
```

#### **Komponen Baru**

```
components/layout/
├── ScheduleTableView.tsx     # Main component (refactored)
├── ManpowerDropdown.tsx      # Dropdown manpower
└── EditableCell.tsx         # Input cell yang dapat diedit
```

### 4. **Keuntungan Refactor**

- ✅ **Maintainability**: Kode lebih mudah dipelihara
- ✅ **Reusability**: Utils dapat digunakan kembali
- ✅ **Readability**: Kode lebih mudah dibaca
- ✅ **Dark Theme Support**: Warna yang sesuai untuk dark mode
- ✅ **Separation of Concerns**: Setiap file memiliki tanggung jawab yang jelas

### 5. **Cara Penggunaan**

```typescript
// Menggunakan utils warna
import {
  getRowColorConfig,
  getTotalColorConfig,
} from "../../utils/scheduleColorUtils";

// Dengan dark theme support
const { rowBgColor, textColor } = getRowColorConfig(rowKey, theme === "dark");
const { bgColor, textColor } = getTotalColorConfig(rowKey, theme === "dark");
```

### 6. **Pengelompokan Warna Sesuai Gambar**

Berdasarkan gambar yang diberikan:

- **Manpower**: Warna terpisah (abu-abu)
- **Jam Produksi + Hasil Produksi Aktual**: Hijau (Grup 1)
- **Akumulasi Hasil + Jam Aktual**: Ungu (Grup 2)

### 7. **Filter Options**

Filter "Hasil Produksi" sekarang menampilkan kedua grup:

- hasil-produksi-1 (Hijau)
- hasil-produksi-2 (Ungu)
