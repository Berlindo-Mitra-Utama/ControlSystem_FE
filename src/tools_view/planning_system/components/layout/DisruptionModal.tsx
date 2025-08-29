import React, { useState, useEffect } from "react";
import { AlertTriangle, X, Package, TrendingDown, Navigation } from "lucide-react";
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

interface DisruptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  disruptions: DisruptionItem[];
  partName: string;
  customerName: string;
  onNavigateToField?: (disruption: DisruptionItem) => void;
}

const DisruptionModal: React.FC<DisruptionModalProps> = ({
  isOpen,
  onClose,
  disruptions,
  partName,
  customerName,
  onNavigateToField
}) => {
  const { uiColors } = useTheme();

  if (!isOpen) return null;

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

  const getShiftLabel = (shift: number) => {
    return `Shift ${shift}`;
  };

  const handleNavigateToField = (disruption: DisruptionItem) => {
    if (onNavigateToField) {
      onNavigateToField(disruption);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className={`${uiColors.bg.modal} rounded-2xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${uiColors.text.primary}`}>
                Disruption Analysis
              </h2>
              <p className={`text-sm ${uiColors.text.secondary}`}>
                {partName} - {customerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${uiColors.button.secondary.bg} ${uiColors.button.secondary.hover} ${uiColors.button.secondary.text} transition-all duration-200`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {disruptions.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className={`text-lg font-semibold ${uiColors.text.primary} mb-2`}>
                Tidak Ada Disruption
              </h3>
              <p className={`${uiColors.text.secondary}`}>
                Semua data rencana dan aktual sesuai dengan target.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  <span className="font-semibold text-yellow-800 dark:text-yellow-200">
                    Total Disruption: {disruptions.length}
                  </span>
                </div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Ditemukan {disruptions.length} item yang memiliki perbedaan antara rencana dan aktual.
                </p>
              </div>

              <div className="grid gap-4">
                {disruptions.map((disruption, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${uiColors.border.primary} ${uiColors.bg.card}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getTypeColor(disruption.type)}`}>
                          {getTypeIcon(disruption.type)}
                        </div>
                        <div>
                          <h4 className={`font-semibold ${uiColors.text.primary}`}>
                            {getTypeLabel(disruption.type)}
                          </h4>
                          <p className={`text-sm ${uiColors.text.secondary}`}>
                            {getDayName(disruption.day)} - {getShiftLabel(disruption.shift)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${uiColors.text.primary}`}>
                          {disruption.value.toLocaleString()}
                        </div>
                        <div className={`text-sm ${uiColors.text.secondary}`}>
                          {disruption.fieldName}
                        </div>
                      </div>
                    </div>
                    
                    {/* Navigate Button */}
                    <div className="flex justify-end mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <button
                        onClick={() => handleNavigateToField(disruption)}
                        className={`px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 flex items-center gap-2 text-sm font-medium`}
                        title="Navigate to Field"
                      >
                        <Navigation className="w-4 h-4" />
                        Navigate to Field
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className={`px-6 py-2 rounded-lg ${uiColors.button.secondary.bg} ${uiColors.button.secondary.hover} ${uiColors.button.secondary.text} ${uiColors.button.secondary.border} transition-all duration-200`}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default DisruptionModal;
