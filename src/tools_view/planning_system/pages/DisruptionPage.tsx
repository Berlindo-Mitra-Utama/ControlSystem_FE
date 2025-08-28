import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Navigation, Package, TrendingDown } from "lucide-react";
import { useTheme } from "../../../contexts/ThemeContext";

interface DisruptionItem {
  partId: string;
  partName: string;
  customerName: string;
  day: number;
  shift: number;
  type: 'rencanaInMaterial' | 'aktualInMaterial' | 'rencanaStock' | 'aktualStock';
  value: number;
  fieldName: string;
}

const DisruptionPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [disruptions, setDisruptions] = useState<DisruptionItem[]>([]);
  const [currentPartInfo, setCurrentPartInfo] = useState<any>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Show toast notification
  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  useEffect(() => {
    // Load disruptions from sessionStorage
    const storedDisruptions = sessionStorage.getItem('disruptions');
    const storedPartInfo = sessionStorage.getItem('currentPartInfo');
    
    if (storedDisruptions) {
      setDisruptions(JSON.parse(storedDisruptions));
    }
    
    if (storedPartInfo) {
      setCurrentPartInfo(JSON.parse(storedPartInfo));
    }
  }, []);

  // Group disruptions by part
  const disruptionsByPart = disruptions.reduce((acc, disruption) => {
    if (!acc[disruption.partId]) {
      acc[disruption.partId] = {
        partName: disruption.partName,
        customerName: disruption.customerName,
        disruptions: []
      };
    }
    acc[disruption.partId].disruptions.push(disruption);
    return acc;
  }, {} as Record<string, { partName: string; customerName: string; disruptions: DisruptionItem[] }>);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'rencanaInMaterial': return 'Rencana In Material';
      case 'aktualInMaterial': return 'Aktual In Material';
      case 'rencanaStock': return 'Rencana Stock';
      case 'aktualStock': return 'Aktual Stock';
      default: return type;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'rencanaInMaterial':
      case 'aktualInMaterial':
        return <Package className="w-4 h-4" />;
      case 'rencanaStock':
      case 'aktualStock':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'rencanaInMaterial':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700';
      case 'aktualInMaterial':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-700';
      case 'rencanaStock':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-700';
      case 'aktualStock':
        return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-700';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-200 dark:border-gray-700';
    }
  };

  const getDayName = (day: number) => {
    const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const offset = 2; // 0=Minggu, 1=Senin, 2=Selasa, dst
    return DAY_NAMES[(offset + day) % 7];
  };

  const handleNavigateToField = (disruption: DisruptionItem) => {
    // Show confirmation dialog
    if (window.confirm(`Navigasi ke field "${disruption.fieldName}" pada ${getDayName(disruption.day)} Shift ${disruption.shift}?`)) {
      // Show toast message
      showToastMessage(`Navigasi ke ${disruption.fieldName}...`);
      
      // Store comprehensive navigation data for the planning page to use
      sessionStorage.setItem('navigateToField', JSON.stringify({
        partName: disruption.partName,
        customerName: disruption.customerName,
        day: disruption.day,
        shift: disruption.shift,
        type: disruption.type,
        fieldName: disruption.fieldName,
        navigateToSchedule: true, // Flag to indicate we want to go to schedule
        openScheduleDirectly: true, // Flag to open schedule directly
        scrollToSpecificDate: true, // Flag to scroll to specific date
        targetDate: disruption.day, // Target date for scrolling
        dayName: getDayName(disruption.day), // Day name for better identification
        timestamp: Date.now() // Add timestamp for tracking
      }));
      
      // Navigate directly to the scheduler page
      navigate('/dashboard/scheduler');
    }
  };

  const handleBackToPlanning = () => {
    // Navigate back to the planning page with ChildPartTable
    // First, check if we have current part info to navigate to the specific schedule
    if (currentPartInfo && currentPartInfo.partName && currentPartInfo.customerName) {
      // Find the first disruption for this part to navigate to the specific field
      const firstDisruption = disruptions.find(d => 
        d.partName === currentPartInfo.partName && 
        d.customerName === currentPartInfo.customerName
      );
      
      if (firstDisruption) {
        // Show toast message
        showToastMessage(`Kembali ke Planning: ${currentPartInfo.partName} - ${currentPartInfo.customerName}`);
        
        // Store comprehensive navigation data to open the specific schedule and navigate to the disrupted field
        sessionStorage.setItem('navigateToField', JSON.stringify({
          partName: currentPartInfo.partName,
          customerName: currentPartInfo.customerName,
          day: firstDisruption.day,
          shift: firstDisruption.shift,
          type: firstDisruption.type,
          fieldName: firstDisruption.fieldName,
          navigateToSchedule: true,
          openScheduleDirectly: true,
          scrollToSpecificDate: true, // Enable scrolling to specific date
          targetDate: firstDisruption.day, // Target date for scrolling
          dayName: getDayName(firstDisruption.day), // Day name for better identification
          showChildPartTable: true, // Flag to indicate we want to show ChildPartTable
          navigateToSpecificField: true, // Flag to navigate to specific disrupted field
          timestamp: Date.now()
        }));
      } else {
        // If no disruption found, just navigate to the schedule without specific field targeting
        showToastMessage(`Kembali ke Planning: ${currentPartInfo.partName} - ${currentPartInfo.customerName}`);
        
        sessionStorage.setItem('navigateToField', JSON.stringify({
          partName: currentPartInfo.partName,
          customerName: currentPartInfo.customerName,
          navigateToSchedule: true,
          openScheduleDirectly: true,
          scrollToSpecificDate: false,
          showChildPartTable: true,
          navigateToSpecificField: false,
          timestamp: Date.now()
        }));
      }
      
      // Navigate to the scheduler page
      navigate('/dashboard/scheduler');
    } else {
      // If no specific part info, just go back to the previous page
      showToastMessage('Kembali ke halaman sebelumnya');
      navigate(-1);
    }
  };

  if (disruptions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={handleBackToPlanning}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              Kembali ke Planning
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Disruption Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Kelola semua gangguan dan nilai negatif dalam sistem</p>
          </div>

          {/* No Disruptions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Tidak Ada Disruption
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Semua nilai dalam sistem valid. Tidak ada gangguan yang perlu ditangani.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBackToPlanning}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Kembali ke Planning
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Disruption Management</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {disruptions.length} gangguan ditemukan yang memerlukan perhatian
              </p>
              {currentPartInfo && (
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  Part: {currentPartInfo.partName} | Customer: {currentPartInfo.customerName}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Disruption</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{disruptions.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Parts Terpengaruh</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{Object.keys(disruptionsByPart).length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Stock Negatif</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {disruptions.filter(d => d.type.includes('Stock')).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Input Negatif</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {disruptions.filter(d => d.type.includes('InMaterial')).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Disruption List by Part */}
        <div className="space-y-6">
          {Object.entries(disruptionsByPart).map(([partId, partData]) => (
            <div key={partId} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Part Header */}
              <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {partData.partName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Customer: {partData.customerName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Disruption</p>
                    <p className="text-xl font-bold text-red-600 dark:text-red-400">
                      {partData.disruptions.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Disruption Items */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {partData.disruptions.map((disruption, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${getTypeColor(disruption.type)}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(disruption.type)}
                          <span className="font-medium">{getTypeLabel(disruption.type)}</span>
                        </div>
                        <span className="text-lg font-bold text-red-600 dark:text-red-400">
                          {disruption.value.toFixed(0)}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 dark:text-gray-400">Hari:</span>
                          <span className="font-medium">{getDayName(disruption.day)} {disruption.day}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 dark:text-gray-400">Shift:</span>
                          <span className="font-medium">Shift {disruption.shift}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 dark:text-gray-400">Field:</span>
                          <span className="font-medium">{disruption.fieldName}</span>
                        </div>
                      </div>

                      {/* Navigation Button */}
                                              <button
                          onClick={() => handleNavigateToField(disruption)}
                          className="mt-3 w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-medium py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                          title={`Klik untuk navigasi ke field "${disruption.fieldName}"`}
                        >
                        <Navigation className="w-4 h-4" />
                        Navigate ke Field
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisruptionPage;
