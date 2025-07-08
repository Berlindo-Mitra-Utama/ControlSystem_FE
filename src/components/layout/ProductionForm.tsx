import React from "react";

interface FormData {
  part: string;
  customer: string;
  timePerPcs: number;
  cycle1: number;
  cycle7: number;
  cycle35: number;
  stock: number;
  delivery: number;
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Time per Piece */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">
                Time per Piece (sec)
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="timePerPcs"
                  value={form.timePerPcs}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                  className="w-full px-4 py-4 pr-12 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-white hover:border-gray-600"
                />
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 font-medium">
                  sec
                </span>
              </div>
            </div>
            
            {/* Cycle 1 Hour */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">
                Cycle 1 Hour
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="cycle1"
                  value={form.cycle1}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                  className="w-full px-4 py-4 pr-12 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-white hover:border-gray-600"
                />
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 font-medium">
                  sec
                </span>
              </div>
            </div>
            
            {/* Cycle 7 Hours */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">
                Cycle 7 Hours
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="cycle7"
                  value={form.cycle7}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                  className="w-full px-4 py-4 pr-12 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-white hover:border-gray-600"
                />
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 font-medium">
                  sec
                </span>
              </div>
            </div>
            
            {/* Cycle 3.5 Hours */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">
                Cycle 3.5 Hours
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="cycle35"
                  value={form.cycle35}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                  className="w-full px-4 py-4 pr-12 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-white hover:border-gray-600"
                />
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 font-medium">
                  sec
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
                
                {/* Delivery Target */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-300">
                    Delivery Target
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="delivery"
                      value={form.delivery}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-4 py-4 pr-12 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-white hover:border-gray-600"
                    />
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 font-medium">
                      PCS
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Planning Hours */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">
                  Planning Hours
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="planningHour"
                    value={form.planningHour}
                    onChange={handleChange}
                    min="0"
                    step="0.1"
                    className="w-full px-4 py-4 pr-12 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-white hover:border-gray-600"
                  />
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 font-medium">
                    hours
                  </span>
                </div>
              </div>
              
              {/* Overtime Hours */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">
                  Overtime Hours
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="overtimeHour"
                    value={form.overtimeHour}
                    onChange={handleChange}
                    min="0"
                    step="0.1"
                    className="w-full px-4 py-4 pr-12 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-white hover:border-gray-600"
                  />
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 font-medium">
                    hours
                  </span>
                </div>
              </div>
            </div>

            {/* Output Section */}
            <div className="space-y-6">
              {/* Shift Information */}
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h4 className="text-lg font-semibold text-white mb-4">
                  Shift Information
                </h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Shift 1:</span>
                    <span className="text-white font-medium">
                      08:00 - 12:00 (4 jam)
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Shift 2:</span>
                    <span className="text-white font-medium">
                      13:00 - 17:00 (4 jam)
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Overtime:</span>
                    <span className="text-white font-medium">
                      Day 31 if target not met
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-700 mt-2">
                    <div className="text-sm text-gray-400">
                      The system will calculate production per shift based on cycle time and shift duration. 
                      If production hasn't met the target after 30 days, the remaining production will be 
                      added to overtime on day 31.
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Production Calculation */}
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h4 className="text-lg font-semibold text-white mb-4">
                  Production Calculation
                </h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Production Target:</span>
                    <span className="text-white font-medium">
                      {Math.max(0, form.delivery - form.stock)} PCS
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Production per Shift:</span>
                    <span className="text-white font-medium">
                      {form.timePerPcs > 0
                        ? Math.floor(14400 / form.timePerPcs)
                        : 0} PCS
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Production per Day:</span>
                    <span className="text-white font-medium">
                      {form.timePerPcs > 0
                        ? Math.floor(28800 / form.timePerPcs)
                        : 0} PCS
                    </span>
                  </div>
                </div>
              </div>
            </div>
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
