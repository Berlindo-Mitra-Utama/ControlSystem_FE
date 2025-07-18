import React from "react";
import { ScheduleItem } from "../../types/scheduleTypes";

interface EditableFieldProps {
  label: string;
  value: string | number | undefined;
  field: keyof ScheduleItem;
  type?: string;
  step?: number;
  placeholder?: string;
  unit?: string;
  editingRow: string | null;
  editForm: Partial<ScheduleItem>;
  setEditForm: React.Dispatch<React.SetStateAction<Partial<ScheduleItem>>>;
}

const EditableField: React.FC<EditableFieldProps> = ({
  label,
  value,
  field,
  type = "text",
  step,
  placeholder,
  unit = "",
  editingRow,
  editForm,
  setEditForm,
}) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-slate-300">{label}</label>
    {editingRow ? (
      <input
        type={type}
        step={step}
        value={
          editForm[field] !== undefined ? editForm[field] : (value ?? "")
        }
        onChange={(e) => {
          const val =
            type === "number"
              ? (step
                  ? Number.parseFloat(e.target.value)
                  : Number.parseInt(e.target.value)) || 0
              : e.target.value;
          setEditForm((prev) => ({ ...prev, [field]: val }));
        }}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    ) : (
      <div className="px-3 py-2 bg-slate-900/50 rounded-lg text-white font-mono">
        {typeof value === "number"
          ? value.toLocaleString("id-ID")
          : value || "-"}
        {unit && <span className="text-slate-400 ml-1">{unit}</span>}
      </div>
    )}
  </div>
);

export default EditableField;