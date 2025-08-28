import React from "react";
import { useTheme } from "../../../contexts/ThemeContext";

interface StatsCardsProps {
  stats: {
    // Data yang sudah ada
    totalProduction: number;
    totalPlanned: number;
    totalDays: number;
    disruptedItems: number;

    // Data baru sesuai gambar
    deliveryActual: number;
    akumulasiDelivery: number;
    planningProduksiPcs: number;
    planningProduksiJam: number;
    overtimePcs: number;
    overtimeJam: number;
    jamProduksiCycleTime: number;
    hasilProduksiAktual: number;
    akumulasiHasilProduksi: number;
    actualStock: number;
    rencanaStock: number;

    // Data untuk child part
    rencanaInMaterial?: number;
    aktualInMaterial?: number;
  };
  isChildPart?: boolean;
  isNormalPart?: boolean; // Tambahkan prop baru
  showAllMetrics?: boolean; // Tambahkan prop baru untuk menampilkan semua metrik
}

const StatsCards: React.FC<StatsCardsProps> = ({
  stats,
  isChildPart = false,
  isNormalPart = false,
  showAllMetrics = false,
}) => {
  const { uiColors } = useTheme();

  // Data untuk tabel dibagi menjadi 3 kolom untuk part normal
  const leftColumnData = [
    { label: "MANPOWER", value: stats.disruptedItems },
    { label: "DELIVERY AKTUAL (PCS)", value: stats.deliveryActual },
    { label: "AKUMULASI DELIVERY (PCS)", value: stats.akumulasiDelivery },
    { label: "PLANNING PRODUKSI (PCS)", value: stats.planningProduksiPcs },
  ];

  const middleColumnData = [
    { label: "PLANNING PRODUKSI (JAM)", value: stats.planningProduksiJam },
    { label: "OVERTIME (PCS)", value: stats.overtimePcs },
    { label: "OVERTIME (JAM)", value: stats.overtimeJam },
    { label: "JAM PRODUKSI (CYCLETIME)", value: stats.jamProduksiCycleTime },
  ];

  const rightColumnData = [
    { label: "HASIL PRODUKSI AKTUAL (PCS)", value: stats.hasilProduksiAktual },
    {
      label: "AKUMULASI HASIL PRODUKSI (PCS)",
      value: stats.akumulasiHasilProduksi,
    },
    { label: "ACTUAL STOCK (PCS)", value: stats.actualStock },
    { label: "RENCANA STOCK (PCS)", value: stats.rencanaStock },
  ];

  // Data untuk child part (sesuai gambar)
  const childPartData = [
    { label: "RENCANA IN MATERIAL", value: stats.rencanaInMaterial || 0 },
    { label: "AKTUAL IN MATERIAL", value: stats.aktualInMaterial || 0 },
    { label: "RENCANA STOCK (PCS)", value: stats.rencanaStock },
    { label: "AKTUAL STOCK (PCS)", value: stats.actualStock },
  ];

  // Fungsi untuk membuat tabel
  const renderTable = (data: { label: string; value: number }[]) => (
    <div
      className={`${uiColors.bg.secondary} border ${uiColors.border.primary} rounded-xl overflow-hidden shadow-md h-full`}
    >
      <table className="w-full">
        <thead>
          <tr className={`${uiColors.bg.tertiary}`}>
            <th
              className={`px-4 py-3 text-left text-sm font-medium ${uiColors.text.primary} uppercase tracking-wider`}
            >
              Metrik
            </th>
            <th
              className={`px-4 py-3 text-right text-sm font-medium ${uiColors.text.primary} uppercase tracking-wider`}
            >
              Total
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((item, index) => (
            <tr
              key={index}
              className={
                index % 2 === 0
                  ? uiColors.bg.secondary
                  : `${uiColors.bg.primary} bg-opacity-50`
              }
            >
              <td
                className={`px-4 py-3 text-sm font-medium ${uiColors.text.tertiary} uppercase`}
              >
                {item.label}
              </td>
              <td
                className={`px-4 py-3 text-right text-sm font-bold ${uiColors.text.primary}`}
              >
                {typeof item.value === "number"
                  ? item.value.toLocaleString()
                  : item.value || 0}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Jika showAllMetrics true, tampilkan kedua jenis metrik
  if (showAllMetrics) {
    return (
      <div className="space-y-8">
        <div>
          <h3 className={`text-xl font-semibold ${uiColors.text.primary} mb-4`}>
            Metrik Normal Part
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>{renderTable(leftColumnData)}</div>
            <div>{renderTable(middleColumnData)}</div>
            <div>{renderTable(rightColumnData)}</div>
          </div>
        </div>

        <div>
          <h3 className={`text-xl font-semibold ${uiColors.text.primary} mb-4`}>
            Metrik Child Part
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <div>{renderTable(childPartData)}</div>
          </div>
        </div>
      </div>
    );
  }

  // Jika isChildPart true, tampilkan hanya satu tabel dengan metrik child part
  if (isChildPart) {
    return (
      <div>
        <h3 className={`text-xl font-semibold ${uiColors.text.primary} mb-4`}>
          Metrik Child Part
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <div>{renderTable(childPartData)}</div>
        </div>
      </div>
    );
  }

  // Jika isNormalPart true, tampilkan tiga tabel dengan metrik normal part
  if (isNormalPart) {
    return (
      <div>
        <h3 className={`text-xl font-semibold ${uiColors.text.primary} mb-4`}>
          Metrik Normal Part
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>{renderTable(leftColumnData)}</div>
          <div>{renderTable(middleColumnData)}</div>
          <div>{renderTable(rightColumnData)}</div>
        </div>
      </div>
    );
  }

  // Jika tidak ada part yang dipilih atau tidak teridentifikasi jenisnya, tampilkan pesan
  return (
    <div
      className={`${uiColors.bg.secondary} border ${uiColors.border.primary} rounded-xl p-6 text-center`}
    >
      <p className={`text-lg ${uiColors.text.primary}`}>
        Silakan pilih part untuk melihat metrik yang sesuai.
      </p>
    </div>
  );
};

export default StatsCards;
