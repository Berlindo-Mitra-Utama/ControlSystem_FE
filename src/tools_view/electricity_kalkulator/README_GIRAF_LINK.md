# Fitur Link ke GIRAF Tech Solution

## 📋 Deskripsi Fitur

Fitur ini memungkinkan pengguna untuk mengklik link "Giraf Tech Solution" di electricity calculator dan akan diarahkan ke bagian GIRAF Tech Solution di LandingPage dengan scroll yang smooth.

## 🔧 Implementasi

### 1. **Electricity Calculator (electricity_page.tsx)**

#### **Import dan Setup:**

```tsx
import { Link, useNavigate } from "react-router-dom";
import { handleGirafTeamClick } from "./utils/scrollUtils";

export default function Component() {
  const navigate = useNavigate();
  // ... rest of component
}
```

#### **Footer Section:**

```tsx
{
  /* Footer - Creator */
}
<div className="border-t border-slate-600 px-6 py-4">
  <div className="text-center">
    <p className="text-xs text-slate-500">
      Dibuat oleh{" "}
      <button
        onClick={() => handleGirafTeamClick(navigate)}
        className="text-cyan-400 font-semibold hover:underline cursor-pointer transition-colors hover:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 rounded"
      >
        Giraf Tech Solution
      </button>
    </p>
  </div>
</div>;
```

### 2. **Utility Functions (scrollUtils.ts)**

#### **handleGirafTeamClick Function:**

```tsx
export const handleGirafTeamClick = (navigate: any) => {
  // Navigate to landing page with hash
  navigate("/#giraf-team");

  // Smooth scroll to element after navigation
  setTimeout(() => {
    const element = document.getElementById("giraf-team");
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, 200);
};
```

### 3. **LandingPage (LandingPage.tsx)**

#### **GIRAF Team Section:**

```tsx
{
  /* Section Tim Developer GIRAF */
}
<div
  id="giraf-team"
  className="bg-gray-900/80 rounded-2xl p-8 max-w-3xl mx-auto text-center shadow-lg border border-gray-800 mb-10 scroll-mt-20 hover:shadow-2xl hover:border-cyan-400/30 transition-all duration-500"
>
  {/* GIRAF Team Content */}
</div>;
```

## 🎯 Fitur Utama

### **1. Smooth Navigation:**

- Menggunakan `navigate('/#giraf-team')` untuk navigasi
- Smooth scroll dengan `scrollIntoView({ behavior: 'smooth' })`
- Delay 200ms untuk memastikan DOM sudah ter-render

### **2. Visual Feedback:**

- Hover effects pada button di electricity calculator
- Focus ring untuk accessibility
- Hover effects pada GIRAF section di LandingPage

### **3. Accessibility:**

- Proper focus management
- Keyboard navigation support
- Screen reader friendly

## 🎨 Styling

### **Electricity Calculator Button:**

```css
text-cyan-400 font-semibold hover:underline cursor-pointer
transition-colors hover:text-cyan-300
focus:outline-none focus:ring-2 focus:ring-cyan-400/50 rounded
```

### **LandingPage GIRAF Section:**

```css
bg-gray-900/80 rounded-2xl p-8 max-w-3xl mx-auto text-center
shadow-lg border border-gray-800 mb-10 scroll-mt-20
hover:shadow-2xl hover:border-cyan-400/30 transition-all duration-500
```

## 🔄 Flow Kerja

1. **User mengklik "Giraf Tech Solution"** di electricity calculator
2. **handleGirafTeamClick dipanggil** dengan navigate function
3. **Navigasi ke LandingPage** dengan hash `/#giraf-team`
4. **Timeout 200ms** untuk memastikan DOM ready
5. **Smooth scroll** ke element dengan ID `giraf-team`
6. **Section GIRAF Tech Solution** ditampilkan dengan efek visual

## ✅ Testing Checklist

- ✅ **Navigation**: Link berfungsi dan mengarah ke LandingPage
- ✅ **Scroll Behavior**: Smooth scroll ke section GIRAF
- ✅ **Visual Feedback**: Hover effects berfungsi
- ✅ **Accessibility**: Keyboard navigation dan focus management
- ✅ **Responsive**: Berfungsi di semua ukuran layar
- ✅ **Performance**: Tidak ada lag atau delay yang berlebihan

## 🚀 Cara Penggunaan

1. Buka electricity calculator
2. Scroll ke bagian bawah
3. Klik "Giraf Tech Solution"
4. Akan diarahkan ke LandingPage dengan scroll smooth ke section GIRAF

## 📁 File yang Terlibat

- `electricity_page.tsx` - Main component dengan link
- `scrollUtils.ts` - Utility functions untuk scroll behavior
- `LandingPage.tsx` - Target section dengan ID `giraf-team`
