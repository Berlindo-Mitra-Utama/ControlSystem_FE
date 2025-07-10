import { useState, useEffect } from "react";
import Navbar from "./components/layout/Navbar";
import LoginPage from "./pages/LoginPage";
import SchedulerPage from "./pages/SchedulerPage";
import SavedSchedulesPage from "./pages/SavedSchedulesPage";
import Dashboard from "./pages/Dashboard";
import AllChartsPage from "./pages/AllChartsPage";
import HitungCoil from "./HitungCoil/pages/hitungcoil";

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
    "dashboard" | "scheduler" | "saved" | "allcharts" | "hitungcoil"
  >("scheduler");
  const [savedSchedules, setSavedSchedules] = useState<SavedSchedule[]>([]);
  const [loadedSchedule, setLoadedSchedule] = useState<SavedSchedule | null>(
    null,
  );
  const [initialChoice, setInitialChoice] = useState<string>("");

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
      
      // Set initial view based on choice
      if (initialChoice === "hitungcoil") {
        setCurrentView("hitungcoil");
      } else {
        setCurrentView("scheduler");
      }
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
        setInitialChoice={setInitialChoice}
      />
    );
  }

  // Jika sudah login, tampilkan aplikasi utama
  return (
    <div className="min-h-screen bg-gray-950">
      {currentView !== "hitungcoil" ? (
        <>
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
                    totalProduction: savedSchedules.reduce((total, schedule) => {
                      return (
                        total +
                        schedule.schedule.reduce(
                          (sum, item) => sum + (item.actualPcs || 0),
                          0,
                        )
                      );
                    }, 0),
                    totalPlanned: savedSchedules.reduce((total, schedule) => {
                      return (
                        total +
                        schedule.schedule.reduce((sum, item) => sum + item.pcs, 0)
                      );
                    }, 0),
                    totalDays: savedSchedules.reduce((total, schedule) => {
                      const maxDay = Math.max(
                        ...schedule.schedule.map((item) => item.day),
                      );
                      return total + maxDay;
                    }, 0),
                    disruptedItems: savedSchedules.reduce((total, schedule) => {
                      return (
                        total +
                        schedule.schedule.filter(
                          (item) => item.status === "Gangguan",
                        ).length
                      );
                    }, 0),
                  }}
                  schedule={
                    loadedSchedule
                      ? loadedSchedule.schedule
                      : savedSchedules.length > 0
                        ? savedSchedules[savedSchedules.length - 1].schedule
                        : []
                  }
                  savedSchedules={savedSchedules}
                  setCurrentView={setCurrentView}
                />
              ) : currentView === "saved" ? (
                <SavedSchedulesPage
                  savedSchedules={savedSchedules}
                  loadSchedule={loadSchedule}
                  deleteSchedule={deleteSchedule}
                  setCurrentView={setCurrentView}
                />
              ) : currentView === "allcharts" ? (
                <AllChartsPage
                  savedSchedules={savedSchedules}
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
        </>
      ) : (
        <>
          <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <p className="font-bold text-white text-xl ml-2">Hitung Coil</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
          <HitungCoil />
        </>
      )}
    </div>
  );
}

export default App;
