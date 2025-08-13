import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { AuthService } from "../../services/API_Services";

interface User {
  username: string;
  email: string;
  id?: number;
  nama?: string;
  nip?: string;
  role?: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  loginForm: { username: string; password: string };
  setLoginForm: React.Dispatch<
    React.SetStateAction<{ username: string; password: string }>
  >;
  handleLogin: (e: React.FormEvent, initialChoice?: string) => Promise<void>;
  handleLogout: () => Promise<void>;
  checkToolAccess: (toolName: string) => boolean;
  isLoading: boolean; // Tambahkan isLoading
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [userTools, setUserTools] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Tambahkan loading state
  const navigate = useNavigate();

  useEffect(() => {
    const validateSession = async () => {
      const savedUser = localStorage.getItem("currentUser");
      const savedTools = localStorage.getItem("userTools");

      if (savedUser) {
        try {
          // Validasi session dengan memanggil API profile
          const profileResponse = await AuthService.getProfile();
          console.log("Profile response:", profileResponse);

          // Cek apakah response valid (bisa berupa profileResponse.data atau profileResponse langsung)
          const isValidResponse =
            profileResponse &&
            (profileResponse.user ||
              profileResponse.data?.user ||
              profileResponse.id); // Jika response langsung berisi user data

          if (isValidResponse) {
            setUser(JSON.parse(savedUser));
            setIsLoggedIn(true);

            if (savedTools) {
              setUserTools(JSON.parse(savedTools));
            }
            console.log("Session validated successfully");
          } else {
            // Jika validasi gagal, hapus data dari localStorage
            console.log("Session validation failed - no valid response");
            handleLogout();
          }
        } catch (error) {
          console.error("Session validation error:", error);
          // Jika terjadi error, hapus data dari localStorage
          handleLogout();
        }
      }

      // Set loading ke false setelah validasi selesai
      setIsLoading(false);
    };

    validateSession();
  }, []);

  // Fungsi untuk memeriksa apakah user memiliki akses ke tool tertentu
  const checkToolAccess = (toolName: string) => {
    // Admin memiliki akses ke semua tools
    if (user?.role === "admin") {
      return true;
    }

    // User biasa harus memiliki akses spesifik ke tool
    return userTools.includes(toolName);
  };

  const handleLogin = async (e: React.FormEvent, initialChoice?: string) => {
    e.preventDefault();
    if (loginForm.username && loginForm.password) {
      try {
        // Panggil API login dengan menambahkan toolName jika ada
        const response = await AuthService.login({
          nip: loginForm.username,
          password: loginForm.password,
          toolName: initialChoice, // Menambahkan toolName ke request
        });

        // Validasi respons dari API
        if (!response || !response.user) {
          throw new Error("Format respons dari server tidak valid");
        }

        // Format user data dari response API
        const userData = {
          username: response.user.nip,
          email: `${response.user.nip}@berlindo.com`,
          id: response.user.id,
          nama: response.user.nama,
          nip: response.user.nip,
          role: response.user.role,
        };

        setUser(userData);
        setIsLoggedIn(true);
        // simpan user + accessToken agar axios interceptor bisa mengirim Authorization
        localStorage.setItem(
          "currentUser",
          JSON.stringify({ ...userData, accessToken: response.accessToken })
        );
        setLoginForm({ username: "", password: "" });

        // Ambil daftar tools yang dapat diakses oleh user
        try {
          const toolsResponse = await AuthService.getMyTools();
          if (toolsResponse && toolsResponse.tools) {
            const toolNames = toolsResponse.tools.map(
              (tool: any) => tool.toolName,
            );
            setUserTools(toolNames);
            localStorage.setItem("userTools", JSON.stringify(toolNames));
          }
        } catch (error) {
          console.error("Error fetching user tools:", error);
          // Tetap lanjutkan proses login meskipun gagal mengambil daftar tools
        }

        // Navigasi berdasarkan tool yang dipilih
        if (initialChoice) {
          switch (initialChoice) {
            case "scheduler":
              navigate("/dashboard");
              break;
            case "hitungcoil":
              navigate("/hitungcoil");
              break;
            case "reports":
              navigate("/dashboard"); // atau route khusus untuk reports
              break;
            case "analytics":
              navigate("/dashboard"); // atau route khusus untuk analytics
              break;
            case "usermanagement":
              navigate("/admin/user-management"); // Mengarahkan ke halaman user management
              break;
            case "progress":
              navigate("/progress");
              break;
            case "systemconfig":
              navigate("/dashboard"); // atau route khusus untuk system config
              break;
            case "monitoring":
              navigate("/dashboard"); // atau route khusus untuk monitoring
              break;
            default:
              navigate("/dashboard");
          }
        } else {
          navigate("/dashboard");
        }
      } catch (error) {
        // Pastikan error dilempar kembali untuk ditangkap oleh LoginPage
        throw error;
      }
    }
  };

  const handleLogout = async () => {
    try {
      // Panggil API logout
      await AuthService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Selalu hapus data dari localStorage dan reset state
      setUser(null);
      setIsLoggedIn(false);
      setUserTools([]);
      setIsLoading(false); // Pastikan loading state di-reset
      localStorage.removeItem("currentUser");
      localStorage.removeItem("userTools");
      // Jangan hapus rememberedCredentials saat logout, biarkan user memilih
      navigate("/tools");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        loginForm,
        setLoginForm,
        handleLogin,
        handleLogout,
        checkToolAccess,
        isLoading, // Tambahkan isLoading ke context
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
