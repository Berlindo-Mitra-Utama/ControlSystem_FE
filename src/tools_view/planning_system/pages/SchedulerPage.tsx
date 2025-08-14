import { useState, useEffect } from "react";
import ProductionForm from "../components/layout/ProductionForm";
import ScheduleTable from "../components/layout/ScheduleProduction";
import React from "react";
import { useSchedule } from "../contexts/ScheduleContext";
import type { SavedSchedule } from "../contexts/ScheduleContext";
import { useNavigate } from "react-router-dom";
import Modal from "../components/ui/Modal";
import { useNotification } from "../../../hooks/useNotification";
import ChildPart from "../components/layout/ChildPart";
import ChildPartTable from "../components/layout/ChildPartTable";
import ChildPartCardView from "../components/layout/ChildPartCardView";
import ViewModeToggle from "../components/layout/ViewModeToggle";
import { useTheme } from "../../contexts/ThemeContext";
import { X } from "lucide-react";
import {
  PlanningSystemService,
  ProductPlanningData,
  ProductionService,
  ProductInfo,
  ChildPartService,
  RencanaChildPartService,
} from "../../../services/API_Services";
import {
  generateScheduleFromForm,
  recalculateScheduleWithChanges,
  updateCalculatedFields,
  handleFormChange,
  handlePartSelection,
  resetFormAndSchedule,
} from "../utils/scheduleCalcUtils";
import {
  MONTHS,
  mockData,
  getScheduleName,
  parseScheduleName,
} from "../utils/scheduleDateUtils";
import { ScheduleItem } from "../types/scheduleTypes";
import { ChildPartData } from "../types/childPartTypes";
import { BarChart2, Package, Layers, Target, Factory } from "lucide-react";

