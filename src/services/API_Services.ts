import axios from "axios";

// Base URL untuk API - Sesuaikan dengan port backend yang benar
//const API_BASE_URL = "https://292mhrfs-5555.asse.devtunnels.ms/api";
//const API_BASE_URL = "https://6bqdp851-5555.use2.devtunnels.ms/api";
const API_BASE_URL = "http://localhost:5555/api";

// Konfigurasi axios default
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Untuk mengirim cookies dengan request
});

// Request interceptor untuk menambahkan token autentikasi
api.interceptors.request.use(
  (config) => {
    const currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
      try {
        const userData = JSON.parse(currentUser);
        if (userData.accessToken) {
          config.headers.Authorization = `Bearer ${userData.accessToken}`;
        }
      } catch (error) {
        console.error("Error parsing currentUser from localStorage:", error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

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

// Interface untuk production schedule
export interface ProductionSchedule {
  id?: number;
  partName: string;
  customer: string;
  month: number;
  year: number;
  initialStock: number;
  timePerPcs: number;
  scheduleName: string;
  productionData: ProductionData[];
  createdAt?: string;
  lastSavedBy?: UserInfo; // Tambahkan informasi user yang terakhir kali saved
}

// Interface untuk informasi user yang terakhir kali saved
export interface UserInfo {
  id: number;
  nama: string;
  nip: string;
  role: string;
}

// Interface untuk informasi produk
export interface ProductInfo {
  partName: string;
  customer: string;
  lastSavedBy?: UserInfo;
  lastSavedAt?: string;
}

// Interface untuk production data
export interface ProductionData {
  id?: number;
  day: number;
  shift: string;
  planningPcs: number;
  delivery: number;
  overtimePcs: number;
  hasilProduksi: number;
  jamProduksiAktual: number;
  manpowerIds: number[];
  status: string;
  notes: string;
}

// Interface untuk manpower
export interface Manpower {
  id?: number;
  name: string;
  userId?: number;
}

// Interface untuk data perencanaan produksi
export interface ProductPlanningData {
  id?: number;
  partName: string;
  customerName: string;
  productionMonth: number;
  productionYear: number;
  currentStock: number;
  partImageBase64?: string;
  partImageMimeType?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Interface untuk response perencanaan produksi
export interface ProductPlanningResponse {
  productPlannings: ProductPlanningData[];
}

// Interface untuk response detail perencanaan produksi
export interface ProductPlanningDetailResponse {
  productPlanning: ProductPlanningData;
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
      const response = await api.get("/auth/users");
      return response.data.data.users;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.message || "Gagal mendapatkan daftar pengguna",
        );
      }
      throw new Error("Terjadi kesalahan saat menghubungi server");
    }
  },

  // Create new user (admin only)
  createUser: async (userData: UserRequest): Promise<UserData> => {
    try {
      const response = await api.post("/auth/register", userData);
      return response.data.data.user;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.message || "Gagal membuat pengguna baru",
        );
      }
      throw new Error("Terjadi kesalahan saat menghubungi server");
    }
  },

  // Update user (admin only)
  updateUser: async (
    userId: number,
    userData: Partial<UserRequest>,
  ): Promise<UserData> => {
    try {
      const response = await api.post("/auth/users/update", {
        userId,
        ...userData,
      });
      return response.data.data.user;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.message || "Gagal memperbarui pengguna",
        );
      }
      throw new Error("Terjadi kesalahan saat menghubungi server");
    }
  },

  // Delete user (admin only)
  deleteUser: async (userId: number): Promise<void> => {
    try {
      await api.delete(`/auth/users/${userId}`);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.message || "Gagal menghapus pengguna",
        );
      }
      throw new Error("Terjadi kesalahan saat menghubungi server");
    }
  },

  // Get user count (admin only)
  getUserCount: async (): Promise<UserCountResponse> => {
    try {
      const response = await api.get("/auth/users/count-pengguna-sistem");
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.message || "Gagal mendapatkan jumlah pengguna",
        );
      }
      throw new Error("Terjadi kesalahan saat menghubungi server");
    }
  },
};

