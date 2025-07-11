import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-gray-900 border-t border-gray-800 py-6 text-center">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
        <div className="text-gray-400 text-sm mb-2 md:mb-0">
          &copy; {new Date().getFullYear()} Control System Scheduler. All rights reserved.
        </div>
        <div className="flex items-center gap-2">
          {/* Ganti src dengan logo perusahaan Anda */}
          <img src="../src/img/berlindo-logo-shadow-rev.resized (1).webp" alt="Berlindo company logo with stylized shadow effect, set against a neutral background, conveying a professional and modern tone" className="h-95 w-40 object-contain" />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