// CSS untuk animasi dan custom scrollbar
const fadeInUpAnimation = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }

  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(51, 65, 85, 0.3);
    border-radius: 3px;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #3b82f6, #1d4ed8);
    border-radius: 3px;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #2563eb, #1e40af);
  }

  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #3b82f6 rgba(51, 65, 85, 0.3);
  }

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(-10px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .submenu-enter {
    animation: slideInRight 0.2s ease-out;
  }

  .menu-item-hover {
    transition: all 0.2s ease-in-out;
  }

  .menu-item-hover:hover {
    transform: translateX(4px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  }
`;

// Inject CSS menggunakan useEffect
const injectCSS = () => {
  if (typeof document !== "undefined") {
    const existingStyle = document.getElementById("fadeInUp-animation");
    if (!existingStyle) {
      const style = document.createElement("style");
      style.id = "fadeInUp-animation";
      style.textContent = fadeInUpAnimation;
      document.head.appendChild(style);
    }
  }
};

interface DataItem {
  part: string;
  customer: string;
  timePerPcs: number;
  cycle1: number;
  cycle7: number;
  cycle35: number;
}

interface SchedulerPageProps {
  savedSchedules: SavedSchedule[];
  setSavedSchedules: React.Dispatch<React.SetStateAction<SavedSchedule[]>>;
  setCurrentView: (view: "dashboard" | "scheduler" | "saved") => void;
  loadedSchedule?: SavedSchedule | null;
}

const SchedulerPage: React.FC = () => {
  const {
    savedSchedules,
    setSavedSchedules,
    loadedSchedule,
    checkExistingSchedule,
    updateSchedule,
  } = useSchedule();
  const navigate = useNavigate();
  const { uiColors } = useTheme();
  const {
    notification,
    hideNotification,
    showAlert,
    showSuccess,
    showConfirm,
  } = useNotification();

  // Inject CSS untuk animasi
  useEffect(() => {
    injectCSS();
  }, []);

  const [form, setForm] = useState({
    part: "",
    customer: "",
    timePerPcs: 257,
    cycle1: 0,
    cycle7: 0,
    cycle35: 0,
    stock: 332,
    planningHour: 274,
    overtimeHour: 119,
    planningPcs: 3838,
    overtimePcs: 1672,
    isManualPlanningPcs: false,
    manpowers: [],
  });

  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [showProductionForm, setShowProductionForm] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [manpowerList, setManpowerList] = useState<
    { id: number; name: string }[]
  >([]);

  const [editForm, setEditForm] = useState<Partial<ScheduleItem>>({});

  // Date picker states
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [searchDate, setSearchDate] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [showSavedScheduleModal, setShowSavedScheduleModal] = useState(false);
  const [tempSelectedMonth, setTempSelectedMonth] = useState(
    new Date().getMonth(),
  );
  const [tempSelectedYear, setTempSelectedYear] = useState(
    new Date().getFullYear(),
  );
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [showChildPartModal, setShowChildPartModal] = useState(false);
  const [childParts, setChildParts] = useState<ChildPartData[]>([]);
  const [childPartCarouselIdx, setChildPartCarouselIdx] = useState(0);
  const [childPartSearch, setChildPartSearch] = useState("");
  // Ganti childPartFilter menjadi array of string (nama part), 'all' untuk semua
  const [childPartFilter, setChildPartFilter] = useState<"all" | string[]>(
    "all",
  );
  // State untuk tracking perubahan child part
  const [childPartChanges, setChildPartChanges] = useState<Set<number>>(
    new Set(),
  );
  const [hasUnsavedChildPartChanges, setHasUnsavedChildPartChanges] =
    useState(false);

  // State untuk tracking perubahan schedule
  const [hasScheduleChanges, setHasScheduleChanges] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState<boolean>(false);
  const [showPartFilterDropdown, setShowPartFilterDropdown] =
    useState<boolean>(false);
  const [childPartCarouselPage, setChildPartCarouselPage] = useState(0);
  const CHILD_PARTS_PER_PAGE = 2;
  const [editChildPartIdx, setEditChildPartIdx] = useState<number | null>(null);
  const [activeChildPartTableFilter, setActiveChildPartTableFilter] = useState<
    string[]
  >([]);
  // Tambahkan state untuk mobile detection:
  const [isMobile, setIsMobile] = useState(false);
  // Add state for delete confirmation modal (after other state declarations)
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deleteTargetIndex, setDeleteTargetIndex] = useState<number | null>(
    null,
  );

  // Temporary filter states for selection before applying
  const [tempChildPartFilter, setTempChildPartFilter] = useState<
    "all" | string[]
  >("all");
  const [tempActiveChildPartTableFilter, setTempActiveChildPartTableFilter] =
    useState<string[]>([]);

  // State untuk informasi produk
  const [productInfo, setProductInfo] = useState<{
    partName: string;
    customer: string;
    lastSavedBy?: {
      nama: string;
      role: string;
    };
    lastSavedAt?: string;
  }>({
    partName: "",
    customer: "",
    lastSavedBy: undefined,
    lastSavedAt: undefined,
  });

  // Tambahkan useEffect untuk detect mobile dan set viewMode sesuai dengan device:
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth < 640;
      setIsMobile(isMobileDevice);

      // Set viewMode berdasarkan device
      if (isMobileDevice) {
        setViewMode("cards");
      } else {
        setViewMode("table");
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showDropdown && !target.closest(".dropdown-container")) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  // Close part filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showPartFilterDropdown && !target.closest(".part-filter-dropdown")) {
        setShowPartFilterDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPartFilterDropdown]);

  // Close data filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showFilterDropdown && !target.closest(".data-filter-dropdown")) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilterDropdown]);

  // Generate schedule name from selected month/year
  const getCurrentScheduleName = () => {
    return getScheduleName(selectedMonth, selectedYear);
  };

  // Automatically load schedule if loadedSchedule prop changes
  useEffect(() => {
    if (loadedSchedule) {
      setForm(loadedSchedule.form);
      setScheduleWithTracking(loadedSchedule.schedule);
      if (loadedSchedule.childParts) {
        setChildParts(loadedSchedule.childParts);
      }

      // Update product info dari loaded schedule
      if (loadedSchedule.productInfo) {
        setProductInfo({
          partName: loadedSchedule.productInfo.partName || "",
          customer: loadedSchedule.productInfo.customer || "",
          lastSavedBy: loadedSchedule.productInfo.lastSavedBy,
          lastSavedAt: loadedSchedule.productInfo.lastSavedAt,
        });
      } else {
        // Fallback ke informasi dari form
        setProductInfo({
          partName: loadedSchedule.form.part || "",
          customer: loadedSchedule.form.customer || "",
          lastSavedBy: undefined,
          lastSavedAt: undefined,
        });
      }

      const scheduleName = loadedSchedule.name;

      // Parse the schedule name to get month and year
      for (let i = 0; i < MONTHS.length; i++) {
        if (scheduleName.includes(MONTHS[i])) {
          setSelectedMonth(i);

          // Extract year using regex
          const yearMatch = scheduleName.match(/(\d{4})/);
          if (yearMatch && yearMatch[1]) {
            setSelectedYear(parseInt(yearMatch[1]));
          }
          break;
        }
      }
    }
  }, [loadedSchedule]);

  useEffect(() => {
    doUpdateCalculatedFields();
  }, [form.timePerPcs, form.planningHour, form.overtimeHour]);

  // Update informasi produk ketika part atau customer berubah
  useEffect(() => {
    updateProductInfo();
  }, [form.part, form.customer]);

  // Helper function untuk mendapatkan token dari localStorage
  const getAuthToken = () => {
    try {
      const currentUser = localStorage.getItem("currentUser");
      console.log(
        "🔍 Checking localStorage for currentUser:",
        currentUser ? "Found" : "Not found",
      );

      if (currentUser) {
        const userData = JSON.parse(currentUser);
        console.log("👤 Parsed user data:", {
          username: userData.username,
          nama: userData.nama,
          role: userData.role,
          hasAccessToken: !!userData.accessToken,
        });

        if (userData.accessToken) {
          console.log(
            "✅ Token found:",
            userData.accessToken.substring(0, 20) + "...",
          );
          return userData.accessToken;
        } else {
          console.log("❌ No accessToken found in user data");
          return null;
        }
      }

      console.log("❌ No currentUser found in localStorage");
      return null;
    } catch (error) {
      console.error("❌ Error parsing currentUser from localStorage:", error);
      return null;
    }
  };

  // Load manpowerList saat komponen dimount
  useEffect(() => {
    const loadManpowerList = async () => {
      try {
        console.log("🔄 Loading manpower list...");
        // Cek apakah user sudah login
        const token = getAuthToken();
        if (!token) {
          console.log("❌ User belum login, menggunakan data lokal");
          setManpowerList([]);
          return;
        }

        console.log("✅ User sudah login, mencoba load dari backend...");

        const { ManpowerService } = await import(
          "../../../services/API_Services"
        );
        const response = await ManpowerService.getActiveManpower();
        setManpowerList(response || []);
      } catch (error) {
        console.error("Error loading manpower list:", error);
        // Fallback ke array kosong jika backend tidak tersedia
        setManpowerList([]);
        // Tampilkan notifikasi hanya jika bukan error koneksi atau auth
        if (
          error.message &&
          !error.message.includes("ERR_CONNECTION_REFUSED") &&
          !error.message.includes("Token tidak ada")
        ) {
          showAlert("Gagal mengambil data manpower dari server", "Peringatan");
        }
      }
    };

    loadManpowerList();
  }, []);

  // Load child parts dari backend saat komponen dimount
  useEffect(() => {
    const loadChildParts = async () => {
      try {
        // Cek apakah user sudah login
        const token = getAuthToken();
        if (!token) {
          console.log("User belum login, menggunakan data lokal");
          return;
        }

        const { ChildPartService, RencanaChildPartService } = await import(
          "../../../services/API_Services"
        );
        const response = await ChildPartService.getAllChildParts();

        if (response && response.length > 0) {
          // Konversi data dari backend ke format yang sesuai dengan frontend
          const convertedChildParts: ChildPartData[] = response.map(
            (item: any) => ({
              id: item.id,
              partName: item.partName,
              customerName: item.customerName,
              stock: item.stockAvailable,
              inMaterial: Array.from({ length: 30 }, () => [null, null]),
              aktualInMaterial: Array.from({ length: 30 }, () => [null, null]),
            }),
          );

          // Load rencana data untuk setiap child part
          for (let i = 0; i < convertedChildParts.length; i++) {
            const childPart = convertedChildParts[i];
            if (childPart.id) {
              try {
                // Coba load rencana data untuk bulan dan tahun saat ini
                const currentMonth = new Date().getMonth() + 1;
                const currentYear = new Date().getFullYear();
                const rencanaResponse =
                  await RencanaChildPartService.getRencanaChildPartByBulanTahun(
                    currentMonth,
                    currentYear,
                  );

                if (rencanaResponse && rencanaResponse.length > 0) {
                  const rencanaForThisPart = rencanaResponse.find(
                    (r: any) => r.childPartId === childPart.id,
                  );

                  if (rencanaForThisPart) {
                    convertedChildParts[i].inMaterial =
                      rencanaForThisPart.rencanaInMaterial ||
                      Array.from({ length: 30 }, () => [null, null]);
                    convertedChildParts[i].aktualInMaterial =
                      rencanaForThisPart.aktualInMaterial ||
                      Array.from({ length: 30 }, () => [null, null]);
                  }
                }
              } catch (rencanaError) {
                console.error(
                  `Error loading rencana data for child part ${childPart.id}:`,
                  rencanaError,
                );
                // Gunakan default values jika gagal load rencana data
              }
            }
          }

          setChildParts(convertedChildParts);
          console.log(
            "Child parts dan rencana data berhasil dimuat dari database:",
            convertedChildParts,
          );
        }
      } catch (error) {
        console.error("Error loading child parts:", error);
        // Fallback ke data lokal jika backend tidak tersedia
        // Tidak perlu showAlert karena ini bukan error kritis
      }
    };

    loadChildParts();
  }, []);

  // Event listeners untuk komunikasi dengan ScheduleProduction
  useEffect(() => {
    const handleAddManpowerEvent = (event: CustomEvent) => {
      const { name } = event.detail;
      addManPower(name);
    };

    const handleRemoveManpowerEvent = (event: CustomEvent) => {
      const { name } = event.detail;
      removeManPower(name);
    };

    window.addEventListener(
      "addManpower",
      handleAddManpowerEvent as EventListener,
    );
    window.addEventListener(
      "removeManpower",
      handleRemoveManpowerEvent as EventListener,
    );

    return () => {
      window.removeEventListener(
        "addManpower",
        handleAddManpowerEvent as EventListener,
      );
      window.removeEventListener(
        "removeManpower",
        handleRemoveManpowerEvent as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    if (
      form.isManualPlanningPcs &&
      form.timePerPcs > 0 &&
      form.planningPcs > 0
    ) {
      const calculatedPlanningHour =
        (form.planningPcs * form.timePerPcs) / 3600;
      setForm((prev) => ({
        ...prev,
        planningHour: Number.parseFloat(calculatedPlanningHour.toFixed(2)),
      }));
    }
  }, [form.planningPcs, form.isManualPlanningPcs]);

  const doUpdateCalculatedFields = () => {
    const calculatedFields = updateCalculatedFields(form);
    if (calculatedFields && typeof calculatedFields === "object") {
      setForm((prev) => ({
        ...prev,
        ...calculatedFields,
      }));
    }
  };

  const handleSelectPart = (e: React.ChangeEvent<HTMLSelectElement>) => {
    handlePartSelection(e, mockData, setForm);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    handleFormChange(e, form, setForm);
  };

  // Fungsi untuk mengupdate informasi produk
  const updateProductInfo = () => {
    setProductInfo({
      partName: form.part || "",
      customer: form.customer || "",
      lastSavedBy: productInfo?.lastSavedBy, // Pertahankan lastSavedBy yang sudah ada
      lastSavedAt: productInfo?.lastSavedAt, // Pertahankan lastSavedAt yang sudah ada
    });
  };

  // Handler untuk manpowers (add/remove)
  const addManPower = async (name: string) => {
    try {
      // Cek apakah user sudah login
      const token = getAuthToken();
      if (!token) {
        // Jika belum login, simpan hanya ke state lokal
        setForm((prev) => ({
          ...prev,
          manpowers: [...(prev.manpowers || []), name],
        }));
        setManpowerList((prev) => [
          ...prev,
          { id: Date.now(), name, createdBy: "System" },
        ]);
        showSuccess(`${name} berhasil ditambahkan (lokal)!`);
        return;
      }

      // Simpan ke backend menggunakan global manpower endpoint
      const { ManpowerService } = await import(
        "../../../services/API_Services"
      );
      const response = await ManpowerService.createManpowerTest({
        name: name.trim(),
      });

      // Update state lokal
      setForm((prev) => ({
        ...prev,
        manpowers: [...(prev.manpowers || []), name],
      }));

      // Refresh manpowerList dari backend
      const manpowerResponse = await ManpowerService.getActiveManpowerTest();
      setManpowerList(manpowerResponse || []);

      console.log("Manpower berhasil ditambahkan:", response);
      showSuccess(`${name} berhasil ditambahkan!`);
    } catch (error) {
      console.error("Error adding manpower:", error);
      // Fallback ke state lokal jika backend gagal
      setForm((prev) => ({
        ...prev,
        manpowers: [...(prev.manpowers || []), name],
      }));

      // Tampilkan notifikasi yang berbeda berdasarkan jenis error
      if (error.message && error.message.includes("ERR_CONNECTION_REFUSED")) {
        showAlert("Server tidak tersedia, data disimpan lokal", "Peringatan");
      } else if (error.message && error.message.includes("Token tidak ada")) {
        showAlert(
          "Silakan login terlebih dahulu, data disimpan lokal",
          "Peringatan",
        );
      } else {
        showAlert(
          "Gagal menyimpan ke database, data disimpan lokal",
          "Peringatan",
        );
      }
    }
  };
  const removeManPower = async (name: string) => {
    try {
      // Cek apakah user sudah login
      const token = getAuthToken();
      if (!token) {
        // Jika belum login, hapus hanya dari state lokal
        setForm((prev) => ({
          ...prev,
          manpowers: (prev.manpowers || []).filter((mp) => mp !== name),
        }));
        setManpowerList((prev) => prev.filter((mp) => mp.name !== name));
        showSuccess(`${name} berhasil dihapus (lokal)!`);
        return;
      }

      // Cari ID manpower berdasarkan nama
      const manpowerToDelete = manpowerList.find((mp) => mp.name === name);
      if (!manpowerToDelete) {
        throw new Error("Manpower tidak ditemukan");
      }

      // Hapus dari backend menggunakan global manpower endpoint
      const { ManpowerService } = await import(
        "../../../services/API_Services"
      );
      await ManpowerService.deleteManpowerTest(manpowerToDelete.id);

      // Update state lokal
      setForm((prev) => ({
        ...prev,
        manpowers: (prev.manpowers || []).filter((mp) => mp !== name),
      }));

      // Refresh manpowerList dari backend
      const manpowerResponse = await ManpowerService.getActiveManpowerTest();
      setManpowerList(manpowerResponse || []);

      console.log("Manpower berhasil dihapus:", name);
      showSuccess(`${name} berhasil dihapus!`);
    } catch (error) {
      console.error("Error removing manpower:", error);
      // Fallback ke state lokal jika backend gagal
      setForm((prev) => ({
        ...prev,
        manpowers: (prev.manpowers || []).filter((mp) => mp !== name),
      }));

      // Tampilkan notifikasi yang berbeda berdasarkan jenis error
      if (error.message && error.message.includes("ERR_CONNECTION_REFUSED")) {
        showAlert("Server tidak tersedia, data dihapus lokal", "Peringatan");
      } else if (error.message && error.message.includes("Token tidak ada")) {
        showAlert(
          "Silakan login terlebih dahulu, data dihapus lokal",
          "Peringatan",
        );
      } else {
        showAlert(
          "Gagal menghapus dari database, data dihapus lokal",
          "Peringatan",
        );
      }
    }
  };

  const generateSchedule = async () => {
    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Generate schedule hanya di frontend, tidak perlu backend
    const newSchedule = generateScheduleFromForm(form, schedule);
    setScheduleWithTracking(newSchedule);
    setIsGenerating(false);
    setChildPartFilter("all"); // Reset filter ke Semua Child Part setiap generate
  };

  const recalculateSchedule = (updatedSchedule: ScheduleItem[]) => {
    const { timePerPcs } = form;
    let totalDisrupted = 0;

    const processedSchedule = updatedSchedule.map((item) => {
      if (item.status === "Gangguan") {
        const disrupted = item.pcs - (item.actualPcs || 0);
        totalDisrupted += disrupted;
        return item;
      }
      return item;
    });

    if (totalDisrupted <= 0) {
      setScheduleWithTracking(updatedSchedule);
      return;
    }

    const existingOvertimeIndex = processedSchedule.findIndex(
      (item) => item.day === 31 && item.type === "Lembur",
    );

    if (existingOvertimeIndex >= 0) {
      const updatedProcessedSchedule = [...processedSchedule];
      const existingOvertime = updatedProcessedSchedule[existingOvertimeIndex];
      const newPcs = existingOvertime.pcs + totalDisrupted;
      const newTime = ((newPcs * timePerPcs) / 60).toFixed(2);

      updatedProcessedSchedule[existingOvertimeIndex] = {
        ...existingOvertime,
        pcs: newPcs,
        actualPcs: newPcs,
        time: newTime,
        notes: "Lembur untuk memenuhi target produksi dan kompensasi gangguan",
      };

      setScheduleWithTracking(updatedProcessedSchedule);
    } else {
      const overtimeSeconds = totalDisrupted * timePerPcs;
      const overtimeMinutes = overtimeSeconds / 60;

      const overtimeSchedule: ScheduleItem = {
        id: `31-1`,
        day: 31,
        shift: "1",
        type: "Lembur",
        pcs: totalDisrupted,
        time: overtimeMinutes.toFixed(2),
        status: "Normal",
        actualPcs: totalDisrupted,
        notes: "Kompensasi gangguan produksi",
      };

      setScheduleWithTracking([...processedSchedule, overtimeSchedule]);
    }
  };

  const startEdit = (item: ScheduleItem) => {
    setEditingRow(item.id);
    setEditForm({
      status: item.status,
      actualPcs: item.actualPcs,
      notes: item.notes,
    });
  };

  const cancelEdit = () => {
    setEditingRow(null);
    setEditForm({});
  };

  const saveEdit = (itemId: string) => {
    // Ambil semua delivery terbaru dari tabel (termasuk editForm jika sedang diedit)
    const deliveryMap: { [key: string]: number } = {};
    schedule.forEach((item) => {
      if (item.id === itemId && editForm.delivery !== undefined) {
        deliveryMap[item.id] = editForm.delivery;
      } else if (item.delivery !== undefined) {
        deliveryMap[item.id] = item.delivery;
      }
    });

    // --- Detect planningPcs change and propagate selisih ---
    let changedPlanningDay: number | null = null;
    let changedPlanningShift: string | null = null;
    let planningDiff: number = 0;
    let oldPlanning: number | undefined = undefined;
    let newPlanning: number | undefined = undefined;
    // Find which row is being edited and if planningPcs changed
    const editedRow = schedule.find((item) => item.id === itemId);
    if (
      editedRow &&
      editForm.planningPcs !== undefined &&
      editForm.planningPcs !== editedRow.planningPcs
    ) {
      changedPlanningDay = editedRow.day;
      changedPlanningShift = editedRow.shift;
      oldPlanning = editedRow.planningPcs ?? 0;
      newPlanning = editForm.planningPcs;
      planningDiff = newPlanning - oldPlanning;
    }

    // Regenerasi schedule sesuai logika planning PCS, stock, shortfall, overtime
    const waktuKerjaShift = 7; // jam kerja per shift
    let timePerPcs = form.timePerPcs;
    const kapasitasShift = Math.floor((waktuKerjaShift * 3600) / timePerPcs);
    let sisaStock = form.stock;
    let shortfall = 0;
    let overtimeRows: ScheduleItem[] = [];
    const scheduleList: ScheduleItem[] = [];
    for (let d = 1; d <= 30; d++) {
      const idShift1 = `${d}-1`;
      const idShift2 = `${d}-2`;
      // Ambil delivery terbaru (shift 1 saja)
      let deliveryShift1 = deliveryMap[idShift1] ?? 0;
      let totalDelivery = deliveryShift1;
      // Kalkulasi planning PCS per shift
      let planningHariIni = Math.min(totalDelivery, sisaStock);
      let planningShift1 = Math.min(
        Math.floor(planningHariIni / 2),
        kapasitasShift,
        sisaStock,
      );
      sisaStock -= planningShift1;
      let planningShift2 = Math.min(
        planningHariIni - planningShift1,
        kapasitasShift,
        sisaStock,
      );
      sisaStock -= planningShift2;

      // --- If this is the edited row, override planningPcs and propagate selisih ---
      if (changedPlanningDay === d && changedPlanningShift === "1") {
        if (editForm.planningPcs !== undefined) {
          planningShift1 = editForm.planningPcs;
        }
      }
      if (changedPlanningDay === d && changedPlanningShift === "2") {
        if (editForm.planningPcs !== undefined) {
          planningShift2 = editForm.planningPcs;
        }
      }

      // --- Propagate selisih to next day's shift 1 ---
      if (
        changedPlanningDay !== null &&
        planningDiff !== 0 &&
        d === changedPlanningDay + 1
      ) {
        planningShift1 += planningDiff;
        // Clamp to non-negative
        if (planningShift1 < 0) planningShift1 = 0;
      }

      // Jika delivery > total produksi hari ini, shortfall
      let shortfallHariIni = totalDelivery - (planningShift1 + planningShift2);
      if (shortfallHariIni > 0) {
        shortfall += shortfallHariIni;
      }
      // Row shift 1
      const oldRow1 = schedule.find((r) => r.id === idShift1);
      // Hitung kekurangan produksi (shortfall hari ini)
      let notes1 =
        oldRow1 && typeof oldRow1.notes === "string" ? oldRow1.notes : "";
      if (shortfallHariIni > 0) {
        notes1 = `Kekurangan produksi hari ini: ${shortfallHariIni} pcs`;
      }
      scheduleList.push({
        ...(oldRow1 ? oldRow1 : {}),
        id: idShift1,
        day: d,
        shift: "1",
        type: "Produksi",
        pcs: planningShift1,
        time: "07:00-15:00",
        status:
          oldRow1 && typeof oldRow1.status === "string"
            ? oldRow1.status
            : "Normal",
        actualPcs:
          oldRow1 && typeof oldRow1.actualPcs === "number"
            ? oldRow1.actualPcs
            : undefined,
        delivery: deliveryShift1,
        planningPcs: planningShift1,
        overtimePcs: 0,
        notes: notes1,
        // Add selisih info for the edited row
        selisih:
          changedPlanningDay === d &&
          changedPlanningShift === "1" &&
          planningDiff !== 0
            ? planningDiff
            : undefined,
      });
      // Row shift 2
      const oldRow2 = schedule.find((r) => r.id === idShift2);
      // Untuk shift 2, kekurangan produksi hanya dicatat jika shortfallHariIni > 0
      let notes2 =
        oldRow2 && typeof oldRow2.notes === "string" ? oldRow2.notes : "";
      if (shortfallHariIni > 0) {
        notes2 = `Kekurangan produksi hari ini: ${shortfallHariIni} pcs`;
      }
      scheduleList.push({
        ...(oldRow2 ? oldRow2 : {}),
        id: idShift2,
        day: d,
        shift: "2",
        type: "Produksi",
        pcs: planningShift2,
        time: "15:00-23:00",
        status:
          oldRow2 && typeof oldRow2.status === "string"
            ? oldRow2.status
            : "Normal",
        actualPcs:
          oldRow2 && typeof oldRow2.actualPcs === "number"
            ? oldRow2.actualPcs
            : undefined,
        delivery: undefined,
        planningPcs: planningShift2,
        overtimePcs: 0,
        notes: notes2,
        selisih:
          changedPlanningDay === d &&
          changedPlanningShift === "2" &&
          planningDiff !== 0
            ? planningDiff
            : undefined,
      });
      // Setiap 3 hari, shortfall dijadwalkan sebagai lembur 2 hari kemudian
      if (d % 3 === 0 && shortfall > 0) {
        const lemburDay = d + 2;
        if (lemburDay <= 30) {
          overtimeRows.push({
            id: `${lemburDay}-OT`,
            day: lemburDay,
            shift: "-",
            type: "Lembur",
            pcs: shortfall,
            time: "-",
            status: "Normal",
            delivery: undefined,
            planningPcs: 0,
            overtimePcs: shortfall,
            notes: `Lembur dari shortfall hari ${d - 2} s/d ${d}`,
          });
          sisaStock -= shortfall;
        }
        shortfall = 0;
      }
    }
    // Gabungkan lembur ke schedule utama, urutkan berdasarkan hari
    const allRows = [...scheduleList, ...overtimeRows];
    allRows.sort(
      (a, b) => a.day - b.day || (a.shift || "").localeCompare(b.shift || ""),
    );
    setScheduleWithTracking(allRows);
    setEditingRow(null);
    setEditForm({});
  };

  // Modified save function to show saved schedule modal first
  const handleSaveClick = () => {
    saveSchedule();
  };

  const saveSchedule = async (
    monthOverride?: number,
    yearOverride?: number,
  ) => {
    if (!form.part) {
      showAlert("Silakan pilih part terlebih dahulu", "Peringatan");
      return;
    }

    // Update informasi produk sebelum menyimpan
    updateProductInfo();

    // Gunakan parameter override jika ada, atau gunakan state yang ada
    const currentMonth =
      monthOverride !== undefined ? monthOverride : selectedMonth;
    const currentYear =
      yearOverride !== undefined ? yearOverride : selectedYear;

    const scheduleName = `${MONTHS[currentMonth]} ${currentYear}`;

    // Cek apakah sudah ada jadwal untuk part, bulan, dan tahun yang sama
    const existingSchedule = checkExistingSchedule(
      form.part,
      currentMonth,
      currentYear,
    );

    if (existingSchedule) {
      // Buat pesan konfirmasi yang sederhana
      const confirmationMessage = `Apakah Anda yakin ingin menimpa jadwal yang sudah tersimpan?\n\nJadwal untuk ${form.part} - ${scheduleName} sudah ada dan akan diganti dengan data yang baru.`;

      // Tampilkan konfirmasi untuk menimpa jadwal yang sudah ada
      showConfirm(
        confirmationMessage,
        async () => {
          // User memilih untuk menimpa
          await performSaveSchedule(
            currentMonth,
            currentYear,
            scheduleName,
            parseInt(existingSchedule.id),
          );
        },
        `Jadwal untuk ${form.part} - ${scheduleName} sudah ada`,
        "Timpa Jadwal",
        "Batal",
      );
    } else {
      // Tidak ada jadwal yang sama, langsung simpan

      await performSaveSchedule(currentMonth, currentYear, scheduleName);
    }
  };

  // Fungsi untuk melakukan penyimpanan schedule
  const performSaveSchedule = async (
    currentMonth: number,
    currentYear: number,
    scheduleName: string,
    existingId?: number,
  ) => {
    try {
      // Import ProductionService terlebih dahulu
      const { ProductionService } = await import(
        "../../../services/API_Services"
      );

      // Langsung gunakan API yang tersedia

      // Validasi data yang diperlukan
      if (!form.part || !form.customer) {
        throw new Error("Data part dan customer harus diisi");
      }

      if (!schedule || schedule.length === 0) {
        throw new Error("Data schedule tidak boleh kosong");
      }

      // Validasi data schedule
      const invalidSchedule = schedule.find((item) => !item.day || !item.shift);
      if (invalidSchedule) {
        throw new Error("Data schedule tidak lengkap, silakan generate ulang");
      }

      // Validasi month dan year
      if (!currentMonth || !currentYear) {
        throw new Error("Data bulan dan tahun tidak valid");
      }

      // Dapatkan informasi user saat ini
      const currentUser = ProductionService.getCurrentUserInfo();

      // Cek apakah ini adalah user yang berbeda dari yang terakhir kali save
      const shouldUpdateLastSavedBy = (() => {
        if (!currentUser) return false; // Jika tidak ada user info, tidak update

        // Jika ini adalah jadwal baru (tidak ada existingId), selalu update lastSavedBy
        if (!existingId) return true;

        // Jika ini adalah update jadwal yang sudah ada
        const existingSchedule = savedSchedules.find(
          (s) => s.id === existingId.toString(),
        );
        if (!existingSchedule?.productInfo?.lastSavedBy) return true;

        // Cek apakah user saat ini berbeda dengan user yang terakhir kali save
        const lastSavedBy = existingSchedule.productInfo.lastSavedBy;
        return currentUser.nama !== lastSavedBy.nama;
      })();

      // Konversi data untuk backend
      const scheduleDataForBackend = {
        form,
        schedule,
        scheduleName,
        selectedMonth: currentMonth,
        selectedYear: currentYear,
      };

      // Simpan ke backend
      const backendData = ProductionService.convertScheduleDataForBackend(
        scheduleDataForBackend,
      );

      // Validasi data backend sebelum dikirim
      if (
        !backendData.partName ||
        !backendData.customer ||
        !backendData.productionData
      ) {
        console.error("Data backend tidak lengkap:", backendData);
        throw new Error("Data perencanaan produksi tidak lengkap");
      }

      console.log("Data backend yang akan dikirim:", backendData);

      let response;

      try {
        if (existingId) {
          console.log(`Mencoba update schedule dengan ID: ${existingId}`);
          // Update jadwal yang sudah ada
          response = await ProductionService.updateProductionSchedule(
            existingId,
            backendData,
          );
          // Jika update berhasil, gunakan ID yang dikembalikan dari server
          if (response.id) {
            console.log(`Schedule berhasil diupdate dengan ID: ${response.id}`);
          }
        } else {
          console.log("Mencoba membuat schedule baru");
          // Buat jadwal baru
          response =
            await ProductionService.createProductionSchedule(backendData);
        }
        console.log("Response dari API:", response);
      } catch (apiError) {
        console.error("API Error:", apiError);

        // Cek apakah ini error 404 (endpoint tidak ditemukan) atau data tidak ditemukan
        if (
          apiError.message.includes("Endpoint tidak ditemukan") ||
          apiError.message.includes("Schedule dengan ID") ||
          apiError.message.includes(
            "Data perencanaan produksi tidak ditemukan",
          ) ||
          apiError.response?.status === 404
        ) {
          console.log(
            "Server tidak tersedia atau data tidak ditemukan, mencoba buat schedule baru...",
          );

          // Coba buat schedule baru sebagai fallback
          try {
            response =
              await ProductionService.createProductionSchedule(backendData);
            console.log(
              "Berhasil membuat schedule baru sebagai fallback:",
              response,
            );
          } catch (createError) {
            console.log(
              "Gagal membuat schedule baru, menyimpan ke localStorage...",
            );
            response = { id: existingId || Date.now() };
          }
        } else {
          // Jika error lain, throw error untuk ditangani di catch block luar
          throw apiError;
        }
      }

      // Tentukan lastSavedBy berdasarkan logika di atas
      const lastSavedBy =
        shouldUpdateLastSavedBy && currentUser
          ? {
              nama: currentUser.nama,
              role: currentUser.role,
            }
          : (() => {
              // Jika tidak perlu update, gunakan yang sudah ada
              if (existingId) {
                const existingSchedule = savedSchedules.find(
                  (s) => s.id === existingId.toString(),
                );
                return existingSchedule?.productInfo?.lastSavedBy;
              }
              return undefined;
            })();

      // Simpan juga ke SavedSchedulesPage
      const newSchedule = {
        id:
          response.id?.toString() ||
          existingId?.toString() ||
          Date.now().toString(),
        name: scheduleName,
        date: new Date().toISOString(),
        form: { ...form },
        schedule: [...schedule],
        childParts: childParts,
        productInfo: {
          partName: form.part,
          customer: form.customer,
          lastSavedBy: lastSavedBy,
          lastSavedAt: shouldUpdateLastSavedBy
            ? new Date().toISOString()
            : (() => {
                // Jika tidak perlu update, gunakan yang sudah ada
                if (existingId) {
                  const existingSchedule = savedSchedules.find(
                    (s) => s.id === existingId.toString(),
                  );
                  return existingSchedule?.productInfo?.lastSavedAt;
                }
                return new Date().toISOString();
              })(),
        },
      };

      // Simpan child part data ke backend jika ada
      if (childParts.length > 0) {
        try {
          const { RencanaChildPartService } = await import(
            "../../../services/API_Services"
          );

          for (const childPart of childParts) {
            // Cek apakah child part sudah ada di database
            if (childPart.id && typeof childPart.id === "number") {
              // Update existing child part
              await ChildPartService.updateChildPart(childPart.id, {
                partName: childPart.partName,
                customerName: childPart.customerName,
                stockAvailable: childPart.stock || 0,
              });
            } else {
              // Create new child part
              const savedChildPart = await ChildPartService.createChildPart({
                partName: childPart.partName,
                customerName: childPart.customerName,
                stockAvailable: childPart.stock || 0,
              });
              // Update local child part dengan ID dari database
              childPart.id = savedChildPart.id;
            }

            // Konversi data dari format frontend (array 2D) ke format backend (per hari per shift)
            if (childPart.inMaterial && childPart.inMaterial.length > 0) {
              for (let day = 0; day < childPart.inMaterial.length; day++) {
                for (let shift = 0; shift < 2; shift++) {
                  const rencanaValue = childPart.inMaterial[day]?.[shift] || 0;
                  const aktualValue =
                    childPart.aktualInMaterial?.[day]?.[shift] || 0;

                  // Buat data untuk setiap hari dan shift
                  const rencanaData = {
                    childPartId: childPart.id,
                    bulan: currentMonth + 1, // +1 karena month di JavaScript dimulai dari 0
                    tahun: currentYear,
                    hari: day + 1, // +1 karena day dimulai dari 0
                    shift: shift + 1, // +1 karena shift dimulai dari 0
                    rencana_inmaterial: rencanaValue || 0,
                    aktual_inmaterial: aktualValue || 0,
                  };

                  try {
                    // Cek apakah sudah ada rencana untuk hari dan shift ini
                    const existingRencana =
                      await RencanaChildPartService.getRencanaChildPartByBulanTahun(
                        currentMonth + 1,
                        currentYear,
                      );

                    if (existingRencana && existingRencana.length > 0) {
                      // Cari data yang sudah ada untuk hari dan shift ini
                      const existingData = existingRencana.find(
                        (r) =>
                          r.childPartId === childPart.id &&
                          r.hari === day + 1 &&
                          r.shift === shift + 1,
                      );

                      if (existingData) {
                        // Update existing data
                        await RencanaChildPartService.updateRencanaChildPart(
                          existingData.id,
                          rencanaData,
                        );
                      } else {
                        // Create new data
                        await RencanaChildPartService.createRencanaChildPart(
                          rencanaData,
                        );
                      }
                    } else {
                      // Create new data
                      await RencanaChildPartService.createRencanaChildPart(
                        rencanaData,
                      );
                    }
                  } catch (rencanaError) {
                    console.error(
                      `Error saving rencana data for day ${day + 1}, shift ${shift + 1}:`,
                      rencanaError,
                    );
                    // Lanjutkan dengan data berikutnya
                  }
                }
              }
            }
          }
          console.log("Child part data berhasil disimpan ke database");
        } catch (childPartError) {
          console.error("Error saving child part data:", childPartError);
          // Tidak throw error, karena schedule sudah berhasil disimpan
          // Child part data akan tetap tersimpan di localStorage
        }
      }

      if (existingId) {
        // Gunakan ID dari response jika ada, atau existingId
        const finalId = response.id?.toString() || existingId.toString();
        console.log(
          `Updating schedule with ID: ${finalId} (original: ${existingId}, response: ${response.id})`,
        );
        updateSchedule(finalId, newSchedule);
        showSuccess("Jadwal berhasil diperbarui!");

        // Reset semua state perubahan setelah berhasil update
        setHasScheduleChanges(false);
        setHasUnsavedChildPartChanges(false);
        setChildPartChanges(new Set());
      } else {
        // Tambah jadwal baru ke SavedSchedulesPage
        const updatedSchedules = [...savedSchedules, newSchedule];
        setSavedSchedules(updatedSchedules);
        localStorage.setItem(
          "savedSchedules",
          JSON.stringify(updatedSchedules),
        );

        // Pesan sukses yang lebih informatif
        const successMessage = response.id
          ? "Schedule berhasil disimpan ke database dan Saved Schedules!"
          : "Schedule berhasil disimpan ke Saved Schedules (server tidak tersedia)";
        showSuccess(successMessage);
      }

      // Reset semua state perubahan setelah berhasil menyimpan
      setHasScheduleChanges(false);
      setHasUnsavedChildPartChanges(false);
      setChildPartChanges(new Set());
    } catch (error) {
      console.error("Error saving schedule:", error);

      // Pesan error yang lebih informatif
      let errorMessage = "Gagal menyimpan schedule";
      if (error.message.includes("Data part dan customer")) {
        errorMessage = "Data part dan customer harus diisi terlebih dahulu";
      } else if (error.message.includes("Data schedule tidak boleh kosong")) {
        errorMessage =
          "Data schedule tidak boleh kosong, silakan generate schedule terlebih dahulu";
      } else if (error.message.includes("Data perencanaan produksi")) {
        errorMessage =
          "Data perencanaan produksi tidak lengkap, silakan cek kembali form input";
      } else if (
        error.message.includes("Endpoint tidak ditemukan") ||
        error.message.includes("Schedule dengan ID")
      ) {
        errorMessage =
          "Server tidak tersedia atau endpoint tidak ditemukan, schedule disimpan ke localStorage";
      } else if (error.message.includes("Gagal menyimpan ke database")) {
        errorMessage =
          "Server tidak tersedia, schedule disimpan ke localStorage";
      } else if (error.message.includes("Data schedule tidak lengkap")) {
        errorMessage =
          "Data schedule tidak lengkap, silakan generate ulang schedule";
      } else {
        errorMessage = `Error: ${error.message}`;
      }

      showAlert(errorMessage, "Error");
    }
  };

  // Tambahkan fungsi resetFormAndSchedule di dalam komponen SchedulerPage
  const resetFormAndSchedule = () => {
    setForm({
      part: "",
      customer: "",
      timePerPcs: 257,
      cycle1: 0,
      cycle7: 0,
      cycle35: 0,
      stock: 332,
      planningHour: 274,
      overtimeHour: 119,
      planningPcs: 3838,
      overtimePcs: 1672,
      isManualPlanningPcs: false,
      manpowers: [],
    });
    setScheduleWithTracking([]);
    setSelectedMonth(new Date().getMonth());
    setSelectedYear(new Date().getFullYear());
  };

  // Handler untuk generate tabel child part
  const handleGenerateChildPart = async (data: {
    partName: string;
    customerName: string;
    stock: number;
  }) => {
    try {
      // ChildPartService sudah diimport di atas

      // Create child part data for backend
      const childPartData = {
        partName: data.partName,
        customerName: data.customerName,
        stockAvailable: data.stock,
      };

      // Try to save to backend first
      let savedChildPart;
      try {
        savedChildPart = await ChildPartService.createChildPart(childPartData);
        console.log(
          "Child part berhasil disimpan ke database:",
          savedChildPart,
        );
      } catch (apiError) {
        console.error("Gagal menyimpan child part ke database:", apiError);
        // Fallback: create with temporary ID
        savedChildPart = {
          id: Date.now(),
          ...childPartData,
        };
      }

      // Create local child part data with correct structure
      const newChildPart: ChildPartData = {
        partName: data.partName,
        customerName: data.customerName,
        stock: data.stock,
        inMaterial: Array.from({ length: days }, () => [null, null]),
        aktualInMaterial: Array.from({ length: days }, () => [null, null]),
      };

      setChildParts((prev) => [...prev, newChildPart]);
      setShowChildPartModal(false);

      // Show success message
      if (savedChildPart.id && typeof savedChildPart.id === "number") {
        showSuccess("Child part berhasil di generate!");
      } else {
        showSuccess("Child part berhasil di generate!");
      }
    } catch (error) {
      console.error("Error dalam handleGenerateChildPart:", error);
      showAlert("Gagal membuat child part", "Error");
    }
  };

  // Handler untuk tracking perubahan pada child part data
  const handleChildPartDataChange = (childPartIdx: number) => {
    setChildPartChanges((prev) => new Set([...prev, childPartIdx]));
    setHasUnsavedChildPartChanges(true);
  };

  // Handler untuk update child part data dengan tracking perubahan
  const handleChildPartDataUpdate = (
    childPartIdx: number,
    updatedData: Partial<ChildPartData>,
  ) => {
    setChildParts((prev) =>
      prev.map((cp, idx) =>
        idx === childPartIdx ? { ...cp, ...updatedData } : cp,
      ),
    );
    handleChildPartDataChange(childPartIdx);
  };

  // Wrapper untuk setSchedule dengan tracking perubahan
  const setScheduleWithTracking = (
    newSchedule: ScheduleItem[] | ((prev: ScheduleItem[]) => ScheduleItem[]),
  ) => {
    setSchedule(newSchedule);
    setHasScheduleChanges(true);
  };

  // Handler untuk menyimpan data ke backend
  const handleSaveToBackend = async (data: ProductPlanningData) => {
    try {
      await PlanningSystemService.createProductPlanning(data);
      showSuccess("Data perencanaan produksi berhasil disimpan ke database!");
    } catch (error) {
      console.error("Error saving to backend:", error);
      showAlert(
        error instanceof Error
          ? error.message
          : "Gagal menyimpan data ke database",
        "Error",
      );
    }
  };

  // Handler untuk menghapus child part berdasarkan index
  const handleDeleteChildPart = async (idx: number) => {
    try {
      const childPart = childParts[idx];
      console.log("=== MULAI PROSES DELETE CHILD PART ===");
      console.log("Child part yang akan dihapus:", childPart);
      console.log("ID child part:", childPart.id, "Type:", typeof childPart.id);

      // Jika child part memiliki ID dari database, hapus dari backend
      if (childPart.id && typeof childPart.id === "number") {
        console.log(
          "✅ Child part memiliki ID database, akan hapus dari backend",
        );

        try {
          // Hapus semua data rencana child part terlebih dahulu
          console.log("📋 Langkah 1: Mencoba hapus data rencana child part...");

          try {
            // Hapus berdasarkan childPartId saja, tidak perlu filter bulan/tahun
            console.log(
              `🔍 Mencari data rencana untuk childPartId: ${childPart.id}`,
            );
            const allRencana =
              await RencanaChildPartService.getRencanaChildPartByChildPartId(
                childPart.id,
              );

            if (allRencana && allRencana.length > 0) {
              console.log(
                `📊 Menemukan ${allRencana.length} data rencana untuk dihapus:`,
                allRencana,
              );

              for (const rencana of allRencana) {
                try {
                  console.log(`🗑️ Mencoba hapus rencana ID: ${rencana.id}`);
                  await RencanaChildPartService.deleteRencanaChildPart(
                    rencana.id,
                  );
                  console.log(`✅ Berhasil hapus rencana ID: ${rencana.id}`);
                } catch (deleteError) {
                  console.error(
                    `❌ Gagal hapus rencana ID ${rencana.id}:`,
                    deleteError,
                  );
                }
              }
              console.log(
                `🎯 Total ${allRencana.length} data rencana child part berhasil dihapus dari database`,
              );
            } else {
              console.log(
                "ℹ️ Tidak ada data rencana yang ditemukan untuk child part ini",
              );
            }
          } catch (rencanaError) {
            console.error(
              "❌ Gagal mengambil data rencana child part:",
              rencanaError,
            );
            console.log("⚠️ Lanjutkan dengan penghapusan child part utama...");
          }

          // Hapus child part dari database
          console.log(
            "📋 Langkah 2: Mencoba hapus child part utama dari database...",
          );
          console.log(`🗑️ Mencoba hapus child part dengan ID: ${childPart.id}`);

          const deleteResult = await ChildPartService.deleteChildPart(
            childPart.id,
          );
          console.log("✅ Child part berhasil dihapus dari database");
          console.log("Response dari delete:", deleteResult);

          // Hapus dari state lokal hanya jika berhasil hapus dari database
          console.log("📋 Langkah 3: Update state lokal...");
          setChildParts((prev) => prev.filter((_, i) => i !== idx));
          setChildPartCarouselPage(0);
          showSuccess("Child part berhasil dihapus dari database!");
          console.log("=== PROSES DELETE SELESAI - BERHASIL ===");
        } catch (apiError) {
          console.error(
            "❌ Gagal menghapus child part dari database:",
            apiError,
          );
          console.error("Error details:", {
            message: apiError.message,
            status: apiError.response?.status,
            data: apiError.response?.data,
          });
          showAlert(
            "Gagal menghapus child part dari database. Silakan coba lagi.",
            "Error",
          );
          // JANGAN hapus dari state lokal jika gagal hapus dari database
          console.log(
            "⚠️ Tidak menghapus dari state lokal karena gagal hapus dari database",
          );
          return;
        }
      } else {
        // Jika tidak ada ID database, hapus dari state lokal saja
        console.log(
          "⚠️ Child part tidak memiliki ID database, hapus dari state lokal saja",
        );
        setChildParts((prev) => prev.filter((_, i) => i !== idx));
        setChildPartCarouselPage(0);
        showSuccess("Child part berhasil dihapus dari state lokal");
        console.log("=== PROSES DELETE SELESAI - LOKAL SAJA ===");
      }
    } catch (error) {
      console.error("❌ Error deleting child part:", error);
      showAlert("Gagal menghapus child part", "Error");
      console.log("=== PROSES DELETE SELESAI - ERROR ===");
    }
  };

  // Handler untuk menghapus schedule dari database
  const handleDeleteScheduleFromDatabase = async (scheduleId: string) => {
    try {
      const { ProductionService } = await import(
        "../../../services/API_Services"
      );

      // Cari schedule yang akan dihapus
      const scheduleToDelete = savedSchedules.find((s) => s.id === scheduleId);
      if (!scheduleToDelete) {
        console.error("Schedule tidak ditemukan untuk dihapus");
        return;
      }

      // Coba hapus dari backend menggunakan ID schedule
      try {
        // Jika ID adalah angka (kemungkinan dari database), gunakan untuk delete
        const numericId = parseInt(scheduleId);
        if (!isNaN(numericId)) {
          await ProductionService.deleteSchedule(numericId);
          console.log("Schedule berhasil dihapus dari database");
        }
      } catch (apiError) {
        console.error("Gagal menghapus schedule dari database:", apiError);
        // Tetap lanjutkan dengan penghapusan lokal
      }

      // Hapus dari state lokal
      const updatedSchedules = savedSchedules.filter(
        (s) => s.id !== scheduleId,
      );
      setSavedSchedules(updatedSchedules);

      // Update localStorage
      localStorage.setItem("savedSchedules", JSON.stringify(updatedSchedules));

      showSuccess("Schedule berhasil dihapus");
    } catch (error) {
      console.error("Error deleting schedule:", error);
      showAlert("Gagal menghapus schedule", "Error");
    }
  };

  // Handler untuk menyimpan perubahan child part secara terpisah
  const handleSaveChildPartChanges = async () => {
    if (!hasUnsavedChildPartChanges || childPartChanges.size === 0) {
      showAlert("Tidak ada perubahan yang perlu disimpan", "Info");
      return;
    }

    try {
      const { RencanaChildPartService } = await import(
        "../../../services/API_Services"
      );

      let successCount = 0;
      let errorCount = 0;

      for (const childPartIdx of childPartChanges) {
        const childPart = childParts[childPartIdx];
        if (!childPart || !childPart.id) continue;

        try {
          // Konversi data dari format frontend ke format backend
          if (childPart.inMaterial && childPart.inMaterial.length > 0) {
            for (let day = 0; day < childPart.inMaterial.length; day++) {
              for (let shift = 0; shift < 2; shift++) {
                const rencanaValue = childPart.inMaterial[day]?.[shift] || 0;
                const aktualValue =
                  childPart.aktualInMaterial?.[day]?.[shift] || 0;

                const rencanaData = {
                  childPartId: childPart.id,
                  bulan: selectedMonth + 1,
                  tahun: selectedYear,
                  hari: day + 1,
                  shift: shift + 1,
                  rencana_inmaterial: rencanaValue || 0,
                  aktual_inmaterial: aktualValue || 0,
                };

                // Cek apakah sudah ada data untuk hari dan shift ini
                const existingRencana =
                  await RencanaChildPartService.getRencanaChildPartByBulanTahun(
                    selectedMonth + 1,
                    selectedYear,
                  );

                if (existingRencana && existingRencana.length > 0) {
                  const existingData = existingRencana.find(
                    (r) =>
                      r.childPartId === childPart.id &&
                      r.hari === day + 1 &&
                      r.shift === shift + 1,
                  );

                  if (existingData) {
                    await RencanaChildPartService.updateRencanaChildPart(
                      existingData.id,
                      rencanaData,
                    );
                  } else {
                    await RencanaChildPartService.createRencanaChildPart(
                      rencanaData,
                    );
                  }
                } else {
                  await RencanaChildPartService.createRencanaChildPart(
                    rencanaData,
                  );
                }
              }
            }
          }
          successCount++;
        } catch (error) {
          console.error(
            `Error saving child part ${childPart.partName}:`,
            error,
          );
          errorCount++;
        }
      }

      // Reset perubahan
      setChildPartChanges(new Set());
      setHasUnsavedChildPartChanges(false);

      if (errorCount === 0) {
        showSuccess(`Berhasil menyimpan ${successCount} perubahan child part!`);
      } else if (successCount > 0) {
        showAlert(
          `Berhasil menyimpan ${successCount} perubahan, ${errorCount} gagal`,
          "Warning",
        );
      } else {
        showAlert("Gagal menyimpan perubahan child part", "Error");
      }
    } catch (error) {
      console.error("Error saving child part changes:", error);
      showAlert("Gagal menyimpan perubahan child part", "Error");
    }
  };

  // Add confirmation handler
  const handleConfirmDelete = () => {
    if (deleteTargetIndex !== null) {
      setChildParts((prev) => prev.filter((_, i) => i !== deleteTargetIndex));
      setChildPartCarouselPage(0);
    }
    setShowDeleteConfirmModal(false);
    setDeleteTargetIndex(null);
  };

  // Add cancel handler
  const handleCancelDelete = () => {
    setShowDeleteConfirmModal(false);
    setDeleteTargetIndex(null);
  };

  // Filter application functions
  const applyPartFilter = () => {
    setChildPartFilter(tempChildPartFilter);
    setShowPartFilterDropdown(false);
  };

  const applyDataFilter = () => {
    setActiveChildPartTableFilter(tempActiveChildPartTableFilter);
    setShowFilterDropdown(false);
  };

  const handleOpenPartFilter = () => {
    setTempChildPartFilter(childPartFilter);
    setShowPartFilterDropdown(!showPartFilterDropdown);
  };

  const handleOpenDataFilter = () => {
    setTempActiveChildPartTableFilter(activeChildPartTableFilter);
    setShowFilterDropdown(!showFilterDropdown);
  };

  const cancelPartFilter = () => {
    setTempChildPartFilter(childPartFilter);
    setShowPartFilterDropdown(false);
  };

  const cancelDataFilter = () => {
    setTempActiveChildPartTableFilter(activeChildPartTableFilter);
    setShowFilterDropdown(false);
  };

  // Tentukan jumlah hari dari schedule
  const days =
    schedule.length > 0 ? Math.max(...schedule.map((s) => s.day)) : 30;

  // Fungsi untuk menyimpan data dari komponen ke backend
  const saveProductionDataToBackend = async (
    productionData: ScheduleItem[],
  ) => {
    try {
      const { ProductionService } = await import(
        "../../../services/API_Services"
      );
      const response =
        await ProductionService.saveProductionDataFromComponents(
          productionData,
        );
      console.log("Data produksi berhasil disimpan:", response);
      return response;
    } catch (error) {
      console.error("Error saving production data:", error);
      throw error;
    }
  };

  // Handler untuk menyimpan perubahan dari komponen
  const handleSaveProductionChanges = async (updatedRows: ScheduleItem[]) => {
    try {
      await saveProductionDataToBackend(updatedRows);
      showSuccess("Perubahan berhasil disimpan ke database!");
    } catch (error) {
      showAlert("Gagal menyimpan perubahan ke database", "Error");
    }
  };

  return (
    <div className="w-full min-h-screen flex items-start justify-center pt-16 sm:pt-20">
      {/* SchedulerPage main content */}
      <div className="w-full max-w-none mx-auto px-2 sm:px-4 lg:px-6">
        {/* Main content below */}
        {/* ...existing code... */}

        {/* Production Form Modal */}
        {showProductionForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4"
            onClick={() => setShowProductionForm(false)}
          >
            <div
              className="bg-gray-900 rounded-3xl shadow-2xl w-full max-w-3xl relative border border-gray-800 animate-fadeInUp overflow-y-auto"
              style={{ maxWidth: "800px", maxHeight: "90vh" }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-red-400 text-xl sm:text-2xl font-bold z-10"
                onClick={() => setShowProductionForm(false)}
                aria-label="Tutup"
              >
                ×
              </button>
              <ProductionForm
                form={form}
                scheduleName={getCurrentScheduleName()}
                setScheduleName={() => {}}
                handleChange={handleChange}
                isGenerating={isGenerating}
                generateSchedule={() => {
                  generateSchedule();
                  setShowProductionForm(false);
                }}
                saveSchedule={saveSchedule}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                setSelectedMonth={setSelectedMonth}
                setSelectedYear={setSelectedYear}
                onSaveToBackend={handleSaveToBackend}
              />
            </div>
          </div>
        )}

        {/* Saved Schedule Modal dengan Month/Year Picker */}
        {false && showSavedScheduleModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4"
            onClick={() => setShowSavedScheduleModal(false)}
          >
            <div
              className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl w-full max-w-md relative border border-slate-700"
              style={{
                animation: "fadeInUp 0.3s ease-out",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 px-6 sm:px-8 py-4 sm:py-6 rounded-t-3xl border-b border-slate-600">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3">
                      <svg
                        className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                        />
                      </svg>
                      Simpan Jadwal
                    </h2>
                    <p className="text-slate-400 mt-1 text-sm sm:text-base">
                      Pilih bulan dan tahun untuk menyimpan jadwal
                    </p>
                  </div>
                  <button
                    className="text-gray-400 hover:text-red-400 text-xl sm:text-2xl font-bold transition-colors"
                    onClick={() => setShowSavedScheduleModal(false)}
                    aria-label="Tutup"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 sm:p-8">
                {/* Month Picker */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-300 mb-3">
                    Pilih Bulan
                  </label>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {MONTHS.map((month, index) => (
                      <button
                        key={month}
                        onClick={() => setTempSelectedMonth(index)}
                        className={`px-2 sm:px-4 py-2 sm:py-3 rounded-xl border-2 transition-all duration-200 font-medium text-xs sm:text-sm ${
                          tempSelectedMonth === index
                            ? "bg-blue-600 border-blue-500 text-white shadow-lg scale-105"
                            : "bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500"
                        }`}
                      >
                        {month}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Year Picker */}
                <div className="mb-6 sm:mb-8">
                  <label className="block text-sm font-semibold text-slate-300 mb-3">
                    Pilih Tahun
                  </label>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <button
                      onClick={() => setTempSelectedYear(tempSelectedYear - 1)}
                      className="p-1.5 sm:p-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 hover:border-slate-500 transition-colors"
                    >
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>

                    <div className="flex-1 text-center">
                      <span className="text-xl sm:text-2xl font-bold text-white bg-slate-800 border border-slate-600 rounded-lg px-4 sm:px-6 py-2 sm:py-3 inline-block min-w-[100px] sm:min-w-[120px]">
                        {tempSelectedYear}
                      </span>
                    </div>

                    <button
                      onClick={() => setTempSelectedYear(tempSelectedYear + 1)}
                      className="p-1.5 sm:p-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 hover:border-slate-500 transition-colors"
                    >
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Action Buttons - Modified to show only "Simpan" */}
                <div className="flex gap-3 sm:gap-4">
                  <button
                    onClick={() => setShowSavedScheduleModal(false)}
                    className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-all duration-200 border border-slate-600 hover:border-slate-500 text-sm sm:text-base"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSaveClick}
                    className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg text-sm sm:text-base"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* If no schedule, show blank state */}
        {schedule.length === 0 ? (
          <div
            className={`flex flex-col items-center justify-center min-h-[500px] sm:min-h-[600px] ${uiColors.bg.secondary} ${uiColors.border.primary} rounded-3xl p-8 sm:p-16 mx-auto max-w-4xl`}
          >
            <div className="text-center">
              <h2
                className={`text-xl sm:text-2xl font-bold ${uiColors.text.primary} mb-4`}
              >
                🚀 Mulai Perencanaan Produksi
              </h2>
              <p
                className={`text-base sm:text-lg ${uiColors.text.tertiary} mb-6 sm:mb-8`}
              >
                Buat jadwal produksi yang optimal untuk meningkatkan efisiensi
                dan target produksi
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => {
                    resetFormAndSchedule();
                    setShowProductionForm(true);
                  }}
                  className="px-8 sm:px-12 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-base sm:text-lg font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-300 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  ✨ Buat Jadwal Produksi
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div id="schedule-table-section">
            {/* Dashboard Produksi Header dengan gradasi full */}
            <div
              className={`${uiColors.bg.tertiary} px-4 sm:px-8 py-4 sm:py-6 rounded-t-3xl ${uiColors.border.primary}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2
                    className={`text-xl sm:text-2xl font-bold ${uiColors.text.primary}`}
                  >
                    🏭 Dashboard Produksi
                  </h2>
                  <p
                    className={`${uiColors.text.tertiary} mt-1 text-sm sm:text-base`}
                  >
                    Monitoring dan perencanaan produksi harian
                  </p>
                </div>

                {/* Combined Controls */}
                <div className="flex flex-row items-center gap-2 sm:gap-4">
                  {/* View Mode Toggle */}
                  <ViewModeToggle
                    currentView={viewMode}
                    onViewChange={setViewMode}
                  />

                  {/* Search */}
                  <div className="relative flex-1 sm:flex-none">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className={`w-4 h-4 ${uiColors.text.tertiary}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={searchDate}
                      onChange={(e) => setSearchDate(e.target.value)}
                      placeholder="Cari tanggal..."
                      className={`w-full max-w-[200px] sm:w-48 pl-10 pr-4 py-2 ${uiColors.bg.primary} ${uiColors.border.secondary} rounded-lg ${uiColors.text.primary} placeholder-${uiColors.text.tertiary} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm`}
                    />
                    {searchDate && (
                      <button
                        onClick={() => setSearchDate("")}
                        className={`absolute inset-y-0 right-0 pr-3 flex items-center ${uiColors.text.tertiary} hover:text-red-400`}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Dropdown Menu */}
                  <div className="relative dropdown-container">
                    <button
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 text-sm"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                        />
                      </svg>
                      <span className="hidden sm:inline">Menu</span>
                      <svg
                        className={`w-4 h-4 transition-transform ${
                          showDropdown ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {/* Dropdown Content */}
                    {showDropdown && (
                      <div
                        className="absolute right-0 mt-2 w-72 sm:w-80 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 border border-slate-600 rounded-xl shadow-2xl z-50 overflow-y-auto custom-scrollbar"
                        style={{ overflowX: "hidden" }}
                      >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-slate-700 to-slate-600 px-4 py-3 border-b border-slate-600">
                          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-blue-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                              />
                            </svg>
                            Menu Utama
                          </h3>
                        </div>

                        {/* Menu Items */}
                        <div
                          className="py-2 max-h-96 overflow-y-auto custom-scrollbar"
                          style={{ overflowX: "hidden" }}
                        >
                          {/* Simpan Jadwal */}
                          <div className="relative group menu-item-hover">
                            <button
                              onClick={() => {
                                handleSaveClick();
                                setShowDropdown(false);
                                setActiveSubmenu(null);
                              }}
                              className="w-full text-left px-4 py-3 text-white hover:bg-gradient-to-r hover:from-green-600/20 hover:to-emerald-600/20 transition-all duration-200 flex items-center gap-3 text-sm group-hover:translate-x-1 relative overflow-hidden group/submenu"
                              title="Simpan jadwal ke penyimpanan lokal"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-green-600/0 to-emerald-600/0 group-hover/submenu:from-green-600/10 group-hover/submenu:to-emerald-600/10 transition-all duration-300"></div>
                              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg
                                  className="w-4 h-4 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                                  />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <span className="font-medium">
                                  Simpan Jadwal
                                </span>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  Simpan jadwal ke penyimpanan lokal
                                </p>
                              </div>
                            </button>
                          </div>

                          {/* Penjadwalan Section */}
                          <div className="relative group menu-item-hover">
                            <button
                              onClick={() =>
                                setActiveSubmenu(
                                  activeSubmenu === "scheduling"
                                    ? null
                                    : "scheduling",
                                )
                              }
                              className="w-full text-left px-4 py-3 text-white hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-indigo-600/20 transition-all duration-200 flex items-center gap-3 text-sm group-hover:translate-x-1 relative overflow-hidden group/submenu"
                              title="Kelola jadwal produksi"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 to-indigo-600/0 group-hover/submenu:from-blue-600/10 group-hover/submenu:to-indigo-600/10 transition-all duration-300"></div>
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg
                                  className="w-4 h-4 text-white"
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
                              </div>
                              <div className="flex-1">
                                <span className="font-medium">Penjadwalan</span>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  Kelola jadwal produksi
                                </p>
                              </div>
                              <svg
                                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${activeSubmenu === "scheduling" ? "rotate-90" : ""}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </button>

                            {/* Submenu Penjadwalan */}
                            {activeSubmenu === "scheduling" && (
                              <div className="bg-slate-700/50 border-l-2 border-blue-500 ml-4 mr-2 rounded-r-lg overflow-hidden submenu-enter">
                                {/* Tambah Penjadwalan Baru */}
                                <button
                                  onClick={() => {
                                    resetFormAndSchedule();
                                    setShowProductionForm(true);
                                    setShowDropdown(false);
                                    setActiveSubmenu(null);
                                  }}
                                  className="w-full text-left px-4 py-3 text-white hover:bg-gradient-to-r hover:from-blue-600/30 hover:to-cyan-600/30 transition-all duration-200 flex items-center gap-3 text-sm pl-8 relative overflow-hidden group/submenu"
                                  title="Buat jadwal produksi baru dengan form yang lengkap"
                                >
                                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 to-cyan-600/0 group-hover/submenu:from-blue-600/10 group-hover/submenu:to-cyan-600/10 transition-all duration-300"></div>
                                  <div className="w-6 h-6 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-md flex items-center justify-center flex-shrink-0">
                                    <svg
                                      className="w-3 h-3 text-white"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 4v16m8-8H4"
                                      />
                                    </svg>
                                  </div>
                                  <div className="flex-1">
                                    <span className="font-medium">
                                      Tambah Baru
                                    </span>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                      Buat jadwal produksi baru
                                    </p>
                                  </div>
                                </button>

                                {/* Edit Production Form */}
                                <button
                                  onClick={() => {
                                    setShowProductionForm(true);
                                    setShowDropdown(false);
                                    setActiveSubmenu(null);
                                  }}
                                  className="w-full text-left px-4 py-3 text-white hover:bg-gradient-to-r hover:from-yellow-600/30 hover:to-orange-600/30 transition-all duration-200 flex items-center gap-3 text-sm pl-8 relative overflow-hidden group/submenu"
                                  title="Edit form produksi yang sudah ada"
                                >
                                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/0 to-orange-600/0 group-hover/submenu:from-yellow-600/10 group-hover/submenu:to-orange-600/10 transition-all duration-300"></div>
                                  <div className="w-6 h-6 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-md flex items-center justify-center flex-shrink-0">
                                    <svg
                                      className="w-3 h-3 text-white"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                      />
                                    </svg>
                                  </div>
                                  <div className="flex-1">
                                    <span className="font-medium">
                                      Edit Form
                                    </span>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                      Edit form produksi
                                    </p>
                                  </div>
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Export Section */}
                          <div className="relative group menu-item-hover">
                            {/* Download Excel Langsung (bukan submenu) */}
                            <div className="relative group menu-item-hover">
                              <button
                                onClick={() => {
                                  const event = new CustomEvent(
                                    "downloadExcel",
                                  );
                                  window.dispatchEvent(event);
                                  setShowDropdown(false);
                                  setActiveSubmenu(null);
                                }}
                                className="w-full text-left px-4 py-3 text-white hover:bg-gradient-to-r hover:from-green-600/20 hover:to-emerald-600/20 transition-all duration-200 flex items-center gap-3 text-sm group-hover:translate-x-1 relative overflow-hidden group/submenu"
                                title="Download jadwal dalam format Excel"
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-green-600/0 to-emerald-600/0 group-hover/submenu:from-green-600/10 group-hover/submenu:to-emerald-600/10 transition-all duration-300"></div>
                                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <svg
                                    className="w-4 h-4 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                    />
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <span className="font-medium">
                                    Download Excel
                                  </span>
                                  <p className="text-xs text-slate-400 mt-0.5">
                                    Ekspor ke format Excel
                                  </p>
                                </div>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-gradient-to-r from-slate-700 to-slate-600 px-4 py-2 border-t border-slate-600">
                          <p className="text-xs text-slate-400 text-center">
                            Berlindo Production System
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`${uiColors.bg.secondary} ${uiColors.border.primary} rounded-b-3xl`}
            >
              <ScheduleTable
                schedule={schedule}
                editingRow={editingRow}
                editForm={editForm}
                startEdit={startEdit}
                saveEdit={saveEdit}
                cancelEdit={cancelEdit}
                setEditForm={setEditForm}
                initialStock={form.stock}
                timePerPcs={form.timePerPcs}
                scheduleName={getCurrentScheduleName()}
                viewMode={viewMode}
                searchDate={searchDate}
                onDataChange={handleSaveProductionChanges}
                manpowerList={manpowerList}
                productInfo={productInfo}
              />
              {/* Search, Add Button, and Filter Controls */}
              <div className="flex flex-col gap-4 p-4">
                {/* Search and Add Button Row */}
                <div className="flex flex-col sm:flex-row items-center gap-4 justify-between w-full">
                  {/* Button Tambahkan Material di atas untuk mobile, kanan untuk desktop */}
                  <button
                    onClick={() => setShowChildPartModal(true)}
                    className="w-full sm:w-auto h-12 px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg text-base order-1 sm:order-3"
                  >
                    Tambahkan Material
                  </button>

                  {/* Filter Buttons */}
                  <div className="flex flex-row items-center gap-4 w-full sm:w-auto order-2 sm:order-1">
                    {/* Part Name Filter Dropdown */}
                    <div className="relative flex-1 sm:flex-none">
                      <button
                        className="w-full px-6 py-2 rounded-xl font-semibold border border-blue-400 text-blue-400 flex items-center gap-2 hover:bg-blue-900 transition"
                        onClick={handleOpenPartFilter}
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4 6h16M4 12h16M4 18h16"
                          />
                        </svg>
                        Nama Part{" "}
                        {childPartFilter !== "all" &&
                          childPartFilter.length > 0 &&
                          `(${childPartFilter.length})`}
                        <svg
                          className={`w-4 h-4 transition-transform ${showPartFilterDropdown ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>

                      {/* Part Name Filter Options */}
                      {showPartFilterDropdown && (
                        <div className="absolute z-50 mt-2 w-64 bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl p-4 animate-fadeInUp part-filter-dropdown">
                          <div className="mb-3 border-b border-slate-600 pb-2 flex items-center gap-2">
                            <svg
                              className="w-5 h-5 text-blue-400"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                              />
                            </svg>
                            <span className="text-white font-bold text-base">
                              Filter Nama Part{" "}
                              {tempChildPartFilter !== "all" &&
                                tempChildPartFilter.length > 0 &&
                                `(${tempChildPartFilter.length})`}
                            </span>
                          </div>

                          <div className="space-y-2 mb-4">
                            <button
                              onClick={() => {
                                setTempChildPartFilter("all");
                              }}
                              className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${tempChildPartFilter === "all" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-700"}`}
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              Semua Part
                            </button>
                            {Array.from(
                              new Set(childParts.map((cp) => cp.partName)),
                            ).map((partName) => (
                              <button
                                key={partName}
                                onClick={() => {
                                  const currentFilters =
                                    tempChildPartFilter === "all"
                                      ? []
                                      : [...tempChildPartFilter];
                                  if (currentFilters.includes(partName)) {
                                    setTempChildPartFilter(
                                      currentFilters.filter(
                                        (f) => f !== partName,
                                      ),
                                    );
                                  } else {
                                    setTempChildPartFilter([
                                      ...currentFilters,
                                      partName,
                                    ]);
                                  }
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${tempChildPartFilter !== "all" && tempChildPartFilter.includes(partName) ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-700"}`}
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                                  />
                                </svg>
                                {partName}
                              </button>
                            ))}
                          </div>

                          <div className="border-t border-slate-600 pt-3">
                            <div className="flex gap-2">
                              <button
                                onClick={cancelPartFilter}
                                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition"
                              >
                                Batal
                              </button>
                              <button
                                onClick={applyPartFilter}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                              >
                                Simpan
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Data Filter Dropdown Button */}
                    <div className="relative flex-1 sm:flex-none">
                      <button
                        className="w-full px-6 py-2 rounded-xl font-semibold bg-slate-700 text-slate-200 flex items-center gap-2 hover:bg-slate-600 transition-all"
                        onClick={handleOpenDataFilter}
                      >
                        <BarChart2 className="w-5 h-5" />
                        Filter Data{" "}
                        {activeChildPartTableFilter.length > 0 &&
                          `(${activeChildPartTableFilter.length})`}
                        <svg
                          className={`w-4 h-4 transition-transform ${showFilterDropdown ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>

                      {/* Filter Options Dropdown */}
                      {showFilterDropdown && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 data-filter-dropdown">
                          <div className="w-80 bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl p-6 animate-fadeInUp">
                            <div className="mb-4 border-b border-slate-600 pb-3 flex items-center gap-2">
                              <svg
                                className="w-5 h-5 text-blue-400"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707l-6.414 6.414A1 1 0 0013 13.414V19a1 1 0 01-1.447.894l-4-2A1 1 0 017 17v-3.586a1 1 0 00-.293-.707L3.293 6.707A1 1 0 013 6V4z"
                                />
                              </svg>
                              <span className="text-white font-bold text-base">
                                Filter Data{" "}
                                {tempActiveChildPartTableFilter.length > 0 &&
                                  `(${tempActiveChildPartTableFilter.length})`}
                              </span>
                            </div>

                            {/* Data Type Filters */}
                            <div className="space-y-2 mb-4">
                              <button
                                onClick={() =>
                                  setTempActiveChildPartTableFilter([])
                                }
                                className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${tempActiveChildPartTableFilter.length === 0 ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-700"}`}
                              >
                                <BarChart2 className="w-4 h-4" /> Semua Data
                              </button>
                              <button
                                onClick={() => {
                                  const currentFilters = [
                                    ...tempActiveChildPartTableFilter,
                                  ];
                                  const filterName = "rencanaInMaterial";
                                  if (currentFilters.includes(filterName)) {
                                    setTempActiveChildPartTableFilter(
                                      currentFilters.filter(
                                        (f) => f !== filterName,
                                      ),
                                    );
                                  } else {
                                    setTempActiveChildPartTableFilter([
                                      ...currentFilters,
                                      filterName,
                                    ]);
                                  }
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${tempActiveChildPartTableFilter.includes("rencanaInMaterial") ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-700"}`}
                              >
                                <Package className="w-4 h-4" /> Rencana In
                                Material
                              </button>
                              <button
                                onClick={() => {
                                  const currentFilters = [
                                    ...tempActiveChildPartTableFilter,
                                  ];
                                  const filterName = "aktualInMaterial";
                                  if (currentFilters.includes(filterName)) {
                                    setTempActiveChildPartTableFilter(
                                      currentFilters.filter(
                                        (f) => f !== filterName,
                                      ),
                                    );
                                  } else {
                                    setTempActiveChildPartTableFilter([
                                      ...currentFilters,
                                      filterName,
                                    ]);
                                  }
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${tempActiveChildPartTableFilter.includes("aktualInMaterial") ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-700"}`}
                              >
                                <Layers className="w-4 h-4" /> Aktual In
                                Material
                              </button>
                              <button
                                onClick={() => {
                                  const currentFilters = [
                                    ...tempActiveChildPartTableFilter,
                                  ];
                                  const filterName = "rencanaStock";
                                  if (currentFilters.includes(filterName)) {
                                    setTempActiveChildPartTableFilter(
                                      currentFilters.filter(
                                        (f) => f !== filterName,
                                      ),
                                    );
                                  } else {
                                    setTempActiveChildPartTableFilter([
                                      ...currentFilters,
                                      filterName,
                                    ]);
                                  }
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${tempActiveChildPartTableFilter.includes("rencanaStock") ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-700"}`}
                              >
                                <Target className="w-4 h-4" /> Rencana Stock
                                (PCS)
                              </button>
                              <button
                                onClick={() => {
                                  const currentFilters = [
                                    ...tempActiveChildPartTableFilter,
                                  ];
                                  const filterName = "aktualStock";
                                  if (currentFilters.includes(filterName)) {
                                    setTempActiveChildPartTableFilter(
                                      currentFilters.filter(
                                        (f) => f !== filterName,
                                      ),
                                    );
                                  } else {
                                    setTempActiveChildPartTableFilter([
                                      ...currentFilters,
                                      filterName,
                                    ]);
                                  }
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${tempActiveChildPartTableFilter.includes("aktualStock") ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-700"}`}
                              >
                                <Factory className="w-4 h-4" /> Aktual Stock
                                (PCS)
                              </button>
                            </div>

                            <div className="border-t border-slate-600 pt-3">
                              <div className="flex gap-2">
                                <button
                                  onClick={cancelDataFilter}
                                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition"
                                >
                                  Batal
                                </button>
                                <button
                                  onClick={applyDataFilter}
                                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                                >
                                  Simpan
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Render ChildPartTable sebagai carousel per 2 item per page */}
              {childParts.length > 0 ? (
                <div className="relative px-4 pb-8">
                  {(() => {
                    // Filter childParts by filter dropdown dan search
                    let filtered = childParts;
                    if (childPartFilter !== "all") {
                      filtered = filtered.filter((cp) =>
                        childPartFilter.includes(cp.partName),
                      );
                    }
                    filtered = filtered.filter(
                      (cp) =>
                        cp.partName
                          .toLowerCase()
                          .includes(childPartSearch.toLowerCase()) ||
                        cp.customerName
                          .toLowerCase()
                          .includes(childPartSearch.toLowerCase()),
                    );
                    // Pagination logic
                    const totalPages = Math.ceil(
                      filtered.length / CHILD_PARTS_PER_PAGE,
                    );
                    const page = Math.min(
                      childPartCarouselPage,
                      Math.max(0, totalPages - 1),
                    );
                    const startIdx = page * CHILD_PARTS_PER_PAGE;
                    const endIdx = startIdx + CHILD_PARTS_PER_PAGE;
                    const pageItems = filtered.slice(startIdx, endIdx);
                    if (filtered.length === 0)
                      return (
                        <div className="grid grid-cols-1 gap-8">
                          {viewMode === "cards" ? (
                            <ChildPartCardView
                              partName={"-"}
                              customerName={"-"}
                              initialStock={null}
                              days={days}
                              schedule={[]}
                              inMaterial={Array.from({ length: days }, () => [
                                null,
                                null,
                              ])}
                              onInMaterialChange={() => {}}
                              onDelete={undefined}
                              activeFilter={activeChildPartTableFilter}
                            />
                          ) : (
                            <ChildPartTable
                              partName={"-"}
                              customerName={"-"}
                              initialStock={null}
                              days={days}
                              schedule={[]}
                              inMaterial={Array.from({ length: days }, () => [
                                null,
                                null,
                              ])}
                              onInMaterialChange={() => {}}
                              onDelete={undefined}
                              activeFilter={activeChildPartTableFilter}
                            />
                          )}
                          <div className="text-center text-slate-400 py-8 -mt-12">
                            Tidak ada Child Part ditemukan.
                          </div>
                        </div>
                      );
                    return (
                      <>
                        <div
                          className={`grid gap-8 ${viewMode === "cards" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}
                        >
                          {pageItems.map((cp, idx) => {
                            const realIdx = childParts.findIndex(
                              (c) => c === cp,
                            );
                            const commonProps = {
                              key: startIdx + idx,
                              partName: cp.partName,
                              customerName: cp.customerName,
                              initialStock: cp.stock,
                              days: days,
                              schedule: schedule,
                              onDelete: () => {
                                handleDeleteChildPart(realIdx);
                                setChildPartCarouselPage(0);
                              },
                              inMaterial: cp.inMaterial,
                              onInMaterialChange: (val: any) => {
                                setChildParts((prev) =>
                                  prev.map((c, i) =>
                                    i === realIdx
                                      ? { ...c, inMaterial: val }
                                      : c,
                                  ),
                                );
                              },
                              aktualInMaterial: cp.aktualInMaterial,
                              onAktualInMaterialChange: (val: any) => {
                                setChildParts((prev) =>
                                  prev.map((c, i) =>
                                    i === realIdx
                                      ? { ...c, aktualInMaterial: val }
                                      : c,
                                  ),
                                );
                              },
                              renderHeaderAction: (
                                <div className="flex gap-2 items-center">
                                  <button
                                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                                    onClick={() => setEditChildPartIdx(realIdx)}
                                    type="button"
                                    title="Edit"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                      />
                                    </svg>
                                  </button>
                                  <button
                                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-red-400 transition-all"
                                    onClick={() => {
                                      handleDeleteChildPart(realIdx);
                                      setChildPartCarouselPage(0);
                                    }}
                                    type="button"
                                    title="Delete"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              ),
                              activeFilter: activeChildPartTableFilter,
                            };

                            return viewMode === "cards" || isMobile ? (
                              <ChildPartCardView {...commonProps} />
                            ) : (
                              <ChildPartTable {...commonProps} />
                            );
                          })}
                        </div>
                        {/* Carousel navigation */}
                        {totalPages > 1 && (
                          <div className="flex justify-center items-center gap-2 mt-4">
                            <button
                              onClick={() =>
                                setChildPartCarouselPage((i) =>
                                  Math.max(0, i - 1),
                                )
                              }
                              disabled={page === 0}
                              className={`px-3 py-1 rounded-lg font-bold flex flex-col items-center text-xs transition-all duration-200 ${
                                page === 0
                                  ? "bg-slate-800 text-slate-400 cursor-not-allowed"
                                  : "bg-slate-700 text-white hover:bg-slate-600"
                              }`}
                            >
                              <span className="text-base">&#8592;</span>
                              <span>Sebelumnya</span>
                            </button>
                            <div className="text-center font-bold text-base w-12">
                              <span className="text-white">{page + 1}</span>{" "}
                              <span className="text-slate-400">/</span>{" "}
                              <span className="text-white">{totalPages}</span>
                            </div>
                            <button
                              onClick={() =>
                                setChildPartCarouselPage((i) =>
                                  Math.min(totalPages - 1, i + 1),
                                )
                              }
                              disabled={page === totalPages - 1}
                              className={`px-3 py-1 rounded-lg font-bold flex flex-col items-center text-xs transition-all duration-200 ${
                                page === totalPages - 1
                                  ? "bg-slate-800 text-slate-400 cursor-not-allowed"
                                  : "bg-blue-700 text-white hover:bg-blue-800"
                              }`}
                            >
                              <span>Selanjutnya</span>
                              <span className="text-base">&#8594;</span>
                            </button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-slate-800 rounded-full flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-300 mb-2">
                      Data Child Part Belum Ditambahkan
                    </h3>
                    <p className="text-slate-400 mb-6">
                      Belum ada material child part yang ditambahkan ke dalam
                      jadwal produksi ini.
                    </p>
                    <button
                      onClick={() => setShowChildPartModal(true)}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      Tambah Child Part Pertama
                    </button>
                  </div>
                </div>
              )}
            </div>
            {/* Modal Child Part */}
            <ChildPart
              isOpen={showChildPartModal}
              onClose={() => setShowChildPartModal(false)}
              onGenerate={handleGenerateChildPart}
            />
            {/* Modal Edit Child Part */}
            {editChildPartIdx !== null && (
              <ChildPart
                isOpen={true}
                onClose={() => setEditChildPartIdx(null)}
                onGenerate={(data) => {
                  setChildParts((prev) =>
                    prev.map((c, i) =>
                      i === editChildPartIdx ? { ...c, ...data } : c,
                    ),
                  );
                  setEditChildPartIdx(null);
                }}
                // Prefill data
                {...childParts[editChildPartIdx]}
              />
            )}
          </div>
        )}

        {/* Modal component */}
        <Modal
          isOpen={notification.isOpen}
          onClose={hideNotification}
          title={notification.title}
          type={notification.type}
          onConfirm={notification.onConfirm}
          confirmText={notification.confirmText}
          cancelText={notification.cancelText}
        >
          {notification.message}
        </Modal>
        {showDeleteConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-gray-900 rounded-2xl p-8 border border-gray-700 max-w-sm w-full">
              <h2 className="text-xl font-bold text-white mb-2">
                Konfirmasi Hapus
              </h2>
              <p className="text-gray-300 mb-6">
                Apakah Anda yakin ingin menghapus part ini?
              </p>
              <div className="flex gap-4 justify-end">
                <button
                  onClick={handleCancelDelete}
                  className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchedulerPage;
