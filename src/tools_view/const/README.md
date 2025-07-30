# Color Configuration untuk Tools View

File `colors.ts` berisi konfigurasi warna yang dapat digunakan di seluruh tools view untuk konsistensi desain.

## Struktur Warna

### 1. Status Colors

Digunakan untuk status badges dan indicators:

```typescript
import { getStatusColor } from "../../const/colors";

const statusColor = getStatusColor("Normal"); // atau "Gangguan", "Completed"
// Returns: { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30", icon: "✓" }
```

### 2. Part Colors

Digunakan untuk different parts/items:

```typescript
import { getPartColor } from "../../const/colors";

const partColor = getPartColor("29N Muffler");
// Returns: { name: "29N Muffler", customer: "Sakura", color: "from-blue-500 to-cyan-500", ... }
```

### 3. Category Colors

Digunakan untuk different data categories:

```typescript
import { getCategoryColor } from "../../const/colors";

const categoryColor = getCategoryColor("delivery");
// Returns: { bg: "bg-blue-800/50", text: "text-blue-200", border: "border-blue-600", hover: "hover:bg-blue-700/50" }
```

### 4. Progress Colors

Digunakan untuk progress indicators:

```typescript
import { getProgressColor } from "../../const/colors";

const progressColor = getProgressColor(75); // percentage
// Returns: { color: "from-blue-500 to-cyan-600", textColor: "text-blue-400" }
```

### 5. UI Colors

Digunakan untuk background, borders, text, dan buttons:

```typescript
import { Colors } from "../../const/colors";

// Background colors
const bgColor = Colors.ui.bg.primary; // "bg-gray-900"

// Border colors
const borderColor = Colors.ui.border.primary; // "border-gray-800"

// Text colors
const textColor = Colors.ui.text.primary; // "text-white"

// Button colors
const buttonColor = Colors.ui.button.primary; // { bg: "bg-blue-600", hover: "hover:bg-blue-700", ... }
```

## Contoh Penggunaan

### StatusBadge Component

```typescript
import { getStatusColor } from "../../../const/colors";

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = getStatusColor(status);

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}>
      <span className="text-xs">{config.icon}</span>
      {status}
    </span>
  );
};
```

### ScheduleTableView Component

```typescript
import { getCategoryColor } from "../../../const/colors";

// Untuk delivery category
const deliveryColor = getCategoryColor("delivery");
bgColor = deliveryColor.bg;
textColor = deliveryColor.text;

// Untuk planning category
const planningColor = getCategoryColor("planning");
bgColor = planningColor.bg.replace("/50", "/30");
textColor = planningColor.text.replace("200", "300");
```

### Progress Dashboard

```typescript
import { getProgressColor } from "../../const/colors";

const getStatusInfo = (progress: number) => {
  const progressColor = getProgressColor(progress);
  return {
    color: progressColor.color,
    textColor: progressColor.textColor,
  };
};
```

## Keuntungan

1. **Konsistensi**: Semua tools view menggunakan warna yang sama
2. **Maintainability**: Perubahan warna cukup dilakukan di satu tempat
3. **Type Safety**: TypeScript memberikan autocomplete dan type checking
4. **Reusability**: Helper functions memudahkan penggunaan
5. **Scalability**: Mudah menambah warna baru

## Menambah Warna Baru

Untuk menambah warna baru, cukup update file `colors.ts`:

```typescript
// Tambah di bagian yang sesuai
export const Colors = {
  // ... existing colors
  newCategory: {
    bg: "bg-new-color/50",
    text: "text-new-color-200",
    border: "border-new-color-600",
    hover: "hover:bg-new-color-700/50",
  },
};

// Tambah helper function jika diperlukan
export const getNewCategoryColor = (category: string) => {
  // logic untuk mendapatkan warna
};
```
