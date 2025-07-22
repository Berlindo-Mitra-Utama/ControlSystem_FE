import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-gradient-to-r from-[#101624] to-[#0a1833] border-t border-gray-800 py-0 text-center relative overflow-hidden">
      <div className="relative w-full flex flex-col md:flex-row items-center justify-between min-h-[90px]">
        {/* Mobile: Logo di atas, copyright di bawah. Desktop: copyright kiri, logo kanan */}
        <div className="w-full flex flex-col md:flex-row items-center justify-between">
          {/* Mobile: Logo Berlindo dan Giraf di atas, bersebelahan */}
          <div className="w-full flex md:hidden items-center justify-center pt-6">
            <div className="relative flex items-center justify-center h-[140px] z-10 gap-4">
              <img
                src=".../../src/img/logo_berlindo.png"
                alt="Berlindo company logo with stylized shadow effect, set against a neutral background, conveying a professional and modern tone"
                className="h-32 w-56 object-contain drop-shadow-xl relative"
                style={{ left: '-16px' }}
              />
              <img
                src=".../../src/img/logo_giraf.png"
                alt="Giraf Tech Solution logo"
                className="h-24 w-24 object-contain drop-shadow-xl relative"
                style={{ left: '0px' }}
              />
            </div>
          </div>
          {/* Copyright area */}
          <div className="flex-1 flex flex-col items-center md:items-start justify-center py-6 px-10 order-2 md:order-1">
            <div className="text-blue-200 text-lg font-semibold mb-1">
              &copy; {new Date().getFullYear()} Control System Scheduler
            </div>
            <div className="text-blue-400 text-sm">
              All rights reserved.
            </div>
          </div>
          {/* Desktop: Logo Berlindo dan Giraf di kanan, bersebelahan */}
          <div className="relative hidden md:flex items-center justify-end h-full w-[440px] md:w-[600px] order-1 md:order-2">
            {/* Blue grid SVG background */}
            <svg
              viewBox="0 0 480 90" width="100%" height="100%"
              className="absolute left-0 top-0 h-full w-full z-0"
              preserveAspectRatio="none"
            >
            </svg>
            {/* Logo Berlindo dan Giraf */}
            <div className="relative flex items-center justify-center h-[140px] w-[340px] z-10 gap-4">
              <img
                src=".../../src/img/logo_berlindo.png"
                alt="Berlindo company logo with stylized shadow effect, set against a neutral background, conveying a professional and modern tone"
                className="h-32 w-56 object-contain drop-shadow-xl relative"
                style={{ left: '-32px' }}
              />
              <img
                src=".../../src/img/logo_giraf.png"
                alt="Giraf Tech Solution logo"
                className="h-24 w-32 object-contain drop-shadow-xl relative"
                style={{ left: '-12px' }}
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
