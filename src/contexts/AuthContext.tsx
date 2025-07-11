import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";

interface User {
  username: string;
  email: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  loginForm: { username: string; password: string };
  setLoginForm: React.Dispatch<
    React.SetStateAction<{ username: string; password: string }>
  >;
  handleLogin: (e: React.FormEvent, initialChoice?: string) => void;
  handleLogout: () => void;
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
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent, initialChoice?: string) => {
    e.preventDefault();
    if (loginForm.username && loginForm.password) {
      const userData = {
        username: loginForm.username,
        email: `${loginForm.username}@berlindo.com`,
      };
      setUser(userData);
      setIsLoggedIn(true);
      localStorage.setItem("currentUser", JSON.stringify(userData));
      setLoginForm({ username: "", password: "" });

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
            navigate("/dashboard"); // atau route khusus untuk user management
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
    }
  };

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem("currentUser");
    navigate("/login");
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
