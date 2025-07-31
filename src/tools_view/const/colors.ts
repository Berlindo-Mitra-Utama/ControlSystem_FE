// Color configuration untuk seluruh tools view dengan support light/dark mode
export type Theme = "light" | "dark";

export const Colors = {
  // Status Colors - sama untuk light dan dark
  status: {
    normal: {
      bg: "bg-emerald-500/20",
      text: "text-emerald-400",
      border: "border-emerald-500/30",
      icon: "✓",
    },
    gangguan: {
      bg: "bg-red-500/20",
      text: "text-red-400",
      border: "border-red-500/30",
      icon: "⚠",
    },
    completed: {
      bg: "bg-blue-500/20",
      text: "text-blue-400",
      border: "border-blue-500/30",
      icon: "✓",
    },
  },

  // Part Colors - sama untuk light dan dark
  parts: {
    muffler: {
      name: "29N Muffler",
      customer: "Sakura",
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      description: "Komponen sistem pembuangan",
    },
    transmission: {
      name: "Transmission Case B2",
      customer: "Honda Corp",
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
      description: "Casing transmisi otomatis",
    },
    brakeDisc: {
      name: "Brake Disc C3",
      customer: "Nissan Ltd",
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
      description: "Cakram rem performa tinggi",
    },
  },

  // Category Colors - sama untuk light dan dark
  categories: {
    delivery: {
      bg: "bg-blue-600/30",
      text: "text-blue-800",
      border: "border-blue-600",
      hover: "hover:bg-blue-700/50",
    },
    planning: {
      bg: "bg-yellow-600/30",
      text: "text-yellow-800",
      border: "border-yellow-600",
      hover: "hover:bg-yellow-700/50",
    },
    overtime: {
      bg: "bg-orange-600/30",
      text: "text-orange-800",
      border: "border-orange-600",
      hover: "hover:bg-orange-700/50",
    },
    stock: {
      bg: "bg-indigo-600/30",
      text: "text-indigo-800",
      border: "border-indigo-600",
      hover: "hover:bg-indigo-700/50",
    },
    hasilProduksi: {
      bg: "bg-purple-600/30",
      text: "text-purple-800",
      border: "border-purple-600",
      hover: "hover:bg-purple-700/50",
    },
    jamAktual: {
      bg: "bg-green-600/30",
      text: "text-green-800",
      border: "border-green-600",
      hover: "hover:bg-green-700/50",
    },
  },

  // UI Colors - berbeda untuk light dan dark mode
  ui: {
    light: {
      // Background colors
      bg: {
        primary: "bg-white",
        secondary: "bg-gray-50",
        tertiary: "bg-gray-100",
        card: "bg-white",
        modal: "bg-white/95",
        overlay: "bg-black/20",
      },

      // Border colors
      border: {
        primary: "border-gray-200",
        secondary: "border-gray-300",
        tertiary: "border-gray-400",
        accent: "border-blue-500",
        success: "border-green-500",
        warning: "border-yellow-500",
        error: "border-red-500",
      },

      // Text colors
      text: {
        primary: "text-gray-900",
        secondary: "text-gray-700",
        tertiary: "text-gray-600",
        muted: "text-gray-500",
        accent: "text-blue-600",
        success: "text-green-600",
        warning: "text-yellow-600",
        error: "text-red-600",
      },

      // Button colors
      button: {
        primary: {
          bg: "bg-blue-600",
          hover: "hover:bg-blue-700",
          text: "text-white",
          border: "border-blue-600",
        },
        secondary: {
          bg: "bg-gray-200",
          hover: "hover:bg-gray-300",
          text: "text-gray-700",
          border: "border-gray-300",
        },
        success: {
          bg: "bg-green-600",
          hover: "hover:bg-green-700",
          text: "text-white",
          border: "border-green-600",
        },
        danger: {
          bg: "bg-red-600",
          hover: "hover:bg-red-700",
          text: "text-white",
          border: "border-red-600",
        },
      },

      // Gradient colors
      gradient: {
        primary: "from-blue-600 to-indigo-600",
        secondary: "from-green-600 to-emerald-600",
        accent: "from-purple-600 to-pink-600",
        dark: "from-gray-100 to-gray-200",
      },
    },
    dark: {
      // Background colors
      bg: {
        primary: "bg-gray-900",
        secondary: "bg-gray-800",
        tertiary: "bg-gray-700",
        card: "bg-gray-800/50",
        modal: "bg-gray-900/95",
        overlay: "bg-black/50",
      },

      // Border colors
      border: {
        primary: "border-gray-800",
        secondary: "border-gray-700",
        tertiary: "border-gray-600",
        accent: "border-blue-500",
        success: "border-green-500",
        warning: "border-yellow-500",
        error: "border-red-500",
      },

      // Text colors
      text: {
        primary: "text-white",
        secondary: "text-gray-300",
        tertiary: "text-gray-400",
        muted: "text-gray-500",
        accent: "text-blue-400",
        success: "text-green-400",
        warning: "text-yellow-400",
        error: "text-red-400",
      },

      // Button colors
      button: {
        primary: {
          bg: "bg-blue-600",
          hover: "hover:bg-blue-700",
          text: "text-white",
          border: "border-blue-600",
        },
        secondary: {
          bg: "bg-gray-700",
          hover: "hover:bg-gray-600",
          text: "text-gray-300",
          border: "border-gray-600",
        },
        success: {
          bg: "bg-green-600",
          hover: "hover:bg-green-700",
          text: "text-white",
          border: "border-green-600",
        },
        danger: {
          bg: "bg-red-600",
          hover: "hover:bg-red-700",
          text: "text-white",
          border: "border-red-600",
        },
      },

      // Gradient colors
      gradient: {
        primary: "from-blue-600 to-indigo-600",
        secondary: "from-green-600 to-emerald-600",
        accent: "from-purple-600 to-pink-600",
        dark: "from-gray-800 to-gray-900",
      },
    },
  },

  // Progress colors - sama untuk light dan dark
  progress: {
    low: {
      color: "from-gray-500 to-gray-600",
      textColor: "text-gray-400",
    },
    medium: {
      color: "from-purple-500 to-pink-500",
      textColor: "text-purple-400",
    },
    high: {
      color: "from-yellow-500 to-orange-500",
      textColor: "text-yellow-400",
    },
    veryHigh: {
      color: "from-blue-500 to-cyan-600",
      textColor: "text-blue-400",
    },
    complete: {
      color: "from-green-500 to-emerald-600",
      textColor: "text-green-400",
    },
  },
};

