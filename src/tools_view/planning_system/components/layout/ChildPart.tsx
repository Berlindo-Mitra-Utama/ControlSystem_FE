import React, { useState, useEffect } from "react";
import { Edit, Trash2, Calendar, Save, X } from "lucide-react";

interface ChildPartFormProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (data: {
    partName: string;
    customerName: string;
    stock: number | null;
  }) => void;
  onEdit?: (data: {
    partName: string;
    customerName: string;
    stock: number | null;
  }) => void;
  onDelete?: () => void;
  initialData?: {
    partName: string;
    customerName: string;
    stock: number | null;
  };
  isEditMode?: boolean;
}

const ChildPart: React.FC<ChildPartFormProps> = ({
  isOpen,
  onClose,
  onGenerate,
  onEdit,
  onDelete,
  initialData,
  isEditMode = false,
}) => {
  const [partName, setPartName] = useState(initialData?.partName || "");
  const [customerName, setCustomerName] = useState(
    initialData?.customerName || "",
  );
  const [stock, setStock] = useState<number | null>(initialData?.stock || null);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (initialData) {
      setPartName(initialData.partName);
      setCustomerName(initialData.customerName);
      setStock(initialData.stock);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partName || !customerName) {
      setError("Semua field wajib diisi");
      return;
    }
    setError("");

    if (isEditMode && onEdit) {
      onEdit({ partName, customerName, stock });
    } else {
      onGenerate({ partName, customerName, stock });
    }

    onClose();
    resetForm();
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
    setShowDeleteConfirm(false);
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setPartName("");
    setCustomerName("");
    setStock(null);
    setError("");
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md relative border border-gray-200 dark:border-gray-800 animate-fadeInUp overflow-y-auto"
        style={{ maxWidth: "400px", maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-3 right-3 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 text-xl font-bold z-10"
          onClick={onClose}
          aria-label="Tutup"
        >
          ×
        </button>
        <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-5">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isEditMode ? "Edit Material Child Part" : "Material Child Part"}
            </h2>
          </div>

          <div>
            <label className="block text-gray-700 dark:text-slate-300 font-medium mb-1">
              Nama Part
            </label>
            <input
              type="text"
              value={partName}
              onChange={(e) => setPartName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Masukkan nama part"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-slate-300 font-medium mb-1">
              Nama Customer
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Masukkan nama customer"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-slate-300 font-medium mb-1">
              Stock Tersedia (pcs)
            </label>
            <input
              type="number"
              min={0}
              value={stock === null ? "" : stock}
              onChange={(e) =>
                setStock(e.target.value === "" ? null : Number(e.target.value))
              }
              className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Masukkan jumlah stock"
            />
          </div>
          {error && (
            <div className="text-red-500 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 mt-2">
            {isEditMode && onDelete && (
              <button
                type="button"
                onClick={() => {
                  // Delegasikan konfirmasi ke parent agar hanya ada satu modal
                  onDelete();
                }}
                className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Hapus
              </button>
            )}
            <button
              type="submit"
              className={`py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center gap-2 ${isEditMode && onDelete ? "flex-1" : "w-full"}`}
            >
              {isEditMode ? (
                <>
                  <Save className="w-4 h-4" />
                  Simpan Perubahan
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  Generate Tabel Jadwal
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Modal konfirmasi hapus dihapus, gunakan modal global dari parent */}
    </div>
  );
};

export default ChildPart;
