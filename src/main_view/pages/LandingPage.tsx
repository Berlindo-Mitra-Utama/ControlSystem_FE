import { Button } from "@heroui/react";
import { ArrowRight, BarChart3, Calendar, Factory } from "lucide-react";
import { Link } from "react-router-dom";

import Footer from "../components/Footer";
import logoGiraf from "../../img/logo_giraf.png";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <div className="flex-1">
        {/* Simple Header */}
        <header className="border-b border-gray-800 bg-gray-900/50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Factory className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    Berlindo Production System
                  </h1>
                  <p className="text-xs text-gray-400">
                    Internal Tools & Management
                  </p>
                </div>
              </div>
              <Link to="/tools">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-2xl px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-300">
                  Akses Tools
                </Button>
              </Link>
            </div>
          </div>
        </header>
        {/* Main Content */}
        <main className="container mx-auto px-6 py-16">
          {/* Hero Section - Simplified */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Internal System
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                PT Berlindo Mitra Utama
              </span>
            </h2>
            <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
              Platform terintegrasi untuk mendukung operasional harian, mulai
              dari manajemen produksi, perencanaan, hingga pelaporan, dalam satu
              sistem efisien dan terpusat.
            </p>
            <Link to="/tools">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8 py-4 text-lg rounded-3xl shadow-2xl hover:shadow-blue-500/25 hover:scale-105 transition-all duration-300 transform"
              >
                Mulai Bekerja
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>

          {/* Quick Info */}
          <div className="bg-gray-800/30 rounded-2xl p-8 max-w-3xl mx-auto text-center mb-10">
            <h3 className="text-xl font-bold text-white mb-4">
              Informasi Sistem
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-2xl font-bold text-blue-400 mb-1">
                  24/7
                </div>
                <div className="text-gray-400 text-sm">Sistem Aktif</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400 mb-1">
                  99.9%
                </div>
                <div className="text-gray-400 text-sm">Uptime</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400 mb-1">
                  Real-time
                </div>
                <div className="text-gray-400 text-sm">Data Sync</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-400 mb-1">
                  Secure
                </div>
                <div className="text-gray-400 text-sm">Internal Only</div>
              </div>
            </div>
          </div>

          {/* Section Tim Developer GIRAF */}
          <div
            id="giraf-team"
            className="bg-gray-900/80 rounded-2xl p-8 max-w-3xl mx-auto text-center shadow-lg border border-gray-800 mb-10 scroll-mt-20 hover:shadow-2xl hover:border-cyan-400/30 transition-all duration-500"
          >
            <div className="flex flex-col items-center justify-center mb-6">
              <img
                src={logoGiraf}
                alt="Logo GIRAF"
                className="w-28 h-28 object-contain mb-2 drop-shadow-lg"
                style={{ background: "transparent" }}
              />
              <h3 className="text-2xl font-bold text-cyan-400 mb-1 tracking-wide">
                GIRAF TECH SOLUTION
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-4">
              {/* Fausta Akbar Wijaya */}
              <div className="bg-gray-800/60 rounded-xl p-6 flex flex-col items-center shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-cyan-400 hover:border-2 cursor-pointer">
                <div className="w-20 h-20 rounded-full bg-gray-700 mb-3 flex items-center justify-center overflow-hidden border-2 border-cyan-400">
                  {/* Ganti src foto jika ada, default avatar jika tidak */}
                  <img
                    src={"/src/img/foto_fausta.png"}
                    alt="Fausta Akbar Wijaya"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
                <div className="text-lg font-semibold text-cyan-300">
                  Fausta Akbar
                </div>
                <div className="text-gray-400 text-xs">System Developer</div>
              </div>
              {/* Georgio Armando Woda Kolo */}
              <div className="bg-gray-800/60 rounded-xl p-6 flex flex-col items-center shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-cyan-400 hover:border-2 cursor-pointer">
                <div className="w-20 h-20 rounded-full bg-gray-700 mb-3 flex items-center justify-center overflow-hidden border-2 border-cyan-400">
                  <img
                    src={"/src/img/foto_georgio.png"}
                    alt="Georgio Armando Woda Kolo"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
                <div className="text-lg font-semibold text-cyan-300">
                  Georgio Armando
                </div>
                <div className="text-gray-400 text-xs">System Developer</div>
              </div>
              {/* Rasendriya Abel Abhista Kristiawan */}
              <div className="bg-gray-800/60 rounded-xl p-6 flex flex-col items-center shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-cyan-400 hover:border-2 cursor-pointer">
                <div className="w-20 h-20 rounded-full bg-gray-700 mb-3 flex items-center justify-center overflow-hidden border-2 border-cyan-400">
                  <img
                    src={"/src/img/foto_rasendriya.png"}
                    alt="Rasendriya Abel Abhista Kristiawan"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
                <div className="text-lg font-semibold text-cyan-300">
                  Rasendriya Abel
                </div>
                <div className="text-gray-400 text-xs">System Developer</div>
              </div>
            </div>
            <div className="mt-6 text-xs text-gray-500">
              GIRAF Tech Solution adalah tim pengembang yang berfokus pada
              solusi digital, integrasi sistem, dan pengembangan aplikasi untuk
              kebutuhan industri modern.
            </div>
          </div>
        </main>
      </div>

      {/* Footer hanya ditampilkan di LandingPage */}
      <Footer />
    </div>
  );
}