// Service untuk planning system
export const PlanningSystemService = {
  // Mendapatkan semua data perencanaan produksi
  getAllProductPlanning: async (): Promise<ProductPlanningResponse> => {
    try {
      const response = await api.get("/planning-system");
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.message ||
            "Gagal mendapatkan data perencanaan produksi",
        );
      }
      throw new Error("Terjadi kesalahan saat menghubungi server");
    }
  },

  // Mendapatkan data perencanaan produksi berdasarkan ID
  getProductPlanningById: async (
    id: number,
  ): Promise<ProductPlanningDetailResponse> => {
    try {
      const response = await api.get(`/planning-system/${id}`);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.message ||
            "Gagal mendapatkan detail perencanaan produksi",
        );
      }
      throw new Error("Terjadi kesalahan saat menghubungi server");
    }
  },

  // Mendapatkan data perencanaan produksi berdasarkan bulan dan tahun
  getProductPlanningByMonthYear: async (
    month: number,
    year: number,
  ): Promise<ProductPlanningResponse> => {
    try {
      const response = await api.get(
        `/planning-system/by-month-year?month=${month}&year=${year}`,
      );
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.message ||
            "Gagal mendapatkan data perencanaan produksi",
        );
      }
      throw new Error("Terjadi kesalahan saat menghubungi server");
    }
  },

  // Membuat data perencanaan produksi baru
  createProductPlanning: async (
    data: ProductPlanningData,
  ): Promise<ProductPlanningDetailResponse> => {
    try {
      const response = await api.post("/planning-system", data);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.message ||
            "Gagal membuat data perencanaan produksi",
        );
      }
      throw new Error("Terjadi kesalahan saat menghubungi server");
    }
  },

  // Upsert data perencanaan produksi berdasarkan kombinasi part/customer/bulan/tahun
  upsertProductPlanning: async (
    data: ProductPlanningData,
  ): Promise<ProductPlanningDetailResponse> => {
    try {
      const response = await api.post("/planning-system/upsert", data);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.message ||
            "Gagal membuat/memperbarui data perencanaan produksi",
        );
      }
      throw new Error("Terjadi kesalahan saat menghubungi server");
    }
  },

  // Memperbarui data perencanaan produksi berdasarkan ID
  updateProductPlanning: async (
    id: number,
    data: Partial<ProductPlanningData>,
  ): Promise<ProductPlanningDetailResponse> => {
    try {
      const response = await api.put(`/planning-system/${id}`, data);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.message ||
            "Gagal memperbarui data perencanaan produksi",
        );
      }
      throw new Error("Terjadi kesalahan saat menghubungi server");
    }
  },

  // Memperbarui data perencanaan produksi berdasarkan bulan dan tahun
  updateProductPlanningByMonthYear: async (
    month: number,
    year: number,
    data: Partial<ProductPlanningData>,
  ): Promise<ProductPlanningResponse> => {
    try {
      const response = await api.put(
        `/planning-system/month/${month}/year/${year}`,
        data,
      );
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.message ||
            "Gagal memperbarui data perencanaan produksi",
        );
      }
      throw new Error("Terjadi kesalahan saat menghubungi server");
    }
  },

  // Menghapus data perencanaan produksi berdasarkan ID
  deleteProductPlanning: async (id: number): Promise<void> => {
    try {
      await api.delete(`/planning-system/${id}`);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.message ||
            "Gagal menghapus data perencanaan produksi",
        );
      }
      throw new Error("Terjadi kesalahan saat menghubungi server");
    }
  },

  // Menghapus data perencanaan produksi berdasarkan bulan dan tahun
  deleteProductPlanningByMonthYear: async (
    month: number,
    year: number,
  ): Promise<void> => {
    try {
      await api.delete(`/planning-system/month/${month}/year/${year}`);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.message ||
            "Gagal menghapus data perencanaan produksi",
        );
      }
      throw new Error("Terjadi kesalahan saat menghubungi server");
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
        throw new Error(
          error.response.data.message ||
            "Gagal mendapatkan daftar tools pengguna",
        );
      }
      throw new Error("Terjadi kesalahan saat menghubungi server");
    }
  },

  // Add tool access for user (admin only)
  addUserTool: async (userId: number, toolName: string): Promise<any> => {
    try {
      const response = await api.post("/tools/add", { userId, toolName });
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.message || "Gagal menambahkan akses tool",
        );
      }
      throw new Error("Terjadi kesalahan saat menghubungi server");
    }
  },

  // Remove tool access from user (admin only)
  removeUserTool: async (userId: number, toolName: string): Promise<any> => {
    try {
      const response = await api.post("/tools/remove", { userId, toolName });
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.message || "Gagal menghapus akses tool",
        );
      }
      throw new Error("Terjadi kesalahan saat menghubungi server");
    }
  },
};

