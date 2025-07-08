// components/Navbar.tsx
import React from "react";

interface NavbarProps {
    user: { username: string; email: string } | null;
    isLoggedIn: boolean;
    currentView: "dashboard" | "scheduler" | "saved";
    setCurrentView: (view: "dashboard" | "scheduler" | "saved") => void;
    handleLogout: () => void;
    savedSchedulesCount: number;
}

const Navbar: React.FC<NavbarProps> = ({
    user,
    isLoggedIn,
    currentView,
    setCurrentView,
    handleLogout,
    savedSchedulesCount,
}) => {
    return (
    <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
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
            <h1 className="text-xl font-bold text-white">Production Scheduler</h1>
        </div>

        <div className="flex items-center gap-4">
            <div className="flex bg-gray-800 rounded-lg p-1">
            <button
                onClick={() => setCurrentView("dashboard")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                currentView === "dashboard"
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-700"
                }`}
            >
                Dashboard
            </button>
            <button
                onClick={() => setCurrentView("scheduler")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                currentView === "scheduler"
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-700"
                }`}
            >
                Scheduler
            </button>
            <button
                onClick={() => setCurrentView("saved")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                currentView === "saved"
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-700"
                }`}
            >
                Saved ({savedSchedulesCount})
            </button>
            </div>

            <div className="flex items-center gap-3">
            <div className="text-right">
                <p className="text-sm font-medium text-white">{user?.username}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
            <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-all duration-200 text-sm font-medium"
            >
                Logout
            </button>
            </div>
        </div>
        </div>
    </nav>
);
};

export default Navbar;
