import React from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../../../main_view/contexts/AuthContext";

const ElectricityLayout: React.FC = () => {
  const { handleLogout } = useAuth();

  return (
    <>
      <div className="bg-gray-900 border-b border-gray-800 px-3 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg sm:rounded-xl flex items-center justify-center">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <p className="font-bold text-white text-lg sm:text-xl ml-2">Kalkulator Listrik</p>
        </div>
      </div>
      <Outlet />
    </>
  );
};

export default ElectricityLayout;