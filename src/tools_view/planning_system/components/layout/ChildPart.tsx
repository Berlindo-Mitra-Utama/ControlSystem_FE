import React, { useState } from "react";

interface ChildPartFormProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (data: { partName: string; customerName: string; stock: number | null }) => void;
}

const ChildPart: React.FC<ChildPartFormProps> = ({ isOpen, onClose, onGenerate }) => {
  const [partName, setPartName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [stock, setStock] = useState<number | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partName || !customerName) {
      setError("Semua field wajib diisi");
      return;
    }
    setError("");
    onGenerate({ partName, customerName, stock });
    onClose();
    setPartName("");
    setCustomerName("");
    setStock(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4" onClick={onClose}>
      <div
        className="bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md relative border border-gray-800 animate-fadeInUp overflow-y-auto"
        style={{ maxWidth: "400px", maxHeight: "90vh" }}
        onClick={e => e.stopPropagation()}
      >
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-red-400 text-xl font-bold z-10"
          onClick={onClose}
          aria-label="Tutup"
        >
          ×
        </button>
        <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-5">
          <h2 className="text-xl font-bold text-white mb-2">Material Child Part</h2>
          <div>
            <label className="block text-slate-300 font-medium mb-1">Nama Part</label>
            <input
              type="text"
              value={partName}
              onChange={e => setPartName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Masukkan nama part"
              required
            />
          </div>
          <div>
            <label className="block text-slate-300 font-medium mb-1">Nama Customer</label>
            <input
              type="text"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Masukkan nama customer"
              required
            />
          </div>
          <div>
            <label className="block text-slate-300 font-medium mb-1">Stock Tersedia (pcs)</label>
            <input
              type="number"
              min={0}
              value={stock === null ? "" : stock}
              onChange={e => setStock(e.target.value === "" ? null : Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Masukkan jumlah stock"
            />
          </div>
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 mt-2"
          >
            Generate Tabel Jadwal
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChildPart; 