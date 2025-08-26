"use client";

import { useState, useEffect } from "react";
import { Zap, Clock, Calculator, Percent } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { handleGirafTeamClick } from "./utils/scrollUtils";

export default function Component() {
  const navigate = useNavigate();
  const [power, setPower] = useState<string>("");
  const [hours, setHours] = useState<string>("");
  const [minutes, setMinutes] = useState<string>("");
  const [electricityRate, setElectricityRate] = useState<string>("1444");
  const [percentage, setPercentage] = useState<string>("100");
  const [cost, setCost] = useState<number>(0);
  const [isCalculated, setIsCalculated] = useState<boolean>(false);

  const calculateCost = () => {
    const powerWatts = Number.parseFloat(power) || 0;
    const totalHours =
      (Number.parseFloat(hours) || 0) + (Number.parseFloat(minutes) || 0) / 60;
    const rate = Number.parseFloat(electricityRate) || 0;
    const usagePercentage = Number.parseFloat(percentage) || 100;

    if (powerWatts > 0 && totalHours > 0 && rate > 0) {
      // Konversi ke kWh dengan mempertimbangkan persentase pemakaian
      const energyKwh = (powerWatts * totalHours * (usagePercentage / 100)) / 1000;
      // Hitung biaya
      const totalCost = energyKwh * rate;
      setCost(totalCost);
      setIsCalculated(true);
    } else {
      setCost(0);
      setIsCalculated(false);
    }
  };

  const resetCalculator = () => {
    setPower("");
    setHours("");
    setMinutes("");
    setElectricityRate("1444");
    setPercentage("100");
    setCost(0);
    setIsCalculated(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  useEffect(() => {
    if (power || hours || minutes || electricityRate || percentage) {
      calculateCost();
    }
  }, [power, hours, minutes, electricityRate, percentage]);

  return (
    <div className="min-h-screen bg-slate-900 p-4 flex items-center justify-center">
      <div className="w-full max-w-md shadow-2xl border border-slate-700 bg-slate-800/90 backdrop-blur-sm rounded-lg">
        {/* Header */}
        <div className="text-center space-y-2 p-6 pb-0">
          <div className="mx-auto w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            Kalkulator Biaya Listrik
          </h1>
          <p className="text-slate-400">
            Hitung biaya pemakaian listrik berdasarkan daya dan waktu penggunaan
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6">
          {/* Input Daya */}
          <div className="space-y-2">
            <label
              htmlFor="power"
              className="text-sm font-medium text-slate-300 flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Daya Listrik
            </label>
            <div className="relative">
              <input
                id="power"
                type="number"
                placeholder="Masukkan daya"
                value={power}
                onChange={(e) => setPower(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white placeholder:text-slate-400 rounded-md focus:border-green-500 focus:ring-1 focus:ring-green-500/20 focus:outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-green-400 font-medium">
                Watt
              </span>
            </div>
          </div>

          {/* Input Tarif */}
          <div className="space-y-2">
            <label
              htmlFor="electricityRate"
              className="text-sm font-medium text-slate-300 flex items-center gap-2"
            >
              <Calculator className="w-4 h-4" />
              Tarif Listrik
            </label>
            <div className="relative">
              <input
                id="electricityRate"
                type="number"
                placeholder="Masukkan tarif"
                value={electricityRate}
                onChange={(e) => setElectricityRate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white placeholder:text-slate-400 rounded-md focus:border-green-500 focus:ring-1 focus:ring-green-500/20 focus:outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-green-400 font-medium">
                Rp/kWh
              </span>
            </div>
          </div>

          {/* Input Persentase Pemakaian */}
          <div className="space-y-2">
            <label
              htmlFor="percentage"
              className="text-sm font-medium text-slate-300 flex items-center gap-2"
            >
              <Percent className="w-4 h-4" />
              Persentase Pemakaian
            </label>
            <div className="relative">
              <input
                id="percentage"
                type="number"
                placeholder="Masukkan persentase"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                min="0"
                max="100"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white placeholder:text-slate-400 rounded-md focus:border-green-500 focus:ring-1 focus:ring-green-500/20 focus:outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-green-400 font-medium">
                %
              </span>
            </div>
          </div>

          {/* Input Waktu */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Waktu Pemakaian
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="hours" className="text-xs text-slate-400">
                  Jam
                </label>
                <input
                  id="hours"
                  type="number"
                  placeholder="0"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white placeholder:text-slate-400 rounded-md focus:border-green-500 focus:ring-1 focus:ring-green-500/20 focus:outline-none transition-colors text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="minutes" className="text-xs text-slate-400">
                  Menit
                </label>
                <input
                  id="minutes"
                  type="number"
                  placeholder="0"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white placeholder:text-slate-400 rounded-md focus:border-green-500 focus:ring-1 focus:ring-green-500/20 focus:outline-none transition-colors text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="border-t border-slate-600 my-4"></div>

          {/* Hasil Perhitungan */}
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-slate-700/50 to-slate-600/50 rounded-lg p-4 border border-slate-600">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  Biaya Listrik:
                </span>
                <span
                  className={`text-xl font-bold ${isCalculated ? "text-green-400" : "text-slate-500"}`}
                >
                  {isCalculated ? formatCurrency(cost) : "Rp 0"}
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Tarif: {formatCurrency(Number.parseFloat(electricityRate) || 0)}
                /kWh
              </div>
            </div>

            {/* Informasi Tambahan */}
            {isCalculated && (
              <div className="bg-slate-700/30 rounded-lg p-3 space-y-2 border border-slate-600/50">
                <div className="text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Konsumsi Energi:</span>
                    <span className="font-medium">
                      {(
                        ((Number.parseFloat(power) || 0) *
                          ((Number.parseFloat(hours) || 0) +
                            (Number.parseFloat(minutes) || 0) / 60) *
                          ((Number.parseFloat(percentage) || 100) / 100)) /
                        1000
                      )
                        .toFixed(3)
                        .replace(".", ",")}{" "}
                      kWh
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Persentase Pemakaian:</span>
                    <span className="font-medium">
                      {Number.parseFloat(percentage) || 100}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Waktu:</span>
                    <span className="font-medium">
                      {(
                        (Number.parseFloat(hours) || 0) +
                        (Number.parseFloat(minutes) || 0) / 60
                      )
                        .toFixed(2)
                        .replace(".", ",")}{" "}
                      jam
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Tombol Reset */}
            <button
              onClick={resetCalculator}
              className="w-full px-4 py-2 border border-red-600/50 hover:bg-red-600/10 bg-transparent text-red-400 hover:text-red-300 hover:border-red-500 rounded-md transition-colors flex items-center justify-center gap-2"
            >
              <Calculator className="w-4 h-4" />
              Reset Kalkulator
            </button>
          </div>
        </div>
        {/* Footer - Creator */}
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
        </div>
      </div>
    </div>
  );
}
