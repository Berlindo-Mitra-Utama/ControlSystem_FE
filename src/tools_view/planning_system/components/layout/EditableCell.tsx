import React from "react";

interface EditableCellProps {
  value: string | number;
  field: string;
  rowId: string;
  isFocused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onChange: (rowId: string, field: string, value: string) => void;
  textColor: string;
  step?: string;
  min?: string;
}

const EditableCell: React.FC<EditableCellProps> = ({
  value,
  field,
  rowId,
  isFocused,
  onFocus,
  onBlur,
  onChange,
  textColor,
  step = "1",
  min = "0",
}) => {
  return (
    <input
      type="number"
      value={
        isFocused
          ? value || ""
          : field === "jamProduksiAktual"
            ? Number(value).toFixed(1)
            : value || 0
      }
      onChange={(e) => onChange(rowId, field, e.target.value)}
      onFocus={onFocus}
      onBlur={onBlur}
      className={`w-full bg-transparent border-none text-center focus:outline-none focus:ring-2 focus:ring-blue-400 rounded px-2 py-1 ${textColor} font-mono text-sm font-semibold`}
      placeholder=""
      min={min}
      step={step}
    />
  );
};

export default EditableCell;
