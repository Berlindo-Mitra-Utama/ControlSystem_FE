import axios from "axios";

// Base URL untuk API - Sesuaikan dengan port backend yang benar
const API_BASE_URL = "http://localhost:5555/api";

// Konfigurasi axios default
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Untuk mengirim cookies dengan request
});

// Interface untuk response login
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    nama: string;
    nip: string;
    role: string;
  };
}

// Interface untuk login request
// Interface untuk login request
export interface LoginRequest {
  nip: string;
  password: string;
  toolName?: string; // Menambahkan parameter opsional untuk tool yang ingin diakses
}

// Interface untuk response tools
export interface ToolResponse {
  tools: Array<{
    id: number;
    userId: number;
    toolName: string;
  }>;
}

// Service untuk autentikasi
export const AuthService = {
  // Login user
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await api.post("/auth/login", credentials);
      // Mengakses response.data.data untuk mendapatkan data yang sesuai dengan LoginResponse
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || "Login gagal");
      }
      throw new Error("Terjadi kesalahan saat menghubungi server");
    }
  },

  // Logout user
  logout: async (): Promise<void> => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
      throw new Error("Terjadi kesalahan saat logout");
    }
  },

  // Refresh token
  refreshToken: async (
    refreshToken: string,
  ): Promise<{ accessToken: string }> => {
    try {
      const response = await api.post("/auth/refresh-token", { refreshToken });
      return response.data;
    } catch (error) {
      throw new Error("Gagal memperbarui token");
    }
  },

  // Get user profile
  getProfile: async (): Promise<any> => {
    try {
      const response = await api.get("/auth/profile");
      return response.data;
    } catch (error) {
      throw new Error("Gagal mendapatkan profil pengguna");
    }
  },

  // Get user tools
  getMyTools: async (): Promise<ToolResponse> => {
    try {
      const response = await api.get("/user-tools/my-tools");
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.message || "Gagal mendapatkan daftar tools",
        );
      }
      throw new Error("Terjadi kesalahan saat menghubungi server");
    }
  },
};

// Tambahkan interceptor untuk menangani error
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (axios.isAxiosError(error) && error.response) {
      // Jika token kedaluwarsa (status 401), hapus data dari localStorage
      if (error.response.status === 401) {
        // Cek apakah request URL adalah untuk login atau profile
        const isLoginRequest = error.config.url?.includes("/auth/login");
        const isProfileRequest = error.config.url?.includes("/auth/profile");

        // Jika bukan request login dan bukan profile request, baru redirect ke halaman login
        if (!isLoginRequest && !isProfileRequest) {
          localStorage.removeItem("currentUser");
          localStorage.removeItem("userTools");
          window.location.href = "/login";
        }
        // Jika ini adalah request login atau profile, biarkan error ditangani oleh catch block
      }
    }
    return Promise.reject(error);
  },
);
export default api;
