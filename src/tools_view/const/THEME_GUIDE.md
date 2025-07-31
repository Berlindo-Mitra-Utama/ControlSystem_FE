# Panduan Penggunaan Tema Light/Dark Mode

## Overview

Sistem tema light/dark mode telah diimplementasikan untuk planning system dengan fitur:

- **Toggle Tema**: Tombol switch tema di navbar
- **Persistensi**: Tema tersimpan di localStorage
- **System Preference**: Otomatis mengikuti preferensi sistem
- **Konsistensi**: Semua komponen menggunakan tema yang sama

## Struktur Tema

### 1. Theme Context

```typescript
import { useTheme } from "../../contexts/ThemeContext";

const { theme, toggleTheme, setTheme, uiColors } = useTheme();
```

### 2. UI Colors berdasarkan Tema

```typescript
// Light Mode
uiColors.bg.primary = "bg-white";
uiColors.text.primary = "text-gray-900";
uiColors.border.primary = "border-gray-200";

// Dark Mode
uiColors.bg.primary = "bg-gray-900";
uiColors.text.primary = "text-white";
uiColors.border.primary = "border-gray-800";
```

## Implementasi di Komponen

### 1. Navbar

- Background: `uiColors.bg.primary`
- Text: `uiColors.text.primary`
- Border: `uiColors.border.primary`
- Toggle button dengan icon matahari/bulan

### 2. Dashboard

- Background: `uiColors.bg.primary`
- Text: `uiColors.text.primary`
- Cards: `uiColors.bg.secondary`
- Accent: `uiColors.text.accent`

### 3. StatsCards

- Card background: `uiColors.bg.secondary`
- Card border: `uiColors.border.primary`
- Text primary: `uiColors.text.primary`
- Text secondary: `uiColors.text.tertiary`
- Text muted: `uiColors.text.muted`

### 4. ProductionChart

- Chart container: `uiColors.bg.secondary`
- Chart text: `uiColors.text.primary`
- Grid lines: Dinamis berdasarkan tema
- Tooltip: Dinamis berdasarkan tema

## Cara Menambah Tema ke Komponen Baru

### 1. Import useTheme

```typescript
import { useTheme } from "../../contexts/ThemeContext";
```

### 2. Destructure uiColors

```typescript
const { uiColors } = useTheme();
```

### 3. Gunakan di className

```typescript
<div className={`${uiColors.bg.primary} ${uiColors.text.primary}`}>
  Content
</div>
```

### 4. Untuk conditional styling

```typescript
const { uiColors, theme } = useTheme();

// Contoh untuk chart colors
const gridColor = theme === "light" ? "#e5e7eb" : "#374151";
```

## Layout Wrapper

Planning system menggunakan `PlanningSystemLayout` yang membungkus semua komponen dengan `ThemeProvider`:

```typescript
// App.tsx
<PlanningSystemLayout>
  <DashboardLayout />
</PlanningSystemLayout>
```

## Keuntungan

1. **Konsistensi**: Semua komponen menggunakan tema yang sama
2. **User Experience**: Pengguna dapat memilih tema yang nyaman
3. **Accessibility**: Mendukung preferensi sistem
4. **Maintainability**: Perubahan tema terpusat
5. **Performance**: Tema tersimpan di localStorage

## Menambah Tema Baru

Untuk menambah tema baru (misalnya auto/auto):

1. Update `Theme` type di `colors.ts`
2. Tambahkan konfigurasi UI colors untuk tema baru
3. Update logic di `ThemeContext.tsx`
4. Update komponen yang menggunakan tema

## Testing

Untuk testing tema:

1. Klik icon tema di navbar
2. Refresh halaman (tema harus tersimpan)
3. Cek di berbagai komponen (navbar, dashboard, charts)
4. Test di light dan dark mode
