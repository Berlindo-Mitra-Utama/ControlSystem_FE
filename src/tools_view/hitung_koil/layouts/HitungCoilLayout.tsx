import React from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../../../main_view/contexts/AuthContext";

const HitungCoilLayout: React.FC = () => {
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
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <p className="font-bold text-white text-lg sm:text-xl ml-2">Hitung Coil</p>
        </div>
        {/* Tombol logout dihapus dari sini */}
      </div>
      <Outlet />
    </>
  );
};

export default HitungCoilLayout;
