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

// Interface untuk user data
export interface UserData {
  updatedAt: string;
  id: number;
  nama: string;
  nip: string;
  role: string;
  status: string;
  createdAt: string;
  lastLogin?: string;
}

// Interface untuk create/update user request
export interface UserRequest {
  nama: string;
  nip: string;
  password: string;
  role: string;
}

// Interface untuk response count pengguna sistem
export interface UserCountResponse {
  adminCount: number;
  userCount: number;
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

  // Get all users (admin only)
  getAllUsers: async (): Promise<UserData[]> => {
    try {
      const response = await api.get('/auth/users');
      return response.data.data.users;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Gagal mendapatkan daftar pengguna');
      }
      throw new Error('Terjadi kesalahan saat menghubungi server');
    }
  },

  // Create new user (admin only)
  createUser: async (userData: UserRequest): Promise<UserData> => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data.data.user;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Gagal membuat pengguna baru');
      }
      throw new Error('Terjadi kesalahan saat menghubungi server');
    }
  },

  // Update user (admin only)
  updateUser: async (userId: number, userData: Partial<UserRequest>): Promise<UserData> => {
    try {
      const response = await api.post('/auth/users/update', {
        userId,
        ...userData
      });
      return response.data.data.user;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Gagal memperbarui pengguna');
      }
      throw new Error('Terjadi kesalahan saat menghubungi server');
    }
  },

  // Delete user (admin only)
  deleteUser: async (userId: number): Promise<void> => {
    try {
      await api.delete(`/auth/users/${userId}`);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Gagal menghapus pengguna');
      }
      throw new Error('Terjadi kesalahan saat menghubungi server');
    }
  },
  
  // Get user count (admin only)
  getUserCount: async (): Promise<UserCountResponse> => {
    try {
      const response = await api.get('/auth/users/count-pengguna-sistem');
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Gagal mendapatkan jumlah pengguna');
      }
      throw new Error('Terjadi kesalahan saat menghubungi server');
    }
  },
};

// Service untuk user tools
export const UserToolsService = {
  // Get tools for specific user (admin only)
  getUserTools: async (userId: number): Promise<ToolResponse> => {
    try {
      const response = await api.get(`/users/${userId}/tools`);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Gagal mendapatkan daftar tools pengguna');
      }
      throw new Error('Terjadi kesalahan saat menghubungi server');
    }
  },

  // Add tool access for user (admin only)
  addUserTool: async (userId: number, toolName: string): Promise<any> => {
    try {
      const response = await api.post('/tools/add', { userId, toolName });
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Gagal menambahkan akses tool');
      }
      throw new Error('Terjadi kesalahan saat menghubungi server');
    }
  },

  // Remove tool access from user (admin only)
  removeUserTool: async (userId: number, toolName: string): Promise<any> => {
    try {
      const response = await api.post('/tools/remove', { userId, toolName });
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Gagal menghapus akses tool');
      }
      throw new Error('Terjadi kesalahan saat menghubungi server');
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

