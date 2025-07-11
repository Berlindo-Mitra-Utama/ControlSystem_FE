import { useState, useEffect } from "react";
import { Button } from "@heroui/react";
import { Eye, EyeOff, User, Lock, Loader2 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function EnhancedLoginPage() {
  const { loginForm, setLoginForm, handleLogin } = useAuth();
  const [loginError, setLoginError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const location = useLocation();
  const initialChoice = new URLSearchParams(location.search).get("tool");

  // Fungsi untuk mendapatkan informasi tool
  const getToolInfo = (toolId: string | null) => {
    const toolsMap: { [key: string]: { title: string; description: string } } =
      {
        scheduler: {
          title: "Planning System",
          description: "Sistem perencanaan dan penjadwalan produksi",
        },
        hitungcoil: {
          title: "Hitung Coil",
          description: "Kalkulasi material coil dan inventory management",
        },
        reports: {
          title: "Laporan Produksi",
          description: "Generate laporan harian dan bulanan",
        },
        analytics: {
          title: "Analytics",
          description: "Analisis performa dan trend produksi",
        },
        usermanagement: {
          title: "User Management",
          description: "Kelola akses pengguna sistem",
        },
        systemconfig: {
          title: "System Config",
          description: "Konfigurasi dan maintenance sistem",
        },
        monitoring: {
          title: "Monitoring Real-time",
          description: "Monitor status produksi real-time",
        },
      };
    return toolId ? toolsMap[toolId] : null;
  };

  const selectedTool = getToolInfo(initialChoice);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoading(true);

    try {
      if (loginForm.username && loginForm.password) {
        await handleLogin(e, initialChoice || undefined);
      } else {
        setLoginError("NIP dan Password harus diisi");
      }
    } catch (error) {
      setLoginError("Terjadi kesalahan saat login");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-950">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-950 to-black"></div>

        {/* Animated Circles */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/5 rounded-full blur-2xl animate-pulse delay-500"></div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Login Card */}
          <div className="bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-800/50 overflow-hidden">
            {/* Header Section */}
            <div className="relative p-8 pb-6">
              {/* Logo */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 mb-6 shadow-lg shadow-blue-500/25 transform hover:scale-105 transition-transform duration-300">
                  <svg
                    className="w-10 h-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
              </div>

              {/* Welcome Message */}
              <div className="text-center mb-6">
                <h1 className="text-2xl font-semibold text-white mb-2">
                  Selamat Datang Kembali
                </h1>
                {selectedTool ? (
                  <div className="mb-4">
                    <p className="text-gray-400 text-sm mb-2">
                      Anda akan mengakses:
                    </p>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                      <h3 className="text-blue-400 font-semibold text-sm">
                        {selectedTool.title}
                      </h3>
                      <p className="text-gray-300 text-xs">
                        {selectedTool.description}
                      </p>
                    </div>
                  </div>
                ) : null}
                <p className="text-gray-400 text-sm">
                  Masuk ke akun Anda untuk mengakses sistem produksi
                </p>
              </div>
            </div>

            {/* Form Section */}
            <div className="px-8 pb-8">
              <form onSubmit={onSubmit} className="space-y-6">
                {/* NIP Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Nomor Induk Pegawai (NIP)
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User
                        className={`w-5 h-5 transition-colors duration-200 ${
                          focusedField === "username"
                            ? "text-blue-400"
                            : "text-gray-500"
                        }`}
                      />
                    </div>
                    <input
                      type="text"
                      value={loginForm.username}
                      onChange={(e) =>
                        setLoginForm({ ...loginForm, username: e.target.value })
                      }
                      onFocus={() => setFocusedField("username")}
                      onBlur={() => setFocusedField(null)}
                      className={`
                        w-full pl-12 pr-4 py-4 bg-gray-800/50 border rounded-xl 
                        focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 
                        transition-all duration-200 text-white placeholder-gray-500
                        hover:bg-gray-800/70 backdrop-blur-sm
                        ${focusedField === "username" ? "border-blue-500 bg-gray-800/70" : "border-gray-700"}
                      `}
                      placeholder="Masukkan NIP Anda"
                      required
                      disabled={isLoading}
                    />
                    <div
                      className={`absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 transition-opacity duration-200 pointer-events-none ${
                        focusedField === "username" ? "opacity-100" : ""
                      }`}
                    ></div>
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock
                        className={`w-5 h-5 transition-colors duration-200 ${
                          focusedField === "password"
                            ? "text-blue-400"
                            : "text-gray-500"
                        }`}
                      />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={loginForm.password}
                      onChange={(e) =>
                        setLoginForm({ ...loginForm, password: e.target.value })
                      }
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      className={`
                        w-full pl-12 pr-12 py-4 bg-gray-800/50 border rounded-xl 
                        focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 
                        transition-all duration-200 text-white placeholder-gray-500
                        hover:bg-gray-800/70 backdrop-blur-sm
                        ${focusedField === "password" ? "border-blue-500 bg-gray-800/70" : "border-gray-700"}
                      `}
                      placeholder="Masukkan password Anda"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-300 transition-colors duration-200"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                    <div
                      className={`absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 transition-opacity duration-200 pointer-events-none ${
                        focusedField === "password" ? "opacity-100" : ""
                      }`}
                    ></div>
                  </div>
                </div>

                {/* Error Message */}
                {loginError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <p className="text-red-400 text-sm font-medium">
                        {loginError}
                      </p>
                    </div>
                  </div>
                )}

                {/* Login Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className={`
                    w-full py-4 text-base font-semibold rounded-xl
                    bg-gradient-to-r from-blue-600 to-indigo-600 
                    hover:from-blue-700 hover:to-indigo-700
                    focus:ring-4 focus:ring-blue-500/25
                    transition-all duration-300 transform
                    ${isLoading ? "scale-95" : "hover:scale-[1.02] active:scale-95"}
                    shadow-lg shadow-blue-500/25
                    disabled:opacity-70 disabled:cursor-not-allowed
                  `}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Memproses...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <span>Masuk ke Sistem</span>
                      <svg
                        className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-200"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </div>
                  )}
                </Button>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center space-x-2 text-gray-400 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500/25 focus:ring-2"
                      disabled={isLoading}
                    />
                    <span className="group-hover:text-gray-300 transition-colors duration-200">
                      Ingat saya
                    </span>
                  </label>
                  <button
                    type="button"
                    className="text-blue-400 hover:text-blue-300 transition-colors duration-200 font-medium"
                    disabled={isLoading}
                  >
                    Lupa password?
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-6 text-center">
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>System Online</span>
              </div>
              <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Secure Connection</span>
              </div>
            </div>
            <div className="mt-4">
              <Link to="/">
                <Button
                  size="sm"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"
                >
                  ← Kembali ke Beranda
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
