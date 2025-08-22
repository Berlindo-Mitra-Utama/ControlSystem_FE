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
    deliveryPlan: number;
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
  };
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const { uiColors } = useTheme();
  
  // Data untuk tabel dibagi menjadi 3 kolom
  const leftColumnData = [
    { label: "MANPOWER", value: stats.disruptedItems },
    { label: "DELIVERY PLAN (PCS)", value: stats.deliveryPlan },
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
    { label: "AKUMULASI HASIL PRODUKSI (PCS)", value: stats.akumulasiHasilProduksi },
    { label: "ACTUAL STOCK (PCS)", value: stats.actualStock },
    { label: "RENCANA STOCK (PCS)", value: stats.rencanaStock },
  ];

  // Fungsi untuk membuat tabel
  const renderTable = (data: { label: string; value: number }[]) => (
    <div className={`${uiColors.bg.secondary} border ${uiColors.border.primary} rounded-xl overflow-hidden shadow-md h-full`}>
      <table className="w-full">
        <thead>
          <tr className={`${uiColors.bg.tertiary}`}>
            <th className={`px-4 py-3 text-left text-sm font-medium ${uiColors.text.primary} uppercase tracking-wider`}>
              Metrik
            </th>
            <th className={`px-4 py-3 text-right text-sm font-medium ${uiColors.text.primary} uppercase tracking-wider`}>
              Nilai
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((item, index) => (
            <tr 
              key={index} 
              className={index % 2 === 0 ? uiColors.bg.secondary : `${uiColors.bg.primary} bg-opacity-50`}
            >
              <td className={`px-4 py-3 text-sm font-medium ${uiColors.text.tertiary} uppercase`}>
                {item.label}
              </td>
              <td className={`px-4 py-3 text-right text-sm font-bold ${uiColors.text.primary}`}>
                {typeof item.value === 'number' ? item.value.toLocaleString() : item.value || 0}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>{renderTable(leftColumnData)}</div>
      <div>{renderTable(middleColumnData)}</div>
      <div>{renderTable(rightColumnData)}</div>
    </div>
  );
};

export default StatsCards;
