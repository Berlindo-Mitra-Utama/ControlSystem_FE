import React, { useState, useRef, useEffect } from 'react';

interface CompactDatePickerProps {
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onClose: () => void;
}

const CompactDatePicker: React.FC<CompactDatePickerProps> = ({
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
  onClose
}) => {
  const [showMonths, setShowMonths] = useState(false);
  const [showYears, setShowYears] = useState(false);
  const monthsRef = useRef<HTMLDivElement>(null);
  const yearsRef = useRef<HTMLDivElement>(null);

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  useEffect(() => {
    if (showMonths && monthsRef.current) {
      const selectedElement = monthsRef.current.children[selectedMonth] as HTMLElement;
      selectedElement?.scrollIntoView({ block: 'center' });
    }
  }, [showMonths, selectedMonth]);

  useEffect(() => {
    if (showYears && yearsRef.current) {
      const yearIndex = years.indexOf(selectedYear);
      if (yearIndex !== -1) {
        const selectedElement = yearsRef.current.children[yearIndex] as HTMLElement;
        selectedElement?.scrollIntoView({ block: 'center' });
      }
    }
  }, [showYears, selectedYear, years]);

  return (
    <div className="absolute top-full mt-2 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 min-w-[280px]">
      <div className="p-4 space-y-4">
        {/* Month Selector */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Bulan
          </label>
          <button
            onClick={() => {
              setShowMonths(!showMonths);
              setShowYears(false);
            }}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 flex items-center justify-between"
          >
            <span>{months[selectedMonth]}</span>
            <svg className={`w-4 h-4 transition-transform ${showMonths ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showMonths && (
            <div 
              ref={monthsRef}
              className="absolute top-full mt-1 w-full bg-gray-700 border border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto z-10"
            >
              {months.map((month, index) => (
                <button
                  key={index}
                  onClick={() => {
                    onMonthChange(index);
                    setShowMonths(false);
                  }}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-600 transition-colors ${
                    index === selectedMonth ? 'bg-blue-600 text-white' : 'text-gray-300'
                  }`}
                >
                  {month}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Year Selector */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Tahun
          </label>
          <button
            onClick={() => {
              setShowYears(!showYears);
              setShowMonths(false);
            }}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 flex items-center justify-between"
          >
            <span>{selectedYear}</span>
            <svg className={`w-4 h-4 transition-transform ${showYears ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showYears && (
            <div 
              ref={yearsRef}
              className="absolute top-full mt-1 w-full bg-gray-700 border border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto z-10"
            >
              {years.map((year) => (
                <button
                  key={year}
                  onClick={() => {
                    onYearChange(year);
                    setShowYears(false);
                  }}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-600 transition-colors ${
                    year === selectedYear ? 'bg-blue-600 text-white' : 'text-gray-300'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
          Pilih
        </button>
      </div>
    </div>
  );
};

export default CompactDatePicker;