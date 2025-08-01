import React from "react";
import { ScheduleItem } from "../../types/scheduleTypes";

interface ManpowerDropdownProps {
  shift: ScheduleItem;
  manpowerList: { id: number; name: string }[];
  tempManpowerSelection: { [key: string]: number[] };
  setTempManpowerSelection: React.Dispatch<
    React.SetStateAction<{ [key: string]: number[] }>
  >;
  setFocusedInputs: React.Dispatch<
    React.SetStateAction<{ [key: string]: boolean }>
  >;
  setEditForm?: React.Dispatch<React.SetStateAction<Partial<ScheduleItem>>>;
  onDataChange?: (updatedRows: ScheduleItem[]) => void;
  flatRows: ScheduleItem[];
  uiColors: any;
  setManpowerError: React.Dispatch<React.SetStateAction<string>>;
}

const ManpowerDropdown: React.FC<ManpowerDropdownProps> = ({
  shift,
  manpowerList,
  tempManpowerSelection,
  setTempManpowerSelection,
  setFocusedInputs,
  setEditForm,
  onDataChange,
  flatRows,
  uiColors,
  setManpowerError,
}) => {
  const currentSelection = tempManpowerSelection[shift.id] ||
    shift.manpowerIds || [1, 2, 3];

  const handleManpowerChange = (mpId: number, checked: boolean) => {
    let newIds = [...currentSelection];

    if (checked) {
      if (newIds.length < 6) {
        newIds = [...newIds, mpId];
      }
    } else {
      newIds = newIds.filter((id) => id !== mpId);
    }

    setTempManpowerSelection((prev) => ({
      ...prev,
      [shift.id]: newIds,
    }));
  };

  const handleCancel = () => {
    setFocusedInputs((prev) => ({
      ...prev,
      [`${shift.id}-manpowerDropdown`]: false,
    }));
    // Reset temporary selection
    setTempManpowerSelection((prev) => ({
      ...prev,
      [shift.id]: undefined,
    }));
  };

  const handleConfirm = () => {
    const selectedIds = tempManpowerSelection[shift.id] ||
      shift.manpowerIds || [1, 2, 3];
    shift.manpowerIds = selectedIds;

    if (setEditForm) {
      setEditForm((prev) => ({
        ...prev,
        manpowerIds: selectedIds,
      }));
    }

    if (onDataChange) {
      onDataChange([...flatRows]);
    }

    setFocusedInputs((prev) => ({
      ...prev,
      [`${shift.id}-manpowerDropdown`]: false,
    }));
  };

  return (
    <div className="relative w-full manpower-dropdown">
      <button
        type="button"
        className="w-full bg-transparent border-none text-center focus:outline-none flex items-center justify-center gap-2 px-2 py-1 rounded-lg border border-slate-400 manpower-dropdown"
        onClick={() => {
          if (manpowerList.length === 0) {
            setManpowerError("Silakan tambahkan manpower terlebih dahulu");
            return;
          }
          setFocusedInputs((prev) => ({
            ...prev,
            [`${shift.id}-manpowerDropdown`]:
              !prev[`${shift.id}-manpowerDropdown`],
          }));
        }}
      >
        {shift.manpowerIds && shift.manpowerIds.length > 0
          ? shift.manpowerIds.length.toString()
          : "3"}
        <span className="ml-2">▼</span>
      </button>

      {tempManpowerSelection[shift.id] !== undefined && (
        <div
          className={`absolute z-20 min-w-max max-w-xs ${uiColors.bg.tertiary} border border-slate-400 rounded-lg mt-1 shadow-xl manpower-dropdown`}
        >
          {/* Header */}
          <div
            className={`${uiColors.bg.secondary} px-3 py-2 ${uiColors.border.secondary}`}
          >
            <h4 className={`${uiColors.text.primary} font-semibold text-sm`}>
              Pilih Manpower
            </h4>
          </div>

          {/* Manpower List */}
          <div className="p-2">
            {manpowerList.length === 0 ? (
              <div className="text-center py-4">
                <div className={`${uiColors.text.tertiary} text-sm`}>
                  Belum ada manpower
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {manpowerList
                  .filter((mp) => mp && mp.id && mp.name)
                  .map((mp) => (
                    <label
                      key={mp.id}
                      className="flex items-center px-2 py-2 hover:bg-blue-800/50 cursor-pointer rounded transition-colors duration-200"
                    >
                      <input
                        type="checkbox"
                        checked={currentSelection.includes(mp.id)}
                        disabled={
                          currentSelection.length >= 6 &&
                          !currentSelection.includes(mp.id)
                        }
                        onChange={(e) =>
                          handleManpowerChange(mp.id, e.target.checked)
                        }
                        className="mr-2 w-4 h-4 text-blue-600 bg-slate-800 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-blue-100 text-sm">
                        {mp.id}. {mp.name}
                      </span>
                    </label>
                  ))}
              </div>
            )}
          </div>

          {/* Footer dengan Button */}
          <div
            className={`${uiColors.bg.secondary} px-3 py-2 ${uiColors.border.secondary}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`${uiColors.text.tertiary} text-xs`}>
                {currentSelection.length} terpilih
              </div>
              <div className="text-slate-400 text-xs">Max: 6</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-1 px-3 rounded text-xs font-medium transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded text-xs font-semibold transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {shift.manpowerIds && shift.manpowerIds.length > 6 && (
        <div className="text-red-400 text-xs mt-1">
          Maksimal 6 manpower per shift.
        </div>
      )}
    </div>
  );
};

export default ManpowerDropdown;
