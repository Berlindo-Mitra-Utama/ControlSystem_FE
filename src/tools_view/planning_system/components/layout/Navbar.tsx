// components/Navbar.tsx
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Button,
} from "@heroui/react";

// Logo komponen
export const ProductionLogo = () => {
  return (
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
  );
};

interface NavbarProps {
  user: { username: string; email: string } | null;
  isLoggedIn: boolean;
  handleLogout: () => void;
  savedSchedulesCount: number;
}

const NavbarComponent: React.FC<NavbarProps> = ({
  user,
  isLoggedIn,
  handleLogout,
  savedSchedulesCount,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  // Aktif hanya jika path persis sama
  const isActive = (path: string) => currentPath === path;

  const handleLogoutAndRedirect = () => {
    handleLogout();
  };

  return (
    <Navbar
      shouldHideOnScroll
      className="bg-gray-900 border-b border-gray-800 px-6 py-4"
    >
      <NavbarBrand>
        <ProductionLogo />
        <p className="font-bold text-white text-xl ml-2">
          Production Scheduler
        </p>
      </NavbarBrand>

      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        <NavbarItem isActive={isActive("/dashboard")}> 
          <Link
            to="/dashboard"
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              isActive("/dashboard")
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
          >
            Dashboard
          </Link>
        </NavbarItem>
        <NavbarItem isActive={isActive("/dashboard/scheduler")}> 
          <Link
            to="/dashboard/scheduler"
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              isActive("/dashboard/scheduler")
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
          >
            Scheduler
          </Link>
        </NavbarItem>
        <NavbarItem isActive={isActive("/dashboard/saved")}> 
          <Link
            to="/dashboard/saved"
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              isActive("/dashboard/saved")
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
          >
            Saved ({savedSchedulesCount})
          </Link>
        </NavbarItem>
      </NavbarContent>

      <NavbarContent justify="end">
        {isLoggedIn && user && (
          <>
            <NavbarItem className="hidden lg:flex">
              <div className="text-right">
                <p className="text-sm font-medium text-white">
                  {user.username}
                </p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
            </NavbarItem>
            <NavbarItem>
              <Button
                color="default"
                variant="flat"
                onClick={handleLogoutAndRedirect}
                className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-all duration-200 text-sm font-medium"
              >
                Logout
              </Button>
            </NavbarItem>
          </>
        )}
      </NavbarContent>
    </Navbar>
  );
};

export default NavbarComponent;
