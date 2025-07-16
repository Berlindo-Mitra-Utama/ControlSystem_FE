import { Button } from "@heroui/react";
import { ArrowRight, BarChart3, Calendar, Factory } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";

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
              Sistem Produksi
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                PT Berlindo
              </span>
            </h2>
            <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
              Platform internal untuk manajemen produksi, perencanaan, dan
              monitoring operasional harian.
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

          {/* Quick Access Tools - Consistent Height */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-center mb-8">Tools Utama</h3>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-gray-800/50 border border-gray-700 hover:bg-gray-800/70 transition-all duration-300 h-full flex flex-col rounded-lg p-6">
                <div className="text-center flex-1 flex flex-col">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-white text-xl mb-3">Planning System</h4>
                  <p className="text-gray-400 flex-1 flex items-center">
                    Perencanaan produksi dan penjadwalan harian
                  </p>
                </div>
              </div>

              <div className="bg-gray-800/50 border border-gray-700 hover:bg-gray-800/70 transition-all duration-300 h-full flex flex-col rounded-lg p-6">
                <div className="text-center flex-1 flex flex-col">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-white text-xl mb-3">Hitung Coil</h4>
                  <p className="text-gray-400 flex-1 flex items-center">
                    Kalkulasi dan perhitungan material coil
                  </p>
                </div>
              </div>

              <div className="bg-gray-800/50 border border-gray-700 hover:bg-gray-800/70 transition-all duration-300 h-full flex flex-col rounded-lg p-6">
                <div className="text-center flex-1 flex flex-col">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center mx-auto mb-4">
                    <Factory className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-white text-xl mb-3">Monitoring</h4>
                  <p className="text-gray-400 flex-1 flex items-center">
                    Monitor status produksi real-time
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Info */}
          <div className="bg-gray-800/30 rounded-2xl p-8 max-w-3xl mx-auto text-center">
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
        </main>
      </div>

      {/* Footer hanya ditampilkan di LandingPage */}
      <Footer />
    </div>
  );
}
