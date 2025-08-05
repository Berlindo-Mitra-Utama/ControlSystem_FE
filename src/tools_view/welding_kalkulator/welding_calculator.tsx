"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Trash2,
  Activity,
  Settings,
  Scale,
  Box,
  Ruler,
  Cable,
  Flame,
  Package,
  Calculator,
  TrendingUp,
  Gauge,
  Target,
  Sparkles,
  Cpu,
  BarChart3,
} from "lucide-react"
import { handleGirafTeamClick } from "../electricity_kalkulator/utils/scrollUtils"

export default function Component() {
  const navigate = useNavigate()
  const [kgWire, setKgWire] = useState<string>("")
  const [volumeWelding, setVolumeWelding] = useState<string>("")
  const [lengthProduk, setLengthProduk] = useState<string>("")

  const [panjangWire, setPanjangWire] = useState<number>(0)
  const [lengthWelding, setLengthWelding] = useState<number>(0)
  const [qtyPart, setQtyPart] = useState<number>(0)

  useEffect(() => {
    const kgWireNum = Number.parseFloat(kgWire) || 0
    const volumeWeldingNum = Number.parseFloat(volumeWelding) || 0
    const lengthProdukNum = Number.parseFloat(lengthProduk) || 0

    // Calculate panjang wire = kg wire / 0.0000060988
    const calculatedPanjangWire = kgWireNum / 0.0000060988
    setPanjangWire(calculatedPanjangWire)

    // Calculate length welding = panjang wire / volume welding
    const calculatedLengthWelding = volumeWeldingNum > 0 ? calculatedPanjangWire / volumeWeldingNum : 0
    setLengthWelding(calculatedLengthWelding)

    // Calculate qty part = length welding / length produk (rounded down)
    const calculatedQtyPart = lengthProdukNum > 0 ? Math.floor(calculatedLengthWelding / lengthProdukNum) : 0
    setQtyPart(calculatedQtyPart)
  }, [kgWire, volumeWelding, lengthProduk])

  const formatNumber = (num: number): string => {
    if (num === 0) return "0.000"
    if (num < 1) return num.toFixed(6)
    return num.toLocaleString("id-ID", { maximumFractionDigits: 3, useGrouping: true })
  }

  const resetCalculator = () => {
    setKgWire("")
    setVolumeWelding("")
    setLengthProduk("")
    setPanjangWire(0)
    setLengthWelding(0)
    setQtyPart(0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-2 sm:p-4 flex items-center justify-center relative overflow-hidden">
      {/* Enhanced animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-r from-green-500/20 to-emerald-500/10 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-r from-slate-700/30 to-slate-600/20 rounded-full filter blur-3xl animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-green-400/5 to-teal-400/5 rounded-full filter blur-3xl animate-pulse animation-delay-4000"></div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

        {/* Floating decorative icons */}
        <div className="absolute top-20 left-20 text-green-500/10 animate-pulse">
          <Sparkles className="w-8 h-8" />
        </div>
        <div className="absolute top-40 right-32 text-blue-500/10 animate-pulse animation-delay-1000">
          <Cpu className="w-6 h-6" />
        </div>
        <div className="absolute bottom-32 left-32 text-purple-500/10 animate-pulse animation-delay-2000">
          <Target className="w-7 h-7" />
        </div>
        <div className="absolute bottom-20 right-20 text-emerald-500/10 animate-pulse animation-delay-3000">
          <BarChart3 className="w-8 h-8" />
        </div>
      </div>

      <div className="w-full max-w-6xl px-2 sm:px-4">
        {/* Enhanced Header */}
        <div className="text-center mb-8 sm:mb-16 relative z-10">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-4 sm:mb-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500 animate-pulse"></div>
              <div className="relative p-3 sm:p-5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-2xl transform group-hover:scale-105 transition-transform duration-300">
                <div className="relative">
                  <Flame className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-yellow-400 rounded-full animate-ping"></div>
                </div>
              </div>
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r from-white via-green-100 to-green-200 bg-clip-text text-transparent drop-shadow-2xl mb-2">
                Welding Calculator
              </h1>
              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Calculator className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                    <div className="absolute -top-1 -right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                  <span className="text-green-400 font-semibold text-sm sm:text-lg">CALC</span>
                </div>
                <div className="w-px h-4 sm:h-6 bg-slate-600 hidden sm:block"></div>
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                <span className="text-slate-400 text-sm sm:text-lg font-medium">Real-time Calculation</span>
              </div>
            </div>
          </div>
          <p className="text-slate-300 text-base sm:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
            Hitung parameter welding dengan presisi tinggi menggunakan teknologi modern
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10">
          {/* Enhanced Input Section */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative bg-slate-800/60 backdrop-blur-2xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header with enhanced styling */}
              <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 border-b border-slate-600/50 p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="p-1.5 sm:p-2 bg-blue-500/20 rounded-lg">
                      <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-white">Parameter Input</h2>
                      <p className="text-slate-400 text-xs sm:text-sm">Masukkan data perhitungan</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 animate-pulse" />
                    <span className="text-blue-400 text-xs sm:text-sm font-medium">Active</span>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8">
                {/* Enhanced Input Fields */}
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-green-500/20 rounded-lg">
                      <Scale className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                    </div>
                    <div className="w-1 h-5 sm:h-6 bg-gradient-to-b from-green-400 to-green-600 rounded-full"></div>
                    <label htmlFor="kg-wire" className="text-sm sm:text-base font-semibold text-slate-200">
                      Kg Wire
                    </label>
                    <span className="text-slate-500 text-xs sm:text-sm">(kg)</span>
                  </div>
                  <div className="relative">
                    <input
                      id="kg-wire"
                      type="number"
                      step="0.001"
                      placeholder="0.000"
                      value={kgWire}
                      onChange={(e) => setKgWire(e.target.value)}
                      className="w-full h-12 sm:h-14 px-3 sm:px-5 text-base sm:text-lg font-medium text-white bg-slate-700/40 border-2 border-slate-600/50 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-all duration-300 placeholder:text-slate-500 hover:bg-slate-700/60 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-blue-500/20 rounded-lg">
                      <Box className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                    </div>
                    <div className="w-1 h-5 sm:h-6 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full"></div>
                    <label htmlFor="volume-welding" className="text-sm sm:text-base font-semibold text-slate-200">
                      Volume Welding
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      id="volume-welding"
                      type="number"
                      step="0.001"
                      placeholder="0.000"
                      value={volumeWelding}
                      onChange={(e) => setVolumeWelding(e.target.value)}
                      className="w-full h-12 sm:h-14 px-3 sm:px-5 text-base sm:text-lg font-medium text-white bg-slate-700/40 border-2 border-slate-600/50 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-300 placeholder:text-slate-500 hover:bg-slate-700/60 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-purple-500/20 rounded-lg">
                      <Ruler className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                    </div>
                    <div className="w-1 h-5 sm:h-6 bg-gradient-to-b from-purple-400 to-purple-600 rounded-full"></div>
                    <label htmlFor="length-produk" className="text-sm sm:text-base font-semibold text-slate-200">
                      Length Produk
                    </label>
                    <span className="text-slate-500 text-xs sm:text-sm">(mm)</span>
                  </div>
                  <div className="relative">
                    <input
                      id="length-produk"
                      type="number"
                      step="0.1"
                      placeholder="0.0"
                      value={lengthProduk}
                      onChange={(e) => setLengthProduk(e.target.value)}
                      className="w-full h-12 sm:h-14 px-3 sm:px-5 text-base sm:text-lg font-medium text-white bg-slate-700/40 border-2 border-slate-600/50 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all duration-300 placeholder:text-slate-500 hover:bg-slate-700/60 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>

                {/* Enhanced Reset Button */}
                <div className="pt-4 sm:pt-6 border-t border-slate-700/50">
                  <button
                    onClick={resetCalculator}
                    className="w-full h-12 sm:h-14 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-sm sm:text-base font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    Clear All
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-300 rounded-full animate-pulse"></div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Output Section */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative bg-slate-800/60 backdrop-blur-2xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header with enhanced styling */}
              <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 border-b border-slate-600/50 p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="p-1.5 sm:p-2 bg-green-500/20 rounded-lg">
                      <Gauge className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-white">Hasil Perhitungan</h2>
                      <p className="text-slate-400 text-xs sm:text-sm">Output kalkulasi real-time</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 animate-pulse" />
                    <span className="text-green-400 text-xs sm:text-sm font-medium">Live</span>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
                {/* Enhanced Output Cards */}
                <div className={`bg-gradient-to-br ${panjangWire > 0 ? 'from-slate-800 to-slate-900' : 'from-slate-700/40 to-slate-800/40'} p-4 sm:p-6 md:p-8 rounded-2xl border ${panjangWire > 0 ? 'border-green-600/30' : 'border-slate-600/30'} relative overflow-hidden group/card hover:from-slate-700/60 hover:to-slate-800/60 transition-all duration-500`}>
                  <div className={`absolute top-0 left-0 w-full h-1 ${panjangWire > 0 ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-slate-600'}`}></div>
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className={`p-1.5 sm:p-2 ${panjangWire > 0 ? 'bg-green-500/20' : 'bg-slate-500/20'} rounded-lg`}>
                        <Cable className={`w-4 h-4 sm:w-5 sm:h-5 ${panjangWire > 0 ? 'text-green-400' : 'text-slate-400'}`} />
                      </div>
                      <span className="text-white text-sm sm:text-base font-semibold">Panjang Wire</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs sm:text-sm font-medium ${panjangWire > 0 ? 'text-green-400' : 'text-slate-400'}`}>mm</span>
                      <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 ${panjangWire > 0 ? 'bg-green-500' : 'bg-slate-500'} rounded-full animate-pulse`}></div>
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2 font-mono tracking-wider">{formatNumber(panjangWire)}</div>
                  <div className="w-full bg-slate-600/30 rounded-full h-1.5 sm:h-2">
                  </div>
                </div>

                <div className={`bg-gradient-to-br ${lengthWelding > 0 ? 'from-slate-800 to-slate-900' : 'from-slate-700/40 to-slate-800/40'} p-4 sm:p-6 md:p-8 rounded-2xl border ${lengthWelding > 0 ? 'border-green-600/30' : 'border-slate-600/30'} relative overflow-hidden group/card hover:from-slate-700/60 hover:to-slate-800/60 transition-all duration-500`}>
                  <div className={`absolute top-0 left-0 w-full h-1 ${lengthWelding > 0 ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-slate-600'}`}></div>
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className={`p-1.5 sm:p-2 ${lengthWelding > 0 ? 'bg-green-500/20' : 'bg-slate-500/20'} rounded-lg`}>
                        <Flame className={`w-4 h-4 sm:w-5 sm:h-5 ${lengthWelding > 0 ? 'text-green-400' : 'text-slate-400'}`} />
                      </div>
                      <span className="text-white text-sm sm:text-base font-semibold">Length Welding</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs sm:text-sm font-medium ${lengthWelding > 0 ? 'text-green-400' : 'text-slate-400'}`}>mm</span>
                      <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 ${lengthWelding > 0 ? 'bg-green-500' : 'bg-slate-500'} rounded-full animate-pulse`}></div>
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2 font-mono tracking-wider">{formatNumber(lengthWelding)}</div>
                  <div className="w-full bg-slate-600/30 rounded-full h-1.5 sm:h-2">
                  </div>
                </div>

                <div className={`bg-gradient-to-br ${qtyPart > 0 ? 'from-slate-800 to-slate-900' : 'from-slate-700/40 to-slate-800/40'} p-4 sm:p-6 md:p-8 rounded-2xl border ${qtyPart > 0 ? 'border-green-600/30' : 'border-slate-600/30'} relative overflow-hidden group/card hover:from-slate-700/60 hover:to-slate-800/60 transition-all duration-500`}>
                  <div className={`absolute top-0 left-0 w-full h-1 ${qtyPart > 0 ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-slate-600'}`}></div>
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className={`p-1.5 sm:p-2 ${qtyPart > 0 ? 'bg-green-500/20' : 'bg-slate-500/20'} rounded-lg`}>
                        <Package className={`w-4 h-4 sm:w-5 sm:h-5 ${qtyPart > 0 ? 'text-green-400' : 'text-slate-400'}`} />
                      </div>
                      <span className="text-white text-sm sm:text-base font-semibold">Qty Part</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs sm:text-sm font-medium ${qtyPart > 0 ? 'text-green-400' : 'text-slate-400'}`}>pcs</span>
                      <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 ${qtyPart > 0 ? 'bg-green-500' : 'bg-slate-500'} rounded-full animate-pulse`}></div>
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2 font-mono tracking-wider">{qtyPart.toLocaleString("id-ID")}</div>
                  <div className="w-full bg-slate-600/30 rounded-full h-1.5 sm:h-2">
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Footer */}
        <div className="text-center mt-12 relative z-10">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-full">
            <Cpu className="w-4 h-4 text-blue-400 animate-pulse" />
            <span className="text-slate-400 text-sm">Dibuat oleh</span>
            <button
              onClick={() => handleGirafTeamClick(navigate)}
              className="text-blue-400 font-semibold hover:underline cursor-pointer transition-colors hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400/50 rounded"
            >
              Giraf Tech Solution
            </button>
            <Sparkles className="w-4 h-4 text-green-400" />
          </div>
        </div>
      </div>
    </div>
  )
}
