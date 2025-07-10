import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LoginForm from "../components/layout/LoginForm";

const LoginPage: React.FC = () => {
  const { isLoggedIn, loginForm, setLoginForm, handleLogin } = useAuth();
  const [initialChoice, setInitialChoice] = useState<string>("");

  // Redirect if already logged in
  if (isLoggedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChoiceSelection = (choice: string) => {
    setInitialChoice(choice);
  };

  const onLogin = (e: React.FormEvent) => {
    handleLogin(e, initialChoice);
  };

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
              onClick={() => handleChoiceSelection("scheduler")}
              className={`px-4 py-3 font-semibold rounded-xl transition-all duration-300 flex-1 flex items-center justify-center gap-2 ${
                initialChoice === "scheduler"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white ring-4 ring-blue-300"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-300"
              }`}
            >
              Kontrol Planning
              {initialChoice === "scheduler" && (
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
            <button
              onClick={() => handleChoiceSelection("hitungcoil")}
              className={`px-4 py-3 font-semibold rounded-xl transition-all duration-300 flex-1 flex items-center justify-center gap-2 ${
                initialChoice === "hitungcoil"
                  ? "bg-gradient-to-r from-green-600 to-teal-600 text-white ring-4 ring-green-300"
                  : "bg-gradient-to-r from-green-600 to-teal-600 text-white hover:from-green-700 hover:to-teal-700 focus:ring-4 focus:ring-green-300"
              }`}
            >
              Hitung Coil
              {initialChoice === "hitungcoil" && (
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Form login hanya muncul setelah memilih */}
        {initialChoice ? (
          <LoginForm
            loginForm={loginForm}
            setLoginForm={setLoginForm}
            handleLogin={onLogin}
          />
        ) : (
          <div className="text-center text-gray-400 text-sm">
            Silakan pilih menu terlebih dahulu
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
