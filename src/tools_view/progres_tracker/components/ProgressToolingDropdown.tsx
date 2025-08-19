"use client";

import React from "react";
import { getProgressToolingDetail, getProgressToolingTrials, upsertProgressToolingTrials } from "../../../services/API_Services";
import { useTheme } from '../../../contexts/ThemeContext';

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
  // Identifiers for backend persistence
  partId: string;
  categoryId: string;
  processId: string;
  subProcessId: string;
  // Bubble full detail payload to parent for Save
  onDetailChange?: (detail: any) => void;
}

export function ProgressToolingDropdown({ progressToolingChild, onProgressToolingComplete, onProgressUpdate, partId, categoryId, processId, subProcessId, onDetailChange }: ProgressToolingDropdownProps) {
  const { isDarkMode } = useTheme();
  const [open, setOpen] = React.useState(false);
  const initialDetail = (progressToolingChild as any)?.toolingDetail || null;
  const [initialized, setInitialized] = React.useState<boolean>(!!(initialDetail && typeof initialDetail.overallProgress === 'number'));
  const cacheKey = React.useMemo(() => `tooling-detail-${partId}-${categoryId}-${processId}-${subProcessId}`, [partId, categoryId, processId, subProcessId]);

  // Dynamic UI colors based on theme
  const uiColors = {
    bg: {
      primary: isDarkMode ? 'bg-gray-700' : 'bg-white',
      secondary: isDarkMode ? 'bg-gray-800' : 'bg-gray-50',
      tertiary: isDarkMode ? 'bg-gray-900' : 'bg-gray-100',
      card: isDarkMode ? 'bg-gray-800' : 'bg-white',
      hover: isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-50'
    },
    border: {
      primary: isDarkMode ? 'border-gray-600' : 'border-gray-300',
      secondary: isDarkMode ? 'border-gray-700' : 'border-gray-200',
      tertiary: isDarkMode ? 'border-gray-800' : 'border-gray-100'
    },
    text: {
      primary: isDarkMode ? 'text-white' : 'text-gray-900',
      secondary: isDarkMode ? 'text-gray-200' : 'text-gray-700',
      tertiary: isDarkMode ? 'text-gray-300' : 'text-gray-600',
      muted: isDarkMode ? 'text-gray-400' : 'text-gray-500'
    },
    input: {
      bg: isDarkMode ? 'bg-gray-700' : 'bg-white',
      border: isDarkMode ? 'border-gray-600' : 'border-gray-300',
      text: isDarkMode ? 'text-white' : 'text-gray-900',
      focus: isDarkMode ? 'focus:ring-blue-500 focus:border-blue-500' : 'focus:ring-blue-500 focus:border-blue-500'
    }
  };

  const loadFromCache = React.useCallback(() => {
    try {
      const raw = localStorage.getItem(cacheKey);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, [cacheKey]);
  const [materials, setMaterials] = React.useState<Material[]>([
    { name: "Steel", actual: initialDetail?.rawMaterialActual ?? null, planned: initialDetail?.rawMaterialPlanned ?? null, unit: "kg" },
    { name: "Aluminum", actual: null, planned: null, unit: "kg" },
    { name: "Copper", actual: null, planned: null, unit: "kg" }
  ]);
  const initialTrialCount = typeof initialDetail?.trialCount === 'number' ? initialDetail.trialCount : 1;
  let initialTrials: Trial[] = Array.from({ length: initialTrialCount }).map((_, i) => ({
    name: `Trial ${i + 1}`,
    completed: !!initialDetail?.trialsCompleted?.[i]?.completed,
    weight: Math.round(20 / initialTrialCount)
  }));
  const [trials, setTrials] = React.useState<Trial[]>(initialTrials.length ? initialTrials : [{ name: "Trial 1", completed: false, weight: 10 }]);
  const [trialCount, setTrialCount] = React.useState<number | null>(initialTrialCount);
  
  // State untuk checkbox processes
  const [processStates, setProcessStates] = React.useState({
    "Design Tooling": !!initialDetail?.designToolingCompleted,
    "Machining 1": !!initialDetail?.machining1Completed,
    "Machining 2": !!initialDetail?.machining2Completed,
    "Machining 3": !!initialDetail?.machining3Completed,
    "Assy": !!initialDetail?.assyCompleted,
    "Approval": !!initialDetail?.approvalCompleted
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
    const progress = Math.round((completedTrials / trials.length) * 100);
    console.log('Trial progress calculation:', { 
      totalTrials: trials.length, 
      completedTrials, 
      progress,
      trials: trials.map(t => ({ name: t.name, completed: t.completed }))
    });
    return progress;
  };

  // Update trial count and redistribute weights
  const updateTrialCount = async (count: number | null) => {
    const newCount = count || 1;
    setTrialCount(newCount);
    
    // Only create new trials if we don't have any existing trials
    if (trials.length === 0) {
      const newTrials = [];
      for (let i = 1; i <= newCount; i++) {
        newTrials.push({
          name: `Trial ${i}`,
          completed: false,
          weight: Math.round(20 / newCount) // Distribute 20% weight equally
        });
      }
      setTrials(newTrials);
    } else {
      // If we have existing trials, just adjust the count and preserve existing data
      if (newCount > trials.length) {
        // Add new trials if count increased
        const additionalTrials = [];
        for (let i = trials.length + 1; i <= newCount; i++) {
          additionalTrials.push({
            name: `Trial ${i}`,
            completed: false,
            weight: Math.round(20 / newCount)
          });
        }
        setTrials([...trials, ...additionalTrials]);
      } else if (newCount < trials.length) {
        // Remove excess trials if count decreased
        setTrials(trials.slice(0, newCount));
      }
      
      // Recalculate weights for all trials
      const updatedTrials = trials.slice(0, newCount).map(trial => ({
        ...trial,
        weight: Math.round(20 / newCount)
      }));
      setTrials(updatedTrials);
    }
    
    // Save trials directly to database after updating count
    await saveTrialsToDatabase();
  };

  // Handle checkbox change
  const handleProcessCheckbox = (processName: string) => {
    setProcessStates(prev => ({
      ...prev,
      [processName]: !prev[processName]
    }));
    // Notify parent of changes
    if (onDetailChange) {
      const payload = buildDetailPayload();
      onDetailChange(payload);
    }
  };

  const rows = React.useMemo(() => [
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
      completed: calculateTrialProgress() === 100,
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
  ], [processStates, materials, trials, calculateMaterialProgress, calculateTrialProgress]);

  const totalProgress = rows.reduce((sum, row) => {
    return sum + (row.progress * row.weight / 100);
  }, 0);
  const overallProgress = initialized && typeof initialDetail?.overallProgress === 'number'
    ? Math.max(0, Math.min(100, Math.round(Number(initialDetail.overallProgress))))
    : Math.round(totalProgress);
  
  // Debug logging for progress calculation
  React.useEffect(() => {
    if (initialized) {
      console.log('Progress calculation debug:', {
        rows: rows.map(r => ({ name: r.name, progress: r.progress, weight: r.weight })),
        totalProgress,
        overallProgress,
        trials: trials.map(t => ({ name: t.name, completed: t.completed, weight: t.weight }))
      });
    }
  }, [rows, totalProgress, overallProgress, trials, initialized]);

  // Build payload to persist
  const buildDetailPayload = React.useCallback(() => {
    const payload = {
      designToolingCompleted: !!processStates["Design Tooling"],
      rawMaterialActual: materials[0]?.actual ? parseInt(materials[0].actual.toString()) : null,
      rawMaterialPlanned: materials[0]?.planned ? parseInt(materials[0].planned.toString()) : null,
      machining1Completed: !!processStates["Machining 1"],
      machining2Completed: !!processStates["Machining 2"],
      machining3Completed: !!processStates["Machining 3"],
      assyCompleted: !!processStates["Assy"],
      trialCount: parseInt((trialCount || 1).toString()),
      approvalCompleted: !!processStates["Approval"],
      overallProgress: parseFloat(overallProgress.toString())
    };
    
    console.log('Built tooling detail payload:', payload);
    return payload;
  }, [materials, processStates, trialCount, overallProgress]);

  // Build trials payload for pt_progress_tooling_trials table
  const buildTrialsPayload = React.useCallback(() => {
    const trialsPayload = (trials || []).map((trial, index) => ({
      index: index + 1,
      name: trial.name,
      completed: !!trial.completed,
      weight: trial.weight,
      notes: null
    }));
    
    console.log('Built trials payload:', trialsPayload);
    return trialsPayload;
  }, [trials]);

  // Save trials data directly to pt_progress_tooling_trials table
  const saveTrialsToDatabase = React.useCallback(async () => {
    try {
      console.log('Saving trials to database:', { partId, categoryId, processId });
      const trialsPayload = buildTrialsPayload();
      
      if (trialsPayload.length > 0) {
        const response = await upsertProgressToolingTrials(
          { partId, categoryId, processId },
          trialsPayload
        );
        console.log('Trials saved successfully:', response);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving trials to database:', error);
      return false;
    }
  }, [partId, categoryId, processId, buildTrialsPayload]);

  // Load trials data from database
  const loadTrialsFromDatabase = React.useCallback(async () => {
    try {
      console.log('Loading trials from database:', { partId, categoryId, processId });
      const trialRes = await getProgressToolingTrials({ partId, categoryId, processId });
      const arr = trialRes?.data || trialRes?.trials || [];
      
      if (Array.isArray(arr) && arr.length > 0) {
        console.log('Trials loaded from database:', arr);
        const sorted = [...arr].sort((a: any, b: any) => (a.index || 0) - (b.index || 0));
        
        // Set trial count and trials from database
        setTrialCount(sorted.length);
        const newTrials = sorted.map((t: any) => ({
          name: t.name || `Trial ${t.index}`,
          completed: !!t.completed,
          weight: typeof t.weight === 'number' ? t.weight : Math.round(20 / sorted.length)
        }));
        setTrials(newTrials);
        console.log('Trials set to state from database:', newTrials);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error loading trials from database:', error);
      return false;
    }
  }, [partId, categoryId, processId]);

  // Effect untuk auto-complete ketika overall progress mencapai 100%
  React.useEffect(() => {
    if (totalProgress === 100 && onProgressToolingComplete) {
      onProgressToolingComplete(true);
    }
  }, [totalProgress, onProgressToolingComplete]);

  // Effect untuk mengupdate progress ke parent component
  React.useEffect(() => {
    if (onProgressUpdate) {
      onProgressUpdate(overallProgress);
    }
    if (onDetailChange) {
      const payload = buildDetailPayload();
      console.log('Sending detail payload to parent:', payload);
      onDetailChange(payload);
      // Cache locally untuk mencegah reset saat backend belum simpan detail
      try { localStorage.setItem(cacheKey, JSON.stringify(payload)); } catch {}
    }
  }, [overallProgress, onProgressUpdate, onDetailChange, buildDetailPayload, cacheKey]);

  // Load existing tooling detail to prefill UI
  React.useEffect(() => {
    const loadDetail = async () => {
      try {
        console.log('Loading tooling detail for:', { partId, categoryId, processId, subProcessId });
        
        // Load all data in parallel for better performance
        const [detailRes, trialsRes] = await Promise.allSettled([
          getProgressToolingDetail({ partId, categoryId, processId, subProcessId }),
          getProgressToolingTrials({ partId, categoryId, processId })
        ]);
        
        console.log('Detail response:', detailRes);
        console.log('Trials response:', trialsRes);
        
        // Process tooling detail
        let d = null;
        if (detailRes.status === 'fulfilled' && detailRes.value?.success && detailRes.value?.data) {
          d = detailRes.value.data;
        } else if (processId) {
          // Try fallback with processId only
          try {
            const fallbackRes = await getProgressToolingDetail({ partId: '', categoryId: '', processId, subProcessId: '' } as any);
            if (fallbackRes?.success && fallbackRes?.data) {
              d = fallbackRes.data;
            }
          } catch (fallbackErr) {
            console.log('Fallback detail loading failed:', fallbackErr);
          }
        }
        
        if (!d) {
          // Fallback ke cache lokal jika backend belum punya data
          console.log('No backend data, trying cache');
          d = loadFromCache();
          console.log('Cache data:', d);
        }
        
        // Process trials data
        let trialsData = [];
        if (trialsRes.status === 'fulfilled' && trialsRes.value?.data) {
          trialsData = trialsRes.value.data;
        } else if (trialsRes.status === 'fulfilled' && trialsRes.value?.trials) {
          trialsData = trialsRes.value.trials;
        }
        
        console.log('Trials data from API:', trialsData);
        
        if (d) {
          console.log('Setting process states with data:', d);
          setProcessStates(prev => ({
            ...prev,
            "Design Tooling": !!d.designToolingCompleted,
            "Machining 1": !!d.machining1Completed,
            "Machining 2": !!d.machining2Completed,
            "Machining 3": !!d.machining3Completed,
            "Assy": !!d.assyCompleted,
            "Approval": !!d.approvalCompleted,
          }));
          
          console.log('Setting materials with data:', d.rawMaterialActual, d.rawMaterialPlanned);
          setMaterials([{ name: materials[0].name, unit: materials[0].unit, actual: d.rawMaterialActual ?? null, planned: d.rawMaterialPlanned ?? null }]);
          
          // Handle trials data
          if (Array.isArray(trialsData) && trialsData.length > 0) {
            console.log('Setting trials from API data:', trialsData);
            const sorted = [...trialsData].sort((a: any, b: any) => (a.index || 0) - (b.index || 0));
            
            setTrialCount(sorted.length);
            const newTrials = sorted.map((t: any) => ({
              name: t.name || `Trial ${t.index}`,
              completed: !!t.completed,
              weight: typeof t.weight === 'number' ? t.weight : Math.round(20 / sorted.length)
            }));
            setTrials(newTrials);
            console.log('Trials loaded from API and set to state:', newTrials);
          } else if (Array.isArray(d.trialsCompleted) && d.trialsCompleted.length > 0) {
            // Fallback to trialsCompleted from detail
            console.log('Setting trials from trialsCompleted fallback:', d.trialsCompleted);
            const count = d.trialCount || 1;
            setTrialCount(count);
            const newTrials = [] as Trial[];
            for (let i = 0; i < count; i++) {
              newTrials.push({ 
                name: `Trial ${i + 1}`, 
                completed: !!d.trialsCompleted[i]?.completed, 
                weight: Math.round(20 / count) 
              });
            }
            setTrials(newTrials);
          } else {
            // Default trial setup
            const count = d.trialCount || 1;
            setTrialCount(count);
            const defaultTrials = Array.from({ length: count }, (_, i) => ({
              name: `Trial ${i + 1}`,
              completed: false,
              weight: Math.round(20 / count)
            }));
            setTrials(defaultTrials);
          }
          
          console.log('Setting initialized to true');
          setInitialized(true);
        }
      } catch (err) {
        console.log('Error loading detail from backend:', err);
        // Backend gagal: coba cache lokal
        const d = loadFromCache();
        if (d) {
          setProcessStates(prev => ({
            ...prev,
            "Design Tooling": !!d.designToolingCompleted,
            "Machining 1": !!d.machining1Completed,
            "Machining 2": !!d.machining2Completed,
            "Machining 3": !!d.machining3Completed,
            "Assy": !!d.assyCompleted,
            "Approval": !!d.approvalCompleted,
          }));
          setMaterials([{ name: materials[0].name, unit: materials[0].unit, actual: d.rawMaterialActual ?? null, planned: d.rawMaterialPlanned ?? null }]);
          
          const count = d.trialCount || 1;
          setTrialCount(count);
          if (Array.isArray(d.trialsCompleted) && d.trialsCompleted.length > 0) {
            const newTrials = [] as Trial[];
            for (let i = 0; i < count; i++) {
              newTrials.push({ 
                name: `Trial ${i + 1}`, 
                completed: !!d.trialsCompleted[i]?.completed, 
                weight: Math.round(20 / count) 
              });
            }
            setTrials(newTrials);
          } else {
            const defaultTrials = Array.from({ length: count }, (_, i) => ({
              name: `Trial ${i + 1}`,
              completed: false,
              weight: Math.round(20 / count)
            }));
            setTrials(defaultTrials);
          }
          setInitialized(true);
        }
      }
    };
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partId, categoryId, processId, subProcessId, loadFromCache]);

  // Force refresh when component receives new data from parent (only on initial load)
  React.useEffect(() => {
    const refreshFromParent = async () => {
      if (initialized && progressToolingChild?.toolingDetail && !open) {
        console.log('Received new tooling detail from parent on initial load, refreshing UI');
        const detail = progressToolingChild.toolingDetail;
        setProcessStates(prev => ({
          ...prev,
          "Design Tooling": !!detail.designToolingCompleted,
          "Machining 1": !!detail.machining1Completed,
          "Machining 2": !!detail.machining2Completed,
          "Machining 3": !!detail.machining3Completed,
          "Assy": !!detail.assyCompleted,
          "Approval": !!detail.approvalCompleted,
        }));
        setMaterials([{ name: materials[0].name, unit: materials[0].unit, actual: detail.rawMaterialActual ?? null, planned: detail.rawMaterialPlanned ?? null }]);
        const count = detail.trialCount || 1;
        // Don't override trials if we already have them loaded from database
        if (trials.length === 0) {
          await updateTrialCount(count);
          if (Array.isArray(detail.trialsCompleted) && detail.trialsCompleted.length > 0) {
            const newTrials = [] as Trial[];
            for (let i = 0; i < count; i++) {
              newTrials.push({ name: `Trial ${i + 1}`, completed: !!detail.trialsCompleted[i]?.completed, weight: Math.round(20 / count) });
            }
            setTrials(newTrials);
          }
        }
      }
    };
    refreshFromParent();
  }, [progressToolingChild?.toolingDetail, initialized, materials, open]);

  // Data is now loaded upfront, no need to refresh on dropdown open
  // But we can add a debug log to show when dropdown opens
  React.useEffect(() => {
    if (open && initialized) {
      console.log('Dropdown opened, current trial data:', trials);
      console.log('Current trial count:', trialCount);
    }
  }, [open, initialized, trials, trialCount]);

  return (
    <div className="w-full mt-2">
      <button
        className={`w-full flex items-center justify-between p-3 ${uiColors.bg.primary} border ${uiColors.border.primary} rounded-lg ${uiColors.text.primary} ${uiColors.bg.hover} transition-colors`}
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
          <div className={`${uiColors.bg.tertiary} border ${uiColors.border.secondary} rounded shadow-lg p-3 sm:p-6 w-full`}>
            {/* Overall Progress */}
            <div className={`mb-6 p-4 ${isDarkMode ? 'bg-gradient-to-r from-gray-800 to-gray-700' : 'bg-gradient-to-r from-blue-50 to-indigo-50'} rounded-lg border ${uiColors.border.primary}`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
                <span className={`${uiColors.text.primary} font-semibold text-sm sm:text-base`}>Overall Progress</span>
                <span className="text-blue-600 font-bold text-lg sm:text-xl">{overallProgress}%</span>
              </div>
              <div className={`w-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-3 sm:h-4 overflow-hidden`}>
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 sm:h-4 rounded-full transition-all duration-500 ease-out shadow-lg"
                  style={{ width: `${overallProgress}%` }}
                ></div>
              </div>
              
              {/* Auto-complete Status berdasarkan Overall Progress */}
              {overallProgress === 100 && (
                <div className={`mt-3 p-2 ${isDarkMode ? 'bg-blue-600 text-white' : 'bg-green-100 text-green-800 border border-green-200'} rounded text-xs`}>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Overall Progress 100% - Progress Tooling will auto-complete!</span>
                  </div>
                </div>
              )}
              {overallProgress < 100 && overallProgress > 0 && (
                <div className={`mt-3 p-2 ${isDarkMode ? 'bg-gray-600 text-white' : 'bg-blue-100 text-blue-800 border border-blue-200'} rounded text-xs`}>
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
              <table className={`w-full text-xs sm:text-sm text-left ${uiColors.text.secondary}`}>
                <thead>
                  <tr className={`border-b ${uiColors.border.secondary} ${uiColors.bg.secondary}`}>
                    <th className="py-3 px-2 sm:px-3 font-semibold">Status</th>
                    <th className="py-3 px-2 sm:px-3 font-semibold">Process</th>
                    <th className="py-3 px-2 sm:px-3 font-semibold">Weight</th>
                    <th className="py-3 px-2 sm:px-3 font-semibold">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={idx} className={`border-b ${uiColors.border.tertiary} last:border-0 ${uiColors.bg.hover} transition-colors`}>
                      <td className="py-3 px-2 sm:px-3">
                        {row.type === "checkbox" && (
                          <input
                            type="checkbox"
                            checked={row.completed}
                            onChange={() => handleProcessCheckbox(row.name)}
                            className={`w-4 h-4 sm:w-5 sm:h-5 text-blue-600 ${uiColors.input.bg} ${uiColors.input.border} rounded focus:ring-blue-500 focus:ring-2 cursor-pointer transition-all duration-200 hover:scale-110`}
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
                        <span className={`${uiColors.bg.primary} px-2 py-1 rounded text-xs font-medium ${uiColors.text.primary}`}>
                          {row.weight}%
                        </span>
                      </td>
                      <td className="py-3 px-2 sm:px-3">
                        <div className="flex items-center space-x-2">
                          <div className={`w-16 sm:w-20 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2 sm:h-3 overflow-hidden`}>
                            <div 
                              className={`h-2 sm:h-3 rounded-full transition-all duration-500 ease-out ${
                                row.progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${row.progress}%` }}
                            ></div>
                          </div>
                          <span className={`text-xs font-medium ${
                            row.progress === 100 ? 'text-green-600' : uiColors.text.tertiary
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
              <div className={`p-4 ${uiColors.bg.card} rounded-lg border ${uiColors.border.secondary}`}>
                <h4 className={`${uiColors.text.primary} font-semibold mb-4 text-sm sm:text-base flex items-center`}>
                  <span className="text-green-500 mr-2">●</span>
                  Raw Material Tracking
                </h4>
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                  <span className={`${uiColors.text.tertiary} text-xs sm:text-sm font-medium`}>Material:</span>
                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      value={materials[0]?.actual ?? ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        const newMaterials = [...materials];
                        newMaterials[0] = {
                          ...newMaterials[0],
                          actual: value === '' ? null : (isNaN(parseInt(value)) ? null : parseInt(value))
                        };
                        setMaterials(newMaterials);
                        // Notify parent of changes
                        if (onDetailChange) {
                          const payload = buildDetailPayload();
                          onDetailChange(payload);
                        }
                      }}
                      className={`w-20 sm:w-24 px-3 py-2 ${uiColors.input.bg} border ${uiColors.input.border} rounded ${uiColors.input.text} text-xs sm:text-sm ${uiColors.input.focus} transition-all duration-200`}
                      placeholder="0"
                      min="0"
                    />
                    <span className={`${uiColors.text.muted} text-xs sm:text-sm font-medium`}>/</span>
                    <input
                      type="number"
                      value={materials[0]?.planned ?? ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        const newMaterials = [...materials];
                        newMaterials[0] = {
                          ...newMaterials[0],
                          planned: value === '' ? null : (isNaN(parseInt(value)) ? null : parseInt(value))
                        };
                        setMaterials(newMaterials);
                        // Notify parent of changes
                        if (onDetailChange) {
                          const payload = buildDetailPayload();
                          onDetailChange(payload);
                        }
                      }}
                      className={`w-20 sm:w-24 px-3 py-2 ${uiColors.input.bg} border ${uiColors.input.border} rounded ${uiColors.input.text} text-xs sm:text-sm ${uiColors.input.focus} transition-all duration-200`}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Trial Management */}
              <div className={`p-4 ${uiColors.bg.card} rounded-lg border ${uiColors.border.secondary}`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                  <h4 className={`${uiColors.text.primary} font-semibold text-sm sm:text-base flex items-center`}>
                    <span className="text-yellow-500 mr-2">●</span>
                    Trial Management
                  </h4>
                  <div className="flex items-center space-x-3">
                    <span className={`${uiColors.text.tertiary} text-xs sm:text-sm font-medium`}>Trial Count:</span>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={trialCount ?? ''}
                      onChange={async (e) => {
                        const value = e.target.value;
                        const newCount = value === '' ? null : (isNaN(parseInt(value)) ? null : parseInt(value));
                        if (newCount !== null && newCount >= 1 && newCount <= 10) {
                          updateTrialCount(newCount);
                          // Save trials directly to database
                          await saveTrialsToDatabase();
                          // Notify parent of changes
                          if (onDetailChange) {
                            const payload = buildDetailPayload();
                            onDetailChange(payload);
                          }
                        }
                      }}
                      className={`w-16 sm:w-20 px-3 py-2 ${uiColors.input.bg} border ${uiColors.input.border} rounded ${uiColors.input.text} text-xs sm:text-sm ${uiColors.input.focus} transition-all duration-200`}
                    />
                    <button
                      onClick={async () => {
                        console.log('Manual refresh of trial data requested');
                        await loadTrialsFromDatabase();
                      }}
                      className={`px-3 py-2 ${uiColors.bg.primary} border ${uiColors.border.primary} rounded ${uiColors.text.primary} text-xs font-medium hover:${uiColors.bg.hover} transition-colors`}
                      title="Refresh trial data from database"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {trials.map((trial, idx) => (
                    <div key={idx} className={`flex items-center space-x-3 p-2 ${uiColors.bg.primary} rounded ${uiColors.bg.hover} transition-colors`}>
                      <input
                        type="checkbox"
                        checked={trial.completed}
                        onChange={async (e) => {
                          const newTrials = [...trials];
                          newTrials[idx].completed = e.target.checked;
                          setTrials(newTrials);
                          // Save trials directly to database
                          await saveTrialsToDatabase();
                          // Notify parent of changes
                          if (onDetailChange) {
                            const payload = buildDetailPayload();
                            onDetailChange(payload);
                          }
                        }}
                        className={`w-4 h-4 sm:w-5 sm:h-5 text-blue-600 ${uiColors.input.bg} ${uiColors.input.border} rounded focus:ring-blue-500 focus:ring-2 cursor-pointer transition-all duration-200 hover:scale-110`}
                      />
                      <span className={`${uiColors.text.tertiary} text-xs sm:text-sm font-medium ${
                        trial.completed ? 'text-green-600' : ''
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
                      <span className={`${uiColors.text.muted} text-xs sm:text-sm font-medium`}>({trial.weight}%)</span>
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