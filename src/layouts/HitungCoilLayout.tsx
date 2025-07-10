import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface HitungCoilLayoutProps {
  children: React.ReactNode;
}

const HitungCoilLayout: React.FC<HitungCoilLayoutProps> = ({ children }) => {
  const { handleLogout } = useAuth();

  return (
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
      {children}
    </>
  );
};

export default HitungCoilLayout;