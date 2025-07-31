// components/Navbar.tsx
import React, { useState } from "react";
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
    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
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
  );
};

// Logo untuk Hitung Coil
export const HitungCoilLogo = () => {
  return (
    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center">
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
  );
};

interface MenuItem {
  path: string;
  label: string;
}

interface NavbarProps {
  user: { username: string; email: string; nama?: string; nip?: string } | null;
  isLoggedIn: boolean;
  handleLogout: () => void;
  savedSchedulesCount?: number;
  title?: string;
  logo?: "production" | "hitungcoil";
  menuItems?: MenuItem[];
  showUserInfo?: boolean;
  showLogout?: boolean;
}

const NavbarComponent: React.FC<NavbarProps> = ({
  user,
  isLoggedIn,
  handleLogout,
  savedSchedulesCount = 0,
  title = "Production Scheduler",
  logo = "production",
  menuItems = [],
  showUserInfo = true,
  showLogout = true,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Aktif hanya jika path persis sama
  const isActive = (path: string) => currentPath === path;

  const handleLogoutAndRedirect = () => {
    handleLogout();
    navigate("/tools");
    setIsMenuOpen(false);
  };

  // Default menu items untuk Production Scheduler
  const defaultMenuItems: MenuItem[] = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/dashboard/scheduler", label: "Scheduler" },
    { path: "/dashboard/saved", label: `Saved (${savedSchedulesCount})` },
  ];

  // Gunakan custom menu items atau default
  const finalMenuItems = menuItems.length > 0 ? menuItems : defaultMenuItems;

  // Render logo berdasarkan prop
  const renderLogo = () => {
    switch (logo) {
      case "hitungcoil":
        return <HitungCoilLogo />;
      default:
        return <ProductionLogo />;
    }
  };

  return (
    <Navbar
      className="border-b border-gray-800/50 bg-gray-900 px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-40 shadow-lg"
      onMenuOpenChange={setIsMenuOpen}
    >
      <NavbarBrand>
        {renderLogo()}
        <p className="font-bold text-white text-lg sm:text-xl ml-2 hidden sm:block">
          {title}
        </p>
        <p className="font-bold text-white text-sm ml-2 sm:hidden">
          {title.split(" ")[0]}
        </p>
      </NavbarBrand>

      {/* Desktop Navigation */}
      {finalMenuItems.length > 0 && (
        <NavbarContent className="hidden sm:flex gap-4" justify="center">
          {finalMenuItems.map((item) => (
            <NavbarItem key={item.path} isActive={isActive(item.path)}>
              <Link
                to={item.path}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  isActive(item.path)
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-700"
                }`}
              >
                {item.label}
              </Link>
            </NavbarItem>
          ))}
        </NavbarContent>
      )}

      {/* Desktop User Info & Logout */}
      {showUserInfo && showLogout && (
        <NavbarContent justify="end" className="hidden sm:flex">
          {isLoggedIn && user && (
            <>
              <NavbarItem className="hidden lg:flex">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">
                    {user.nama || user.username}
                  </p>
                  <p className="text-xs text-gray-400">
                    NIP: {user.nip || user.username}
                  </p>
                </div>
              </NavbarItem>
              <NavbarItem>
                <Button
                  color="default"
                  variant="flat"
                  onClick={handleLogoutAndRedirect}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 text-sm font-medium"
                >
                  Logout
                </Button>
              </NavbarItem>
            </>
          )}
        </NavbarContent>
      )}

      {/* Mobile Menu Toggle - Hamburger Icon */}
      {(finalMenuItems.length > 0 || (showUserInfo && showLogout)) && (
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="sm:hidden text-white p-2 hover:bg-gray-700 rounded-lg transition-colors bg-gray-800"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      )}

      {/* Mobile Menu Popup */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Menu Content */}
          <div className="absolute top-0 right-0 w-64 h-full bg-gray-900/30 backdrop-blur-sm border-l border-gray-700 shadow-2xl">
            <div className="p-4 bg-gray-900/30 backdrop-blur-sm h-full">
              {/* Close Button */}
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="text-gray-400 hover:text-white p-2 hover:bg-gray-700 rounded-lg transition-colors bg-gray-800"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Navigation Items */}
              {finalMenuItems.length > 0 && (
                <div className="space-y-2">
                  {finalMenuItems.map((item, index) => (
                    <Link
                      key={`${item.path}-${index}`}
                      to={item.path}
                      className={`block px-4 py-3 text-sm font-medium transition-all duration-200 rounded-lg ${
                        isActive(item.path)
                          ? "bg-blue-600 text-white"
                          : "text-gray-400 hover:text-white hover:bg-gray-700"
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}

              {/* User Info & Logout */}
              {showUserInfo && showLogout && isLoggedIn && user && (
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <div className="px-4 py-2 mb-4">
                    <p className="text-sm font-medium text-white">
                      {user.nama || user.username}
                    </p>
                    <p className="text-xs text-gray-400">
                      NIP: {user.nip || user.username}
                    </p>
                  </div>
                  <button
                    onClick={handleLogoutAndRedirect}
                    className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 text-sm font-medium"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Navbar>
  );
};

export default NavbarComponent;
