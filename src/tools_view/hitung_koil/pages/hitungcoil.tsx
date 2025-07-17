"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
  Calculator,
  Settings,
  BarChart3,
  Trash2,
  Weight,
  Clock,
  Ruler,
  Package,
} from "lucide-react";

interface CoilFormData {
  speckMaterial: string; // Rms
  diameterLuar: string; // Mm
  diameterDalam: string; // Mm
  lebarCoil: string; // Mm
  tebalMaterial: string; // Mm
  langkahPemakanan: string; // Mm
  spm: string; // Strk/Mnt
}

interface CoilCalculationResult {
  tebalSatuSisiCoil: number; // Mm
  bentanganDiameterLuarCoil: number; // Mm
  panjangCoil: number; // Mm
  beratCoil: number; // Kg
  beratPcs: number; // Kg
  waktuProses: number; // Jam
  qty: number; // Pcs
}

const EnhancedCoilCalculator: React.FC = () => {
  const [formData, setFormData] = useState<CoilFormData>({
    speckMaterial: "",
    diameterLuar: "",
    diameterDalam: "",
    lebarCoil: "",
    tebalMaterial: "",
    langkahPemakanan: "",
    spm: "",
  });

  const [result, setResult] = useState<CoilCalculationResult>({
    tebalSatuSisiCoil: 0,
    bentanganDiameterLuarCoil: 0,
    panjangCoil: 0,
    beratCoil: 0,
    beratPcs: 0,
    waktuProses: 0,
    qty: 0,
  });

  // Menghitung hasil berdasarkan rumus yang diberikan
  useEffect(() => {
    // Konversi string ke number, jika kosong atau invalid gunakan 0
    const speckMaterial = Number.parseFloat(formData.speckMaterial) || 0;
    const diameterLuar = Number.parseFloat(formData.diameterLuar) || 0;
    const diameterDalam = Number.parseFloat(formData.diameterDalam) || 0;
    const lebarCoil = Number.parseFloat(formData.lebarCoil) || 0;
    const tebalMaterial = Number.parseFloat(formData.tebalMaterial) || 0;
    const langkahPemakanan = Number.parseFloat(formData.langkahPemakanan) || 0;
    const spm = Number.parseFloat(formData.spm) || 0;

    // Helper function untuk menghindari NaN
    const safeCalculate = (calculation: () => number): number => {
      try {
        const result = calculation();
        return Number.isFinite(result) ? result : 0;
      } catch {
        return 0;
      }
    };

    // 1. TEBAL SATU SISI COIL = (Diameter luar - diameter dalam) / 2
    const tebalSatuSisiCoil = safeCalculate(() => {
      if (
        diameterLuar <= 0 ||
        diameterDalam <= 0 ||
        diameterLuar <= diameterDalam
      )
        return 0;
      return (diameterLuar - diameterDalam) / 2;
    });

    // 2. BENTANGAN DIAMTER LUAR COIL = (Diamater luar - Tebal satu sisi coil) * 3.14
    const bentanganDiameterLuarCoil = safeCalculate(() => {
      if (diameterLuar <= 0 || tebalSatuSisiCoil <= 0) return 0;
      return (diameterLuar - tebalSatuSisiCoil) * 3.14;
    });

    // 3. PANJANG COIL = ((Tebal satu sisi koil/Tebal material)*BENTANGAN DIAMTER LUAR COIL)*98%
    const panjangCoil = safeCalculate(() => {
      if (
        tebalSatuSisiCoil <= 0 ||
        tebalMaterial <= 0 ||
        bentanganDiameterLuarCoil <= 0
      )
        return 0;
      return (
        (tebalSatuSisiCoil / tebalMaterial) * bentanganDiameterLuarCoil * 0.98
      );
    });

    // 4. Berat coil = panjang coil * lebar coil * tebal material * speck material / 1000000
    const beratCoil = safeCalculate(() => {
      if (
        panjangCoil <= 0 ||
        lebarCoil <= 0 ||
        tebalMaterial <= 0 ||
        speckMaterial <= 0
      )
        return 0;
      return (
        (panjangCoil * lebarCoil * tebalMaterial * speckMaterial) / 1000000
      );
    });

    // 5. berat pcs = berat koil / (panjang koil / langkah pemakanan)
    const beratPcs = safeCalculate(() => {
      if (beratCoil <= 0 || panjangCoil <= 0 || langkahPemakanan <= 0) return 0;
      return beratCoil / (panjangCoil / langkahPemakanan);
    });

    // 6. waktu proses = ((panjang coil / langkah pemakanan) / spm) / 60
    const waktuProses = safeCalculate(() => {
      if (panjangCoil <= 0 || langkahPemakanan <= 0 || spm <= 0) return 0;
      return panjangCoil / langkahPemakanan / spm / 60;
    });

    // 7. qty = panjang koil / langkah pemakanan
    const qty = safeCalculate(() => {
      if (panjangCoil <= 0 || langkahPemakanan <= 0) return 0;
      return panjangCoil / langkahPemakanan;
    });

    setResult({
      tebalSatuSisiCoil,
      bentanganDiameterLuarCoil,
      panjangCoil,
      beratCoil,
      beratPcs,
      waktuProses,
      qty,
    });
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleClear = () => {
    setFormData({
      speckMaterial: "",
      diameterLuar: "",
      diameterDalam: "",
      lebarCoil: "",
      tebalMaterial: "",
      langkahPemakanan: "",
      spm: "",
    });
  };

  const inputFields = [
    {
      name: "speckMaterial",
      label: "Speck Material",
      unit: "Rms",
      icon: Package,
    },
    { name: "diameterLuar", label: "Diameter Luar", unit: "Mm", icon: Ruler },
    { name: "diameterDalam", label: "Diameter Dalam", unit: "Mm", icon: Ruler },
    { name: "lebarCoil", label: "Lebar Coil", unit: "Mm", icon: Ruler },
    {
      name: "tebalMaterial",
      label: "Tebal Material",
      unit: "Mm",
      icon: Package,
    },
    {
      name: "langkahPemakanan",
      label: "Langkah Pemakanan",
      unit: "Mm",
      icon: Settings,
    },
    { name: "spm", label: "SPM", unit: "Strk/Mnt", icon: Clock },
  ];

  const dimensionFields = [
    {
      key: "tebalSatuSisiCoil",
      label: "Tebal Satu Sisi Coil",
      unit: "Mm",
      decimals: 1,
      icon: Ruler,
    },
    {
      key: "bentanganDiameterLuarCoil",
      label: "Bentangan Diameter Luar",
      unit: "Mm",
      decimals: 1,
      icon: BarChart3,
    },
    {
      key: "panjangCoil",
      label: "Panjang Coil",
      unit: "Mm",
      decimals: 1,
      icon: Ruler,
    },
  ];

  const productionFields = [
    {
      key: "beratCoil",
      label: "Berat Coil",
      unit: "Kg",
      decimals: 3,
      icon: Weight,
    },
    {
      key: "beratPcs",
      label: "Berat Per Pcs",
      unit: "Kg",
      decimals: 3,
      icon: Weight,
    },
    {
      key: "waktuProses",
      label: "Waktu Proses",
      unit: "Jam:Menit",
      decimals: 3,
      icon: Clock,
    },
    { key: "qty", label: "Quantity", unit: "Pcs", decimals: 0, icon: Package },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-4 md:p-8">
      <div className="container mx-auto max-w-8xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-4 mb-6 p-4 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800">
            <div className="p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl">
              <Calculator className="w-10 h-10 text-blue-400" />
            </div>
            <div className="text-left">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                FORMAT ADL = COIL
              </h1>
              <p className="text-gray-400 text-lg mt-1">
                Kalkulator Spesifikasi Coil untuk Perhitungan Presisi
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col gap-8">
          {/* Input Section - vertical order */}
          <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-3xl overflow-hidden shadow-2xl max-w-xl mx-auto">
            <div className="border-b border-gray-800 px-8 py-6 bg-gradient-to-r from-gray-800/80 to-gray-900/80">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <Settings className="w-7 h-7 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Parameter Input
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Masukkan nilai parameter untuk perhitungan coil
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="flex flex-col gap-6">
                {inputFields.map((field, index) => {
                  const IconComponent = field.icon;
                  return (
                    <div key={field.name} className="group">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-3">
                        <IconComponent className="w-4 h-4 text-gray-500" />
                        {field.label}
                        <span className="text-gray-500 text-xs">
                          ({field.unit})
                        </span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          name={field.name}
                          value={formData[field.name as keyof CoilFormData]}
                          onChange={handleChange}
                          min="0"
                          step="any"
                          className="w-full bg-gray-800/50 border border-gray-700 rounded-2xl px-5 py-4 text-white text-lg placeholder-gray-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-300 appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 backdrop-blur-sm"
                          placeholder="0"
                        />
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">
                          {field.unit}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-800">
                <button
                  onClick={handleClear}
                  className="w-full bg-gradient-to-r from-red-900/40 to-red-800/40 hover:from-red-800/60 hover:to-red-700/60 border border-red-800/50 hover:border-red-700 rounded-2xl px-6 py-4 text-red-300 hover:text-red-200 transition-all duration-300 flex items-center justify-center gap-3 group backdrop-blur-sm font-semibold"
                >
                  <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>Clear All Data</span>
                </button>
              </div>
            </div>
          </div>

          {/* Production Results Only */}
          <div className="bg-gray-900/80 backdrop-blur-sm border border-green-500/30 rounded-3xl overflow-hidden shadow-2xl shadow-green-500/5 max-w-xl mx-auto">
            <div className="border-b border-green-800/30 px-8 py-6 bg-gradient-to-r from-green-900/20 via-gray-800/80 to-green-900/20">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-xl">
                  <div className="flex items-center gap-1">
                    <Weight className="w-6 h-6 text-green-400" />
                    <Clock className="w-6 h-6 text-green-400" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Hasil Produksi
                  </h2>
                  <p className="text-green-200/70 text-sm">
                    Perhitungan berat, waktu, dan kuantitas
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-6 bg-gradient-to-b from-green-950/5 to-gray-900/80">
              {productionFields.map((field, index) => {
                const IconComponent = field.icon;
                return (
                  <div key={field.key} className="group">
                    <label className="flex items-center gap-2 text-sm font-semibold text-green-200/80 mb-3">
                      <IconComponent className="w-4 h-4 text-green-400/70" />
                      {field.label}
                    </label>
                    <div className="bg-gray-800/50 border border-green-700/20 rounded-2xl px-6 py-4 flex items-center justify-between transition-all duration-300 group-hover:border-green-500/40 group-hover:bg-green-950/10 backdrop-blur-sm">
                      <span className="text-white font-mono text-2xl font-bold">
                        {field.key === "waktuProses"
                          ? (() => {
                              // Format waktu proses ke jam:menit
                              const jam = Math.floor(result.waktuProses);
                              const menit = Math.round((result.waktuProses - jam) * 60);
                              return `${jam} Jam ${menit} Menit`;
                            })()
                          : field.decimals === 0
                          ? Math.round(
                              result[
                                field.key as keyof CoilCalculationResult
                              ] as number,
                            ).toLocaleString()
                          : (
                              result[
                                field.key as keyof CoilCalculationResult
                              ] as number
                            ).toFixed(field.decimals)}
                      </span>
                      <span className="text-green-400 text-sm font-bold bg-green-500/10 px-3 py-1 rounded-lg">
                        {field.unit}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gray-900/50 border border-gray-800 rounded-2xl backdrop-blur-sm">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-gray-400 font-medium">
              Perhitungan Real-time Aktif
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCoilCalculator;