// Service untuk production
export const ProductionService = {
  /**
   * Production Schedule Services
   */

  /**
   * Membuat schedule produksi baru
   * @param {ProductionSchedule} scheduleData - Data schedule
   * @returns {Promise<Object>} Response dari API
   */
  createProductionSchedule: async (
    scheduleData: ProductionSchedule,
  ): Promise<any> => {
    try {
      // Log data yang akan dikirim untuk debugging
      console.log("Data yang akan dikirim ke backend:", scheduleData);

      const response = await api.post(
        "/daily-production/schedule",
        scheduleData,
      );
      return response.data;
    } catch (error) {
      console.error("Error createProductionSchedule:", error);
      if (error.response?.status === 404) {
        throw new Error("Endpoint tidak ditemukan, pastikan server berjalan");
      }
      throw new Error(
        error.response?.data?.message || "Gagal membuat schedule",
      );
    }
  },

  /**
   * Mendapatkan semua schedule user
   * @returns {Promise<Object>} Response dari API
   */
  getUserSchedules: async (): Promise<any> => {
    try {
      const response = await api.get("/daily-production/schedules");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Gagal mengambil data schedule",
      );
    }
  },

  /**
   * Mendapatkan schedule berdasarkan ID
   * @param {number} id - ID schedule
   * @returns {Promise<Object>} Response dari API
   */
  getScheduleById: async (id: number): Promise<any> => {
    try {
      const response = await api.get(`/daily-production/schedule/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Gagal mengambil data schedule",
      );
    }
  },

  /**
   * Menghapus schedule
   * @param {number} id - ID schedule
   * @returns {Promise<Object>} Response dari API
   */
  deleteSchedule: async (id: number): Promise<any> => {
    try {
      const response = await api.delete(`/daily-production/schedule/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Gagal menghapus schedule",
      );
    }
  },

  /**
   * Update schedule produksi
   * @param {number} id - ID schedule
   * @param {ProductionSchedule} scheduleData - Data schedule yang diupdate
   * @returns {Promise<Object>} Response dari API
   */
  updateProductionSchedule: async (
    id: number,
    scheduleData: ProductionSchedule,
  ): Promise<any> => {
    try {
      // Log data yang akan dikirim untuk debugging
      console.log("Data yang akan diupdate ke backend:", { id, scheduleData });

      const response = await api.put(
        `/daily-production/schedule/${id}`,
        scheduleData,
      );
      return response.data;
    } catch (error) {
      console.error("Error updateProductionSchedule:", error);
      if (error.response?.status === 404) {
        throw new Error(`Schedule dengan ID ${id} tidak ditemukan di server`);
      }
      throw new Error(
        error.response?.data?.message || "Gagal mengupdate schedule",
      );
    }
  },

  /**
   * Mendapatkan daily production berdasarkan planning ID
   * @param {number} planningId - ID planning
   * @returns {Promise<Array>} Array of daily production data
   */
  getDailyProductionByPlanningId: async (
    planningId: number,
  ): Promise<any[]> => {
    try {
      const response = await api.get(
        `/daily-production/planning/${planningId}`,
      );
      return response.data.dailyProductions || response.data || [];
    } catch (error) {
      console.error("Error getDailyProductionByPlanningId:", error);
      // Jika tidak ada data, return array kosong
      return [];
    }
  },

  /**
   * Production Data Services
   */

  /**
   * Update data produksi
   * @param {number} id - ID data produksi
   * @param {Object} updateData - Data yang akan diupdate
   * @returns {Promise<Object>} Response dari API
   */
  updateProductionData: async (id: number, updateData: any): Promise<any> => {
    try {
      const response = await api.put(`/daily-production/${id}`, updateData);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Gagal mengupdate data produksi",
      );
    }
  },

  /**
   * Update multiple data produksi sekaligus
   * @param {Array} productionData - Array data produksi yang akan diupdate
   * @returns {Promise<Object>} Response dari API
   */
  updateMultipleProductionData: async (productionData: any[]): Promise<any> => {
    try {
      const response = await api.put("/daily-production/bulk", {
        productionData,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Gagal mengupdate data produksi",
      );
    }
  },

  /**
   * Update data produksi harian berdasarkan schedule ID
   * @param {number} scheduleId - ID schedule produksi
   * @param {Array} productionData - Array data produksi harian yang diupdate
   * @returns {Promise<Object>} Response dari API
   */
  updateDailyProductionBySchedule: async (
    scheduleId: number,
    productionData: any[],
  ): Promise<any> => {
    try {
      console.log(
        "Updating daily production for schedule:",
        scheduleId,
        productionData,
      );

      // Konversi data produksi ke format yang diharapkan backend
      const convertedData = productionData.map((item: any) => {
        const y = item.year;
        const m = item.month || 1;
        const d = item.day;
        const yyyy = String(y).padStart(4, "0");
        const mm = String(m).padStart(2, "0");
        const dd = String(d).padStart(2, "0");
        const dateOnly = `${yyyy}-${mm}-${dd}`;

        return {
          productPlanningId: scheduleId,
          productionDate: dateOnly,
          shift: parseInt(item.shift),
          planningProduction: item.planningPcs || 0,
          deliveryActual: item.delivery || 0,
          overtime: item.overtimePcs || 0,
          actualProduction: item.pcs || 0,
          actualProductionHours: item.jamProduksiAktual || 0,
          manpower: item.manpowerIds?.length || 0,
          status: item.status || "Normal",
          notes: item.notes || "",
        };
      });

      // Gunakan upsert untuk setiap item
      const updatePromises = convertedData.map(async (data) => {
        return await api.post("/daily-production/upsert", data);
      });

      const responses = await Promise.all(updatePromises);
      return responses.map((response) => response.data);
    } catch (error) {
      console.error("Error updating daily production:", error);
      throw new Error(
        error.response?.data?.message ||
          "Gagal mengupdate data produksi harian",
      );
    }
  },

  /**
   * Utility function untuk mengkonversi data dari frontend ke format backend
   * @param {Object} scheduleData - Data schedule dari frontend
   * @returns {Object} Data yang sudah dikonversi
   */
  convertScheduleDataForBackend: (scheduleData: any): ProductionSchedule => {
    const { form, schedule, scheduleName, selectedMonth, selectedYear } =
      scheduleData;

    console.log("Data yang diterima untuk konversi:", scheduleData);

    // Validasi data yang diperlukan
    if (!form || !schedule || !scheduleName) {
      console.error("Data tidak lengkap:", { form, schedule, scheduleName });
      throw new Error("Data schedule tidak lengkap");
    }

    if (!form.part || !form.customer) {
      console.error("Part atau customer kosong:", {
        part: form.part,
        customer: form.customer,
      });
      throw new Error("Data part dan customer harus diisi");
    }

    if (!Array.isArray(schedule) || schedule.length === 0) {
      console.error("Schedule kosong atau bukan array:", schedule);
      throw new Error("Data schedule tidak boleh kosong");
    }

    // Konversi production data dengan validasi
    const productionData: ProductionData[] = schedule.map(
      (item: any, index: number) => {
        console.log(`Validasi item ${index}:`, item);

        if (!item.day || !item.shift) {
          console.error(`Item ${index} tidak lengkap:`, item);
          throw new Error(`Data schedule pada index ${index} tidak lengkap`);
        }

        const convertedItem = {
          day: item.day,
          shift: item.shift,
          planningPcs: item.planningPcs || 0,
          delivery: item.delivery || 0,
          overtimePcs: item.overtimePcs || 0,
          hasilProduksi: item.pcs || 0,
          jamProduksiAktual: item.jamProduksiAktual || 0,
          manpowerIds: item.manpowerIds || [1, 2, 3],
          status: item.status || "Normal",
          notes: item.notes || "",
        };

        console.log(`Item ${index} berhasil dikonversi:`, convertedItem);
        return convertedItem;
      },
    );

    // Dapatkan informasi user saat ini
    const currentUser = ProductionService.getCurrentUserInfo();
    console.log("Current user:", currentUser);

    const result = {
      partName: form.part,
      customer: form.customer,
      // selectedMonth adalah 0-11; backend mengharapkan 1-12
      month: (selectedMonth ?? new Date().getMonth()) + 1,
      year: selectedYear ?? new Date().getFullYear(),
      initialStock: form.stock || 0,
      timePerPcs: form.timePerPcs || 257,
      scheduleName,
      productionData,
      lastSavedBy: currentUser,
    };

    console.log("Data yang akan dikirim ke backend:", result);
    return result;
  },

  /**
   * Mendapatkan informasi user saat ini dari localStorage
   * @returns {UserInfo | null} Informasi user atau null jika tidak ada
   */
  getCurrentUserInfo: (): UserInfo | null => {
    try {
      const currentUser = localStorage.getItem("currentUser");
      if (currentUser) {
        const userData = JSON.parse(currentUser);

        // Handle both formats: direct user data or nested under 'user' property
        const user = userData.user || userData;

        if (user && user.id && user.nama && user.nip && user.role) {
          return {
            id: user.id,
            nama: user.nama,
            nip: user.nip,
            role: user.role,
          };
        }
      }
      return null;
    } catch (error) {
      console.error("Error getting current user info:", error);
      return null;
    }
  },

  /**
   * Mendapatkan informasi produk dari schedule
   * @param {Object} scheduleData - Data schedule
   * @returns {ProductInfo} Informasi produk
   */
  getProductInfo: (scheduleData: any): ProductInfo => {
    const { form, lastSavedBy, createdAt } = scheduleData;
    return {
      partName: form.part || "",
      customer: form.customer || "",
      lastSavedBy,
      lastSavedAt: createdAt,
    };
  },

  /**
   * Utility function untuk mengkonversi data dari backend ke format frontend
   * @param {Object} backendData - Data dari backend
   * @returns {Object} Data yang sudah dikonversi untuk frontend
   */
  convertScheduleDataForFrontend: (backendData: any): any => {
    const { productionData, ...scheduleInfo } = backendData;

    // Konversi production data ke format frontend
    const schedule = productionData.map((item: any) => ({
      id: item.id,
      day: item.day,
      shift: item.shift,
      planningPcs: item.planningPcs,
      delivery: item.delivery,
      overtimePcs: item.overtimePcs,
      pcs: item.hasilProduksi,
      jamProduksiAktual: item.jamProduksiAktual,
      manpowerIds: item.manpowerIds,
      status: item.status,
      notes: item.notes,
      time: item.shift === "1" ? "07:30-16:30" : "19:30-04:30",
      type: "Production",
    }));

    const form = {
      part: scheduleInfo.partName,
      customer: scheduleInfo.customer,
      stock: scheduleInfo.initialStock,
      timePerPcs: scheduleInfo.timePerPcs,
    };

    return {
      id: scheduleInfo.id,
      name: scheduleInfo.scheduleName,
      date: scheduleInfo.createdAt,
      form,
      schedule,
    };
  },

  /**
   * Menyimpan data dari ScheduleCardsView atau ScheduleTableView
   * @param {Array} productionData - Array data produksi yang akan disimpan
   * @returns {Promise<Object>} Response dari server
   */
  saveProductionDataFromComponents: async (
    productionData: any[],
  ): Promise<any> => {
    try {
      // Filter data yang memiliki backendId (sudah ada di database)
      const existingData = productionData.filter((item) => item.backendId);
      const newData = productionData.filter((item) => !item.backendId);

      let results = { updated: [], created: [] };

      // Update data yang sudah ada
      if (existingData.length > 0) {
        const updatePromises = existingData.map((item) =>
          ProductionService.updateProductionData(item.backendId, {
            planningProduction: item.planningPcs || 0,
            deliveryActual: item.delivery || 0,
            overtime: item.overtimePcs || 0,
            actualProduction: item.pcs || 0,
            actualProductionHours: item.jamProduksiAktual || 0,
            manpower: item.manpowerIds?.length || 0,
            status: item.status || "Normal",
            notes: item.notes || "",
          }),
        );

        results.updated = await Promise.all(updatePromises);
      }

      // Untuk data baru, perlu dibuat schedule terlebih dahulu
      if (newData.length > 0) {
        // Implementasi untuk membuat schedule baru jika diperlukan
        console.log("Data baru perlu dibuat schedule terlebih dahulu");
      }

      return {
        success: true,
        message: `Berhasil menyimpan ${results.updated.length} data produksi`,
        data: results,
      };
    } catch (error) {
      console.error("Error saving production data:", error);
      throw error;
    }
  },
};

