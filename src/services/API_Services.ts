import axios from "axios";

// Base URL untuk API - Sesuaikan dengan port backend yang benar
// const API_BASE_URL = "https://6bqdp851-5555.use2.devtunnels.ms/api";
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
      const response = await api.post(
        "/daily-production/schedule",
        scheduleData,
      );
      return response.data;
    } catch (error) {
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
      const response = await api.put(
        `/daily-production/schedule/${id}`,
        scheduleData,
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Gagal mengupdate schedule",
      );
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
   * Utility function untuk mengkonversi data dari frontend ke format backend
   * @param {Object} scheduleData - Data schedule dari frontend
   * @returns {Object} Data yang sudah dikonversi
   */
  convertScheduleDataForBackend: (scheduleData: any): ProductionSchedule => {
    const { form, schedule, scheduleName, selectedMonth, selectedYear } =
      scheduleData;

    // Konversi production data
    const productionData: ProductionData[] = schedule.map((item: any) => ({
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
    }));

    // Dapatkan informasi user saat ini
    const currentUser = ProductionService.getCurrentUserInfo();

    return {
      partName: form.part,
      customer: form.customer,
      month: selectedMonth,
      year: selectedYear,
      initialStock: form.stock || 0,
      timePerPcs: form.timePerPcs || 257,
      scheduleName,
      productionData,
      lastSavedBy: currentUser, // Tambahkan informasi user yang terakhir kali saved
    };
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
            deliveryPlan: item.delivery || 0,
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
