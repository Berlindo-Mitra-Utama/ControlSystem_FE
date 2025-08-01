// Utils untuk mengelola warna chart berdasarkan theme

export interface ChartThemeColors {
  // Background colors
  pageBg: string;
  cardBg: string;
  emptyStateBg: string;

  // Text colors
  titleText: string;
  labelText: string;
  emptyStateText: string;

  // Border colors
  borderColor: string;

  // Chart colors
  gridColor: string;
  axisColor: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
  labelTextColor: string;

  // Select colors
  selectBg: string;
  selectText: string;
  selectBorder: string;
  selectFocusRing: string;
}

export const getChartThemeColors = (theme: string): ChartThemeColors => {
  const isDark = theme === "dark";

  return {
    // Background colors
    pageBg: isDark ? "bg-gray-950" : "bg-gray-50",
    cardBg: isDark ? "bg-gray-900" : "bg-white",
    emptyStateBg: isDark ? "bg-gray-900" : "bg-white",

    // Text colors
    titleText: isDark ? "text-white" : "text-gray-900",
    labelText: isDark ? "text-white" : "text-gray-700",
    emptyStateText: isDark ? "text-gray-400" : "text-gray-500",

    // Border colors
    borderColor: isDark ? "border-gray-700" : "border-gray-300",

    // Chart colors
    gridColor: isDark ? "#374151" : "#e5e7eb",
    axisColor: isDark ? "#9ca3af" : "#6b7280",
    tooltipBg: isDark ? "#1f2937" : "#ffffff",
    tooltipBorder: isDark ? "#374151" : "#e5e7eb",
    tooltipText: isDark ? "#f9fafb" : "#111827",
    labelTextColor: isDark ? "#f9fafb" : "#111827",

    // Select colors
    selectBg: isDark ? "bg-gray-800" : "bg-white",
    selectText: isDark ? "text-white" : "text-gray-900",
    selectBorder: isDark ? "border-gray-700" : "border-gray-300",
    selectFocusRing: isDark ? "focus:ring-blue-400" : "focus:ring-blue-500",
  };
};

// Warna untuk bar chart
export const getBarChartColors = (theme: string) => {
  const isDark = theme === "dark";

  return {
    barFill: "#10b981", // Emerald green - konsisten untuk kedua theme
    barRadius: [4, 4, 0, 0],
    barOpacity: isDark ? 0.8 : 1,
  };
};

// Warna untuk line chart (jika diperlukan di masa depan)
export const getLineChartColors = (theme: string) => {
  const isDark = theme === "dark";

  return {
    lineStroke: "#10b981",
    lineStrokeWidth: 2,
    dotFill: isDark ? "#1f2937" : "#ffffff",
    dotStroke: "#10b981",
    dotRadius: 4,
  };
};

// Warna untuk area chart (jika diperlukan di masa depan)
export const getAreaChartColors = (theme: string) => {
  const isDark = theme === "dark";

  return {
    areaFill: isDark ? "#10b981" : "#10b981",
    areaOpacity: isDark ? 0.3 : 0.1,
    strokeColor: "#10b981",
    strokeWidth: 2,
  };
};
