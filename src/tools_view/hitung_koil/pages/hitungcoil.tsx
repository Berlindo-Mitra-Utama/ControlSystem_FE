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
  materialType: string; // Material type selection
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
    materialType: "",
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

  // Material options with default speck material values
  const materialOptions = [
    { value: "", label: "Pilih Material", speckMaterial: "" },
    { value: "SUS 309 L", label: "SUS 309 L", speckMaterial: "7.75" },
    { value: "SUS 409 L", label: "SUS 409 L", speckMaterial: "7.75" },
    { value: "SPHC", label: "SPHC", speckMaterial: "7.85" },
    { value: "S400", label: "S400", speckMaterial: "7.85" },
    { value: "Alumunium", label: "Alumunium", speckMaterial: "2.7" },
    { value: "Cu", label: "Cu", speckMaterial: "8.93" },
    { value: "Cr", label: "Cr", speckMaterial: "8.93" },
  ];

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

  const handleMaterialChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    const selectedMaterial = materialOptions.find(
      (option) => option.value === selectedValue,
    );

    setFormData({
      ...formData,
      materialType: selectedValue,
      speckMaterial: selectedMaterial?.speckMaterial || "",
    });
  };

  const handleClear = () => {
    setFormData({
      materialType: "",
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
      <div className="container mx-auto max-w-6xl">
        {/* Calculator Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 p-3 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800">
            <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg">
              <Calculator className="w-6 h-6 text-blue-400" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Hitung Coil
            </h1>
          </div>
        </div>

        {/* Calculator Body */}
        <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
          {/* Calculator Display */}
          <div className="bg-gray-800/50 border-b border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-sm font-medium">CALC</span>
              </div>
              <div className="text-gray-400 text-sm">Real-time Calculation</div>
            </div>
          </div>

          {/* Calculator Content */}
          <div className="flex flex-col lg:flex-row">
            {/* Input Panel */}
            <div className="flex-1 p-6 border-r border-gray-800">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Settings className="w-5 h-5 text-blue-400" />
                </div>
                <h2 className="text-lg font-bold text-white">
                  Input Parameters
                </h2>
              </div>

              {/* Material Selection Dropdown */}
              <div className="mb-4">
                <label className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-2">
                  <Package className="w-3 h-3" />
                  Pilih Material
                </label>
                <select
                  value={formData.materialType}
                  onChange={handleMaterialChange}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-all duration-200 backdrop-blur-sm"
                >
                  {materialOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {inputFields.map((field, index) => {
                  const IconComponent = field.icon;
                  return (
                    <div key={field.name} className="group">
                      <label className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-2">
                        <IconComponent className="w-3 h-3" />
                        {field.label}
                      </label>
                      <div className="relative">
                        {field.name === "speckMaterial" ? (
                          <input
                            type="text"
                            value={formData.speckMaterial}
                            readOnly
                            className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm cursor-not-allowed backdrop-blur-sm"
                            placeholder="Pilih material terlebih dahulu"
                          />
                        ) : (
                          <input
                            type="number"
                            name={field.name}
                            value={formData[field.name as keyof CoilFormData]}
                            onChange={handleChange}
                            min="0"
                            step="any"
                            className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-all duration-200 appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none backdrop-blur-sm"
                            placeholder="0"
                          />
                        )}
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs font-medium">
                          {field.unit}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-800">
                <button
                  onClick={handleClear}
                  className="w-full bg-gradient-to-r from-red-900/40 to-red-800/40 hover:from-red-800/60 hover:to-red-700/60 border border-red-800/50 hover:border-red-700 rounded-lg px-4 py-2 text-red-300 hover:text-red-200 transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium backdrop-blur-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </button>
              </div>
            </div>

            {/* Results Panel */}
            <div className="flex-1 p-6 bg-gradient-to-b from-green-950/10 to-gray-900/80">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-green-400" />
                </div>
                <h2 className="text-lg font-bold text-white">Results</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {productionFields.map((field, index) => {
                  const IconComponent = field.icon;
                  return (
                    <div key={field.key} className="group">
                      <label className="flex items-center gap-2 text-xs font-medium text-green-200/80 mb-2">
                        <IconComponent className="w-3 h-3 text-green-400/70" />
                        {field.label}
                      </label>
                      <div className="bg-gray-800/50 border border-green-700/20 rounded-lg px-3 py-2 flex items-center justify-between transition-all duration-200 group-hover:border-green-500/40 group-hover:bg-green-950/10 backdrop-blur-sm">
                        <span className="text-white font-mono text-sm font-bold">
                          {field.key === "waktuProses"
                            ? (() => {
                                const jam = Math.floor(result.waktuProses);
                                const menit = Math.round(
                                  (result.waktuProses - jam) * 60,
                                );
                                return `${jam}h ${menit}m`;
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
                        <span className="text-green-400 text-xs font-bold bg-green-500/10 px-2 py-1 rounded">
                          {field.unit}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCoilCalculator;