// Helper functions untuk mendapatkan warna berdasarkan status
export const getStatusColor = (status: string) => {
  const statusKey = status.toLowerCase() as keyof typeof Colors.status;
  return Colors.status[statusKey] || Colors.status.normal;
};

// Helper functions untuk mendapatkan warna berdasarkan kategori
export const getCategoryColor = (category: string) => {
  const categoryKey = category.toLowerCase() as keyof typeof Colors.categories;
  return Colors.categories[categoryKey] || Colors.categories.delivery;
};

// Helper functions untuk mendapatkan warna progress berdasarkan persentase
export const getProgressColor = (percentage: number) => {
  if (percentage === 100) return Colors.progress.complete;
  if (percentage >= 75) return Colors.progress.veryHigh;
  if (percentage >= 50) return Colors.progress.high;
  if (percentage >= 25) return Colors.progress.medium;
  return Colors.progress.low;
};

// Helper functions untuk mendapatkan warna part berdasarkan nama
export const getPartColor = (partName: string) => {
  const partNameLower = partName.toLowerCase();
  if (partNameLower.includes("muffler")) return Colors.parts.muffler;
  if (partNameLower.includes("transmission")) return Colors.parts.transmission;
  if (partNameLower.includes("brake")) return Colors.parts.brakeDisc;
  return Colors.parts.muffler; // default
};

// Helper functions untuk mendapatkan UI colors berdasarkan tema
export const getUIColors = (theme: Theme) => {
  return Colors.ui[theme];
};

export default Colors;