// Service untuk manpower
export const ManpowerService = {
  /**
   * Mendapatkan semua data manpower yang aktif (dengan authentication)
   */
  getActiveManpower: async (): Promise<any> => {
    try {
      const response = await api.get("/manpower/active");
      return response.data.data;
    } catch (error) {
      if (
        error.code === "ERR_NETWORK" ||
        error.message?.includes("ERR_CONNECTION_REFUSED")
      ) {
        throw new Error("ERR_CONNECTION_REFUSED");
      }
      if (error.response?.data?.message?.includes("Token tidak ada")) {
        throw new Error("Token tidak ada");
      }
      throw new Error(
        error.response?.data?.message || "Gagal mengambil data manpower",
      );
    }
  },

  /**
   * Mendapatkan semua data manpower yang aktif (tanpa authentication untuk testing)
   */
  getActiveManpowerTest: async (): Promise<any> => {
    try {
      const response = await api.get("/manpower/test/active");
      return response.data.data;
    } catch (error) {
      if (
        error.code === "ERR_NETWORK" ||
        error.message?.includes("ERR_CONNECTION_REFUSED")
      ) {
        throw new Error("ERR_CONNECTION_REFUSED");
      }
      throw new Error(
        error.response?.data?.message || "Gagal mengambil data manpower",
      );
    }
  },

  /**
   * Membuat data manpower baru (tanpa authentication untuk testing)
   */
  createManpowerTest: async (manpowerData: any): Promise<any> => {
    try {
      const response = await api.post("/manpower/test", manpowerData);
      return response.data.data;
    } catch (error) {
      if (
        error.code === "ERR_NETWORK" ||
        error.message?.includes("ERR_CONNECTION_REFUSED")
      ) {
        throw new Error("ERR_CONNECTION_REFUSED");
      }
      throw new Error(
        error.response?.data?.message || "Gagal membuat manpower",
      );
    }
  },

  /**
   * Menghapus data manpower (tanpa authentication untuk testing)
   */
  deleteManpowerTest: async (id: number): Promise<boolean> => {
    try {
      await api.delete(`/manpower/test/${id}`);
      return true;
    } catch (error) {
      if (
        error.code === "ERR_NETWORK" ||
        error.message?.includes("ERR_CONNECTION_REFUSED")
      ) {
        throw new Error("ERR_CONNECTION_REFUSED");
      }
      throw new Error(
        error.response?.data?.message || "Gagal menghapus manpower",
      );
    }
  },

  /**
   * Mendapatkan semua data manpower (termasuk yang tidak aktif)
   */
  getAllManpower: async (): Promise<any> => {
    try {
      const response = await api.get("/manpower/all");
      return response.data.data;
    } catch (error) {
      if (
        error.code === "ERR_NETWORK" ||
        error.message?.includes("ERR_CONNECTION_REFUSED")
      ) {
        throw new Error("ERR_CONNECTION_REFUSED");
      }
      if (error.response?.data?.message?.includes("Token tidak ada")) {
        throw new Error("Token tidak ada");
      }
      throw new Error(
        error.response?.data?.message || "Gagal mengambil data manpower",
      );
    }
  },

  /**
   * Membuat data manpower baru
   */
  createManpower: async (manpowerData: any): Promise<any> => {
    try {
      const response = await api.post("/manpower", manpowerData);
      return response.data.data;
    } catch (error) {
      if (
        error.code === "ERR_NETWORK" ||
        error.message?.includes("ERR_CONNECTION_REFUSED")
      ) {
        throw new Error("ERR_CONNECTION_REFUSED");
      }
      if (error.response?.data?.message?.includes("Token tidak ada")) {
        throw new Error("Token tidak ada");
      }
      throw new Error(
        error.response?.data?.message || "Gagal membuat manpower",
      );
    }
  },

  /**
   * Mengupdate data manpower
   */
  updateManpower: async (id: number, manpowerData: any): Promise<any> => {
    try {
      const response = await api.put(`/manpower/${id}`, manpowerData);
      return response.data.data;
    } catch (error) {
      if (
        error.code === "ERR_NETWORK" ||
        error.message?.includes("ERR_CONNECTION_REFUSED")
      ) {
        throw new Error("ERR_CONNECTION_REFUSED");
      }
      if (error.response?.data?.message?.includes("Token tidak ada")) {
        throw new Error("Token tidak ada");
      }
      throw new Error(
        error.response?.data?.message || "Gagal mengupdate manpower",
      );
    }
  },

  /**
   * Menghapus data manpower (soft delete)
   */
  deleteManpower: async (id: number): Promise<boolean> => {
    try {
      await api.delete(`/manpower/${id}`);
      return true;
    } catch (error) {
      if (
        error.code === "ERR_NETWORK" ||
        error.message?.includes("ERR_CONNECTION_REFUSED")
      ) {
        throw new Error("ERR_CONNECTION_REFUSED");
      }
      if (error.response?.data?.message?.includes("Token tidak ada")) {
        throw new Error("Token tidak ada");
      }
      throw new Error(
        error.response?.data?.message || "Gagal menghapus manpower",
      );
    }
  },

  /**
   * Mengaktifkan kembali data manpower
   */
  activateManpower: async (id: number): Promise<any> => {
    try {
      const response = await api.patch(`/manpower/${id}/activate`);
      return response.data.data;
    } catch (error) {
      if (
        error.code === "ERR_NETWORK" ||
        error.message?.includes("ERR_CONNECTION_REFUSED")
      ) {
        throw new Error("ERR_CONNECTION_REFUSED");
      }
      if (error.response?.data?.message?.includes("Token tidak ada")) {
        throw new Error("Token tidak ada");
      }
      throw new Error(
        error.response?.data?.message || "Gagal mengaktifkan manpower",
      );
    }
  },
};

