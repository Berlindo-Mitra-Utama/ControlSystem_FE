import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#101624] border-t border-gray-800 py-0 text-center relative overflow-hidden">
      <div className="relative w-full flex flex-col md:flex-row items-center justify-between min-h-[90px]">
        {/* Left: Text area */}
        <div className="flex-1 flex flex-col items-center justify-center py-6 px-4">
          <div className="text-gray-200 text-lg font-semibold mb-1">
            &copy; {new Date().getFullYear()} Control System Scheduler
          </div>
          <div className="text-gray-400 text-sm">
            All rights reserved.
          </div>
        </div>
        {/* Right: Banner chevron design and logo */}
        <div className="relative flex items-center justify-end h-full w-[340px] md:w-[480px]">
          {/* Chevron shapes - now light gray, shifted left */}
          <svg
            viewBox="0 0 480 90" width="100%" height="100%"
            className="absolute left-[-120px] md:left-[-180px] top-0 h-full w-full z-0 transition-all duration-300"
            preserveAspectRatio="none"
            style={{ maxWidth: 'none' }}
          >
            <polygon points="180,0 480,0 480,90 180,90 270,45" fill="#e5e7eb" />
            <polygon points="240,0 480,0 480,90 240,90 330,45" fill="#d1d5db" />
            <polygon points="300,0 480,0 480,90 300,90 390,45" fill="#bfc3c7" />
          </svg>
          {/* Logo on top of chevron */}
          <div className="relative flex items-center justify-center h-[90px] w-[180px] z-10">
            <img
              src="../src/img/berlindo-logo-shadow-rev.resized (1).webp"
              alt="Berlindo company logo with stylized shadow effect, set against a neutral background, conveying a professional and modern tone"
              className="h-16 w-36 object-contain drop-shadow-xl"
            />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
