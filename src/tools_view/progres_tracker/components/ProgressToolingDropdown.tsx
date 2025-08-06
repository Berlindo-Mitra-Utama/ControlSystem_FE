"use client";

import React from "react";

interface Material {
  name: string;
  actual: number | null;
  planned: number | null;
  unit: string;
}

interface Trial {
  name: string;
  completed: boolean;
  weight: number;
}

interface ProgressToolingDropdownProps {
  progressToolingChild: any;
  onProgressToolingComplete?: (completed: boolean) => void;
  onProgressUpdate?: (progress: number) => void;
}

export function ProgressToolingDropdown({ progressToolingChild, onProgressToolingComplete, onProgressUpdate }: ProgressToolingDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const [materials, setMaterials] = React.useState<Material[]>([
    { name: "Steel", actual: null, planned: null, unit: "kg" },
    { name: "Aluminum", actual: null, planned: null, unit: "kg" },
    { name: "Copper", actual: null, planned: null, unit: "kg" }
  ]);
  const [trials, setTrials] = React.useState<Trial[]>([
    { name: "Trial 1", completed: false, weight: 10 }
  ]);
  const [trialCount, setTrialCount] = React.useState<number | null>(1);
  
  // State untuk checkbox processes
  const [processStates, setProcessStates] = React.useState({
    "Design Tooling": false,
    "Machining 1": false,
    "Machining 2": false,
    "Machining 3": false,
    "Assy": false,
    "Approval": false
  });



  // Calculate material progress
  const calculateMaterialProgress = () => {
    if (materials.length === 0) return 0;
    const material = materials[0]; // Hanya gunakan material pertama
    if (!material.planned || material.planned <= 0) return 0;
    if (!material.actual) return 0;
    const progress = (material.actual / material.planned) * 100;
    return Math.min(Math.round(progress), 100); // Maksimal 100%
  };

  // Calculate trial progress
  const calculateTrialProgress = () => {
    if (trials.length === 0) return 0;
    const completedTrials = trials.filter(trial => trial.completed).length;
    return Math.round((completedTrials / trials.length) * 100);
  };

  // Update trial count and redistribute weights
  const updateTrialCount = (count: number | null) => {
    setTrialCount(count || 1);
    const newTrials = [];
    for (let i = 1; i <= (count || 1); i++) {
      newTrials.push({
        name: `Trial ${i}`,
        completed: false,
        weight: Math.round(20 / (count || 1)) // Distribute 20% weight equally
      });
    }
    setTrials(newTrials);
  };

  // Handle checkbox change
  const handleProcessCheckbox = (processName: string) => {
    setProcessStates(prev => ({
      ...prev,
      [processName]: !prev[processName]
    }));
  };

  const rows = [
    { 
      name: "Design Tooling", 
      weight: 10, 
      completed: processStates["Design Tooling"],
      progress: processStates["Design Tooling"] ? 100 : 0,
      type: "checkbox"
    },
    { 
      name: "Raw Material", 
      weight: 10, 
      completed: false,
      progress: calculateMaterialProgress(),
      type: "material"
    },
    { 
      name: "Machining 1", 
      weight: 10, 
      completed: processStates["Machining 1"],
      progress: processStates["Machining 1"] ? 100 : 0,
      type: "checkbox"
    },
    { 
      name: "Machining 2", 
      weight: 25, 
      completed: processStates["Machining 2"],
      progress: processStates["Machining 2"] ? 100 : 0,
      type: "checkbox"
    },
    { 
      name: "Machining 3", 
      weight: 5, 
      completed: processStates["Machining 3"],
      progress: processStates["Machining 3"] ? 100 : 0,
      type: "checkbox"
    },
    { 
      name: "Assy", 
      weight: 10, 
      completed: processStates["Assy"],
      progress: processStates["Assy"] ? 100 : 0,
      type: "checkbox"
    },
    { 
      name: "Trial", 
      weight: 20, 
      completed: false,
      progress: calculateTrialProgress(),
      type: "trial"
    },
    { 
      name: "Approval", 
      weight: 10, 
      completed: processStates["Approval"],
      progress: processStates["Approval"] ? 100 : 0,
      type: "checkbox"
    }
  ];

  const totalProgress = rows.reduce((sum, row) => {
    return sum + (row.progress * row.weight / 100);
  }, 0);

  // Effect untuk auto-complete ketika overall progress mencapai 100%
  React.useEffect(() => {
    if (totalProgress === 100 && onProgressToolingComplete) {
      onProgressToolingComplete(true);
    }
  }, [totalProgress, onProgressToolingComplete]);

  // Effect untuk mengupdate progress ke parent component
  React.useEffect(() => {
    if (onProgressUpdate) {
      onProgressUpdate(totalProgress);
    }
  }, [totalProgress, onProgressUpdate]);

  return (
    <div className="w-full mt-2">
      <button
        className="w-full flex items-center justify-between p-3 bg-gray-700 border border-gray-600 rounded-lg text-white hover:bg-gray-600 transition-colors"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <span className="text-sm font-medium">Detail</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="w-full mt-2">
          <div className="bg-gray-900 border border-gray-700 rounded shadow-lg p-3 sm:p-6 w-full">
            {/* Overall Progress */}
            <div className="mb-6 p-4 bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg border border-gray-600">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
                <span className="text-white font-semibold text-sm sm:text-base">Overall Progress</span>
                <span className="text-blue-400 font-bold text-lg sm:text-xl">{Math.round(totalProgress)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 sm:h-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 sm:h-4 rounded-full transition-all duration-500 ease-out shadow-lg"
                  style={{ width: `${Math.round(totalProgress)}%` }}
                ></div>
              </div>
              
              {/* Auto-complete Status berdasarkan Overall Progress */}
              {totalProgress === 100 && (
                <div className="mt-3 p-2 bg-blue-600 text-white rounded text-xs">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Overall Progress 100% - Progress Tooling will auto-complete!</span>
                  </div>
                </div>
              )}
              {totalProgress < 100 && totalProgress > 0 && (
                <div className="mt-3 p-2 bg-gray-600 text-white rounded text-xs">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Progress Tooling will auto-complete when overall progress reaches 100%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Process Table */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-xs sm:text-sm text-left text-gray-200">
                <thead>
                  <tr className="border-b border-gray-700 bg-gray-800">
                    <th className="py-3 px-2 sm:px-3 font-semibold">Status</th>
                    <th className="py-3 px-2 sm:px-3 font-semibold">Process</th>
                    <th className="py-3 px-2 sm:px-3 font-semibold">Weight</th>
                    <th className="py-3 px-2 sm:px-3 font-semibold">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-800 last:border-0 hover:bg-gray-800 transition-colors">
                      <td className="py-3 px-2 sm:px-3">
                        {row.type === "checkbox" && (
                          <input
                            type="checkbox"
                            checked={row.completed}
                            onChange={() => handleProcessCheckbox(row.name)}
                            className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer transition-all duration-200 hover:scale-110"
                          />
                        )}
                        {row.type === "material" && (
                          <div className="flex items-center justify-center">
                            <span className="text-green-400 text-lg">●</span>
                          </div>
                        )}
                        {row.type === "trial" && (
                          <div className="flex items-center justify-center">
                            <span className="text-yellow-400 text-lg">●</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-2 sm:px-3 font-medium text-xs sm:text-sm">
                        <span className={row.progress === 100 ? "text-green-400" : ""}>
                          {row.name}
                        </span>
                        {row.progress === 100 && row.progress >= 100 && (
                          <div className="inline-block ml-2" title="Process completed">
                            <svg 
                              className="w-3 h-3 text-green-500 transform transition-all duration-300 ease-out scale-100 hover:scale-110 hover:text-green-400" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-2 sm:px-3 text-xs sm:text-sm">
                        <span className="bg-gray-700 px-2 py-1 rounded text-xs font-medium">
                          {row.weight}%
                        </span>
                      </td>
                      <td className="py-3 px-2 sm:px-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 sm:w-20 bg-gray-700 rounded-full h-2 sm:h-3 overflow-hidden">
                            <div 
                              className={`h-2 sm:h-3 rounded-full transition-all duration-500 ease-out ${
                                row.progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${row.progress}%` }}
                            ></div>
                          </div>
                          <span className={`text-xs font-medium ${
                            row.progress === 100 ? 'text-green-400' : 'text-gray-300'
                          }`}>
                            {row.progress}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Material Management and Trial Management - Side by Side */}
            <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Material Management */}
              <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                <h4 className="text-white font-semibold mb-4 text-sm sm:text-base flex items-center">
                  <span className="text-green-400 mr-2">●</span>
                  Raw Material Tracking
                </h4>
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                  <span className="text-gray-300 text-xs sm:text-sm font-medium">Material:</span>
                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      value={materials[0]?.actual || ''}
                      onChange={(e) => {
                        const newMaterials = [...materials];
                        newMaterials[0].actual = e.target.value === '' ? null : parseInt(e.target.value);
                        setMaterials(newMaterials);
                      }}
                      className="w-20 sm:w-24 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="0"
                    />
                    <span className="text-gray-400 text-xs sm:text-sm font-medium">/</span>
                    <input
                      type="number"
                      value={materials[0]?.planned || ''}
                      onChange={(e) => {
                        const newMaterials = [...materials];
                        newMaterials[0].planned = e.target.value === '' ? null : parseInt(e.target.value);
                        setMaterials(newMaterials);
                      }}
                      className="w-20 sm:w-24 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Trial Management */}
              <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                  <h4 className="text-white font-semibold text-sm sm:text-base flex items-center">
                    <span className="text-yellow-400 mr-2">●</span>
                    Trial Management
                  </h4>
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-300 text-xs sm:text-sm font-medium">Trial Count:</span>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={trialCount || ''}
                      onChange={(e) => updateTrialCount(e.target.value === '' ? null : parseInt(e.target.value))}
                      className="w-16 sm:w-20 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  {trials.map((trial, idx) => (
                    <div key={idx} className="flex items-center space-x-3 p-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors">
                      <input
                        type="checkbox"
                        checked={trial.completed}
                        onChange={(e) => {
                          const newTrials = [...trials];
                          newTrials[idx].completed = e.target.checked;
                          setTrials(newTrials);
                        }}
                        className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer transition-all duration-200 hover:scale-110"
                      />
                      <span className={`text-gray-300 text-xs sm:text-sm font-medium ${
                        trial.completed ? 'text-green-400' : ''
                      }`}>
                        {trial.name}
                      </span>
                      {trial.completed && (
                        <div className="inline-block ml-2" title="Trial completed">
                          <svg 
                            className="w-3 h-3 text-green-500 transform transition-all duration-300 ease-out scale-100 hover:scale-110 hover:text-green-400" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      <span className="text-gray-400 text-xs sm:text-sm font-medium">({trial.weight}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 