// Progress Tracker: Get All Parts (named export)
export const getAllParts = async () => {
  try {
    const response = await api.get("/progress-tracker/parts");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createPart = async (partData: {
  partName: string;
  partNumber: string;
  customer: string;
  partImage?: File;
}) => {
  try {
    const formData = new FormData();
    formData.append("partName", partData.partName);
    formData.append("partNumber", partData.partNumber);
    formData.append("customer", partData.customer);

    if (partData.partImage) {
      formData.append("partImage", partData.partImage);
    }

    const response = await api.post("/progress-tracker/parts", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deletePart = async (partId: string) => {
  try {
    const response = await api.delete(`/progress-tracker/parts/${partId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get part by ID
export const getPartById = async (partId: string) => {
  try {
    const response = await api.get(`/progress-tracker/parts/${partId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update part
export const updatePart = async (
  partId: string,
  partData: {
    partName: string;
    partNumber: string;
    customer: string;
    partImage?: File;
  },
) => {
  try {
    const formData = new FormData();
    formData.append("partName", partData.partName);
    formData.append("partNumber", partData.partNumber);
    formData.append("customer", partData.customer);

    if (partData.partImage) {
      formData.append("partImage", partData.partImage);
    }

    const response = await api.put(
      `/progress-tracker/parts/${partId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Manage Progress API Services
export const getPartWithProgress = async (partId: string) => {
  try {
    const response = await api.get(`/manage-progress/parts/${partId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateProcessCompletion = async (
  processId: string,
  completed: boolean,
) => {
  try {
    const response = await api.put(
      `/progress-tracker/processes/${processId}/completion`,
      {
        completed,
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateProcess = async (
  processId: string,
  processData: {
    name: string;
    notes?: string;
    completed: boolean;
  },
) => {
  try {
    const response = await api.put(
      `/manage-progress/processes/${processId}`,
      processData,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Progress Tooling Detail APIs (persist granular data of tooling progress)
export const updateProgressToolingDetail = async (
  params: {
    partId: string;
    categoryId: string;
    processId: string;
    subProcessId: string;
  },
  toolingData: any,
) => {
  try {
    const { processId } = params;
    // Backend hanya butuh processId untuk update tooling detail
    const response = await api.put(
      `/progress-detail/tooling-detail/${processId}`,
      toolingData,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getProgressToolingDetail = async (params: {
  partId: string;
  categoryId: string;
  processId: string;
  subProcessId: string;
}) => {
  try {
    const { processId } = params;
    // Backend hanya butuh processId untuk mencari tooling detail
    const response = await api.get(
      `/progress-detail/tooling-detail/${processId}`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Progress Tooling Trials (optional granular storage per trial)
export const getProgressToolingTrials = async (params: {
  partId: string;
  categoryId: string;
  processId: string;
}) => {
  try {
    const { partId, categoryId, processId } = params;
    const response = await api.get(
      `/progress-detail/tooling-trials/${partId}/${categoryId}/${processId}`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const upsertProgressToolingTrials = async (
  params: { partId: string; categoryId: string; processId: string },
  trials: Array<{
    index: number;
    name: string;
    completed: boolean;
    weight: number;
    notes?: string;
  }>,
) => {
  try {
    const { partId, categoryId, processId } = params;
    const response = await api.put(
      `/progress-detail/tooling-trials/${partId}/${categoryId}/${processId}`,
      { trials },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Progress Detail (persist per category/process/subprocess state & notes)
export const updateProgressDetail = async (
  params: {
    partId: string;
    categoryId: string;
    processId: string;
    subProcessId?: string | null;
  },
  payload: {
    completed: boolean;
    notes?: string;
  },
) => {
  try {
    const { partId, categoryId, processId, subProcessId } = params;
    // Router dimount pada /api/progress-detail → prefix '/progress-detail' wajib ada
    const url = subProcessId
      ? `/progress-detail/${partId}/${categoryId}/${processId}/${subProcessId}`
      : `/progress-detail/${partId}/${categoryId}/${processId}`;
    const response = await api.put(url, payload);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const uploadEvidence = async (
  processId: string,
  evidenceData: {
    name: string;
    type: "image" | "file";
    url: string;
    size?: number;
    notes?: string;
    partId?: string;
    categoryId?: string;
    subProcessId?: string;
  },
) => {
  try {
    // Buat FormData untuk mengirim file
    const formData = new FormData();

    // Tambahkan data evidence
    formData.append("name", evidenceData.name);
    formData.append("type", evidenceData.type);
    formData.append("url", evidenceData.url);
    if (evidenceData.size)
      formData.append("size", evidenceData.size.toString());
    if (evidenceData.partId) formData.append("partId", evidenceData.partId);
    if (evidenceData.categoryId)
      formData.append("categoryId", evidenceData.categoryId);
    if (evidenceData.subProcessId)
      formData.append("subProcessId", evidenceData.subProcessId);

    // Tambahkan file jika ada
    if (evidenceData.url.startsWith("data:")) {
      // Konversi base64 ke blob
      const response = await fetch(evidenceData.url);
      const blob = await response.blob();
      formData.append("evidence", blob, evidenceData.name);
    }

    const response = await api.post(
      `/progress-tracker/processes/${processId}/evidence`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteEvidence = async (evidenceId: string) => {
  try {
    const response = await api.delete(
      `/progress-tracker/evidence/${evidenceId}`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getProcessEvidence = async (processId: string) => {
  try {
    const response = await api.get(
      `/progress-tracker/processes/${processId}/evidence`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
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
// Child Part Service
export const ChildPartService = {
  // Get all child parts
  async getAllChildParts(params?: { productPlanningId?: number }) {
    try {
      const query = new URLSearchParams();
      if (params?.productPlanningId !== undefined) {
        query.append("productPlanningId", String(params.productPlanningId));
      }
      const url = `/child-part${query.toString() ? `?${query.toString()}` : ""}`;
      const response = await api.get(url);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching child parts:", error);
      throw error;
    }
  },

  // Create new child part
  async createChildPart(childPartData: {
    partName: string;
    customerName: string;
    stockAvailable: number;
    productPlanningId?: number | null;
  }) {
    try {
      const response = await api.post("/child-part", childPartData);
      return response.data.data;
    } catch (error) {
      console.error("Error creating child part:", error);
      throw error;
    }
  },

  // Update child part
  async updateChildPart(
    id: number,
    childPartData: {
      partName: string;
      customerName: string;
      stockAvailable: number;
      productPlanningId?: number | null;
    },
  ) {
    try {
      const response = await api.put(`/child-part/${id}`, childPartData);
      return response.data.data;
    } catch (error) {
      console.error("Error updating child part:", error);
      throw error;
    }
  },

  // Delete child part
  async deleteChildPart(id: number) {
    try {
      const response = await api.delete(`/child-part/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting child part:", error);
      throw error;
    }
  },

  // Get child part by ID
  async getChildPartById(id: number) {
    try {
      const response = await api.get(`/child-part/${id}`);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching child part:", error);
      throw error;
    }
  },
};

// Rencana Child Part Service
export const RencanaChildPartService = {
  // Get all rencana child parts
  async getAllRencanaChildParts() {
    try {
      const response = await api.get("/rencana-child-part");
      return response.data.data;
    } catch (error) {
      console.error("Error fetching rencana child parts:", error);
      throw error;
    }
  },

  // Create new rencana child part
  async createRencanaChildPart(rencanaData: {
    childPartId: number;
    bulan: number;
    tahun: number;
    hari: number;
    shift: number;
    rencana_inmaterial: number;
    aktual_inmaterial: number;
  }) {
    try {
      const response = await api.post("/rencana-child-part", rencanaData);
      return response.data.data;
    } catch (error) {
      console.error("Error creating rencana child part:", error);
      throw error;
    }
  },

  // Update rencana child part
  async updateRencanaChildPart(
    id: number,
    rencanaData: {
      childPartId: number;
      bulan: number;
      tahun: number;
      hari: number;
      shift: number;
      rencana_inmaterial: number;
      aktual_inmaterial: number;
    },
  ) {
    try {
      const response = await api.put(`/rencana-child-part/${id}`, rencanaData);
      return response.data.data;
    } catch (error) {
      console.error("Error updating rencana child part:", error);
      throw error;
    }
  },

  // Delete rencana child part
  async deleteRencanaChildPart(id: number) {
    try {
      const response = await api.delete(`/rencana-child-part/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting rencana child part:", error);
      throw error;
    }
  },

  // Get rencana child part by child part ID
  async getRencanaChildPartByChildPartId(childPartId: number) {
    try {
      const response = await api.get(
        `/rencana-child-part/child-part/${childPartId}`,
      );
      return response.data.data || response.data || [];
    } catch (error) {
      console.error(
        "Error fetching rencana child part by child part ID:",
        error,
      );
      return [];
    }
  },

  // Get rencana child part by bulan and tahun
  async getRencanaChildPartByBulanTahun(bulan: number, tahun: number) {
    try {
      const response = await api.get(
        `/rencana-child-part/bulan-tahun/${bulan}/${tahun}`,
      );
      return response.data.data || response.data || [];
    } catch (error) {
      console.error("Error fetching rencana child part by bulan tahun:", error);
      return [];
    }
  },
};

// Service untuk chat
export const ChatService = {
  // Chat completion dengan AI
  chatCompletion: async (payload: {
    messages: Array<{ role: string; content: string }>;
    model?: string;
  }): Promise<any> => {
    try {
      const response = await api.post("/chat", payload);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.message || "Gagal mendapatkan jawaban dari AI",
        );
      }
      throw new Error("Terjadi kesalahan saat menghubungi server");
    }
  },
};

// Interface untuk shift metrics data
export interface ShiftMetricsData {
  normalPart: {
    shift1Data: any[];
    shift2Data: any[];
    totals: {
      manpower: number;
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
  };
  childPart: {
    shift1Data: any[];
    shift2Data: any[];
    totals: {
      rencanaInMaterial: number;
      aktualInMaterial: number;
      rencanaStock: number;
      aktualStock: number;
    };
  };
}

export interface ShiftMetricsSummary {
  normalPart: {
    manpower: number;
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
  childPart: {
    rencanaInMaterial: number;
    aktualInMaterial: number;
    rencanaStock: number;
    aktualStock: number;
  };
  hasNormalPartData: boolean;
  hasChildPartData: boolean;
}

export interface SaveShiftMetricsPayload {
  partId?: number;
  childPartIds?: number[];
  bulan: number;
  tahun: number;
  normalPartMetrics?: {
    shift1?: {
      manpower?: number;
      deliveryPlan?: number;
      akumulasiDelivery?: number;
      planningProduksiPcs?: number;
      planningProduksiJam?: number;
      overtimePcs?: number;
      overtimeJam?: number;
      jamProduksiCycleTime?: number;
      hasilProduksiAktual?: number;
      akumulasiHasilProduksi?: number;
      actualStock?: number;
      rencanaStock?: number;
    };
    shift2?: {
      manpower?: number;
      deliveryPlan?: number;
      akumulasiDelivery?: number;
      planningProduksiPcs?: number;
      planningProduksiJam?: number;
      overtimePcs?: number;
      overtimeJam?: number;
      jamProduksiCycleTime?: number;
      hasilProduksiAktual?: number;
      akumulasiHasilProduksi?: number;
      actualStock?: number;
      rencanaStock?: number;
    };
  };
  childPartMetrics?: Array<{
    shift1?: {
      rencanaInMaterial?: number;
      aktualInMaterial?: number;
      rencanaStock?: number;
      aktualStock?: number;
    };
    shift2?: {
      rencanaInMaterial?: number;
      aktualInMaterial?: number;
      rencanaStock?: number;
      aktualStock?: number;
    };
  }>;
}

// Service untuk Shift Metrics
export const ShiftMetricsService = {
  // Get all shift metrics
  getAllShiftMetrics: async (): Promise<ShiftMetricsData> => {
    try {
      const response = await api.get("/shift-metrics");
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.message || "Gagal mendapatkan data shift metrics",
        );
      }
      throw new Error("Terjadi kesalahan saat menghubungi server");
    }
  },

  // Get shift metrics summary for dashboard
  getShiftMetricsSummary: async (params?: {
    partName?: string;
    bulan?: number;
    tahun?: number;
  }): Promise<ShiftMetricsSummary> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.partName) queryParams.append("partName", params.partName);
      if (params?.bulan) queryParams.append("bulan", params.bulan.toString());
      if (params?.tahun) queryParams.append("tahun", params.tahun.toString());

      const url = `/shift-metrics/summary${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await api.get(url);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.message ||
            "Gagal mendapatkan summary shift metrics",
        );
      }
      throw new Error("Terjadi kesalahan saat menghubungi server");
    }
  },

  // Get shift metrics by month and year
  getShiftMetricsByMonth: async (
    bulan: number,
    tahun: number,
  ): Promise<ShiftMetricsData> => {
    try {
      const response = await api.get(`/shift-metrics/month/${bulan}/${tahun}`);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.message ||
            "Gagal mendapatkan data shift metrics berdasarkan bulan",
        );
      }
      throw new Error("Terjadi kesalahan saat menghubungi server");
    }
  },

  // Get shift metrics by part name
  getShiftMetricsByPart: async (
    partName: string,
    params?: { bulan?: number; tahun?: number },
  ): Promise<ShiftMetricsData> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.bulan) queryParams.append("bulan", params.bulan.toString());
      if (params?.tahun) queryParams.append("tahun", params.tahun.toString());

      const url = `/shift-metrics/part/${encodeURIComponent(partName)}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await api.get(url);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.message ||
            "Gagal mendapatkan data shift metrics berdasarkan part",
        );
      }
      throw new Error("Terjadi kesalahan saat menghubungi server");
    }
  },

  // Save shift metrics from scheduler page
  saveShiftMetrics: async (payload: SaveShiftMetricsPayload): Promise<any> => {
    try {
      const response = await api.post("/shift-metrics/save", payload);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.message || "Gagal menyimpan data shift metrics",
        );
      }
      throw new Error("Terjadi kesalahan saat menghubungi server");
    }
  },

  // Bulk save shift metrics for multiple parts
  bulkSaveShiftMetrics: async (
    schedules: SaveShiftMetricsPayload[],
  ): Promise<any> => {
    try {
      const response = await api.post("/shift-metrics/bulk-save", {
        schedules,
      });
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.message ||
            "Gagal menyimpan data shift metrics secara bulk",
        );
      }
      throw new Error("Terjadi kesalahan saat menghubungi server");
    }
  },

  // Individual shift table services (for advanced usage)

  // FG Part Shift 1
  getFgPartShift1: async (): Promise<any> => {
    try {
      const response = await api.get("/fg-part-shift-1");
      return response.data.data;
    } catch (error) {
      throw new Error("Gagal mendapatkan data FG Part Shift 1");
    }
  },

  createFgPartShift1: async (data: any): Promise<any> => {
    try {
      const response = await api.post("/fg-part-shift-1", data);
      return response.data.data;
    } catch (error) {
      throw new Error("Gagal membuat data FG Part Shift 1");
    }
  },

  updateFgPartShift1: async (id: number, data: any): Promise<any> => {
    try {
      const response = await api.put(`/fg-part-shift-1/${id}`, data);
      return response.data.data;
    } catch (error) {
      throw new Error("Gagal mengupdate data FG Part Shift 1");
    }
  },

  deleteFgPartShift1: async (id: number): Promise<void> => {
    try {
      await api.delete(`/fg-part-shift-1/${id}`);
    } catch (error) {
      throw new Error("Gagal menghapus data FG Part Shift 1");
    }
  },

  // FG Part Shift 2
  getFgPartShift2: async (): Promise<any> => {
    try {
      const response = await api.get("/fg-part-shift-2");
      return response.data.data;
    } catch (error) {
      throw new Error("Gagal mendapatkan data FG Part Shift 2");
    }
  },

  createFgPartShift2: async (data: any): Promise<any> => {
    try {
      const response = await api.post("/fg-part-shift-2", data);
      return response.data.data;
    } catch (error) {
      throw new Error("Gagal membuat data FG Part Shift 2");
    }
  },

  updateFgPartShift2: async (id: number, data: any): Promise<any> => {
    try {
      const response = await api.put(`/fg-part-shift-2/${id}`, data);
      return response.data.data;
    } catch (error) {
      throw new Error("Gagal mengupdate data FG Part Shift 2");
    }
  },

  deleteFgPartShift2: async (id: number): Promise<void> => {
    try {
      await api.delete(`/fg-part-shift-2/${id}`);
    } catch (error) {
      throw new Error("Gagal menghapus data FG Part Shift 2");
    }
  },

  // Child Part Shift 1
  getCPartShift1: async (): Promise<any> => {
    try {
      const response = await api.get("/c-part-shift-1");
      return response.data.data;
    } catch (error) {
      throw new Error("Gagal mendapatkan data Child Part Shift 1");
    }
  },

  createCPartShift1: async (data: any): Promise<any> => {
    try {
      const response = await api.post("/c-part-shift-1", data);
      return response.data.data;
    } catch (error) {
      throw new Error("Gagal membuat data Child Part Shift 1");
    }
  },

  updateCPartShift1: async (id: number, data: any): Promise<any> => {
    try {
      const response = await api.put(`/c-part-shift-1/${id}`, data);
      return response.data.data;
    } catch (error) {
      throw new Error("Gagal mengupdate data Child Part Shift 1");
    }
  },

  deleteCPartShift1: async (id: number): Promise<void> => {
    try {
      await api.delete(`/c-part-shift-1/${id}`);
    } catch (error) {
      throw new Error("Gagal menghapus data Child Part Shift 1");
    }
  },

  // Child Part Shift 2
  getCPartShift2: async (): Promise<any> => {
    try {
      const response = await api.get("/c-part-shift-2");
      return response.data.data;
    } catch (error) {
      throw new Error("Gagal mendapatkan data Child Part Shift 2");
    }
  },

  createCPartShift2: async (data: any): Promise<any> => {
    try {
      const response = await api.post("/c-part-shift-2", data);
      return response.data.data;
    } catch (error) {
      throw new Error("Gagal membuat data Child Part Shift 2");
    }
  },

  updateCPartShift2: async (id: number, data: any): Promise<any> => {
    try {
      const response = await api.put(`/c-part-shift-2/${id}`, data);
      return response.data.data;
    } catch (error) {
      throw new Error("Gagal mengupdate data Child Part Shift 2");
    }
  },

  deleteCPartShift2: async (id: number): Promise<void> => {
    try {
      await api.delete(`/c-part-shift-2/${id}`);
    } catch (error) {
      throw new Error("Gagal menghapus data Child Part Shift 2");
    }
  },
};

export default api;
