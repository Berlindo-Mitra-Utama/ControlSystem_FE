import React from "react";
import LoginForm from "../components/layout/LoginForm";

interface LoginPageProps {
  loginForm: { username: string; password: string };
  setLoginForm: React.Dispatch<React.SetStateAction<{ username: string; password: string }>>;
  handleLogin: (e: React.FormEvent) => void;
  setInitialChoice: React.Dispatch<React.SetStateAction<string>>;
}

const LoginPage: React.FC<LoginPageProps> = ({ 
  loginForm, 
  setLoginForm, 
  handleLogin,
  setInitialChoice 
}) => {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-6">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Production Scheduler
          </h1>
          <p className="text-gray-400 mb-6">
            Sign in to access your production planning tools
          </p>
          
          {/* Tombol pilihan menu */}
          <div className="flex space-x-4 justify-center mb-6">
            <button
              onClick={() => setInitialChoice("scheduler")}
              className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-300 transition-all duration-300 flex-1"
            >
              Kontrol Planning
            </button>
            <button
              onClick={() => setInitialChoice("hitungcoil")}
              className="px-4 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-teal-700 focus:ring-4 focus:ring-green-300 transition-all duration-300 flex-1"
            >
              Hitung Coil
            </button>
          </div>
        </div>
        <LoginForm 
          loginForm={loginForm} 
          setLoginForm={setLoginForm} 
          handleLogin={handleLogin} 
        />
      </div>
    </div>
  );
};

export default LoginPage;