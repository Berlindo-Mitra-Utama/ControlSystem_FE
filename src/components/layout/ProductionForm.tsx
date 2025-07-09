import React, { useState } from "react";

interface FormData {
  part: string;
  customer: string;
  timePerPcs: number;
  cycle1: number;
  cycle7: number;
  cycle35: number;
  stock: number;
  // delivery: number; // REMOVED, now per-row in schedule
  planningHour: number;
  overtimeHour: number;
  planningPcs: number;
  overtimePcs: number;
  isManualPlanningPcs: boolean;
}

interface ProductionFormProps {
  form: FormData;
  scheduleName: string;
  mockData: any[];
  isGenerating: boolean;
  handleSelectPart: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  generateSchedule: () => void;
  setScheduleName: (name: string) => void;
  saveSchedule: () => void;
}

const ProductionForm: React.FC<ProductionFormProps> = ({
  form,
  scheduleName,
  mockData,
  isGenerating,
  handleSelectPart,
  handleChange,
  generateSchedule,
  setScheduleName,
  saveSchedule
}) => {
  // Man Power State
  const [manPowerName, setManPowerName] = useState("");
  const [manPowers, setManPowers] = useState<string[]>([]);

  // Calculate effective time per pcs based on man power
  const effectiveTimePerPcs = form.timePerPcs > 0 && manPowers.length > 0
    ? (3600 / (manPowers.length * 5))
    : form.timePerPcs;

  // Handler for adding man power
  const handleAddManPower = () => {
    const name = manPowerName.trim();
    if (name && !manPowers.includes(name)) {
      setManPowers([...manPowers, name]);
      setManPowerName("");
    }
  };

  // Handler for removing man power
  const handleRemoveManPower = (name: string) => {
    setManPowers(manPowers.filter(mp => mp !== name));
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden">
      <div className="border-b border-gray-800 px-8 py-6">
        <h2 className="text-2xl font-bold text-white">Production Configuration</h2>
        <p className="text-gray-400 mt-1">Configure your manufacturing parameters</p>
      </div>

      <div className="p-8 space-y-8">
        {/* Part Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Part Selection</h3>
          <div className="relative">
            <select
              value={form.part}
              onChange={handleSelectPart}
              className="w-full px-4 py-4 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-white appearance-none cursor-pointer hover:border-gray-600"
            >
              <option value="">Select a part to get started...</option>
              {mockData.map((item, idx) => (
                <option key={idx} value={item.part}>
                  {item.part} - {item.customer}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-white">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Part Name */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">
                Part Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="part"
                value={form.part}
                onChange={handleChange}
                placeholder="Enter part name"
                className="w-full px-4 py-4 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-white placeholder-gray-500 hover:border-gray-600"
                required
              />
            </div>
            
            {/* Customer Name */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="customer"
                value={form.customer}
                onChange={handleChange}
                placeholder="Enter customer name"
                className="w-full px-4 py-4 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-white placeholder-gray-500 hover:border-gray-600"
                required
              />
            </div>
          </div>
        </div>

        {/* Timing Parameters */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-white">Timing Parameters</h3>
          {/* Man Power Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">Man Power</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manPowerName}
                onChange={e => setManPowerName(e.target.value)}
                placeholder="Nama Man Power"
                className="px-3 py-2 rounded-lg border border-gray-700 bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base w-1/2"
              />
              <button
                type="button"
                onClick={handleAddManPower}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all"
              >
                Add
              </button>
            </div>
            {/* List Man Power */}
            {manPowers.length > 0 && (
              <ul className="mt-2 space-y-1">
                {manPowers.map((mp, idx) => (
                  <li key={mp} className="flex items-center justify-between text-white bg-gray-800 rounded px-3 py-1">
                    <span>{idx + 1}. {mp}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveManPower(mp)}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded px-3 py-1 ml-2 transition-colors"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-2 text-xs text-gray-400">1 Man Power = 5 pcs/jam. Jumlah man power mempengaruhi kecepatan produksi.</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Time per Piece */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Time per Piece (sec)
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="timePerPcs"
                  value={effectiveTimePerPcs.toFixed(2)}
                  readOnly
                  className="w-full px-3 py-3 pr-10 bg-gray-800 border border-gray-700 rounded-lg text-white text-base cursor-not-allowed opacity-80"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 font-medium">
                  sec
                </span>
              </div>
            </div>

            {/* Output 1 Jam */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Output 1 Jam
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={manPowers.length > 0 ? manPowers.length * 5 : (form.timePerPcs > 0 ? Math.floor(3600 / form.timePerPcs) : 0)}
                  readOnly
                  className="w-full px-3 py-3 pr-10 bg-gray-800 border border-gray-700 rounded-lg text-white text-base cursor-not-allowed opacity-80"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 font-medium">
                  pcs
                </span>
              </div>
            </div>

            {/* Output 7 Jam */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Output 7 Jam
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={manPowers.length > 0 ? manPowers.length * 5 * 7 : (form.timePerPcs > 0 ? Math.floor(3600 * 7 / form.timePerPcs) : 0)}
                  readOnly
                  className="w-full px-3 py-3 pr-10 bg-gray-800 border border-gray-700 rounded-lg text-white text-base cursor-not-allowed opacity-80"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 font-medium">
                  pcs
                </span>
              </div>
            </div>

            {/* Output 3.5 Jam */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Output 3.5 Jam
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={manPowers.length > 0 ? manPowers.length * 5 * 3.5 : (form.timePerPcs > 0 ? Math.floor(3600 * 3.5 / form.timePerPcs) : 0)}
                  readOnly
                  className="w-full px-3 py-3 pr-10 bg-gray-800 border border-gray-700 rounded-lg text-white text-base cursor-not-allowed opacity-80"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 font-medium">
                  pcs
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Production Targets */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-white">Production Targets</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {/* Current Stock */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-300">
                    Current Stock
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="stock"
                      value={form.stock}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-4 py-4 pr-12 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-white hover:border-gray-600"
                    />
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 font-medium">
                      PCS
                    </span>
                  </div>
                </div>
                
                {/* Delivery Target removed: now per-row in schedule */}
              </div>
              
              {/* Planning Hours and Overtime Hours removed as requested */}
            </div>

            {/* Output Section removed: Shift Information and Production Calculation */}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center pt-8">
                <button
                  onClick={generateSchedule}
                  disabled={isGenerating}
                  className="px-12 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-300 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-3 shadow-lg"
                >
                  {isGenerating ? (
                    <>
                      <svg
                        className="w-5 h-5 animate-spin"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Generating Schedule...
                    </>
                  ) : (
                    <>
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
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      Generate Production Schedule
                    </>
                  )}
                </button>
              </div>
      </div>
    </div>
  );
};

export default ProductionForm;
