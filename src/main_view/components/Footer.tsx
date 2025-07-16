import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-gradient-to-r from-[#101624] to-[#0a1833] border-t border-gray-800 py-0 text-center relative overflow-hidden">
      <div className="relative w-full flex flex-col md:flex-row items-center justify-between min-h-[90px]">
        {/* Left: Text area */}
        <div className="flex-1 flex flex-col items-center justify-center py-6 px-4">
          <div className="text-blue-200 text-lg font-semibold mb-1">
            &copy; {new Date().getFullYear()} Control System Scheduler
          </div>
          <div className="text-blue-400 text-sm">
            All rights reserved.
          </div>
        </div>
        {/* Right: geometric blue grid background and logo */}
        <div className="relative flex items-center justify-end h-full w-[340px] md:w-[480px]">
          {/* Blue grid SVG background */}
          <svg
            viewBox="0 0 480 90" width="100%" height="100%"
            className="absolute left-0 top-0 h-full w-full z-0"
            preserveAspectRatio="none"
          >
          </svg>
          {/* Logo on top of grid */}
          <div className="relative flex items-center justify-center h-[90px] w-[180px] z-10">
            <img
              src="../src/img/logo_berlindo.png"
              alt="Berlindo company logo with stylized shadow effect, set against a neutral background, conveying a professional and modern tone"
              className="h-40 w-64 object-contain drop-shadow-xl relative"
              style={{ left: '-50px' }}
            />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
