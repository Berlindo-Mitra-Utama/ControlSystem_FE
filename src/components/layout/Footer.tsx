import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#101624] border-t border-gray-800 py-0 relative overflow-hidden">
      <div className="relative w-full flex flex-col md:flex-row items-center justify-between min-h-[70px] md:min-h-[90px]">
        {/* Left: Text area - responsive positioning */}
        <div className="flex flex-col justify-center py-4 md:py-6 px-4 md:px-8 z-10 text-center md:text-left w-full md:w-auto">
          <div className="text-gray-200 text-base md:text-lg font-semibold mb-1">
            &copy; 2025 Control System Scheduler
          </div>
          <div className="text-gray-400 text-xs md:text-sm">
            All rights reserved.
          </div>
        </div>

        {/* Right: Responsive gradient background with logo */}
        <div className="absolute right-0 top-0 h-full w-full md:w-1/2 bg-gradient-to-r from-transparent via-gray-800/30 to-gray-700/50">
          {/* Additional gradient overlay for depth */}
          <div className="absolute right-0 top-0 h-full w-full md:w-2/3 bg-gradient-to-r from-transparent via-blue-900/20 to-indigo-800/30"></div>

          {/* Logo positioned responsively */}
          <div className="absolute right-2 sm:right-4 md:right-8 top-1/2 transform -translate-y-1/2 z-20">
            <img
              src="../src/img/berlindo-logo-shadow-rev.resized (1).webp"
              alt="Berlindo company logo with stylized shadow effect, set against a neutral background, conveying a professional and modern tone"
              className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-44 lg:h-24 lg:w-52 object-contain drop-shadow-xl"
            />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
