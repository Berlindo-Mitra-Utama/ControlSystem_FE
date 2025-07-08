import { useState, useEffect } from "react";
import Navbar from "./components/layout/Navbar";
import LoginPage from "./pages/LoginPage";
import SchedulerPage from "./pages/SchedulerPage";
import SavedSchedulesPage from "./pages/SavedSchedulesPage";
import Dashboard from "./pages/Dashboard";

interface ScheduleItem {
  id: string;
  day: number;
  shift: string;
  type: string;
  pcs: number;
  time: string;
  processes: string;
  status: "Normal" | "Gangguan" | "Completed";
  actualPcs?: number;
  notes?: string;
}

interface SavedSchedule {
  id: string;
  name: string;
  date: string;
  form: any;
  schedule: ScheduleItem[];
}

interface User {
  username: string;
  email: string;
}


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [currentView, setCurrentView] = useState<
    "dashboard" | "scheduler" | "saved"
  >("scheduler");
  const [savedSchedules, setSavedSchedules] = useState<SavedSchedule[]>([]);
  const [loadedSchedule, setLoadedSchedule] = useState<SavedSchedule | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("savedSchedules");
    if (saved) {
      setSavedSchedules(JSON.parse(saved));
    }

    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
    }
  }, []);

  // When loading a schedule, set loadedSchedule and switch view
  const loadSchedule = (savedSchedule: SavedSchedule) => {
    setLoadedSchedule(savedSchedule);
    setCurrentView("scheduler");
  };

  const deleteSchedule = (id: string) => {
    const updatedSchedules = savedSchedules.filter((s) => s.id !== id);
    setSavedSchedules(updatedSchedules);
    localStorage.setItem("savedSchedules", JSON.stringify(updatedSchedules));
  };

  const handleLogin = (e: React.FormEvent) => {
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
    }
  };

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem("currentUser");
    setCurrentView("scheduler");
  };

  // Jika belum login, tampilkan halaman login
  if (!isLoggedIn) {
    return (
      <LoginPage
        loginForm={loginForm}
        setLoginForm={setLoginForm}
        handleLogin={handleLogin}
      />
    );
  }

  // Jika sudah login, tampilkan aplikasi utama
  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar
        user={user}
        currentView={currentView}
        setCurrentView={setCurrentView}
        handleLogout={handleLogout}
        savedSchedulesCount={savedSchedules.length}
        isLoggedIn={isLoggedIn}
      />

      <div className="p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {currentView === "dashboard" ? (
            <Dashboard
              stats={{
                totalProduction: 0,
                totalPlanned: 0,
                totalDays: 0,
                disruptedItems: 0,
              }}
            />
          ) : currentView === "saved" ? (
            <SavedSchedulesPage
              savedSchedules={savedSchedules}
              loadSchedule={loadSchedule}
              deleteSchedule={deleteSchedule}
              setCurrentView={setCurrentView}
            />
          ) : (
            <SchedulerPage
              savedSchedules={savedSchedules}
              setSavedSchedules={setSavedSchedules}
              setCurrentView={setCurrentView}
              loadedSchedule={loadedSchedule}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
