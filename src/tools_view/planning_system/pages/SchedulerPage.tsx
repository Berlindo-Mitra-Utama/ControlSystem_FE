import { useState, useEffect } from "react";
import ProductionForm from "../components/layout/ProductionForm";
import ScheduleTable from "../components/layout/ScheduleProduction";
import React from "react";
import { useSchedule } from "../contexts/ScheduleContext";
import type { SavedSchedule } from "../contexts/ScheduleContext";
import { useNavigate } from "react-router-dom";
import Modal from "../components/ui/Modal";
import EditScheduleModal from "../components/ui/EditScheduleModal";
import { useNotification } from "../../../hooks/useNotification";
import ChildPart from "../components/layout/ChildPart";
import ChildPartTable from "../components/layout/ChildPartTable";
import ChildPartCardView from "../components/layout/ChildPartCardView";
import ViewModeToggle from "../components/layout/ViewModeToggle";
import { useTheme } from "../../contexts/ThemeContext";
import * as XLSX from "xlsx";
import { X } from "lucide-react";
import {
  PlanningSystemService,
  ProductPlanningData,
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
  calculateTotalAkumulasiDelivery,
  calculateTotalAkumulasiHasilProduksi,
  recalculateAllAkumulasi,
  prepareTableViewData,
} from "../utils/scheduleCalcUtils";
import {
  MONTHS,
  mockData,
  getScheduleName,
  parseScheduleName,
} from "../utils/scheduleDateUtils";
import { ScheduleItem } from "../types/scheduleTypes";
import { ChildPartData } from "../types/childPartTypes";
import {
  BarChart2,
  Package,
  Layers,
  Target,
  Factory,
  Eye,
  Calendar,
  ArrowLeft,
  Download,
  Trash2,
  Cog,
  Clock,
  CheckCircle,
  Edit3,
  Plus,
} from "lucide-react";

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

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.8;
    }
  }

  @keyframes shimmer {
    0% {
      background-position: -200px 0;
    }
    100% {
      background-position: calc(200px + 100%) 0;
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

  .card-hover {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .card-hover:hover {
    transform: translateY(-2px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  .button-hover {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .button-hover:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }

  .gradient-text {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .glass-effect {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }

  .smooth-scroll {
    scroll-behavior: smooth;
  }

  .focus-ring {
    @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900;
  }

  .text-shadow {
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .shadow-soft {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  .shadow-medium {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }

  .shadow-large {
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
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
    loadSchedule,
  } = useSchedule();

  // Helper untuk membentuk ID konsisten: part-customer-monthIndex-year (monthIndex 0-11)
  const makeScheduleId = (
    part: string,
    monthIndex: number,
    year: number,
    customer?: string,
  ) =>
    customer
      ? `${part}-${customer}-${monthIndex}-${year}`
          .replace(/\s+/g, "-")
          .toLowerCase()
      : `${part}-${monthIndex}-${year}`.replace(/\s+/g, "-").toLowerCase();
  const navigate = useNavigate();
  const { uiColors, theme } = useTheme();
  const {
    notification,
    hideNotification,
    showAlert,
    showSuccess,
    showConfirm,
    showNotification,
  } = useNotification();

  // Helper function untuk memformat image URL secara konsisten
  const formatImageUrl = (imageData?: string, mimeType?: string): string => {
    if (!imageData) return "";

    // Jika sudah ada prefix data:, gunakan apa adanya
    if (imageData.startsWith("data:")) {
      return imageData;
    }

    // Jika tidak ada prefix, tambahkan prefix data: URL
    const mime = mimeType || "image/jpeg";
    return `data:${mime};base64,${imageData}`;
  };

  // Helper function untuk mengoptimalkan ukuran gambar sebelum disimpan
  const optimizeImageForStorage = (imageUrl: string): string => {
    if (!imageUrl || !imageUrl.startsWith("data:")) return imageUrl;

    try {
      // Jika gambar terlalu besar (> 5MB), kompres atau gunakan placeholder
      const base64Data = imageUrl.split(",")[1];
      const sizeInBytes = Math.ceil((base64Data.length * 3) / 4);
      const sizeInMB = sizeInBytes / (1024 * 1024);

      if (sizeInMB > 5) {
        console.log(
          `⚠️ Image too large (${sizeInMB.toFixed(2)}MB), optimizing for storage`,
        );

        // Untuk sementara, gunakan placeholder image yang lebih kecil
        // TODO: Implement proper image compression
        return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1lcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNmI3MjgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2U8L3RleHQ+PC9zdmc+";
      }

      return imageUrl;
    } catch (error) {
      console.error("Error optimizing image:", error);
      return imageUrl;
    }
  };

  // Helper function untuk membersihkan data gambar yang terlalu besar
  const cleanLargeImages = (schedules: any[]): any[] => {
    return schedules.map((schedule) => {
      const cleanedSchedule = { ...schedule };

      // Clean form image
      if (cleanedSchedule.form?.partImageUrl) {
        cleanedSchedule.form.partImageUrl = optimizeImageForStorage(
          cleanedSchedule.form.partImageUrl,
        );
      }

      // Clean productInfo image
      if (cleanedSchedule.productInfo?.partImageUrl) {
        cleanedSchedule.productInfo.partImageUrl = optimizeImageForStorage(
          cleanedSchedule.productInfo.partImageUrl,
        );
      }

      return cleanedSchedule;
    });
  };

  // Helper function untuk memulihkan gambar dari placeholder
  const restoreImageFromPlaceholder = (
    schedule: any,
    originalImageUrl?: string,
  ): any => {
    if (!schedule) return schedule;

    const restoredSchedule = { ...schedule };

    // Check if current image is placeholder
    const isPlaceholder = (imageUrl: string) => {
      return (
        imageUrl &&
        imageUrl.includes(
          "PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1lcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNmI3MjgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2U8L3RleHQ+PC9zdmc+",
        )
      );
    };

    // Restore form image if it's placeholder and we have original
    if (
      restoredSchedule.form?.partImageUrl &&
      isPlaceholder(restoredSchedule.form.partImageUrl)
    ) {
      if (originalImageUrl) {
        restoredSchedule.form.partImageUrl = originalImageUrl;
        console.log("🔄 Restored form image from placeholder");
      } else {
        // Remove placeholder if no original available
        restoredSchedule.form.partImageUrl = undefined;
        console.log("🗑️ Removed placeholder from form (no original available)");
      }
    }

    // Restore productInfo image if it's placeholder and we have original
    if (
      restoredSchedule.productInfo?.partImageUrl &&
      isPlaceholder(restoredSchedule.productInfo.partImageUrl)
    ) {
      if (originalImageUrl) {
        restoredSchedule.productInfo.partImageUrl = originalImageUrl;
        console.log("🔄 Restored productInfo image from placeholder");
      } else {
        // Remove placeholder if no original available
        restoredSchedule.productInfo.partImageUrl = undefined;
        console.log(
          "🗑️ Removed placeholder from productInfo (no original available)",
        );
      }
    }

    return restoredSchedule;
  };

  // Helper function untuk load image dari database
  const loadImageFromDatabase = async (
    imageId: string,
  ): Promise<string | null> => {
    try {
      // Load image dari database berdasarkan ID
      const response = await PlanningSystemService.getProductPlanningById(
        parseInt(imageId),
      );
      if (
        response &&
        response.productPlanning &&
        response.productPlanning.partImageBase64
      ) {
        // Format image URL dari base64
        const imageUrl = formatImageUrl(
          response.productPlanning.partImageBase64,
          response.productPlanning.partImageMimeType,
        );
        console.log("✅ Image loaded from database:", imageId);
        return imageUrl;
      }
      return null;
    } catch (error) {
      console.error("❌ Error loading image from database:", error);
      return null;
    }
  };

  // Helper function untuk cleanup localStorage yang penuh
  const cleanupLocalStorage = () => {
    try {
      // Clear old data
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes("savedSchedules")) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => {
        try {
          localStorage.removeItem(key);
          console.log(`🗑️ Removed old localStorage key: ${key}`);
        } catch (error) {
          console.error(`❌ Error removing key ${key}:`, error);
        }
      });

      console.log("🧹 localStorage cleanup completed");
      return true;
    } catch (error) {
      console.error("❌ Error during localStorage cleanup:", error);
      return false;
    }
  };

  // Helper function untuk save dengan fallback strategy
  const saveToLocalStorageWithFallback = async (
    data: any[],
    key: string = "savedSchedules",
  ) => {
    try {
      // Try to save with optimized images first
      const optimizedData = cleanLargeImages(data);
      localStorage.setItem(key, JSON.stringify(optimizedData));
      console.log(
        "✅ Data berhasil disimpan ke localStorage dengan gambar yang dioptimasi",
      );
      return true;
    } catch (storageError) {
      console.error("❌ Error saving to localStorage:", storageError);

      if (storageError.name === "QuotaExceededError") {
        console.log("⚠️ localStorage penuh, mencoba cleanup...");

        // Try cleanup first
        if (cleanupLocalStorage()) {
          try {
            const optimizedData = cleanLargeImages(data);
            localStorage.setItem(key, JSON.stringify(optimizedData));
            console.log(
              "✅ Data berhasil disimpan setelah cleanup localStorage",
            );
            return true;
          } catch (retryError) {
            console.error("❌ Still can't save after cleanup:", retryError);
          }
        }

        // Second fallback: save to database
        console.log("🔄 localStorage masih penuh, mencoba save ke database...");
        try {
          const saveToDatabaseResult = await saveSchedulesToDatabase(data);
          if (saveToDatabaseResult) {
            console.log(
              "✅ Data berhasil disimpan ke database sebagai fallback",
            );
            showAlert(
              "localStorage penuh. Data berhasil disimpan ke database.",
              "Success",
            );

            // Save metadata ke localStorage (tanpa gambar)
            const metadataOnly = data.map((schedule) => ({
              ...schedule,
              form: { ...schedule.form, partImageUrl: `db://${schedule.id}` },
              productInfo: {
                ...schedule.productInfo,
                partImageUrl: `db://${schedule.id}`,
              },
              _storedInDatabase: true,
            }));

            try {
              localStorage.setItem(key, JSON.stringify(metadataOnly));
              console.log(
                "✅ Metadata tersimpan di localStorage, gambar di database",
              );
            } catch (metadataError) {
              console.log(
                "⚠️ Metadata tidak bisa disimpan di localStorage, tapi data aman di database",
              );
            }

            return true;
          }
        } catch (dbError) {
          console.error("❌ Error saving to database:", dbError);
        }

        // Final fallback: save without images to localStorage
        try {
          const dataWithoutImages = data.map((schedule) => ({
            ...schedule,
            form: { ...schedule.form, partImageUrl: undefined },
            productInfo: { ...schedule.productInfo, partImageUrl: undefined },
          }));

          localStorage.setItem(key, JSON.stringify(dataWithoutImages));
          console.log(
            "✅ Data disimpan tanpa gambar ke localStorage (final fallback)",
          );
          showAlert(
            "localStorage penuh. Data disimpan tanpa gambar.",
            "Warning",
          );
          return true;
        } catch (fallbackError) {
          console.error("❌ Final fallback save juga gagal:", fallbackError);
          showAlert(
            "Gagal menyimpan data. Silakan refresh halaman dan coba lagi.",
            "Error",
          );
          return false;
        }
      }

      return false;
    }
  };

  // Helper function untuk save schedules ke database sebagai fallback
  const saveSchedulesToDatabase = async (
    schedules: any[],
  ): Promise<boolean> => {
    try {
      console.log("🔄 Mencoba save schedules ke database...");

      // Filter schedules yang memiliki gambar
      const schedulesWithImages = schedules.filter(
        (schedule) =>
          schedule.form?.partImageUrl || schedule.productInfo?.partImageUrl,
      );

      if (schedulesWithImages.length === 0) {
        console.log(
          "ℹ️ Tidak ada schedule dengan gambar yang perlu disimpan ke database",
        );
        return true;
      }

      let successCount = 0;

      for (const schedule of schedulesWithImages) {
        try {
          // Jika schedule sudah ada di database, update
          if (schedule.backendId) {
            const updateData = {
              partName: schedule.form?.part || "",
              customerName: schedule.form?.customer || "",
              currentStock: schedule.form?.stock || 0,
              partImageBase64:
                schedule.form?.partImageUrl ||
                schedule.productInfo?.partImageUrl ||
                "",
              partImageMimeType: "image/png", // Default, bisa di-detect dari data URL
              // Tambahkan field lain yang diperlukan
            };

            await PlanningSystemService.updateProductPlanning(
              schedule.backendId,
              updateData,
            );
            console.log(
              `✅ Schedule ${schedule.id} berhasil diupdate di database`,
            );
            successCount++;
          } else {
            // Jika schedule baru, create
            const createData: ProductPlanningData = {
              partName: schedule.form?.part || "",
              customerName: schedule.form?.customer || "",
              productionMonth: new Date().getMonth(), // Current month
              productionYear: new Date().getFullYear(), // Current year
              currentStock: schedule.form?.stock || 0,
              partImageBase64:
                schedule.form?.partImageUrl ||
                schedule.productInfo?.partImageUrl ||
                "",
              partImageMimeType: "image/png", // Default, bisa di-detect dari data URL
            };

            const response =
              await PlanningSystemService.createProductPlanning(createData);
            console.log(
              `✅ Schedule ${schedule.id} berhasil dibuat di database dengan ID: ${response.productPlanning.id}`,
            );

            // Update local ID dengan backend ID
            schedule.backendId = response.productPlanning.id;
            successCount++;
          }
        } catch (scheduleError) {
          console.error(
            `❌ Error saving schedule ${schedule.id} to database:`,
            scheduleError,
          );
          // Continue dengan schedule berikutnya
        }
      }

      console.log(
        `✅ Berhasil save ${successCount}/${schedulesWithImages.length} schedules ke database`,
      );
      return successCount > 0; // Return true jika minimal ada 1 yang berhasil
    } catch (error) {
      console.error("❌ Error dalam saveSchedulesToDatabase:", error);
      return false;
    }
  };

  // Helper function untuk handle error saat edit gambar
  const handleImageEditError = (error: any, context: string) => {
    console.error(`❌ Error saat ${context}:`, error);

    if (error.name === "QuotaExceededError") {
      showAlert(
        "localStorage penuh. Gambar tidak bisa disimpan. Silakan hapus beberapa data lama atau refresh halaman.",
        "Error",
      );
    } else if (error.message?.includes("image")) {
      showAlert(
        "Gagal memproses gambar. Pastikan format gambar valid dan ukuran tidak terlalu besar.",
        "Error",
      );
    } else {
      showAlert(`Gagal ${context}. Silakan coba lagi.`, "Error");
    }
  };

  // Helper function untuk validate dan optimize image sebelum edit
  const validateAndOptimizeImage = (imageUrl: string): string | null => {
    if (!imageUrl) return null;

    try {
      // Check if it's a valid data URL
      if (!imageUrl.startsWith("data:")) {
        console.warn("⚠️ Invalid image format, expected data: URL");
        return null;
      }

      // Check image size
      const base64Data = imageUrl.split(",")[1];
      if (!base64Data) {
        console.warn("⚠️ Invalid base64 data");
        return null;
      }

      const sizeInBytes = Math.ceil((base64Data.length * 3) / 4);
      const sizeInMB = sizeInBytes / (1024 * 1024);

      if (sizeInMB > 5) {
        console.warn(`⚠️ Image too large (${sizeInMB.toFixed(2)}MB), max 5MB`);
        showAlert("Gambar terlalu besar. Maksimal 5MB.", "Warning");
        return null;
      }

      // Return optimized version
      return optimizeImageForStorage(imageUrl);
    } catch (error) {
      console.error("❌ Error validating image:", error);
      return null;
    }
  };

  // Helper function untuk memastikan gambar tersimpan dengan benar
  const ensureImageData = (schedule: any) => {
    // Pastikan gambar tersimpan di form dan productInfo
    if (schedule.form?.partImageUrl && !schedule.productInfo?.partImageUrl) {
      schedule.productInfo = {
        ...schedule.productInfo,
        partImageUrl: schedule.form.partImageUrl,
      };
    }

    if (schedule.productInfo?.partImageUrl && !schedule.form?.partImageUrl) {
      schedule.form = {
        ...schedule.form,
        partImageUrl: schedule.productInfo.partImageUrl,
      };
    }

    // Hanya optimize gambar yang baru (bukan yang sudah ada)
    // Jangan optimize gambar yang sudah di localStorage
    if (
      schedule.form?.partImageUrl &&
      !schedule.form.partImageUrl.includes(
        "PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1lcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNmI3MjgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2U8L3RleHQ+PC9zdmc+",
      )
    ) {
      // Ini gambar baru, optimize jika perlu
      schedule.form.partImageUrl = optimizeImageForStorage(
        schedule.form.partImageUrl,
      );
    }

    if (
      schedule.productInfo?.partImageUrl &&
      !schedule.productInfo.partImageUrl.includes(
        "PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWw9IkFyaWFsLCBzYW5zLWVyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2YjcyODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZTwvdGV4dD48L3N2Zz4=",
      )
    ) {
      // Ini gambar baru, optimize jika perlu
      schedule.productInfo.partImageUrl = optimizeImageForStorage(
        schedule.productInfo.partImageUrl,
      );
    }

    return schedule;
  };

  // Enhanced smooth scroll function with direct scroll bar manipulation
  const smoothScrollToDate = (targetDate: number, dayName: string) => {
    return new Promise<void>((resolve) => {
      console.log(
        `🎯 Memulai enhanced smooth scroll ke tanggal ${targetDate} (${dayName})`,
      );
      console.log(`🔍 Mencari elemen dengan data-date="${targetDate}"...`);

      // Find the specific date column
      const dateColumn = document.querySelector(`[data-date="${targetDate}"]`);
      console.log(`🔍 Hasil pencarian dateColumn:`, dateColumn);

      if (!dateColumn) {
        console.log(`⚠️ Tanggal ${targetDate} tidak ditemukan`);
        console.log(
          `🔍 Debug: Semua elemen dengan data-date:`,
          document.querySelectorAll("[data-date]"),
        );
        resolve();
        return;
      }

      // Find the actual scrollable container - be more specific
      let scrollableContainer = null;

      // First, try to find the container that actually has scroll content
      const possibleContainers = [
        // ScheduleTableView container
        document.querySelector(".flex-1.overflow-x-auto"),
        // ChildPartTable container
        document.querySelector(".flex-1.overflow-x-auto.custom-scrollbar"),
        // Any container with overflow-x-auto
        document.querySelector('[class*="overflow-x-auto"]'),
        // Fallback to the date column's closest scrollable parent
        dateColumn.closest(".overflow-x-auto") ||
          dateColumn.closest('[class*="overflow-x"]'),
      ];

      console.log(`🔍 Debug: Semua possible containers:`, possibleContainers);

      // Find the container that actually has scrollable content
      for (const container of possibleContainers) {
        if (container && container.scrollWidth > container.clientWidth) {
          console.log(
            `🔍 Container dengan scroll content ditemukan:`,
            container,
          );
          console.log(`🔍 Container scroll info:`, {
            scrollWidth: container.scrollWidth,
            clientWidth: container.clientWidth,
            hasScroll: container.scrollWidth > container.clientWidth,
          });
          scrollableContainer = container;
          break;
        }
      }

      console.log("🔍 Scrollable containers found:", possibleContainers);
      console.log("🔍 Selected scrollable container:", scrollableContainer);

      if (scrollableContainer) {
        console.log("🔍 Using scrollable container:", scrollableContainer);
        console.log("🔍 Container scroll info:", {
          scrollWidth: scrollableContainer.scrollWidth,
          clientWidth: scrollableContainer.clientWidth,
          scrollLeft: scrollableContainer.scrollLeft,
          maxScrollLeft:
            scrollableContainer.scrollWidth - scrollableContainer.clientWidth,
        });

        // Get container and column dimensions
        const containerRect = scrollableContainer.getBoundingClientRect();
        const columnRect = dateColumn.getBoundingClientRect();
        const currentScrollLeft = scrollableContainer.scrollLeft;

        // Calculate the target scroll position to center the column
        const columnCenter = columnRect.left + columnRect.width / 2;
        const containerCenter = containerRect.left + containerRect.width / 2;
        const scrollOffset = columnCenter - containerCenter;
        const targetScrollLeft = currentScrollLeft + scrollOffset;

        // Ensure we don't scroll beyond bounds
        const maxScrollLeft =
          scrollableContainer.scrollWidth - scrollableContainer.clientWidth;
        const finalTargetScrollLeft = Math.max(
          0,
          Math.min(targetScrollLeft, maxScrollLeft),
        );

        console.log("🔍 Enhanced scroll calculation:", {
          containerWidth: containerRect.width,
          columnWidth: columnRect.width,
          columnLeft: columnRect.left,
          containerLeft: containerRect.left,
          currentScrollLeft,
          targetScrollLeft,
          finalTargetScrollLeft,
          scrollOffset,
          maxScrollLeft,
        });

        // Add visual indicator for scroll progress
        const scrollProgressIndicator = document.createElement("div");
        scrollProgressIndicator.className =
          "fixed top-4 right-4 z-50 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg";
        scrollProgressIndicator.innerHTML = `
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Scrolling ke tanggal ${targetDate}...</span>
          </div>
          <div class="w-full bg-white bg-opacity-30 rounded-full h-2 mt-2">
            <div class="bg-white h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
          </div>
        `;
        document.body.appendChild(scrollProgressIndicator);

        const progressBar = scrollProgressIndicator.querySelector(
          ".bg-white.h-2",
        ) as HTMLElement;

        // Enhanced smooth scroll with step-by-step animation
        const startScrollLeft = currentScrollLeft;
        const distance = finalTargetScrollLeft - startScrollLeft;
        const duration = 1200; // 1.2 seconds for faster response
        const startTime = performance.now();

        // Animate scroll step by step
        const animateScroll = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);

          // Easing function for smooth animation
          const easeInOutCubic = (t: number) => {
            return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          };

          const easedProgress = easeInOutCubic(progress);
          const currentScrollLeft = startScrollLeft + distance * easedProgress;

          // Update scroll position directly
          scrollableContainer.scrollLeft = currentScrollLeft;

          // Update progress bar
          if (progressBar) {
            progressBar.style.width = `${progress * 100}%`;
          }

          // Continue animation or complete
          if (progress < 1) {
            requestAnimationFrame(animateScroll);
          } else {
            // Animation complete
            console.log("✅ Enhanced smooth scroll selesai");
            console.log(
              "🔍 Final scroll position:",
              scrollableContainer.scrollLeft,
            );

            // Remove progress indicator
            setTimeout(() => {
              if (scrollProgressIndicator.parentNode) {
                scrollProgressIndicator.parentNode.removeChild(
                  scrollProgressIndicator,
                );
              }
            }, 1000);

            // Add scroll bar highlight effect
            if (scrollableContainer.classList.contains("custom-scrollbar")) {
              scrollableContainer.classList.add("scroll-animation-active");

              // Remove animation class after scroll completes
              setTimeout(() => {
                scrollableContainer.classList.remove("scroll-animation-active");
              }, 3000);
            }

            resolve();
          }
        };

        // Start animation
        requestAnimationFrame(animateScroll);
      } else {
        console.log(
          "⚠️ Tidak ada scrollable container yang valid, menggunakan scrollIntoView",
        );
        // Fallback to scrollIntoView
        dateColumn.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center",
        });

        setTimeout(() => {
          resolve();
        }, 1000);
      }
    });
  };

  // Inject CSS untuk animasi dan custom scrollbar
  useEffect(() => {
    injectCSS();

    // Add custom scrollbar styles
    const customScrollbarCSS = `
      .custom-scrollbar::-webkit-scrollbar {
        height: 12px;
        width: 12px;
      }
      
      .custom-scrollbar::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 6px;
        border: 1px solid #e2e8f0;
      }
      
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        border-radius: 6px;
        border: 2px solid #f1f5f9;
        transition: all 0.3s ease;
      }
      
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(135deg, #2563eb, #7c3aed);
        transform: scale(1.1);
      }
      
      .custom-scrollbar::-webkit-scrollbar-corner {
        background: #f1f5f9;
      }
      
      .scroll-animation-active {
        animation: scrollPulse 2s ease-in-out infinite;
      }
      
      @keyframes scrollPulse {
        0%, 100% { 
          box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
          transform: scale(1);
        }
        50% { 
          box-shadow: 0 0 0 10px rgba(59, 130, 246, 0.3);
          transform: scale(1.05);
        }
      }
      
      .scroll-progress-track {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 4px;
        background: rgba(59, 130, 246, 0.1);
        z-index: 9999;
      }
      
      .scroll-progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #3b82f6, #8b5cf6);
        width: 0%;
        transition: width 0.3s ease;
        border-radius: 0 2px 2px 0;
      }
    `;

    // Inject custom scrollbar CSS
    const styleElement = document.createElement("style");
    styleElement.textContent = customScrollbarCSS;
    document.head.appendChild(styleElement);

    return () => {
      if (styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
    };
  }, []);

  const [navigationLoading, setNavigationLoading] = useState(false);
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
    partImageUrl: "", // Tambahkan field untuk gambar part
  });

  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [showProductionForm, setShowProductionForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [manpowerList, setManpowerList] = useState<
    { id: number; name: string }[]
  >([]);

  const [editForm, setEditForm] = useState<Partial<ScheduleItem>>({});

  // Date picker states
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchDate, setSearchDate] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  const [showChildPartModal, setShowChildPartModal] = useState(false);
  const [childParts, setChildParts] = useState<ChildPartData[]>([]);
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

  // State untuk tracking jadwal yang baru di-generate dan belum tersimpan
  const [isNewlyGeneratedSchedule, setIsNewlyGeneratedSchedule] =
    useState(false);

  const [showFilterDropdown, setShowFilterDropdown] = useState<boolean>(false);
  const [showPartFilterDropdown, setShowPartFilterDropdown] =
    useState<boolean>(false);

  const [editChildPartIdx, setEditChildPartIdx] = useState<number | null>(null);
  const [activeChildPartTableFilter, setActiveChildPartTableFilter] = useState<
    string[]
  >([]);

  // State untuk pagination child parts
  const [currentChildPartPage, setCurrentChildPartPage] = useState(0);
  const [childPartsPerPage] = useState(3);

  // Tambahkan state untuk mobile detection:
  const [isMobile, setIsMobile] = useState(false);

  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [showEditPartModal, setShowEditPartModal] = useState(false);
  const [editingPartId, setEditingPartId] = useState<string | null>(null);
  const [editingPartName, setEditingPartName] = useState<string>("");
  const [editingPartCustomer, setEditingPartCustomer] = useState<string>("");
  const [editingPartImage, setEditingPartImage] = useState<File | null>(null);
  const [editingPartImagePreview, setEditingPartImagePreview] = useState<
    string | null
  >(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // State untuk tracking jadwal yang sedang diedit
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(
    null,
  );
  const [editingScheduleBackendId, setEditingScheduleBackendId] = useState<
    number | null
  >(null);

  // State untuk modal edit jadwal yang sederhana
  const [showEditScheduleModal, setShowEditScheduleModal] = useState(false);
  const [editingScheduleData, setEditingScheduleData] = useState<{
    month: number;
    year: number;
    stock: number;
    partName: string;
    customer: string;
  } | null>(null);
  const [isUpdatingSchedule, setIsUpdatingSchedule] = useState(false);

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
    partImageUrl?: string;
    lastSavedBy?: {
      nama: string;
      role: string;
    };
    lastSavedAt?: string;
  }>({
    partName: "",
    customer: "",
    partImageUrl: "",
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

  // Check for navigation from disruption page and auto-open corresponding schedule
  useEffect(() => {
    const navigateToField = sessionStorage.getItem("navigateToField");
    if (navigateToField) {
      try {
        const target = JSON.parse(navigateToField);
        if (
          target.navigateToSchedule &&
          target.partName &&
          target.customerName
        ) {
          // Set navigation loading state
          setNavigationLoading(true);
          console.log("🚀 Memulai navigasi otomatis...");
          console.log("🎯 Target data:", target);

          // Check if this is a "back to planning" navigation
          if (target.showChildPartTable) {
            console.log("🔄 Navigasi: Kembali ke Planning - ChildPartTable");
          } else {
            console.log("🎯 Navigasi: Navigasi ke Field Disruption");
          }

          // Clear the navigation target
          sessionStorage.removeItem("navigateToField");

          // Wait for DOM to be ready
          setTimeout(() => {
            // Set the form to match the target part and customer
            setForm((prev) => ({
              ...prev,
              part: target.partName,
              customer: target.customerName,
            }));

            // Set selected part and customer for filtering
            setSelectedPart(target.partName);
            setSelectedCustomer(target.customerName);

            // Set child part filter to show only the target part
            setChildPartFilter([target.partName]);

            // If openScheduleDirectly is true, try to find and open the existing schedule
            if (target.openScheduleDirectly) {
              // Look for existing schedule in savedSchedules
              const existingSchedule = savedSchedules.find(
                (schedule) =>
                  schedule.productInfo?.partName === target.partName &&
                  schedule.productInfo?.customer === target.customerName,
              );

              if (existingSchedule) {
                // Load the existing schedule
                console.log(
                  `✅ Schedule ditemukan untuk ${target.partName} - ${target.customerName}, membuka...`,
                );

                // Set the schedule data
                setSchedule(existingSchedule.schedule || []);

                // Set the form data from the schedule form
                if (existingSchedule.form) {
                  setForm((prev) => ({
                    ...prev,
                    part: existingSchedule.form.part || target.partName,
                    customer:
                      existingSchedule.form.customer || target.customerName,
                    timePerPcs: existingSchedule.form.timePerPcs || 257,
                    cycle1: existingSchedule.form.cycle1 || 0,
                    cycle7: existingSchedule.form.cycle7 || 0,
                    cycle35: existingSchedule.form.cycle35 || 0,
                    stock: existingSchedule.form.stock || 332,
                    planningHour: existingSchedule.form.planningHour || 274,
                    overtimeHour: existingSchedule.form.overtimeHour || 119,
                    planningPcs: existingSchedule.form.planningPcs || 3838,
                    overtimePcs: existingSchedule.form.overtimePcs || 1672,
                  }));
                }

                // Set selected month and year from schedule
                if (
                  existingSchedule.schedule &&
                  existingSchedule.schedule.length > 0
                ) {
                  // Try to get month and year from the schedule name or use current date
                  if (existingSchedule.name) {
                    // Extract month and year from schedule name (e.g., "Agustus 2025")
                    const monthMatch =
                      existingSchedule.name.match(/(\w+)\s+(\d{4})/);
                    if (monthMatch) {
                      const monthName = monthMatch[1];
                      const year = parseInt(monthMatch[2]);
                      const monthIndex = MONTHS.findIndex(
                        (m) => m.toLowerCase() === monthName.toLowerCase(),
                      );
                      if (monthIndex !== -1) {
                        setSelectedMonth(monthIndex);
                        setSelectedYear(year);
                      }
                    }
                  }
                }

                // Show success message
                console.log(
                  `✅ Schedule untuk ${target.partName} - ${target.customerName} berhasil dibuka`,
                );

                // Switch to table view to show the schedule details
                setViewMode("table");
              } else {
                console.log(
                  `⚠️ Schedule tidak ditemukan untuk ${target.partName} - ${target.customerName}, akan buat baru`,
                );
              }
            }

            // Show success message in console for debugging
            console.log(
              `✅ Schedule untuk ${target.partName} - ${target.customerName} telah dibuka`,
            );

            // Scroll to the child part table
            const childPartSection = document.querySelector(
              '[data-section="child-parts"]',
            );
            if (childPartSection) {
              console.log("🎯 Scrolling ke ChildPartTable section...");
              childPartSection.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });

              // Add highlight effect to the child part section
              childPartSection.classList.add(
                "ring-4",
                "ring-blue-500",
                "ring-opacity-50",
              );
              setTimeout(() => {
                childPartSection.classList.remove(
                  "ring-4",
                  "ring-blue-500",
                  "ring-opacity-50",
                );
              }, 3000);
            }

            // If showChildPartTable is true, focus on the ChildPartTable and stop loading
            if (target.showChildPartTable) {
              console.log(
                "🎯 Menampilkan ChildPartTable untuk navigasi kembali...",
              );

              // Ensure we're in the right view mode to show ChildPartTable
              setViewMode("table"); // This will show the ChildPartTable in table view for desktop

              // If navigateToSpecificField is true, we need to navigate to the specific disrupted field
              if (
                target.navigateToSpecificField &&
                target.day &&
                target.shift &&
                target.type
              ) {
                console.log("🎯 Navigasi ke field spesifik yang terdisrupt...");
                console.log(
                  `📍 Target: Day ${target.day}, Shift ${target.shift}, Type ${target.type}`,
                );

                // Store the specific field navigation data for ChildPartTable to use
                sessionStorage.setItem(
                  "navigateToField",
                  JSON.stringify({
                    partName: target.partName,
                    customerName: target.customerName,
                    day: target.day,
                    shift: target.shift,
                    type: target.type,
                    fieldName: target.fieldName,
                    navigateToSchedule: false, // Don't trigger schedule navigation again
                    openScheduleDirectly: false,
                    scrollToSpecificDate: false,
                    showChildPartTable: false,
                    navigateToSpecificField: true,
                    timestamp: Date.now(),
                  }),
                );

                // Add a small delay to ensure the view mode change is applied
                setTimeout(() => {
                  // Scroll to the child part table again to ensure it's visible
                  const childPartSection = document.querySelector(
                    '[data-section="child-parts"]',
                  );
                  if (childPartSection) {
                    childPartSection.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });

                    // Add a simple green border highlight for "back to planning" navigation
                    childPartSection.classList.add(
                      "border-2",
                      "border-green-500",
                      "border-solid",
                    );
                    setTimeout(() => {
                      childPartSection.classList.remove(
                        "border-2",
                        "border-green-500",
                        "border-solid",
                      );
                    }, 6000);
                  }

                  // Show success message and stop loading
                  setNavigationLoading(false);
                  console.log(
                    "✅ Navigasi kembali ke ChildPartTable dengan field spesifik selesai!",
                  );

                  // Show a brief success indicator
                  const successIndicator = document.createElement("div");
                  successIndicator.className =
                    "fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50";
                  successIndicator.innerHTML = `
                          <div class="flex items-center gap-2">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            <span>Berhasil kembali ke Planning dengan field spesifik</span>
                          </div>
                        `;
                  document.body.appendChild(successIndicator);

                  // Remove success indicator after 3 seconds
                  setTimeout(() => {
                    if (successIndicator.parentNode) {
                      successIndicator.parentNode.removeChild(successIndicator);
                    }
                  }, 3000);
                }, 1500);
              } else {
                // Regular "back to planning" without specific field navigation
                // Add a small delay to ensure the view mode change is applied
                setTimeout(() => {
                  // Scroll to the child part table again to ensure it's visible
                  const childPartSection = document.querySelector(
                    '[data-section="child-parts"]',
                  );
                  if (childPartSection) {
                    childPartSection.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });

                    // Add a simple green border highlight for "back to planning" navigation
                    childPartSection.classList.add(
                      "border-2",
                      "border-green-500",
                      "border-solid",
                    );
                    setTimeout(() => {
                      childPartSection.classList.remove(
                        "border-2",
                        "border-green-500",
                        "border-solid",
                      );
                    }, 6000);
                  }

                  // Show success message and stop loading
                  setNavigationLoading(false);
                  console.log("✅ Navigasi kembali ke ChildPartTable selesai!");

                  // Show a brief success indicator
                  const successIndicator = document.createElement("div");
                  successIndicator.className =
                    "fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50";
                  successIndicator.innerHTML = `
                          <div class="flex items-center gap-2">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            <span>Berhasil kembali ke Planning</span>
                          </div>
                        `;
                  document.body.appendChild(successIndicator);

                  // Remove success indicator after 3 seconds
                  setTimeout(() => {
                    if (successIndicator.parentNode) {
                      successIndicator.parentNode.removeChild(successIndicator);
                    }
                  }, 3000);
                }, 1500);
              }
              return; // Exit early, don't continue with schedule table navigation
            }

            // If this is a direct navigation to specific field (not "back to planning")
            if (
              target.day &&
              target.shift &&
              target.type &&
              !target.showChildPartTable
            ) {
              console.log(
                "🎯 Navigasi langsung ke field spesifik yang terdisrupt...",
              );
              console.log(
                `📍 Target: Day ${target.day}, Shift ${target.shift}, Type ${target.type}`,
              );

              // Store the specific field navigation data for ChildPartTable to use
              sessionStorage.setItem(
                "navigateToField",
                JSON.stringify({
                  partName: target.partName,
                  customerName: target.customerName,
                  day: target.day,
                  shift: target.shift,
                  type: target.type,
                  fieldName: target.fieldName,
                  navigateToSchedule: false, // Don't trigger schedule navigation again
                  openScheduleDirectly: false,
                  scrollToSpecificDate: false,
                  showChildPartTable: false,
                  navigateToSpecificField: true,
                  timestamp: Date.now(),
                }),
              );

              // Switch to table view to show ChildPartTable
              setViewMode("table");

              // Add a delay to ensure the view mode change is applied
              setTimeout(() => {
                // Scroll to the child part table
                const childPartSection = document.querySelector(
                  '[data-section="child-parts"]',
                );
                if (childPartSection) {
                  childPartSection.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });

                  // Add a simple blue border highlight to the child part section
                  childPartSection.classList.add(
                    "border-2",
                    "border-blue-500",
                    "border-solid",
                  );
                  setTimeout(() => {
                    childPartSection.classList.remove(
                      "border-2",
                      "border-blue-500",
                      "border-solid",
                    );
                  }, 6000);
                }

                // Show success message and stop loading
                setNavigationLoading(false);
                console.log("✅ Navigasi langsung ke field spesifik selesai!");

                // Show a brief success indicator
                const successIndicator = document.createElement("div");
                successIndicator.className =
                  "fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50";
                successIndicator.innerHTML = `
                        <div class="flex items-center gap-2">
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                          <span>Berhasil navigasi ke field spesifik</span>
                        </div>
                      `;
                document.body.appendChild(successIndicator);

                // Remove success indicator after 3 seconds
                setTimeout(() => {
                  if (successIndicator.parentNode) {
                    successIndicator.parentNode.removeChild(successIndicator);
                  }
                }, 3000);
              }, 1500);

              return; // Exit early, don't continue with schedule table navigation
            }

            // If we have a schedule, also scroll to the schedule table
            if (target.openScheduleDirectly && schedule.length > 0) {
              setTimeout(() => {
                const scheduleSection = document.querySelector(
                  '[data-section="schedule-table"]',
                );
                if (scheduleSection) {
                  scheduleSection.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });

                  // Add highlight effect to the schedule section
                  scheduleSection.classList.add(
                    "ring-4",
                    "ring-blue-500",
                    "ring-opacity-50",
                  );
                  setTimeout(() => {
                    scheduleSection.classList.remove(
                      "ring-4",
                      "ring-blue-500",
                      "ring-opacity-50",
                    );
                  }, 3000);
                }

                // If scrollToSpecificDate is true, scroll to the specific date column
                if (target.scrollToSpecificDate && target.targetDate) {
                  // Wait longer for the DOM to be fully rendered and all components to be mounted
                  setTimeout(async () => {
                    console.log(
                      `🔍 Mencari kolom tanggal dengan data-date="${target.targetDate}"...`,
                    );
                    console.log(
                      `⏰ Delay 3 detik untuk memastikan DOM sudah siap...`,
                    );

                    // Add global scroll progress bar
                    const globalProgressTrack = document.createElement("div");
                    globalProgressTrack.className = "scroll-progress-track";
                    globalProgressTrack.innerHTML =
                      '<div class="scroll-progress-bar"></div>';
                    document.body.appendChild(globalProgressTrack);

                    const globalProgressBar = globalProgressTrack.querySelector(
                      ".scroll-progress-bar",
                    ) as HTMLElement;

                    // Debug: Log all scrollable containers before scrolling
                    console.log(
                      "🔍 Debug: All scrollable containers before scrolling:",
                    );
                    const allScrollableContainers = document.querySelectorAll(
                      '.overflow-x-auto, [class*="overflow-x"]',
                    );
                    allScrollableContainers.forEach((container, index) => {
                      console.log(`Container ${index}:`, {
                        element: container,
                        className: container.className,
                        scrollWidth: container.scrollWidth,
                        clientWidth: container.clientWidth,
                        scrollLeft: container.scrollLeft,
                        hasScroll:
                          container.scrollWidth > container.clientWidth,
                      });
                    });

                    // Use the enhanced smooth scroll function
                    console.log(
                      `🎯 Memulai smoothScrollToDate untuk tanggal ${target.targetDate} (${target.dayName})`,
                    );
                    try {
                      await smoothScrollToDate(
                        target.targetDate,
                        target.dayName,
                      );
                      console.log(
                        `✅ smoothScrollToDate berhasil untuk tanggal ${target.targetDate}`,
                      );
                    } catch (error) {
                      console.error(
                        `❌ Error dalam smoothScrollToDate untuk tanggal ${target.targetDate}:`,
                        error,
                      );
                    }

                    // Update global progress bar
                    if (globalProgressBar) {
                      globalProgressBar.style.width = "100%";
                      setTimeout(() => {
                        if (globalProgressTrack.parentNode) {
                          globalProgressTrack.parentNode.removeChild(
                            globalProgressTrack,
                          );
                        }
                      }, 2000);
                    }

                    // Find the date column for highlighting
                    const dateColumn = document.querySelector(
                      `[data-date="${target.targetDate}"]`,
                    );
                    if (dateColumn) {
                      console.log(
                        `🎯 Highlighting tanggal ${target.targetDate} (${target.dayName})`,
                      );

                      // Add highlight effect to the date column
                      dateColumn.classList.add(
                        "ring-4",
                        "ring-green-500",
                        "ring-opacity-75",
                        "animate-pulse",
                      );

                      // Remove highlight after 5 seconds
                      setTimeout(() => {
                        dateColumn.classList.remove(
                          "ring-4",
                          "ring-green-500",
                          "ring-opacity-75",
                          "animate-pulse",
                        );
                      }, 5000);

                      // Also highlight the specific shift within the date column
                      const shiftElements =
                        dateColumn.querySelectorAll("[data-shift]");
                      console.log(
                        "🔍 Shift elements found:",
                        shiftElements.length,
                      );

                      const targetShiftElement = Array.from(shiftElements).find(
                        (el) =>
                          el.getAttribute("data-shift") ===
                          target.shift.toString(),
                      );

                      if (targetShiftElement) {
                        console.log(
                          "🎯 Target shift element found:",
                          targetShiftElement,
                        );
                        targetShiftElement.classList.add(
                          "bg-yellow-200",
                          "dark:bg-yellow-800/50",
                          "ring-2",
                          "ring-yellow-500",
                        );
                        setTimeout(() => {
                          targetShiftElement.classList.remove(
                            "bg-yellow-200",
                            "dark:bg-yellow-800/50",
                            "ring-2",
                            "ring-yellow-500",
                          );
                        }, 4000);
                      } else {
                        console.log("⚠️ Target shift element tidak ditemukan");
                      }
                    } else {
                      console.log(
                        `⚠️ Tanggal ${target.targetDate} tidak ditemukan untuk highlighting`,
                      );
                    }

                    // Stop navigation loading after all scrolling is complete
                    setTimeout(() => {
                      setNavigationLoading(false);
                      console.log("✅ Navigasi otomatis selesai!");
                    }, 2000);
                  }, 3000); // Wait longer for the schedule table to be fully rendered
                } else {
                  // If no specific date scrolling, stop loading after schedule table scroll
                  setTimeout(() => {
                    setNavigationLoading(false);
                    console.log("✅ Navigasi otomatis selesai!");
                  }, 2000);
                }
              }, 1000);
            } else {
              // If no schedule table, stop loading after child parts scroll
              setTimeout(() => {
                setNavigationLoading(false);
                console.log("✅ Navigasi otomatis selesai!");
              }, 2000);
            }
          }, 500);
        }
      } catch (error) {
        console.error("Error parsing navigation target:", error);
        sessionStorage.removeItem("navigateToField");
        setNavigationLoading(false);
      }
    }
  }, [savedSchedules, schedule]);

  // Generate schedule name from selected month/year
  const getCurrentScheduleName = () => {
    return getScheduleName(selectedMonth, selectedYear);
  };

  // Automatically load schedule if loadedSchedule prop changes
  useEffect(() => {
    if (loadedSchedule) {
      setForm(loadedSchedule.form); // Gunakan setForm langsung
      setSchedule(loadedSchedule.schedule); // Gunakan setSchedule langsung
      if (loadedSchedule.childParts) {
        setChildParts(loadedSchedule.childParts);
      }

      // Reset semua flag perubahan karena ini adalah schedule yang sudah tersimpan
      setHasUnsavedChanges(false);
      setHasScheduleChanges(false);
      setHasUnsavedChildPartChanges(false);
      setChildPartChanges(new Set());

      console.log(
        "✅ useEffect loadedSchedule: Flag perubahan di-reset untuk schedule yang sudah tersimpan",
      );

      // Update product info dari loaded schedule
      if (loadedSchedule.productInfo) {
        setProductInfo({
          partName: loadedSchedule.productInfo.partName || "",
          customer: loadedSchedule.productInfo.customer || "",
          partImageUrl: loadedSchedule.productInfo.partImageUrl || "",
          lastSavedBy: loadedSchedule.productInfo.lastSavedBy,
          lastSavedAt: loadedSchedule.productInfo.lastSavedAt,
        });
      } else {
        // Fallback ke informasi dari form
        setProductInfo({
          partName: loadedSchedule.form.part || "",
          customer: loadedSchedule.form.customer || "",
          partImageUrl: loadedSchedule.form.partImageUrl || "",
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

  // Update informasi produk ketika part, customer, atau gambar berubah
  useEffect(() => {
    updateProductInfo();
  }, [form.part, form.customer, form.partImageUrl]);

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

  // Load data dari backend saat komponen dimount
  useEffect(() => {
    const loadDataFromBackend = async () => {
      try {
        console.log("🔄 Loading data from backend...");
        // Cek apakah user sudah login
        const token = getAuthToken();
        if (!token) {
          console.log("❌ User belum login, skip loading dari backend");
          return;
        }

        // Load data planning system dari backend
        const { PlanningSystemService } = await import(
          "../../../services/API_Services"
        );

        try {
          const response = await PlanningSystemService.getAllProductPlanning();
          console.log("✅ Data loaded from backend:", response);

          // Update savedSchedules dengan data dari backend
          if (
            response.productPlannings &&
            response.productPlannings.length > 0
          ) {
            const backendSchedules = response.productPlannings.map(
              (planning: any) => {
                // Buat ID yang konsisten
                const monthIndex = planning.productionMonth - 1; // Konversi dari 1-12 ke 0-11
                const scheduleId =
                  `${planning.partName}-${planning.customerName}-${monthIndex}-${planning.productionYear}`
                    .replace(/\s+/g, "-")
                    .toLowerCase();

                return {
                  id: scheduleId,
                  backendId: planning.id,
                  name: `${MONTHS[monthIndex]} ${planning.productionYear}`,
                  date: planning.createdAt || new Date().toISOString(),
                  form: {
                    part: planning.partName,
                    customer: planning.customerName,
                    stock: planning.currentStock,
                    timePerPcs: 257,
                    partImageUrl: formatImageUrl(
                      planning.partImageBase64,
                      planning.partImageMimeType,
                    ),
                  },
                  schedule: [], // Schedule akan di-load terpisah jika diperlukan
                  productInfo: {
                    partName: planning.partName,
                    customer: planning.customerName,
                    partImageUrl: formatImageUrl(
                      planning.partImageBase64,
                      planning.partImageMimeType,
                    ),
                    lastSavedBy: undefined,
                    lastSavedAt: planning.updatedAt || planning.createdAt,
                  },
                };
              },
            );

            // Update savedSchedules dengan data dari backend
            setSavedSchedules((prev) => {
              // Gabungkan data lokal dengan data backend, prioritaskan backend
              const localSchedules = prev.filter((s) => !s.backendId);
              const allSchedules = [...backendSchedules, ...localSchedules];

              // Hapus duplikat berdasarkan ID
              const uniqueSchedules = allSchedules.filter(
                (schedule, index, self) =>
                  index === self.findIndex((s) => s.id === schedule.id),
              );

              // Pastikan gambar tersimpan dengan benar
              const schedulesWithImages = uniqueSchedules.map(ensureImageData);

              console.log(
                "✅ Updated savedSchedules with backend data:",
                schedulesWithImages,
              );
              return schedulesWithImages;
            });
          }
        } catch (error) {
          console.error("❌ Error loading data from backend:", error);
          // Jika gagal load dari backend, gunakan data lokal saja
        }
      } catch (error) {
        console.error("❌ Error in loadDataFromBackend:", error);
      }
    };

    loadDataFromBackend();
  }, []);

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
        // Gunakan backendId (productPlanningId) untuk memfilter child part yang terkait dengan jadwal aktif
        const planningId = savedSchedules.find(
          (s) =>
            s.form?.part === form.part &&
            s.form?.customer === form.customer &&
            s.name === getScheduleName(selectedMonth, selectedYear),
        )?.backendId;
        if (!planningId) {
          console.log(
            "ℹ️ Tidak ada backendId untuk jadwal aktif, tidak memuat child part",
          );
          setChildParts([]);
          return;
        }
        const response = await ChildPartService.getAllChildParts({
          productPlanningId: Number(planningId),
        });

        if (response && response.length > 0) {
          // Konversi data dari backend ke format yang sesuai dengan frontend
          const convertedChildParts: ChildPartData[] = response.map(
            (item: any) => ({
              id: item.id,
              partName: item.partName,
              customerName: item.customerName,
              stock: item.stockAvailable,
              productPlanningId: item.productPlanningId ?? null,
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

          // Dedupe hasil load dari backend (berdasarkan part+customer)
          setChildParts(dedupeChildParts(convertedChildParts));
          console.log(
            "Child parts dan rencana data berhasil dimuat dari database:",
            dedupeChildParts(convertedChildParts),
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

  // Fungsi untuk navigasi pagination child parts
  const goToNextChildPartPage = () => {
    const filtered = getFilteredChildParts();
    setCurrentChildPartPage((prev) =>
      Math.min(prev + 1, Math.ceil(filtered.length / childPartsPerPage) - 1),
    );
  };

  const goToPreviousChildPartPage = () => {
    setCurrentChildPartPage((prev) => Math.max(prev - 1, 0));
  };

  const resetChildPartPagination = () => {
    setCurrentChildPartPage(0);
  };

  // Helper function untuk mendapatkan filtered child parts
  const getFilteredChildParts = () => {
    let filtered = childParts;
    if (childPartFilter !== "all") {
      filtered = filtered.filter((cp) => childPartFilter.includes(cp.partName));
    }
    filtered = filtered.filter(
      (cp) =>
        cp.partName.toLowerCase().includes(childPartSearch.toLowerCase()) ||
        cp.customerName.toLowerCase().includes(childPartSearch.toLowerCase()),
    );
    return filtered;
  };

  // Helper untuk membuat key unik Child Part dan deduplikasi array
  const getChildPartKey = (cp: { partName: string; customerName: string }) =>
    `${(cp.partName || "").trim().toLowerCase()}__${(cp.customerName || "").trim().toLowerCase()}`;

  const dedupeChildParts = (parts: ChildPartData[]): ChildPartData[] => {
    const map = new Map<string, ChildPartData>();
    for (const cp of parts) {
      const key = getChildPartKey(cp);
      const existing = map.get(key);
      if (!existing) {
        map.set(key, cp);
      } else {
        // Prioritaskan data yang memiliki id (berasal dari database)
        const prefer = existing.id ? existing : cp;
        const other = existing.id ? cp : existing;
        // Gabungkan data agar tidak kehilangan inMaterial/aktualInMaterial
        map.set(key, {
          ...other,
          ...prefer,
          inMaterial: prefer.inMaterial || other.inMaterial,
          aktualInMaterial: prefer.aktualInMaterial || other.aktualInMaterial,
        });
      }
    }
    return Array.from(map.values());
  };

  // Fungsi untuk membersihkan duplikasi di savedSchedules
  const cleanDuplicateSchedules = (schedules: any[]) => {
    const uniqueSchedules = schedules.filter((schedule, index, self) => {
      // Cari berdasarkan kombinasi part, customer, bulan, tahun
      const scheduleKey = `${schedule.form?.part || schedule.productInfo?.partName || ""}-${schedule.form?.customer || schedule.productInfo?.customer || ""}-${schedule.name}`;

      const firstIndex = self.findIndex((s) => {
        const sKey = `${s.form?.part || s.productInfo?.partName || ""}-${s.form?.customer || s.productInfo?.customer || ""}-${s.name}`;
        return sKey === scheduleKey;
      });

      // Jika ini adalah index pertama, pertahankan
      if (index === firstIndex) {
        return true;
      }

      // Jika ada backendId, prioritaskan yang memiliki backendId
      const currentHasBackendId = schedule.backendId !== undefined;
      const firstHasBackendId = self[firstIndex]?.backendId !== undefined;

      if (currentHasBackendId && !firstHasBackendId) {
        // Ganti yang pertama dengan yang memiliki backendId
        self[firstIndex] = schedule;
        return false;
      }

      return false;
    });

    console.log(
      `🧹 Cleaned duplicate schedules: ${schedules.length} -> ${uniqueSchedules.length}`,
    );
    return uniqueSchedules;
  };

  // Reset pagination ketika child parts berubah
  useEffect(() => {
    resetChildPartPagination();
  }, [childParts.length]);

  // Monitor perubahan pada savedSchedules untuk debugging
  useEffect(() => {
    console.log("📊 savedSchedules state changed:", {
      count: savedSchedules.length,
      schedules: savedSchedules.map((s) => ({
        id: s.id,
        name: s.name,
        part: s.form?.part || s.productInfo?.partName,
        customer: s.form?.customer || s.productInfo?.customer,
        backendId: s.backendId,
      })),
    });
  }, [savedSchedules]);

  // Load saved schedules dari backend saat komponen dimount
  useEffect(() => {
    const loadSavedSchedules = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          console.log("User belum login, menggunakan data lokal");
          // Load dari localStorage sebagai fallback
          const localData = localStorage.getItem("savedSchedules");
          if (localData) {
            try {
              const parsedData = JSON.parse(localData);
              setSavedSchedules(parsedData);
              console.log(
                "Loaded saved schedules from localStorage:",
                parsedData,
              );
            } catch (parseError) {
              console.error("Error parsing localStorage data:", parseError);
            }
          }
          return;
        }

        const { ProductionService } = await import(
          "../../../services/API_Services"
        );

        // Load semua production schedules dari backend
        const response = await ProductionService.getUserSchedules();
        console.log("🔍 Response dari getUserSchedules:", response);

        // Handle response dari backend - backend mengembalikan { schedules: [...] }
        const schedules =
          response?.data?.schedules || response?.schedules || response || [];
        console.log("📋 Schedules yang diproses:", schedules);

        if (schedules && schedules.length > 0) {
          console.log("🔄 Converting schedules from backend:", schedules);
          // Konversi data dari backend ke format frontend
          const convertedSchedules = schedules.map((item: any) => {
            const monthIndex = item.productionMonth
              ? item.productionMonth - 1
              : new Date().getMonth();
            const year = item.productionYear || new Date().getFullYear();
            const partName = item.partName || "";
            const stableId = makeScheduleId(
              partName,
              monthIndex,
              year,
              item.customerName,
            );
            return {
              id: stableId,
              backendId: item.id ? Number(item.id) : undefined,
              name: item.scheduleName || `${MONTHS[monthIndex]} ${year}`,
              date: item.createdAt || new Date().toISOString(),
              form: {
                part: partName,
                customer: item.customerName || "",
                timePerPcs: item.timePerPcs || 257,
                cycle1: item.cycle1 || 0,
                cycle7: item.cycle7 || 0,
                cycle35: item.cycle35 || 0,
                stock: item.currentStock || 332,
                planningHour: item.planningHour || 274,
                overtimeHour: item.overtimeHour || 119,
                planningPcs: item.planningPcs || 3838,
                overtimePcs: item.overtimePcs || 1672,
                isManualPlanningPcs: item.isManualPlanningPcs || false,
                manpowers: item.manpowers || [],
                // Pastikan gambar tersimpan dengan benar dari backend
                partImageUrl:
                  item.partImageUrl ||
                  (item.partImageBase64
                    ? formatImageUrl(
                        item.partImageBase64,
                        item.partImageMimeType,
                      )
                    : undefined),
              },
              // Map dailyProductions dari backend ke struktur frontend dengan debugging
              schedule: (() => {
                console.log(
                  `🔍 Processing dailyProductions for ${partName}:`,
                  item.dailyProductions,
                );

                if (
                  !item.dailyProductions ||
                  !Array.isArray(item.dailyProductions) ||
                  item.dailyProductions.length === 0
                ) {
                  console.log(
                    `⚠️ No dailyProductions found for ${partName}, trying to regenerate from form data`,
                  );

                  // Coba regenerate schedule dari form data jika ada
                  if (item.timePerPcs && item.partName) {
                    try {
                      const formData = {
                        part: item.partName,
                        customer: item.customerName,
                        timePerPcs: item.timePerPcs,
                        stock: item.currentStock || 332,
                        planningHour: item.planningHour || 274,
                        overtimeHour: item.overtimeHour || 119,
                        planningPcs: item.planningPcs || 3838,
                        overtimePcs: item.overtimePcs || 1672,
                        isManualPlanningPcs: item.isManualPlanningPcs || false,
                        manpowers: item.manpowers || [],
                      };

                      const regeneratedSchedule = generateScheduleFromForm(
                        formData,
                        [],
                      );
                      console.log(
                        `✅ Regenerated ${regeneratedSchedule.length} schedule items for ${partName}`,
                      );
                      return regeneratedSchedule;
                    } catch (regenerateError) {
                      console.error(
                        `❌ Failed to regenerate schedule for ${partName}:`,
                        regenerateError,
                      );
                      return [];
                    }
                  }

                  return [];
                }

                const mappedSchedule = item.dailyProductions.map(
                  (dp: any, index: number) => {
                    console.log(`📅 Mapping dailyProduction ${index}:`, dp);

                    // Handle different date formats
                    let day = 1;
                    try {
                      if (dp.productionDate) {
                        const date = new Date(dp.productionDate);
                        if (!isNaN(date.getTime())) {
                          day = date.getDate();
                        } else {
                          // Try parsing as day number directly
                          day = parseInt(dp.productionDate) || 1;
                        }
                      } else if (dp.day) {
                        day = parseInt(dp.day) || 1;
                      }
                    } catch (e) {
                      console.error(
                        `Error parsing date for dailyProduction ${index}:`,
                        e,
                      );
                      day = index + 1; // Fallback to index + 1
                    }

                    return {
                      id: `${dp.productionDate || dp.day || day}-${dp.shift || 1}`,
                      day: day,
                      shift: String(dp.shift || 1),
                      time:
                        (dp.shift || 1) === 1 ? "07:30-16:30" : "19:30-04:30",
                      type: "Produksi",
                      pcs: dp.actualProduction || dp.pcs || 0,
                      planningPcs: dp.planningProduction || dp.planningPcs || 0,
                      overtimePcs: dp.overtime || dp.overtimePcs || 0,
                      delivery:
                        dp.deliveryActual ||
                        dp.delivery ||
                        dp.deliveryPlan ||
                        0,
                      status: dp.status || "Normal",
                      notes: dp.notes || "",
                      jamProduksiAktual:
                        dp.actualProductionHours || dp.jamProduksiAktual || 0,
                    };
                  },
                );

                console.log(
                  `✅ Mapped schedule for ${partName}:`,
                  mappedSchedule,
                );
                return mappedSchedule;
              })(),
              childParts: item.childParts || [],
              productInfo: {
                partName: partName,
                customer: item.customerName || "",
                // Pastikan gambar tersimpan dengan benar di productInfo
                partImageUrl:
                  item.partImageUrl ||
                  (item.partImageBase64
                    ? formatImageUrl(
                        item.partImageBase64,
                        item.partImageMimeType,
                      )
                    : undefined),
                lastSavedBy: item.updatedBy
                  ? { nama: item.updatedBy, role: "user" }
                  : undefined,
                lastSavedAt: item.updatedAt,
              },
            };
          });

          // Update savedSchedules state
          // Gunakan fungsi cleanDuplicateSchedules untuk membersihkan duplikasi
          const cleanedSchedules = cleanDuplicateSchedules(convertedSchedules);

          // Pastikan gambar tersimpan dengan benar
          const schedulesWithImages = cleanedSchedules.map(ensureImageData);

          setSavedSchedules(schedulesWithImages);

          // Save to localStorage with fallback strategy
          saveToLocalStorageWithFallback(schedulesWithImages);

          // Log untuk debugging gambar
          console.log(
            "💾 Backend data dengan gambar tersimpan ke localStorage:",
            {
              totalSchedules: schedulesWithImages.length,
              schedulesWithImages: schedulesWithImages.filter(
                (s) => s.form?.partImageUrl || s.productInfo?.partImageUrl,
              ).length,
              sampleImage:
                schedulesWithImages
                  .find(
                    (s) => s.form?.partImageUrl || s.productInfo?.partImageUrl,
                  )
                  ?.form?.partImageUrl?.substring(0, 50) + "...",
            },
          );

          console.log(
            "✅ Saved schedules berhasil dimuat dari database:",
            convertedSchedules,
          );
          console.log("📊 Final savedSchedules state:", cleanedSchedules);
        }
      } catch (error) {
        console.error("Error loading saved schedules:", error);
        // Fallback ke data lokal jika backend tidak tersedia
        const localData = localStorage.getItem("savedSchedules");
        if (localData) {
          try {
            const parsedData = JSON.parse(localData);
            console.log(
              "🔄 Fallback: Loaded saved schedules from localStorage:",
              parsedData,
            );

            // Validasi dan perbaiki data dari localStorage jika perlu
            const validatedData = parsedData.map((item: any) => {
              // Log untuk debugging gambar
              if (item.form?.partImageUrl || item.productInfo?.partImageUrl) {
                console.log("🖼️ Found image in localStorage item:", {
                  id: item.id,
                  formImage: item.form?.partImageUrl?.substring(0, 50) + "...",
                  productInfoImage:
                    item.productInfo?.partImageUrl?.substring(0, 50) + "...",
                });
              }

              // Restore gambar dari placeholder jika ada
              const restoredItem = restoreImageFromPlaceholder(item);

              if (
                !restoredItem.schedule ||
                !Array.isArray(restoredItem.schedule) ||
                restoredItem.schedule.length === 0
              ) {
                console.warn(
                  `⚠️ Schedule data empty for ${restoredItem.form?.part}, trying to regenerate...`,
                );
                // Coba regenerate schedule dari form data jika ada
                if (restoredItem.form) {
                  try {
                    const regeneratedSchedule = generateScheduleFromForm(
                      restoredItem.form,
                      [],
                    );
                    return {
                      ...restoredItem,
                      schedule: regeneratedSchedule,
                    };
                  } catch (regenerateError) {
                    console.error(
                      `❌ Failed to regenerate schedule for ${restoredItem.form.part}:`,
                      regenerateError,
                    );
                    return restoredItem;
                  }
                }
              }
              return restoredItem;
            });

            // Bersihkan duplikasi juga untuk data fallback
            const cleanedFallbackData = cleanDuplicateSchedules(validatedData);

            // Pastikan gambar tersimpan dengan benar
            const fallbackDataWithImages =
              cleanedFallbackData.map(ensureImageData);

            setSavedSchedules(fallbackDataWithImages);

            // Simpan kembali ke localStorage untuk memastikan data tersimpan dengan benar
            saveToLocalStorageWithFallback(fallbackDataWithImages);

            console.log(
              "✅ Fallback: Validated, cleaned, and set saved schedules:",
              fallbackDataWithImages,
            );

            // Log untuk debugging gambar dari localStorage
            console.log("🖼️ Fallback: Images loaded from localStorage:", {
              totalSchedules: fallbackDataWithImages.length,
              schedulesWithImages: fallbackDataWithImages.filter(
                (s) => s.form?.partImageUrl || s.productInfo?.partImageUrl,
              ).length,
              sampleImage:
                fallbackDataWithImages
                  .find(
                    (s) => s.form?.partImageUrl || s.productInfo?.partImageUrl,
                  )
                  ?.form?.partImageUrl?.substring(0, 50) + "...",
            });
          } catch (parseError) {
            console.error("❌ Error parsing localStorage data:", parseError);
          }
        }
      }
    };

    loadSavedSchedules();
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
    const newProductInfo = {
      partName: form.part || "",
      customer: form.customer || "",
      partImageUrl: form.partImageUrl || productInfo.partImageUrl || "",
      lastSavedBy: productInfo?.lastSavedBy, // Pertahankan lastSavedBy yang sudah ada
      lastSavedAt: productInfo?.lastSavedAt, // Pertahankan lastSavedAt yang sudah ada
    };

    setProductInfo(newProductInfo);

    // Log untuk debugging gambar
    if (newProductInfo.partImageUrl) {
      console.log("✅ Updated productInfo with image:", {
        partName: newProductInfo.partName,
        customer: newProductInfo.customer,
        hasImage: !!newProductInfo.partImageUrl,
        imageLength: newProductInfo.partImageUrl.length,
      });
    }
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

    // Generate schedule di frontend
    const newSchedule = generateScheduleFromForm(form, schedule);
    setScheduleWithTracking(newSchedule);

    // Hitung ulang akumulasi untuk semua hari
    if (newSchedule.length > 0) {
      const { validGroupedRows } = prepareTableViewData(
        newSchedule,
        "",
        getScheduleName(selectedMonth, selectedYear),
      );
      recalculateAllAkumulasi(validGroupedRows);
    }

    setIsGenerating(false);
    setChildPartFilter("all"); // Reset filter ke Semua Child Part setiap generate

    // Set flag bahwa ini adalah jadwal yang baru di-generate
    setIsNewlyGeneratedSchedule(true);

    // Auto save ke backend setelah generate (menggunakan logika konfirmasi)
    try {
      await saveSchedule(); // Ini akan menampilkan konfirmasi jika ada jadwal yang sama

      // Refresh data dari backend setelah save berhasil
      const token = getAuthToken();
      if (token) {
        const { ProductionService } = await import(
          "../../../services/API_Services"
        );
        const response = await ProductionService.getUserSchedules();
        console.log("🔄 Response dari getUserSchedules (generate):", response);

        // Handle response dari backend - backend mengembalikan { schedules: [...] }
        const schedules =
          response?.data?.schedules || response?.schedules || response || [];
        console.log("📋 Schedules yang diproses (generate):", schedules);

        if (schedules && schedules.length > 0) {
          const convertedSchedules = schedules.map((item: any) => ({
            id: makeScheduleId(
              item.partName || "",
              item.productionMonth
                ? item.productionMonth - 1
                : new Date().getMonth(),
              item.productionYear || new Date().getFullYear(),
              item.customerName,
            ),
            name:
              item.scheduleName ||
              `${MONTHS[item.productionMonth - 1 || 0]} ${item.productionYear || new Date().getFullYear()}`,
            date: item.createdAt || new Date().toISOString(),
            form: {
              part: item.partName || "",
              customer: item.customerName || "",
              timePerPcs: item.timePerPcs || 257,
              cycle1: item.cycle1 || 0,
              cycle7: item.cycle7 || 0,
              cycle35: item.cycle35 || 0,
              stock: item.currentStock || 332,
              planningHour: item.planningHour || 274,
              overtimeHour: item.overtimeHour || 119,
              planningPcs: item.planningPcs || 3838,
              overtimePcs: item.overtimePcs || 1672,
              isManualPlanningPcs: item.isManualPlanningPcs || false,
              manpowers: item.manpowers || [],
              partImageUrl: item.partImageUrl || undefined,
            },
            schedule: item.dailyProductions || [],
            childParts: item.childParts || [],
            productInfo: {
              partName: item.partName || "",
              customer: item.customerName || "",
              lastSavedBy: item.updatedBy
                ? { nama: item.updatedBy, role: "user" }
                : undefined,
              lastSavedAt: item.updatedAt,
            },
          }));

          // Bersihkan duplikasi sebelum set state
          const cleanedGeneratedSchedules =
            cleanDuplicateSchedules(convertedSchedules);

          // Pastikan gambar tersimpan dengan benar
          const generatedSchedulesWithImages =
            cleanedGeneratedSchedules.map(ensureImageData);

          setSavedSchedules(generatedSchedulesWithImages);

          // Save to localStorage with fallback strategy
          saveToLocalStorageWithFallback(generatedSchedulesWithImages);

          // Log untuk debugging gambar
          console.log(
            "💾 Generated schedules dengan gambar tersimpan ke localStorage:",
            {
              totalSchedules: generatedSchedulesWithImages.length,
              schedulesWithImages: generatedSchedulesWithImages.filter(
                (s) => s.form?.partImageUrl || s.productInfo?.partImageUrl,
              ).length,
              sampleImage:
                generatedSchedulesWithImages
                  .find(
                    (s) => s.form?.partImageUrl || s.productInfo?.partImageUrl,
                  )
                  ?.form?.partImageUrl?.substring(0, 50) + "...",
            },
          );
        }
      }

      showSuccess("Jadwal berhasil di-generate dan tersimpan!");

      // Reset flag karena jadwal sudah tersimpan ke database
      setIsNewlyGeneratedSchedule(false);

      // Setelah generate berhasil, untuk mode create saja yang masuk dashboard
      // Mode edit tetap di card view
      if (!isEditMode) {
        setSelectedPart(form.part);
        console.log("✅ Mode create: Masuk ke dashboard produksi");
      } else {
        console.log("✅ Mode edit: Tetap di card view, tidak masuk dashboard");
      }
      setShowProductionForm(false);
    } catch (error) {
      console.error("Error auto-saving after generate:", error);
      showAlert(
        "Jadwal berhasil di-generate, tetapi gagal tersimpan otomatis",
        "Peringatan",
      );
    }
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
        delivery: 0,
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
            delivery: 0,
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
  const handleSaveClick = async () => {
    // Jika sedang di dashboard produksi (sudah ada schedule), langsung simpan tanpa konfirmasi
    if (schedule && schedule.length > 0 && selectedPart) {
      setIsSavingSchedule(true);
      try {
        await saveScheduleFromDashboard();
        showSuccess("Jadwal berhasil disimpan! Terimakasih");
      } catch (error) {
        console.error("Error saving schedule:", error);
        showAlert("Gagal menyimpan jadwal. Silakan coba lagi.", "Error");
      } finally {
        setIsSavingSchedule(false);
      }
    } else {
      // Jika generate jadwal baru, gunakan logika konfirmasi
      setIsSavingSchedule(true);
      try {
        await saveSchedule();
        showSuccess("Jadwal berhasil disimpan! Terimakasih");
      } catch (error) {
        console.error("Error saving schedule:", error);
        showAlert("Gagal menyimpan jadwal. Silakan coba lagi.", "Error");
      } finally {
        setIsSavingSchedule(false);
      }
    }
  };

  // Fungsi untuk simpan dari dashboard produksi (tanpa konfirmasi)
  const saveScheduleFromDashboard = async () => {
    if (!form.part) {
      throw new Error("Silakan pilih part terlebih dahulu");
    }

    // Update informasi produk sebelum menyimpan
    updateProductInfo();

    // Log untuk debugging gambar
    console.log("💾 saveScheduleFromDashboard: Form data with image:", {
      part: form.part,
      customer: form.customer,
      hasImage: !!form.partImageUrl,
      imageLength: form.partImageUrl?.length || 0,
    });

    // selectedMonth adalah 0-11 untuk UI; backend butuh 1-12 saat konversi
    const currentMonth = selectedMonth;
    const currentYear = selectedYear;
    const scheduleName = `${MONTHS[currentMonth]} ${currentYear}`;

    // Cek apakah sudah ada jadwal untuk part, customer, bulan, dan tahun yang sama
    const existingSchedule = checkExistingSchedule(
      form.part,
      currentMonth,
      currentYear,
      form.customer,
    );

    console.log("🔍 Dashboard: Checking existing schedule:", {
      part: form.part,
      customer: form.customer,
      month: currentMonth,
      year: currentYear,
      existingSchedule: existingSchedule
        ? {
            id: existingSchedule.id,
            backendId: existingSchedule.backendId,
            name: existingSchedule.name,
          }
        : null,
    });

    if (existingSchedule && existingSchedule.backendId) {
      // Langsung timpa tanpa konfirmasi karena ini dari dashboard
      console.log(
        `🔄 Dashboard: Updating existing schedule with backendId ${existingSchedule.backendId}`,
      );
      await performSaveSchedule(
        currentMonth,
        currentYear,
        scheduleName,
        existingSchedule.backendId,
      );
    } else {
      // Buat jadwal baru
      console.log("🆕 Dashboard: Creating new schedule");
      await performSaveSchedule(currentMonth, currentYear, scheduleName);
    }
  };

  const saveSchedule = async (
    monthOverride?: number,
    yearOverride?: number,
  ) => {
    if (!form.part) {
      throw new Error("Silakan pilih part terlebih dahulu");
    }

    // Update informasi produk sebelum menyimpan
    updateProductInfo();

    // Log untuk debugging gambar
    console.log("💾 saveSchedule: Form data with image:", {
      part: form.part,
      customer: form.customer,
      hasImage: !!form.partImageUrl,
      imageLength: form.partImageUrl?.length || 0,
      isEditMode,
      editingScheduleId,
      editingScheduleBackendId,
    });

    // Gunakan parameter override jika ada, atau gunakan state yang ada
    const currentMonth =
      monthOverride !== undefined ? monthOverride : selectedMonth;
    const currentYear =
      yearOverride !== undefined ? yearOverride : selectedYear;

    const scheduleName = `${MONTHS[currentMonth]} ${currentYear}`;

    // Jika mode edit, gunakan ID jadwal yang sedang diedit
    if (isEditMode && editingScheduleBackendId) {
      console.log(
        "🔄 Edit mode: Updating existing schedule with backendId:",
        editingScheduleBackendId,
        "editingScheduleId:",
        editingScheduleId,
        "new month:",
        scheduleName,
        "current form part:",
        form.part,
        "current form customer:",
        form.customer,
      );

      // Pastikan form data sudah benar
      if (form.part && form.customer) {
        console.log(
          "✅ Edit mode: Form data lengkap, memanggil updateExistingSchedule",
        );
        await updateExistingSchedule(
          currentMonth,
          currentYear,
          scheduleName,
          editingScheduleBackendId,
        );
        console.log(
          "✅ Edit mode: updateExistingSchedule selesai, return untuk keluar",
        );
        return; // Pastikan return di sini
      } else {
        console.error("❌ Form data tidak lengkap untuk edit mode");
        showAlert(
          "Data part dan customer harus diisi untuk edit mode",
          "Error",
        );
        return;
      }
    }

    // Mode create: Cek apakah sudah ada jadwal untuk part, customer, bulan, dan tahun yang sama
    console.log("🔍 Mode create: Checking for existing schedule...");
    console.log(
      "🔍 Mode create: isEditMode =",
      isEditMode,
      "editingScheduleBackendId =",
      editingScheduleBackendId,
    );

    // Jika masih dalam edit mode, seharusnya tidak sampai ke sini
    if (isEditMode) {
      console.error(
        "❌ ERROR: Masih dalam edit mode tapi sampai ke logic create!",
      );
      console.error("❌ editingScheduleId:", editingScheduleId);
      console.error("❌ editingScheduleBackendId:", editingScheduleBackendId);
      return; // Keluar dari function
    }

    const existingSchedule = checkExistingSchedule(
      form.part,
      currentMonth,
      currentYear,
      form.customer,
    );

    console.log("🔍 Checking existing schedule:", {
      part: form.part,
      customer: form.customer,
      month: currentMonth,
      year: currentYear,
      existingSchedule: existingSchedule
        ? {
            id: existingSchedule.id,
            backendId: existingSchedule.backendId,
            name: existingSchedule.name,
          }
        : null,
    });

    if (existingSchedule && existingSchedule.backendId) {
      console.log("🔍 Found existing schedule, asking for confirmation...");
      // Buat pesan konfirmasi yang sederhana
      const confirmationMessage = `Apakah Anda yakin ingin menimpa jadwal yang sudah tersimpan?\n\nJadwal untuk ${form.part} - ${scheduleName} sudah ada dan akan diganti dengan data yang baru.`;

      // Tampilkan konfirmasi untuk menimpa jadwal yang sudah ada
      showConfirm(
        confirmationMessage,
        async () => {
          // User memilih untuk menimpa
          console.log("✅ User confirmed overwrite, proceeding with update...");
          await performSaveSchedule(
            currentMonth,
            currentYear,
            scheduleName,
            existingSchedule.backendId,
          );
        },
        `Jadwal untuk ${form.part} - ${scheduleName} sudah ada`,
        "Timpa Jadwal",
        "Batal",
      );
    } else {
      // Tidak ada jadwal yang sama, langsung simpan
      console.log("🆕 No existing schedule found, creating new one...");
      await performSaveSchedule(currentMonth, currentYear, scheduleName);
    }
  };

  // Fungsi untuk update jadwal yang sudah ada (tanpa generate jadwal baru)
  const updateExistingSchedule = async (
    currentMonth: number,
    currentYear: number,
    scheduleName: string,
    existingId: number,
  ) => {
    try {
      console.log(`🔄 Updating existing schedule with ID: ${existingId}`);

      // Update hanya informasi bulanan dan stock
      const { PlanningSystemService } = await import(
        "../../../services/API_Services"
      );

      const updateData = {
        partName: form.part,
        customerName: form.customer,
        productionMonth: currentMonth + 1,
        productionYear: currentYear,
        currentStock: form.stock || 0,
        partImageBase64: form.partImageUrl
          ? form.partImageUrl.split(",")[1]
          : undefined,
        partImageMimeType: form.partImageUrl ? "image/jpeg" : undefined,
      };

      await PlanningSystemService.updateProductPlanning(existingId, updateData);

      console.log("✅ Schedule updated successfully");
      return { success: true, id: existingId };
    } catch (error) {
      console.error("Error updating schedule:", error);
      throw error;
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

          // Import PlanningSystemService untuk update yang benar
          const { PlanningSystemService } = await import(
            "../../../services/API_Services"
          );

          // Update jadwal yang sudah ada menggunakan updateProductPlanning
          response = await PlanningSystemService.updateProductPlanning(
            existingId,
            {
              partName: backendData.partName,
              customerName: backendData.customer,
              productionMonth: backendData.month, // backendData.month bukan productionMonth
              productionYear: backendData.year, // backendData.year bukan productionYear
              currentStock: backendData.initialStock || 0, // backendData.initialStock bukan currentStock
              // partImageBase64 dan partImageMimeType tidak ada di backendData, gunakan dari form
              partImageBase64: form.partImageUrl
                ? form.partImageUrl.split(",")[1]
                : undefined,
              partImageMimeType: form.partImageUrl ? "image/jpeg" : undefined,
            },
          );
          console.log(`Schedule berhasil diupdate dengan ID: ${existingId}`);
        } else {
          console.log("Mencoba membuat schedule baru");
          // Buat jadwal baru
          response =
            await ProductionService.createProductionSchedule(backendData);
        }
        console.log("Response dari API:", response);
      } catch (apiError) {
        console.error("API Error:", apiError);

        // Jika error 404 atau data tidak ditemukan, coba buat schedule baru
        if (
          apiError.message.includes("Schedule dengan ID") ||
          apiError.message.includes(
            "Data perencanaan produksi tidak ditemukan",
          ) ||
          apiError.response?.status === 404
        ) {
          console.log(
            "Data tidak ditemukan di database, mencoba buat schedule baru...",
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

      // Normalisasi payload API agar konsisten (success wrapper → data wrapper → payload)
      const apiWrapper = (response && (response as any).data) || response || {};
      const apiData =
        (apiWrapper && (apiWrapper as any).data) || apiWrapper || {};

      // Untuk PlanningSystemService, response langsung berisi productPlanning
      const productPlanningId = apiData?.id ?? response?.id ?? existingId;
      const serverSucceeded = !!productPlanningId;

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

      // Simpan juga ke savedSchedules state
      const newSchedule = {
        id:
          apiData?.id?.toString?.() ||
          (response as any)?.id?.toString?.() ||
          existingId?.toString() ||
          Date.now().toString(),
        name: scheduleName,
        date: new Date().toISOString(),
        form: {
          ...form,
          // Pastikan partImageUrl tersimpan dengan benar
          partImageUrl: form.partImageUrl || productInfo.partImageUrl || "",
        },
        schedule: [...schedule],
        childParts: childParts,
        productInfo: {
          partName: form.part,
          customer: form.customer,
          partImageUrl: form.partImageUrl || productInfo.partImageUrl || "",
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
        backendId: serverSucceeded ? productPlanningId : existingId, // Simpan backend ID untuk referensi
      };

      // Log untuk debugging gambar
      console.log("💾 newSchedule dengan gambar:", {
        id: newSchedule.id,
        partImageUrl: newSchedule.form.partImageUrl,
        productInfoImageUrl: newSchedule.productInfo.partImageUrl,
        hasImage: !!(
          newSchedule.form.partImageUrl || newSchedule.productInfo.partImageUrl
        ),
      });

      // Simpan child part data ke backend jika ada
      if (childParts.length > 0) {
        try {
          const { RencanaChildPartService } = await import(
            "../../../services/API_Services"
          );

          // Gunakan childParts unik untuk mencegah create/update ganda
          const uniqueChildParts = dedupeChildParts(childParts);

          for (const childPart of uniqueChildParts) {
            // Cek apakah child part sudah ada di database
            if (childPart.id && typeof childPart.id === "number") {
              // Update existing child part
              await ChildPartService.updateChildPart(childPart.id, {
                partName: childPart.partName,
                customerName: childPart.customerName,
                stockAvailable: childPart.stock || 0,
                productPlanningId:
                  (savedSchedules.find(
                    (s) =>
                      s.form?.part === form.part &&
                      s.form?.customer === form.customer &&
                      s.name === getScheduleName(selectedMonth, selectedYear),
                  )?.backendId as number) || undefined,
              });
            } else {
              // Create new child part
              const savedChildPart = await ChildPartService.createChildPart({
                partName: childPart.partName,
                customerName: childPart.customerName,
                stockAvailable: childPart.stock || 0,
                productPlanningId:
                  (savedSchedules.find(
                    (s) =>
                      s.form?.part === form.part &&
                      s.form?.customer === form.customer &&
                      s.name === getScheduleName(selectedMonth, selectedYear),
                  )?.backendId as number) || undefined,
              });
              // Update local child part dengan ID dari database
              childPart.id = savedChildPart.id;
              childPart.productPlanningId =
                (savedChildPart as any)?.productPlanningId ??
                childPart.productPlanningId ??
                null;
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

      // Selalu update data produksi harian ketika menyimpan jadwal
      if (response.productPlanning?.id || response.id || existingId) {
        try {
          const scheduleId =
            response.productPlanning?.id || response.id || existingId;
          console.log(
            "Updating daily production data for schedule:",
            scheduleId,
          );

          // Konversi schedule data untuk update daily production
          const productionDataForUpdate = schedule
            .filter((item: any) => item.shift === "1" || item.shift === "2")
            .map((item: any) => ({
              ...item,
              year: currentYear,
              // kirim 1-12 ke backend
              month: currentMonth + 1,
            }));

          await ProductionService.updateDailyProductionBySchedule(
            scheduleId,
            productionDataForUpdate,
          );

          console.log("Daily production data updated successfully");
        } catch (updateError) {
          console.error("Error updating daily production data:", updateError);
          // Tidak throw error karena schedule sudah berhasil disimpan
        }
      }

      if (existingId) {
        // Gunakan ID dari response jika ada, atau existingId
        const finalId =
          response.productPlanning?.id?.toString() ||
          response.id?.toString() ||
          existingId.toString();
        console.log(
          `Updating schedule with ID: ${finalId} (original: ${existingId}, response: ${response.productPlanning?.id || response.id})`,
        );

        // Update schedule di context
        updateSchedule(finalId, newSchedule);

        // Jika mode edit, update berdasarkan editingScheduleId
        if (isEditMode && editingScheduleId) {
          console.log(
            "🔄 Edit mode: Updating schedule based on editingScheduleId:",
            editingScheduleId,
          );
          console.log(
            "🔄 Current savedSchedules:",
            savedSchedules.map((s) => ({
              id: s.id,
              name: s.name,
              backendId: s.backendId,
            })),
          );

          // Cari dan update schedule di savedSchedules berdasarkan editingScheduleId
          const existingIndex = savedSchedules.findIndex(
            (s) => s.id === editingScheduleId,
          );

          console.log("🔄 Found schedule at index:", existingIndex);

          if (existingIndex !== -1) {
            // Update jadwal yang sudah ada dengan data baru
            const updatedSchedules = [...savedSchedules];
            const oldSchedule = updatedSchedules[existingIndex];
            updatedSchedules[existingIndex] = {
              ...newSchedule,
              id: editingScheduleId, // Pertahankan ID asli
              backendId: existingId, // Update backendId
              name: scheduleName, // Update nama jadwal sesuai bulan baru
            };

            console.log(`✅ Updated existing schedule:`, {
              oldName: oldSchedule.name,
              newName: scheduleName,
              oldId: oldSchedule.id,
              newId: editingScheduleId,
              index: existingIndex,
            });
            setSavedSchedules(updatedSchedules);

            // Pastikan gambar tersimpan dengan benar
            const updatedSchedulesWithImages =
              updatedSchedules.map(ensureImageData);

            // Simpan ke localStorage dengan gambar
            saveToLocalStorageWithFallback(updatedSchedulesWithImages);

            // Log untuk debugging gambar
            console.log(
              "💾 Schedule dengan gambar berhasil diupdate di localStorage:",
              {
                totalSchedules: updatedSchedulesWithImages.length,
                schedulesWithImages: updatedSchedulesWithImages.filter(
                  (s) => s.form?.partImageUrl || s.productInfo?.partImageUrl,
                ).length,
                sampleImage:
                  updatedSchedulesWithImages
                    .find(
                      (s) =>
                        s.form?.partImageUrl || s.productInfo?.partImageUrl,
                    )
                    ?.form?.partImageUrl?.substring(0, 50) + "...",
              },
            );

            // Reset edit mode dan tracking setelah berhasil update
            setIsEditMode(false);
            setEditingScheduleId(null);
            setEditingScheduleBackendId(null);

            console.log("🔄 Edit mode reset after successful update");

            // Tampilkan pesan sukses
            showSuccess("Jadwal berhasil diupdate!");

            // PASTIKAN tidak set selectedPart untuk edit mode - tetap di card view
            console.log(
              "🚫 Edit mode: selectedPart TIDAK diset, tetap di card view",
            );

            // Reset form dan schedule untuk kembali ke card view
            resetFormAndSchedule();

            return; // Langsung return, tidak lanjut ke logic create
          } else {
            console.warn(
              "⚠️ Schedule dengan editingScheduleId tidak ditemukan:",
              editingScheduleId,
            );
            console.warn(
              "⚠️ Available schedule IDs:",
              savedSchedules.map((s) => s.id),
            );
          }
        } else {
          // Mode create: Cari dan update schedule di savedSchedules berdasarkan backendId atau ID yang konsisten
          const existingIndex = savedSchedules.findIndex(
            (s) =>
              s.backendId === existingId ||
              s.id === existingId.toString() ||
              s.id === finalId,
          );

          let updatedSchedules;
          if (existingIndex !== -1) {
            // Update jadwal yang sudah ada dengan data baru
            updatedSchedules = [...savedSchedules];
            updatedSchedules[existingIndex] = {
              ...newSchedule,
              id: finalId, // Pastikan ID konsisten
              backendId: existingId, // Pertahankan backendId yang asli
            };
            console.log(
              `✅ Updated existing schedule at index ${existingIndex} with ID ${finalId}`,
            );
          } else {
            // Jika tidak ditemukan, tambahkan sebagai jadwal baru
            updatedSchedules = [
              ...savedSchedules,
              {
                ...newSchedule,
                id: finalId,
                backendId: existingId,
              },
            ];
            console.log(
              `✅ Added new schedule with ID ${finalId} and backendId ${existingId}`,
            );
          }

          // Bersihkan duplikasi sebelum set state
          const cleanedUpdatedSchedules =
            cleanDuplicateSchedules(updatedSchedules);

          // Pastikan gambar tersimpan dengan benar
          const updatedSchedulesWithImages =
            cleanedUpdatedSchedules.map(ensureImageData);

          setSavedSchedules(updatedSchedulesWithImages);

          // Simpan ke localStorage dengan gambar
          saveToLocalStorageWithFallback(updatedSchedulesWithImages);

          // Log untuk debugging gambar
          console.log(
            "💾 Schedule dengan gambar berhasil diupdate di localStorage:",
            {
              totalSchedules: cleanedUpdatedSchedules.length,
              schedulesWithImages: updatedSchedulesWithImages.filter(
                (s) => s.form?.partImageUrl || s.productInfo?.partImageUrl,
              ).length,
              sampleImage:
                updatedSchedulesWithImages
                  .find(
                    (s) => s.form?.partImageUrl || s.productInfo?.partImageUrl,
                  )
                  ?.form?.partImageUrl?.substring(0, 50) + "...",
            },
          );

          showSuccess("Jadwal berhasil diperbarui!");

          // Reset semua state perubahan setelah berhasil update
          setHasScheduleChanges(false);
          setHasUnsavedChildPartChanges(false);
          setChildPartChanges(new Set());
          setHasUnsavedChanges(false);
          setIsNewlyGeneratedSchedule(false); // Reset flag karena ini jadwal yang sudah tersimpan
        }
      } else {
        // Tambah jadwal baru ke state - hindari duplikasi
        const existingIndex = savedSchedules.findIndex(
          (s) =>
            s.id === newSchedule.id ||
            (s.form.part === newSchedule.form.part &&
              s.form.customer === newSchedule.form.customer &&
              s.name === newSchedule.name),
        );

        let updatedSchedules;
        if (existingIndex !== -1) {
          // Update jadwal yang sudah ada
          updatedSchedules = [...savedSchedules];
          updatedSchedules[existingIndex] = newSchedule;
          console.log(`✅ Updated existing schedule at index ${existingIndex}`);
        } else {
          // Tambah jadwal baru
          updatedSchedules = [...savedSchedules, newSchedule];
          console.log(`✅ Added new schedule to savedSchedules`);
        }

        // Bersihkan duplikasi sebelum set state
        const cleanedNewSchedules = cleanDuplicateSchedules(updatedSchedules);

        // Pastikan gambar tersimpan dengan benar
        const newSchedulesWithImages = cleanedNewSchedules.map(ensureImageData);

        setSavedSchedules(newSchedulesWithImages);

        // Simpan ke localStorage dengan gambar
        saveToLocalStorageWithFallback(newSchedulesWithImages);

        // Log untuk debugging gambar
        console.log(
          "💾 Schedule baru dengan gambar berhasil disimpan ke localStorage:",
          {
            totalSchedules: cleanedNewSchedules.length,
            schedulesWithImages: newSchedulesWithImages.filter(
              (s) => s.form?.partImageUrl || s.productInfo?.partImageUrl,
            ).length,
            sampleImage:
              newSchedulesWithImages
                .find(
                  (s) => s.form?.partImageUrl || s.productInfo?.partImageUrl,
                )
                ?.form?.partImageUrl?.substring(0, 50) + "...",
          },
        );

        // Pesan sukses sederhana
        const successMessage = serverSucceeded
          ? "Schedule berhasil disimpan ke database!"
          : "Server tidak tersedia. Data lokal diperbarui.";
        showSuccess(successMessage);
      }

      // Reset semua state perubahan setelah berhasil menyimpan
      setHasScheduleChanges(false);
      setHasUnsavedChildPartChanges(false);
      setChildPartChanges(new Set());
      setHasUnsavedChanges(false);
      setIsNewlyGeneratedSchedule(false); // Reset flag jadwal baru setelah berhasil disimpan
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

      throw new Error(errorMessage); // Re-throw error untuk ditangani di handleSaveClick
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
      partImageUrl: "", // Reset gambar part
    });
    setSchedule([]); // Gunakan setSchedule langsung untuk reset yang bersih
    setSelectedMonth(new Date().getMonth());
    setSelectedYear(new Date().getFullYear());
    setIsNewlyGeneratedSchedule(false); // Reset flag jadwal baru

    // Reset productInfo juga
    setProductInfo({
      partName: "",
      customer: "",
      partImageUrl: "",
      lastSavedBy: undefined,
      lastSavedAt: undefined,
    });
  };

  // Handler untuk generate tabel child part
  const handleGenerateChildPart = async (data: {
    partName: string;
    customerName: string;
    stock: number;
  }) => {
    try {
      // Pastikan user login (dibutuhkan Authorization header oleh backend)
      const token = getAuthToken();
      if (!token) {
        showAlert(
          "Anda harus login untuk menyimpan Child Part ke database.",
          "Peringatan",
        );
        return;
      }

      // Pastikan ProductPlanning ada (upsert) agar kita punya productPlanningId yang valid
      const { PlanningSystemService } = await import(
        "../../../services/API_Services"
      );
      const upsertPayload = {
        partName: form.part,
        customerName: form.customer,
        productionMonth: selectedMonth + 1,
        productionYear: selectedYear,
        currentStock: form.stock || 0,
      };
      const upsertRes =
        await PlanningSystemService.upsertProductPlanning(upsertPayload);
      const planningId =
        (upsertRes as any)?.productPlanning?.id ?? (upsertRes as any)?.id;

      // Create child part data for backend
      const childPartData = {
        partName: data.partName,
        customerName: data.customerName,
        stockAvailable: data.stock,
        // Kaitkan child part baru ke product planning aktif bila tersedia
        productPlanningId: Number(planningId),
      };

      // Simpan ke backend. Jika gagal, tampilkan error dan hentikan.
      const savedChildPart =
        await ChildPartService.createChildPart(childPartData);
      if (!savedChildPart || typeof savedChildPart.id !== "number") {
        showAlert(
          "Gagal menyimpan Child Part ke database. Coba lagi.",
          "Error",
        );
        return;
      }

      // Create local child part data with correct structure (sertakan id jika ada)
      const newChildPart: ChildPartData = {
        id: savedChildPart.id,
        partName: data.partName,
        customerName: data.customerName,
        stock: data.stock,
        productPlanningId:
          (savedChildPart as any)?.productPlanningId ??
          (childPartData as any).productPlanningId ??
          null,
        inMaterial: Array.from({ length: days }, () => [null, null]),
        aktualInMaterial: Array.from({ length: days }, () => [null, null]),
      };

      // Tambahkan dengan deduplikasi berdasarkan part+customer
      setChildParts((prev) => {
        const next = dedupeChildParts([...prev, newChildPart]);
        return next;
      });
      setShowChildPartModal(false);

      // Set flag perubahan
      setHasUnsavedChanges(true);
      setHasUnsavedChildPartChanges(true);

      // Show success message (pasti dari backend)
      showSuccess("Child part berhasil di generate!");
    } catch (error) {
      console.error("Error dalam handleGenerateChildPart:", error);
      showAlert("Gagal membuat child part", "Error");
    }
  };

  // Handler untuk tracking perubahan pada child part data
  const handleChildPartDataChange = (childPartIdx: number) => {
    setChildPartChanges((prev) => new Set([...prev, childPartIdx]));
    setHasUnsavedChildPartChanges(true);
    setHasUnsavedChanges(true); // Tambahkan ini untuk tracking perubahan secara umum
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
    setHasUnsavedChanges(true);
  };

  // Wrapper untuk setForm dengan tracking perubahan
  const setFormWithTracking = (newForm: any | ((prev: any) => any)) => {
    setForm(newForm);
    setHasUnsavedChanges(true);
  };

  // Handler untuk menyimpan data ke backend
  const handleSaveToBackend = async (data: ProductPlanningData) => {
    try {
      await PlanningSystemService.upsertProductPlanning(data);
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

  // Edit Part handlers (sama dengan behavior sebelumnya)
  const handleSavePartEdit = async () => {
    if (!editingPartName.trim() || !editingPartCustomer.trim()) return;

    try {
      const schedulesToUpdate = savedSchedules.filter(
        (s) => s.form.part === editingPartId,
      );

      // Update schedules dengan data baru
      schedulesToUpdate.forEach((schedule) => {
        const updatedSchedule = {
          ...schedule,
          form: {
            ...schedule.form,
            part: editingPartName.trim(),
            customer: editingPartCustomer.trim(),
            partImageUrl:
              editingPartImagePreview || schedule.form.partImageUrl || "",
          },
        };
        updateSchedule(schedule.id, updatedSchedule);
      });

      // Jika ada gambar baru, update ke backend
      if (editingPartImage && editingPartImagePreview) {
        try {
          const { PlanningSystemService } = await import(
            "../../../services/API_Services"
          );

          // Cari schedule yang memiliki backendId
          const scheduleWithBackend = schedulesToUpdate.find(
            (s) => s.backendId,
          );
          if (scheduleWithBackend?.backendId) {
            // Update product planning dengan gambar baru
            const planningData = {
              partName: editingPartName.trim(),
              customerName: editingPartCustomer.trim(),
              productionMonth: new Date().getMonth() + 1,
              productionYear: new Date().getFullYear(),
              currentStock: scheduleWithBackend.form.stock || 0,
              partImageBase64: editingPartImagePreview.includes(",")
                ? editingPartImagePreview.split(",")[1]
                : editingPartImagePreview,
              partImageMimeType: editingPartImage.type || "image/jpeg",
            };

            await PlanningSystemService.upsertProductPlanning(planningData);
            console.log("✅ Part image updated in backend");
          }
        } catch (error) {
          console.error("❌ Error updating part image in backend:", error);
          showAlert(
            "Gambar berhasil diupdate lokal, tetapi gagal disimpan ke database",
            "Peringatan",
          );
        }
      }

      // Selalu update nama part dan customer ke backend bila ada backendId
      try {
        const { PlanningSystemService } = await import(
          "../../../services/API_Services"
        );

        // Cari satu schedule yang memiliki backendId untuk dijadikan acuan update
        const scheduleWithBackend = schedulesToUpdate.find((s) => s.backendId);
        if (scheduleWithBackend?.backendId) {
          // Derive month/year dari nama jadwal bila memungkinkan
          let productionMonth: number | undefined;
          let productionYear: number | undefined;
          try {
            // gunakan import statis yang sudah ada di top: from "../utils/scheduleDateUtils"
            const parsed = parseScheduleName(scheduleWithBackend.name || "");
            if (parsed && typeof parsed.month === "number") {
              productionMonth = parsed.month + 1; // FE 0-11 → BE 1-12
              productionYear = parsed.year;
            }
          } catch {}

          const updatePayload = {
            partName: editingPartName.trim(),
            customerName: editingPartCustomer.trim(),
            currentStock: scheduleWithBackend.form?.stock || 0,
            productionMonth: productionMonth || new Date().getMonth() + 1,
            productionYear: productionYear || new Date().getFullYear(),
          };

          await PlanningSystemService.updateProductPlanning(
            scheduleWithBackend.backendId,
            updatePayload,
          );
          console.log("✅ Part name/customer updated in backend");
        } else {
          // Tidak ada backendId → upsert berdasarkan kombinasi
          const upsertPayload = {
            partName: editingPartName.trim(),
            customerName: editingPartCustomer.trim(),
            productionMonth: new Date().getMonth() + 1,
            productionYear: new Date().getFullYear(),
            currentStock: schedulesToUpdate[0]?.form?.stock || form?.stock || 0,
          } as any;
          await PlanningSystemService.upsertProductPlanning(upsertPayload);
          console.log("✅ Part name/customer upserted in backend");
        }
      } catch (updateError) {
        console.error(
          "❌ Error updating part name/customer in backend:",
          updateError,
        );
        showAlert(
          "Perubahan berhasil disimpan lokal, namun gagal mengupdate database",
          "Peringatan",
        );
      }

      setShowEditPartModal(false);
      setEditingPartId(null);
      setEditingPartImage(null);
      setEditingPartImagePreview(null);
      showSuccess("Berhasil menyimpan perubahan part, customer, dan gambar!");
    } catch (error) {
      console.error("Error saving part edit:", error);
      showAlert("Gagal menyimpan perubahan", "Error");
    }
  };

  const handleCancelPartEdit = () => {
    setShowEditPartModal(false);
    setEditingPartId(null);
    setEditingPartName("");
    setEditingPartCustomer("");
    setEditingPartImage(null);
    setEditingPartImagePreview(null);
  };

  // Handler untuk upload gambar pada edit part
  const handleEditPartImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validasi ukuran file (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showAlert("Ukuran file terlalu besar. Maksimal 5MB.", "Peringatan");
        return;
      }

      // Validasi tipe file
      if (!file.type.startsWith("image/")) {
        showAlert("File harus berupa gambar.", "Peringatan");
        return;
      }

      setEditingPartImage(file);

      // Preview gambar dan konversi ke base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setEditingPartImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handler untuk hapus gambar pada edit part
  const handleRemoveEditPartImage = () => {
    setEditingPartImage(null);
    setEditingPartImagePreview(null);
  };

  // Keyboard event handler untuk modal edit part
  const handleEditPartKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSavePartEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancelPartEdit();
    }
  };

  // Handler untuk menghapus child part berdasarkan index
  const handleDeleteChildPart = async (idx: number) => {
    const childPart = childParts[idx];
    if (!childPart) {
      console.error("Child part tidak ditemukan");
      return;
    }

    // Tampilkan konfirmasi sebelum menghapus
    showConfirm(
      `Apakah Anda yakin ingin menghapus child part "${childPart.partName}"?\n\nTindakan ini tidak dapat dibatalkan.`,
      async () => {
        try {
          console.log("=== MULAI PROSES DELETE CHILD PART ===");
          console.log("Child part yang akan dihapus:", childPart);
          console.log(
            "ID child part:",
            childPart.id,
            "Type:",
            typeof childPart.id,
          );

          // Jika child part memiliki ID dari database, hapus dari backend
          if (childPart.id && typeof childPart.id === "number") {
            console.log(
              "✅ Child part memiliki ID database, akan hapus dari backend",
            );

            try {
              // Hapus semua data rencana child part terlebih dahulu
              console.log(
                "📋 Langkah 1: Mencoba hapus data rencana child part...",
              );

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
                      console.log(
                        `✅ Berhasil hapus rencana ID: ${rencana.id}`,
                      );
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
                console.log(
                  "⚠️ Lanjutkan dengan penghapusan child part utama...",
                );
              }

              // Hapus child part dari database
              console.log(
                "📋 Langkah 2: Mencoba hapus child part utama dari database...",
              );
              console.log(
                `🗑️ Mencoba hapus child part dengan ID: ${childPart.id}`,
              );

              const deleteResult = await ChildPartService.deleteChildPart(
                childPart.id,
              );
              console.log("✅ Child part berhasil dihapus dari database");
              console.log("Response dari delete:", deleteResult);

              // Hapus dari state lokal hanya jika berhasil hapus dari database
              console.log("📋 Langkah 3: Update state lokal...");
              setChildParts((prev) => prev.filter((_, i) => i !== idx));

              // Set flag perubahan
              setHasUnsavedChanges(true);
              setHasUnsavedChildPartChanges(true);

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

            // Set flag perubahan
            setHasUnsavedChanges(true);
            setHasUnsavedChildPartChanges(true);

            showSuccess("Child part berhasil dihapus dari state lokal");
            console.log("=== PROSES DELETE SELESAI - LOKAL SAJA ===");
          }
        } catch (error) {
          console.error("❌ Error deleting child part:", error);
          showAlert("Gagal menghapus child part", "Error");
          console.log("=== PROSES DELETE SELESAI - ERROR ===");
        }
      },
      "Konfirmasi Hapus Child Part",
      "Hapus",
      "Batal",
    );
  };

  // Handler untuk menghapus schedule dari database
  const handleDeleteScheduleFromDatabase = async (scheduleId: string) => {
    // Cari schedule yang akan dihapus
    const scheduleToDelete = savedSchedules.find((s) => s.id === scheduleId);
    if (!scheduleToDelete) {
      console.error("Schedule tidak ditemukan untuk dihapus");
      return;
    }

    // Tampilkan konfirmasi sebelum menghapus menggunakan modal
    showConfirm(
      `Apakah Anda yakin ingin menghapus jadwal "${scheduleToDelete.name}"?\n\nTindakan ini tidak dapat dibatalkan.`,
      async () => {
        try {
          const { ProductionService } = await import(
            "../../../services/API_Services"
          );

          // Tentukan ID backend dengan benar: utamakan backendId dari data, baru fallback bila scheduleId numeric murni
          const backendId =
            scheduleToDelete.backendId !== undefined
              ? scheduleToDelete.backendId
              : /^\d+$/.test(scheduleId)
                ? parseInt(scheduleId)
                : undefined;

          // Coba hapus dari backend menggunakan ID backend yang valid
          try {
            if (backendId && !isNaN(Number(backendId))) {
              await ProductionService.deleteSchedule(Number(backendId));
              console.log("Schedule berhasil dihapus dari database");
            } else {
              console.log(
                "Backend ID tidak tersedia, lewati penghapusan di server (hapus lokal saja)",
              );
            }
          } catch (apiError) {
            console.error("Gagal menghapus schedule dari database:", apiError);
            // Tetap lanjutkan dengan penghapusan lokal
          }

          // Hapus dari state lokal (berdasarkan stable id)
          const updatedSchedules = savedSchedules.filter(
            (s) => s.id !== scheduleId,
          );
          setSavedSchedules(updatedSchedules);

          // Update localStorage
          localStorage.setItem(
            "savedSchedules",
            JSON.stringify(updatedSchedules),
          );

          showSuccess("Schedule berhasil dihapus");
        } catch (error) {
          console.error("Error deleting schedule:", error);
          showAlert("Gagal menghapus schedule", "Error");
        }
      },
      "Konfirmasi Hapus Jadwal",
      "Hapus",
      "Batal",
    );
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

  // Filter application functions
  const applyPartFilter = () => {
    setChildPartFilter(tempChildPartFilter);
    setShowPartFilterDropdown(false);
    resetChildPartPagination(); // Reset pagination ketika filter berubah
  };

  const applyDataFilter = () => {
    setActiveChildPartTableFilter(tempActiveChildPartTableFilter);
    setShowFilterDropdown(false);
    resetChildPartPagination(); // Reset pagination ketika filter berubah
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

  // Styled parts list
  const parts = React.useMemo(() => {
    const uniqueParts = new Map<
      string,
      {
        name: string;
        customer: string;
        color: string;
        bgColor: string;
        borderColor: string;
        description: string;
        imageUrl?: string;
      }
    >();

    const colorVariants = [
      {
        color: "from-blue-500 to-blue-600",
        bgColor: "bg-blue-500",
        borderColor: "border-blue-500/30",
      },
      {
        color: "from-green-500 to-green-600",
        bgColor: "bg-green-500",
        borderColor: "border-green-500/30",
      },
      {
        color: "from-purple-500 to-purple-600",
        bgColor: "bg-purple-500",
        borderColor: "border-purple-500/30",
      },
      {
        color: "from-orange-500 to-orange-600",
        bgColor: "bg-orange-500",
        borderColor: "border-orange-500/30",
      },
      {
        color: "from-red-500 to-red-600",
        bgColor: "bg-red-500",
        borderColor: "border-red-500/30",
      },
      {
        color: "from-indigo-500 to-indigo-600",
        bgColor: "bg-indigo-500",
        borderColor: "border-indigo-500/30",
      },
    ];

    savedSchedules.forEach((s) => {
      const partName = s.form.part;
      const customerName = s.form.customer;
      const imageUrl = (s.form as any).partImageUrl as string | undefined;

      // Buat key unik berdasarkan part + customer
      const uniqueKey = `${partName}-${customerName}`;

      if (!uniqueParts.has(uniqueKey)) {
        const idx = uniqueParts.size % colorVariants.length;
        const variant = colorVariants[idx];
        uniqueParts.set(uniqueKey, {
          name: partName,
          customer: customerName,
          color: variant.color,
          bgColor: variant.bgColor,
          borderColor: variant.borderColor,
          description: `Jadwal produksi untuk ${partName} - ${customerName}`,
          imageUrl: imageUrl,
        });
      } else {
        const existing = uniqueParts.get(uniqueKey)!;
        if (!existing.imageUrl && imageUrl) {
          existing.imageUrl = imageUrl;
          uniqueParts.set(uniqueKey, existing);
        }
      }
    });
    return Array.from(uniqueParts.values());
  }, [savedSchedules]);

  // Flag untuk menyembunyikan section Saved saat sedang menampilkan dashboard produksi
  const isViewingSchedule =
    schedule &&
    Array.isArray(schedule) &&
    schedule.length > 0 &&
    selectedPart &&
    !isEditMode;

  console.log("🔍 isViewingSchedule check:", {
    hasSchedule: !!schedule,
    scheduleLength: schedule?.length || 0,
    selectedPart,
    isEditMode,
    isViewingSchedule,
    message: isEditMode
      ? "EDIT MODE: Tetap di card view"
      : selectedPart
        ? "CREATE MODE: Masuk ke dashboard"
        : "NO PART: Di card view",
  });

  const getSchedulesByPart = (partName: string, customerName?: string) => {
    if (customerName) {
      // Jika ada customer name, filter berdasarkan part + customer
      return savedSchedules.filter(
        (s) => s.form.part === partName && s.form.customer === customerName,
      );
    } else {
      // Jika tidak ada customer name, filter berdasarkan part saja (untuk backward compatibility)
      return savedSchedules.filter((s) => s.form.part === partName);
    }
  };

  const handleEditSchedule = async (saved: SavedSchedule) => {
    try {
      console.log("🎯 handleEditSchedule called with:", saved);

      // Parse schedule name untuk mendapatkan bulan dan tahun
      const { month, year } = parseScheduleName(saved.name);

      // Set data untuk modal edit
      setEditingScheduleData({
        month: month,
        year: year,
        stock: saved.form.stock || 0,
        partName: saved.form.part || "",
        customer: saved.form.customer || "",
      });

      // Set tracking jadwal yang sedang diedit
      setEditingScheduleId(saved.id);
      setEditingScheduleBackendId(saved.backendId || null);

      // Buka modal edit yang sederhana
      setShowEditScheduleModal(true);

      console.log("✅ handleEditSchedule: Modal edit sederhana dibuka", {
        scheduleId: saved.id,
        backendId: saved.backendId,
        month,
        year,
        stock: saved.form.stock,
      });
    } catch (error) {
      console.error("❌ Error in handleEditSchedule:", error);
      showAlert("Gagal membuka form edit. Silakan coba lagi.", "Error");
    }
  };

  const handleSaveEditSchedule = async (data: {
    month: number;
    year: number;
    stock: number;
  }) => {
    try {
      setIsUpdatingSchedule(true);
      console.log("🎯 handleSaveEditSchedule called with:", data);

      if (!editingScheduleId || !editingScheduleData) {
        throw new Error("Tidak ada jadwal yang sedang diedit");
      }

      // Cari jadwal yang sedang diedit
      const scheduleToUpdate = savedSchedules.find(
        (s) => s.id === editingScheduleId,
      );
      if (!scheduleToUpdate) {
        throw new Error("Jadwal tidak ditemukan");
      }

      // Update nama jadwal berdasarkan bulan dan tahun baru
      const newScheduleName = `${MONTHS[data.month]} ${data.year}`;

      // Update form data dengan stock baru
      const updatedForm = {
        ...scheduleToUpdate.form,
        stock: data.stock,
      };

      // Update jadwal di state lokal
      const updatedSchedules = savedSchedules.map((s) => {
        if (s.id === editingScheduleId) {
          return {
            ...s,
            name: newScheduleName,
            form: updatedForm,
            productInfo: {
              ...s.productInfo,
              lastSavedAt: new Date().toISOString(),
            },
          };
        }
        return s;
      });

      setSavedSchedules(updatedSchedules);

      // Jika ada backendId, update ke database
      if (editingScheduleBackendId) {
        try {
          const { PlanningSystemService } = await import(
            "../../../services/API_Services"
          );

          const updateData = {
            partName: editingScheduleData.partName,
            customerName: editingScheduleData.customer,
            currentStock: data.stock,
            productionMonth: data.month + 1, // Backend menggunakan 1-12, frontend 0-11
            productionYear: data.year,
          };

          console.log("🔄 Attempting to update schedule with data:", {
            backendId: editingScheduleBackendId,
            updateData,
          });

          // Gunakan updateProductPlanning untuk update berdasarkan ID
          const result = await PlanningSystemService.updateProductPlanning(
            editingScheduleBackendId,
            updateData,
          );
          console.log("✅ Schedule updated in backend using ID:", result);
        } catch (error) {
          console.error("❌ Error updating schedule in backend:", error);

          // Fallback: coba update berdasarkan bulan dan tahun
          try {
            console.log("🔄 Attempting fallback update using month/year:", {
              month: data.month + 1,
              year: data.year,
            });

            const fallbackResult =
              await PlanningSystemService.updateProductPlanningByMonthYear(
                data.month + 1, // Backend menggunakan 1-12, frontend 0-11
                data.year,
                {
                  partName: editingScheduleData.partName,
                  customerName: editingScheduleData.customer,
                  currentStock: data.stock,
                  productionMonth: data.month + 1,
                  productionYear: data.year,
                },
              );
            console.log(
              "✅ Schedule updated in backend using month/year:",
              fallbackResult,
            );
          } catch (fallbackError) {
            console.error(
              "❌ Error updating schedule in backend (fallback):",
              fallbackError,
            );
            showAlert(
              "Berhasil update jadwal lokal, tetapi gagal update ke database",
              "Warning",
            );
          }
        }
      }

      // Tutup modal dan reset state
      setShowEditScheduleModal(false);
      setEditingScheduleData(null);
      setEditingScheduleId(null);
      setEditingScheduleBackendId(null);

      showSuccess("Jadwal berhasil diupdate!");
      console.log("✅ handleSaveEditSchedule: Jadwal berhasil diupdate");
    } catch (error) {
      console.error("❌ Error in handleSaveEditSchedule:", error);
      showAlert("Gagal mengupdate jadwal. Silakan coba lagi.", "Error");
    } finally {
      setIsUpdatingSchedule(false);
    }
  };

  const handleShowSchedule = async (saved: SavedSchedule) => {
    try {
      console.log("🎯 handleShowSchedule called with:", saved);
      console.log("📋 Schedule data:", saved.schedule);

      // Paksa apply state lokal supaya bisa tampil lagi meski memilih schedule yang sama
      // Restore gambar dari placeholder jika ada
      const restoredForm = restoreImageFromPlaceholder(saved.form);
      setForm(restoredForm); // Gunakan setForm langsung, bukan setFormWithTracking

      // Pastikan schedule data valid
      const scheduleData = saved.schedule || [];
      console.log("📊 Processed schedule data:", scheduleData);

      // Log untuk debugging gambar saat load schedule
      console.log("🖼️ Loading schedule with image data:", {
        scheduleId: saved.id,
        formPartImageUrl: saved.form?.partImageUrl?.substring(0, 50) + "...",
        productInfoPartImageUrl:
          saved.productInfo?.partImageUrl?.substring(0, 50) + "...",
        hasFormImage: !!saved.form?.partImageUrl,
        hasProductInfoImage: !!saved.productInfo?.partImageUrl,
        imageData: {
          formImageLength: saved.form?.partImageUrl?.length || 0,
          productInfoImageLength: saved.productInfo?.partImageUrl?.length || 0,
          formImageStartsWithData:
            saved.form?.partImageUrl?.startsWith("data:") || false,
          productInfoImageStartsWithData:
            saved.productInfo?.partImageUrl?.startsWith("data:") || false,
        },
        imageValidation: {
          formImageValid:
            saved.form?.partImageUrl?.startsWith("data:") || false,
          productInfoImageValid:
            saved.productInfo?.partImageUrl?.startsWith("data:") || false,
          anyImageValid: !!(
            saved.form?.partImageUrl?.startsWith("data:") ||
            saved.productInfo?.partImageUrl?.startsWith("data:")
          ),
          imageReadyForDisplay: !!(
            saved.form?.partImageUrl?.startsWith("data:") ||
            saved.productInfo?.partImageUrl?.startsWith("data:")
          ),
        },
        troubleshooting: {
          needsImageFormatting:
            !!(
              saved.form?.partImageUrl &&
              !saved.form?.partImageUrl.startsWith("data:")
            ) ||
            !!(
              saved.productInfo?.partImageUrl &&
              !saved.productInfo?.partImageUrl.startsWith("data:")
            ),
          imageDataIntegrity: {
            formImageLength: saved.form?.partImageUrl?.length || 0,
            productInfoImageLength:
              saved.productInfo?.partImageUrl?.length || 0,
            formImageStartsWithData:
              saved.form?.partImageUrl?.startsWith("data:") || false,
            productInfoImageStartsWithData:
              saved.productInfo?.partImageUrl?.startsWith("data:") || false,
          },
        },
      });

      if (scheduleData.length === 0) {
        console.warn("⚠️ Schedule data is empty, cannot display table");
        console.log("🔍 Saved object:", saved);
        showAlert(
          "Data jadwal kosong. Ini mungkin karena:\n1. Data belum tersimpan dengan benar ke database\n2. Ada masalah dengan koneksi ke server\n\nSilakan coba generate ulang jadwal atau hubungi administrator.",
          "Peringatan",
        );
        return;
      }

      setSchedule(scheduleData); // Gunakan setSchedule langsung, bukan setScheduleWithTracking

      // Hitung ulang akumulasi untuk semua hari
      if (scheduleData.length > 0) {
        const { validGroupedRows } = prepareTableViewData(
          scheduleData,
          "",
          saved.name,
        );
        recalculateAllAkumulasi(validGroupedRows);
      }

      // Reset semua flag perubahan karena ini adalah schedule yang sudah tersimpan
      setHasUnsavedChanges(false);
      setHasScheduleChanges(false);
      setHasUnsavedChildPartChanges(false);
      setChildPartChanges(new Set());
      setIsNewlyGeneratedSchedule(false); // Reset flag karena ini jadwal yang sudah tersimpan

      console.log(
        "✅ handleShowSchedule: Flag perubahan di-reset untuk schedule yang sudah tersimpan",
      );
      console.log("📊 Current savedSchedules count:", savedSchedules.length);
      setSelectedPart(saved.form?.part || null);
      setSelectedCustomer(saved.form?.customer || null);

      // Muat ulang Child Part yang berelasi berdasarkan backendId schedule yang dipilih
      try {
        const planningId = saved.backendId;
        if (planningId) {
          const { ChildPartService } = await import(
            "../../../services/API_Services"
          );
          const response = await ChildPartService.getAllChildParts({
            productPlanningId: Number(planningId),
          });
          const mappedChildParts: ChildPartData[] = (response || []).map(
            (item: any) => ({
              id: item.id,
              partName: item.partName,
              customerName: item.customerName,
              stock: item.stockAvailable ?? 0,
              productPlanningId: item.productPlanningId ?? null,
              inMaterial: Array.from({ length: days }, () => [null, null]),
              aktualInMaterial: Array.from({ length: days }, () => [
                null,
                null,
              ]),
            }),
          );
          setChildParts(mappedChildParts);
        } else {
          // Jika schedule belum punya backendId, sembunyikan/mengosongkan child parts
          setChildParts([]);
        }
      } catch (cpErr) {
        console.warn("⚠️ Gagal memuat ChildPart terelasi:", cpErr);
        setChildParts([]);
      }

      // Log untuk debugging state setelah reset
      console.log("🔄 State reset completed:", {
        hasUnsavedChanges: false,
        hasScheduleChanges: false,
        hasUnsavedChildPartChanges: false,
        childPartChanges: "Set(0)",
        isNewlyGeneratedSchedule: false,
        selectedPart: saved.form?.part || null,
        imageState: {
          formPartImageUrl: form.partImageUrl?.substring(0, 50) + "...",
          productInfoPartImageUrl:
            productInfo.partImageUrl?.substring(0, 50) + "...",
          hasFormImage: !!form.partImageUrl,
          hasProductInfoImage: !!productInfo.partImageUrl,
        },
        troubleshooting: {
          needsImageFormatting:
            !!(form.partImageUrl && !form.partImageUrl.startsWith("data:")) ||
            !!(
              productInfo.partImageUrl &&
              !productInfo.partImageUrl.startsWith("data:")
            ),
          imageDataIntegrity: {
            formImageLength: form.partImageUrl?.length || 0,
            productInfoImageLength: productInfo.partImageUrl?.length || 0,
            formImageStartsWithData:
              form.partImageUrl?.startsWith("data:") || false,
            productInfoImageStartsWithData:
              productInfo.partImageUrl?.startsWith("data:") || false,
          },
        },
      });

      // Update product info
      if (saved.productInfo) {
        const productInfoData = {
          partName: saved.productInfo.partName || saved.form.part || "",
          customer: saved.productInfo.customer || saved.form.customer || "",
          partImageUrl:
            saved.productInfo.partImageUrl || saved.form.partImageUrl || "",
          lastSavedBy: saved.productInfo.lastSavedBy,
          lastSavedAt: saved.productInfo.lastSavedAt,
        };

        // Restore gambar dari placeholder jika ada
        const restoredProductInfo =
          restoreImageFromPlaceholder(productInfoData);
        setProductInfo(restoredProductInfo);

        // Log untuk debugging gambar dari productInfo
        console.log("🖼️ ProductInfo image data:", {
          partImageUrl:
            saved.productInfo.partImageUrl?.substring(0, 50) + "...",
          formPartImageUrl: saved.form.partImageUrl?.substring(0, 50) + "...",
          finalImageUrl:
            (
              saved.productInfo.partImageUrl || saved.form.partImageUrl
            )?.substring(0, 50) + "...",
          imageSource: "productInfo",
          imageValidation: {
            partImageUrlValid:
              saved.productInfo.partImageUrl?.startsWith("data:") || false,
            formPartImageUrlValid:
              saved.form.partImageUrl?.startsWith("data:") || false,
            finalImageUrlValid:
              (
                saved.productInfo.partImageUrl || saved.form.partImageUrl
              )?.startsWith("data:") || false,
          },
          troubleshooting: {
            needsImageFormatting:
              !!(
                saved.productInfo.partImageUrl &&
                !saved.productInfo.partImageUrl.startsWith("data:")
              ) ||
              !!(
                saved.form.partImageUrl &&
                !saved.form.partImageUrl.startsWith("data:")
              ),
            imageDataIntegrity: {
              partImageUrlLength: saved.productInfo.partImageUrl?.length || 0,
              formPartImageUrlLength: saved.form.partImageUrl?.length || 0,
              partImageUrlStartsWithData:
                saved.productInfo.partImageUrl?.startsWith("data:") || false,
              formPartImageUrlStartsWithData:
                saved.form.partImageUrl?.startsWith("data:") || false,
            },
          },
        });
      } else {
        const formData = {
          partName: saved.form.part || "",
          customer: saved.form.customer || "",
          partImageUrl: saved.form.partImageUrl || "",
          lastSavedBy: undefined,
          lastSavedAt: undefined,
        };

        // Restore gambar dari placeholder jika ada
        const restoredFormData = restoreImageFromPlaceholder(formData);
        setProductInfo(restoredFormData);

        // Log untuk debugging gambar dari form
        console.log("🖼️ Form image data:", {
          partImageUrl: saved.form.partImageUrl?.substring(0, 50) + "...",
          imageSource: "form",
          imageValidation: {
            partImageUrlValid:
              saved.form.partImageUrl?.startsWith("data:") || false,
            partImageUrlLength: saved.form.partImageUrl?.length || 0,
          },
          troubleshooting: {
            needsImageFormatting: !!(
              saved.form.partImageUrl &&
              !saved.form.partImageUrl.startsWith("data:")
            ),
            imageDataIntegrity: {
              partImageUrlLength: saved.form.partImageUrl?.length || 0,
              partImageUrlStartsWithData:
                saved.form.partImageUrl?.startsWith("data:") || false,
            },
          },
        });
      }

      // Log untuk debugging state setelah update product info
      console.log("🔄 Product info updated:", {
        partName: saved.form?.part || "",
        customer: saved.form?.customer || "",
        hasPartImageUrl: !!(
          saved.productInfo?.partImageUrl || saved.form?.partImageUrl
        ),
        finalImageUrl:
          (
            saved.productInfo?.partImageUrl || saved.form?.partImageUrl
          )?.substring(0, 50) + "...",
        imageValidation: {
          finalImageUrlValid:
            (
              saved.productInfo?.partImageUrl || saved.form?.partImageUrl
            )?.startsWith("data:") || false,
          finalImageUrlLength:
            (saved.productInfo?.partImageUrl || saved.form?.partImageUrl)
              ?.length || 0,
          imageReadyForDisplay: !!(
            saved.productInfo?.partImageUrl?.startsWith("data:") ||
            saved.form?.partImageUrl?.startsWith("data:")
          ),
        },
        troubleshooting: {
          needsImageFormatting:
            !!(
              saved.productInfo?.partImageUrl &&
              !saved.productInfo?.partImageUrl.startsWith("data:")
            ) ||
            !!(
              saved.form?.partImageUrl &&
              !saved.form?.partImageUrl.startsWith("data:")
            ),
          imageDataIntegrity: {
            finalImageUrlLength:
              (saved.productInfo?.partImageUrl || saved.form?.partImageUrl)
                ?.length || 0,
            finalImageUrlStartsWithData:
              (
                saved.productInfo?.partImageUrl || saved.form?.partImageUrl
              )?.startsWith("data:") || false,
            imageReadyForDisplay: !!(
              saved.productInfo?.partImageUrl?.startsWith("data:") ||
              saved.form?.partImageUrl?.startsWith("data:")
            ),
          },
        },
      });

      // Jika ada backendId, coba load data lengkap dari backend untuk mendapatkan gambar
      if (saved.backendId) {
        try {
          const { PlanningSystemService } = await import(
            "../../../services/API_Services"
          );
          const response = await PlanningSystemService.getProductPlanningById(
            saved.backendId,
          );

          if (response.productPlanning) {
            const planning = response.productPlanning;

            // Update form dengan data dari backend
            try {
              const formattedImageUrl = formatImageUrl(
                planning.partImageBase64,
                planning.partImageMimeType,
              );

              // Validate dan optimize image sebelum set ke state
              const validatedImageUrl =
                validateAndOptimizeImage(formattedImageUrl);

              // Restore gambar dari placeholder jika ada
              const finalImageUrl = validatedImageUrl || formattedImageUrl;

              // Update form dengan gambar yang sudah di-restore
              setForm((prev) => {
                const updatedForm = {
                  ...prev,
                  part: planning.partName,
                  customer: planning.customerName,
                  stock: planning.currentStock,
                  timePerPcs: 257,
                  partImageUrl: finalImageUrl,
                };

                // Restore dari placeholder jika perlu
                return restoreImageFromPlaceholder(updatedForm, finalImageUrl);
              });

              // Update productInfo dengan gambar dari backend
              setProductInfo((prev) => {
                const updatedProductInfo = {
                  ...prev,
                  partImageUrl: finalImageUrl,
                };

                // Restore dari placeholder jika perlu
                return restoreImageFromPlaceholder(
                  updatedProductInfo,
                  finalImageUrl,
                );
              });

              console.log(
                "✅ Image berhasil diupdate dari backend dan di-restore dari placeholder",
              );
            } catch (imageError) {
              console.error(
                "❌ Error updating image from backend:",
                imageError,
              );
              handleImageEditError(imageError, "update image dari backend");

              // Set image ke undefined jika ada error
              setForm((prev) => ({
                ...prev,
                part: planning.partName,
                customer: planning.customerName,
                stock: planning.currentStock,
                timePerPcs: 257,
                partImageUrl: undefined,
              }));

              setProductInfo((prev) => ({
                ...prev,
                partImageUrl: undefined,
              }));
            }

            // Log untuk debugging gambar dari backend
            console.log("🖼️ Loaded image from backend:", {
              backendId: saved.backendId,
              hasPartImageBase64: !!planning.partImageBase64,
              hasPartImageMimeType: !!planning.partImageMimeType,
              currentFormImage: form.partImageUrl?.substring(0, 50) + "...",
            });

            console.log(
              "✅ Loaded complete data from backend for ID:",
              saved.backendId,
            );

            // Log untuk debugging gambar setelah load dari backend
            console.log("🖼️ Image data after backend load:", {
              backendId: saved.backendId,
              formPartImageUrl: form.partImageUrl?.substring(0, 50) + "...",
              productInfoPartImageUrl:
                productInfo.partImageUrl?.substring(0, 50) + "...",
              hasFormImage: !!form.partImageUrl,
              hasProductInfoImage: !!productInfo.partImageUrl,
              backendData: {
                hasPartImageBase64: !!planning.partImageBase64,
                hasPartImageMimeType: !!planning.partImageMimeType,
                partImageBase64Length: planning.partImageBase64?.length || 0,
                partImageMimeType: planning.partImageMimeType || "none",
              },
              formattedResult: {
                currentFormImage: form.partImageUrl?.substring(0, 50) + "...",
                currentFormImageLength: form.partImageUrl?.length || 0,
                currentFormImageStartsWithData:
                  form.partImageUrl?.startsWith("data:") || false,
              },
            });
          }
        } catch (error) {
          console.error("❌ Error loading complete data from backend:", error);
          // Jika gagal, gunakan data lokal saja
          console.log("⚠️ Using local data as fallback for image");

          // Handle specific errors
          if (error.name === "QuotaExceededError") {
            handleImageEditError(error, "load data dari backend");
          } else if (error.message?.includes("image")) {
            handleImageEditError(error, "proses gambar dari backend");
          }
        }
      }

      // Parse bulan & tahun dari nama schedule (contoh: "Agustus 2025")
      const yearMatch = saved.name.match(/(\d{4})/);
      const monthIndex = MONTHS.findIndex((m) => saved.name.includes(m));
      if (monthIndex >= 0) setSelectedMonth(monthIndex);
      if (yearMatch && yearMatch[1]) setSelectedYear(parseInt(yearMatch[1]));

      // Log untuk debugging bulan dan tahun
      console.log("📅 Month/Year parsed:", {
        scheduleName: saved.name,
        monthIndex,
        year: yearMatch ? parseInt(yearMatch[1]) : null,
        selectedMonth: monthIndex >= 0 ? monthIndex : "Not found",
        selectedYear: yearMatch ? parseInt(yearMatch[1]) : "Not found",
        imageState: {
          formPartImageUrl: form.partImageUrl?.substring(0, 50) + "...",
          productInfoPartImageUrl:
            productInfo.partImageUrl?.substring(0, 50) + "...",
          hasFormImage: !!form.partImageUrl,
          hasProductInfoImage: !!productInfo.partImageUrl,
        },
        troubleshooting: {
          needsImageFormatting:
            !!(form.partImageUrl && !form.partImageUrl.startsWith("data:")) ||
            !!(
              productInfo.partImageUrl &&
              !productInfo.partImageUrl.startsWith("data:")
            ),
          imageDataIntegrity: {
            formImageLength: form.partImageUrl?.length || 0,
            productInfoImageLength: productInfo.partImageUrl?.length || 0,
            formImageStartsWithData:
              form.partImageUrl?.startsWith("data:") || false,
            productInfoImageStartsWithData:
              productInfo.partImageUrl?.startsWith("data:") || false,
          },
        },
      });

      // Simpan juga ke context (gunakan objek baru agar perubahan terdeteksi)
      // Pastikan tidak ada duplikasi dengan memeriksa existing schedule
      const existingScheduleInContext = savedSchedules.find(
        (s) =>
          s.backendId === saved.backendId ||
          (s.form.part === saved.form.part &&
            s.form.customer === saved.form.customer &&
            s.name === saved.name),
      );

      // Log untuk debugging context
      console.log("🔍 Context check:", {
        totalSavedSchedules: savedSchedules.length,
        existingScheduleFound: !!existingScheduleInContext,
        existingScheduleId: existingScheduleInContext?.id,
        currentSavedId: saved.id,
        currentBackendId: saved.backendId,
        searchCriteria: {
          backendId: saved.backendId,
          part: saved.form.part,
          customer: saved.form.customer,
          name: saved.name,
        },
        imageState: {
          formPartImageUrl: form.partImageUrl?.substring(0, 50) + "...",
          productInfoPartImageUrl:
            productInfo.partImageUrl?.substring(0, 50) + "...",
          hasFormImage: !!form.partImageUrl,
          hasProductInfoImage: !!productInfo.partImageUrl,
        },
        troubleshooting: {
          needsImageFormatting:
            !!(form.partImageUrl && !form.partImageUrl.startsWith("data:")) ||
            !!(
              productInfo.partImageUrl &&
              !productInfo.partImageUrl.startsWith("data:")
            ),
          imageDataIntegrity: {
            formImageLength: form.partImageUrl?.length || 0,
            productInfoImageLength: productInfo.partImageUrl?.length || 0,
            formImageStartsWithData:
              form.partImageUrl?.startsWith("data:") || false,
            productInfoImageStartsWithData:
              productInfo.partImageUrl?.startsWith("data:") || false,
          },
        },
      });

      if (!existingScheduleInContext) {
        const scheduleWithImage = {
          ...saved,
          productInfo: {
            ...saved.productInfo,
            partImageUrl:
              saved.productInfo?.partImageUrl || saved.form.partImageUrl || "",
          },
        };

        // Restore gambar dari placeholder jika ada
        const restoredScheduleWithImage =
          restoreImageFromPlaceholder(scheduleWithImage);

        // Log untuk debugging gambar saat load schedule
        console.log("🖼️ Loading new schedule with image:", {
          id: restoredScheduleWithImage.id,
          partImageUrl:
            restoredScheduleWithImage.productInfo?.partImageUrl?.substring(
              0,
              50,
            ) + "...",
          hasImage: !!(
            restoredScheduleWithImage.productInfo?.partImageUrl ||
            restoredScheduleWithImage.form?.partImageUrl
          ),
          scheduleData: {
            totalScheduleItems: restoredScheduleWithImage.schedule?.length || 0,
            hasScheduleData: !!(
              restoredScheduleWithImage.schedule &&
              restoredScheduleWithImage.schedule.length > 0
            ),
          },
          imageDetails: {
            formImageUrl:
              restoredScheduleWithImage.form?.partImageUrl?.substring(0, 50) +
              "...",
            productInfoImageUrl:
              restoredScheduleWithImage.productInfo?.partImageUrl?.substring(
                0,
                50,
              ) + "...",
            formImageLength:
              restoredScheduleWithImage.form?.partImageUrl?.length || 0,
            productInfoImageLength:
              restoredScheduleWithImage.productInfo?.partImageUrl?.length || 0,
            formImageStartsWithData:
              restoredScheduleWithImage.form?.partImageUrl?.startsWith(
                "data:",
              ) || false,
            productInfoImageStartsWithData:
              restoredScheduleWithImage.productInfo?.partImageUrl?.startsWith(
                "data:",
              ) || false,
          },
          imageValidation: {
            formImageValid:
              restoredScheduleWithImage.form?.partImageUrl?.startsWith(
                "data:",
              ) || false,
            productInfoImageValid:
              restoredScheduleWithImage.productInfo?.partImageUrl?.startsWith(
                "data:",
              ) || false,
            anyImageValid: !!(
              restoredScheduleWithImage.form?.partImageUrl?.startsWith(
                "data:",
              ) ||
              restoredScheduleWithImage.productInfo?.partImageUrl?.startsWith(
                "data:",
              )
            ),
            imageReadyForDisplay: !!(
              restoredScheduleWithImage.form?.partImageUrl?.startsWith(
                "data:",
              ) ||
              restoredScheduleWithImage.productInfo?.partImageUrl?.startsWith(
                "data:",
              )
            ),
          },
        });

        loadSchedule(restoredScheduleWithImage);
      } else {
        // Update existing schedule di context
        const updatedSchedule = {
          ...saved,
          productInfo: {
            ...saved.productInfo,
            partImageUrl:
              saved.productInfo?.partImageUrl || saved.form.partImageUrl || "",
          },
        };

        // Restore gambar dari placeholder jika ada
        const restoredUpdatedSchedule =
          restoreImageFromPlaceholder(updatedSchedule);

        // Log untuk debugging gambar saat update schedule
        console.log("🖼️ Updating existing schedule with image:", {
          id: restoredUpdatedSchedule.id,
          partImageUrl:
            restoredUpdatedSchedule.productInfo?.partImageUrl?.substring(
              0,
              50,
            ) + "...",
          hasImage: !!(
            restoredUpdatedSchedule.productInfo?.partImageUrl ||
            restoredUpdatedSchedule.form?.partImageUrl
          ),
          scheduleData: {
            totalScheduleItems: restoredUpdatedSchedule.schedule?.length || 0,
            hasScheduleData: !!(
              restoredUpdatedSchedule.schedule &&
              restoredUpdatedSchedule.schedule.length > 0
            ),
          },
          imageDetails: {
            formImageUrl:
              restoredUpdatedSchedule.form?.partImageUrl?.substring(0, 50) +
              "...",
            productInfoImageUrl:
              restoredUpdatedSchedule.productInfo?.partImageUrl?.substring(
                0,
                50,
              ) + "...",
            formImageLength:
              restoredUpdatedSchedule.form?.partImageUrl?.length || 0,
            productInfoImageLength:
              restoredUpdatedSchedule.productInfo?.partImageUrl?.length || 0,
            formImageStartsWithData:
              restoredUpdatedSchedule.form?.partImageUrl?.startsWith("data:") ||
              false,
            productInfoImageStartsWithData:
              restoredUpdatedSchedule.productInfo?.partImageUrl?.startsWith(
                "data:",
              ) || false,
          },
          imageValidation: {
            formImageValid:
              restoredUpdatedSchedule.form?.partImageUrl?.startsWith("data:") ||
              false,
            productInfoImageValid:
              restoredUpdatedSchedule.productInfo?.partImageUrl?.startsWith(
                "data:",
              ) || false,
            anyImageValid: !!(
              restoredUpdatedSchedule.form?.partImageUrl?.startsWith("data:") ||
              restoredUpdatedSchedule.productInfo?.partImageUrl?.startsWith(
                "data:",
              )
            ),
            imageReadyForDisplay: !!(
              restoredUpdatedSchedule.form?.partImageUrl?.startsWith("data:") ||
              restoredUpdatedSchedule.productInfo?.partImageUrl?.startsWith(
                "data:",
              )
            ),
          },
        });

        updateSchedule(existingScheduleInContext.id, restoredUpdatedSchedule);
      }

      // Scroll ke tabel dengan delay lebih lama untuk memastikan state ter-update
      setTimeout(() => {
        const el = document.getElementById("schedule-table-section");
        if (el) {
          console.log("🎯 Scrolling to schedule table");
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          console.warn("⚠️ Schedule table element not found");
        }
      }, 100);

      // Log final state untuk debugging
      console.log("🖼️ Final image state after handleShowSchedule:", {
        formPartImageUrl: form.partImageUrl?.substring(0, 50) + "...",
        productInfoPartImageUrl:
          productInfo.partImageUrl?.substring(0, 50) + "...",
        hasFormImage: !!form.partImageUrl,
        hasProductInfoImage: !!productInfo.partImageUrl,
        scheduleState: {
          totalScheduleItems: schedule.length,
          hasScheduleData: !!(schedule && schedule.length > 0),
          selectedPart: !!selectedPart,
        },
        imageAnalysis: {
          formImageLength: form.partImageUrl?.length || 0,
          productInfoImageLength: productInfo.partImageUrl?.length || 0,
          formImageStartsWithData:
            form.partImageUrl?.startsWith("data:") || false,
          productInfoImageStartsWithData:
            productInfo.partImageUrl?.startsWith("data:") || false,
          formImageValid: !!(
            form.partImageUrl && form.partImageUrl.startsWith("data:")
          ),
          productInfoImageValid: !!(
            productInfo.partImageUrl &&
            productInfo.partImageUrl.startsWith("data:")
          ),
        },
        imageStatus: {
          anyImageValid: !!(
            form.partImageUrl?.startsWith("data:") ||
            productInfo.partImageUrl?.startsWith("data:")
          ),
          imageReadyForDisplay: !!(
            form.partImageUrl?.startsWith("data:") ||
            productInfo.partImageUrl?.startsWith("data:")
          ),
          imageDisplayIssue: !(
            form.partImageUrl?.startsWith("data:") ||
            productInfo.partImageUrl?.startsWith("data:")
          ),
        },
      });

      console.log("✅ handleShowSchedule completed successfully");

      // Log summary untuk debugging
      console.log("📋 handleShowSchedule Summary:", {
        scheduleId: saved.id,
        backendId: saved.backendId,
        partName: saved.form?.part,
        customerName: saved.form?.customer,
        hasImage: !!(form.partImageUrl || productInfo.partImageUrl),
        imageSource: form.partImageUrl
          ? "form"
          : productInfo.partImageUrl
            ? "productInfo"
            : "none",
        scheduleItems: schedule.length,
        selectedPart: !!selectedPart,
        success: true,
        imageStatus: {
          formImageValid: !!(
            form.partImageUrl && form.partImageUrl.startsWith("data:")
          ),
          productInfoImageValid: !!(
            productInfo.partImageUrl &&
            productInfo.partImageUrl.startsWith("data:")
          ),
          anyImageValid: !!(
            form.partImageUrl?.startsWith("data:") ||
            productInfo.partImageUrl?.startsWith("data:")
          ),
          imageDisplayReady: !!(
            form.partImageUrl?.startsWith("data:") ||
            productInfo.partImageUrl?.startsWith("data:")
          ),
        },
        troubleshooting: {
          imageDisplayIssue: !(
            form.partImageUrl?.startsWith("data:") ||
            productInfo.partImageUrl?.startsWith("data:")
          ),
          needsImageFormatting:
            !!(form.partImageUrl && !form.partImageUrl.startsWith("data:")) ||
            !!(
              productInfo.partImageUrl &&
              !productInfo.partImageUrl.startsWith("data:")
            ),
          imageDataIntegrity: {
            formImageLength: form.partImageUrl?.length || 0,
            productInfoImageLength: productInfo.partImageUrl?.length || 0,
            formImageStartsWithData:
              form.partImageUrl?.startsWith("data:") || false,
            productInfoImageStartsWithData:
              productInfo.partImageUrl?.startsWith("data:") || false,
          },
        },
      });
    } catch (error) {
      console.error("❌ Error in handleShowSchedule:", error);
      showAlert("Gagal menampilkan jadwal", "Error");

      // Log error summary untuk debugging
      console.log("❌ handleShowSchedule Error Summary:", {
        scheduleId: saved?.id,
        backendId: saved?.backendId,
        partName: saved?.form?.part,
        customerName: saved?.form?.customer,
        error: error.message,
        success: false,
        imageStatus: {
          formImageValid:
            saved?.form?.partImageUrl?.startsWith("data:") || false,
          productInfoImageValid:
            saved?.productInfo?.partImageUrl?.startsWith("data:") || false,
          anyImageValid: !!(
            saved?.form?.partImageUrl?.startsWith("data:") ||
            saved?.productInfo?.partImageUrl?.startsWith("data:")
          ),
        },
        troubleshooting: {
          imageDisplayIssue: !(
            saved?.form?.partImageUrl?.startsWith("data:") ||
            saved?.productInfo?.partImageUrl?.startsWith("data:")
          ),
          needsImageFormatting:
            !!(
              saved?.form?.partImageUrl &&
              !saved?.form?.partImageUrl.startsWith("data:")
            ) ||
            !!(
              saved?.productInfo?.partImageUrl &&
              !saved?.productInfo?.partImageUrl.startsWith("data:")
            ),
          imageDataIntegrity: {
            formImageLength: saved?.form?.partImageUrl?.length || 0,
            productInfoImageLength:
              saved?.productInfo?.partImageUrl?.length || 0,
            formImageStartsWithData:
              saved?.form?.partImageUrl?.startsWith("data:") || false,
            productInfoImageStartsWithData:
              saved?.productInfo?.partImageUrl?.startsWith("data:") || false,
          },
        },
      });
    }
  };

  // Handler untuk kembali ke menu sebelumnya
  const handleBackToCards = () => {
    console.log("🔄 handleBackToCards: Kembali ke menu sebelumnya...");

    // Cek apakah ada perubahan yang belum disimpan
    const hasAnyChanges =
      hasUnsavedChanges ||
      hasScheduleChanges ||
      hasUnsavedChildPartChanges ||
      isNewlyGeneratedSchedule;

    if (hasAnyChanges && schedule && schedule.length > 0 && form.part) {
      console.log(
        "⚠️ Ada perubahan yang belum disimpan, tampilkan konfirmasi...",
      );

      // Tampilkan konfirmasi simpan jadwal dengan custom handler
      showNotification({
        title: "Konfirmasi Simpan Jadwal",
        message:
          "Ada perubahan yang belum disimpan. Apakah Anda ingin menyimpan jadwal sebelum kembali?\n\nJika tidak disimpan, perubahan akan hilang.",
        type: "confirm",
        onConfirm: async () => {
          // User memilih untuk simpan
          try {
            console.log("💾 User memilih untuk simpan jadwal...");

            // Update informasi produk sebelum menyimpan
            updateProductInfo();

            const currentMonth = selectedMonth;
            const currentYear = selectedYear;
            const scheduleName = `${MONTHS[currentMonth]} ${currentYear}`;

            // Cek apakah sudah ada jadwal untuk part, customer, bulan, dan tahun yang sama
            const existingSchedule = checkExistingSchedule(
              form.part,
              currentMonth,
              currentYear,
              form.customer,
            );

            console.log("🔍 BackToCards: Checking existing schedule:", {
              part: form.part,
              customer: form.customer,
              month: currentMonth,
              year: currentYear,
              existingSchedule: existingSchedule
                ? {
                    id: existingSchedule.id,
                    backendId: existingSchedule.backendId,
                    name: existingSchedule.name,
                  }
                : null,
            });

            if (existingSchedule && existingSchedule.backendId) {
              // Timpa jadwal yang sudah ada
              console.log(
                `🔄 BackToCards: Updating existing schedule with backendId ${existingSchedule.backendId}`,
              );
              await performSaveSchedule(
                currentMonth,
                currentYear,
                scheduleName,
                existingSchedule.backendId,
              );
            } else {
              // Buat jadwal baru
              console.log("🆕 BackToCards: Creating new schedule");
              await performSaveSchedule(
                currentMonth,
                currentYear,
                scheduleName,
              );
            }

            showSuccess("Jadwal berhasil disimpan!");
            console.log("✅ Save berhasil sebelum kembali ke menu");

            // Kembali ke menu sebelumnya
            goBackToPreviousMenu();
          } catch (error) {
            console.error("❌ Error saving before returning:", error);
            showAlert(
              "Gagal menyimpan jadwal. Silakan coba lagi atau pilih 'Tidak Simpan' untuk kembali tanpa menyimpan.",
              "Error",
            );
          }
        },
        confirmText: "Simpan",
        cancelText: "Tidak Simpan",
      });
    } else {
      // Tidak ada perubahan, langsung kembali ke menu
      console.log("✅ Tidak ada perubahan, langsung kembali ke menu");
      goBackToPreviousMenu();
    }
  };

  // Fungsi helper untuk kembali ke menu sebelumnya
  const goBackToPreviousMenu = () => {
    console.log("🔄 goBackToPreviousMenu: Kembali ke menu sebelumnya...");

    // Reset state untuk kembali ke tampilan jadwal bulanan
    setSelectedPart(null);
    setSelectedCustomer(null);
    setSchedule([]);
    setIsNewlyGeneratedSchedule(false);
    setHasUnsavedChanges(false);
    setHasScheduleChanges(false);
    setHasUnsavedChildPartChanges(false);
    setChildPartChanges(new Set());

    // Pastikan tidak ada schedule yang sedang aktif
    console.log("✅ States reset successfully");

    // Scroll ke bagian jadwal bulanan
    try {
      const jadwalSection = document.querySelector(
        '[data-section="jadwal-bulanan"]',
      );
      if (jadwalSection) {
        jadwalSection.scrollIntoView({ behavior: "smooth", block: "start" });
        console.log("✅ Scrolled to jadwal bulanan section");
      } else {
        // Fallback: scroll ke atas jika section tidak ditemukan
        window.scrollTo({ top: 0, behavior: "smooth" });
        console.log("⚠️ Jadwal bulanan section not found, scrolling to top");
      }
    } catch (error) {
      console.error("❌ Error scrolling to jadwal section:", error);
      // Fallback: scroll ke atas
      try {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch {}
    }

    console.log("✅ Berhasil kembali ke menu sebelumnya");
  };

  // Fungsi helper untuk reset state dan kembali ke card view
  const resetToCardView = () => {
    console.log("🔄 resetToCardView: Resetting all states...");

    // Reset semua state untuk kembali ke tampilan awal
    resetFormAndSchedule();
    setSelectedPart(null);
    setSelectedCustomer(null);
    setShowProductionForm(false);
    setIsEditMode(false);
    setHasUnsavedChanges(false);
    setHasScheduleChanges(false);
    setHasUnsavedChildPartChanges(false);
    setChildPartChanges(new Set());
    setChildParts([]);
    setSchedule([]);
    setIsNewlyGeneratedSchedule(false); // Reset flag jadwal baru
    setProductInfo({
      partName: "",
      customer: "",
      partImageUrl: "",
      lastSavedBy: undefined,
      lastSavedAt: undefined,
    });
    setSelectedMonth(new Date().getMonth());
    setSelectedYear(new Date().getFullYear());

    // Pastikan tidak ada schedule yang sedang aktif
    console.log("✅ All states reset successfully");

    // Scroll ke atas untuk menampilkan menu jadwal
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {}

    console.log("✅ Berhasil kembali ke menu jadwal");
  };

  const handleDownloadExcel = (saved: SavedSchedule) => {
    try {
      const timePerPcs = saved.form.timePerPcs || 257;
      const initialStock = saved.form.initialStock || 0;
      let runningStock = initialStock;
      const scheduleData = (saved.schedule || []).map(
        (item: any, index: number) => {
          const planningHour = item.planningHour || 0;
          const overtimeHour = item.overtimeHour || 0;
          const delivery = item.delivery || 0;
          const planningPcs =
            planningHour > 0
              ? Math.floor((planningHour * 3600) / timePerPcs)
              : 0;
          const overtimePcs =
            overtimeHour > 0
              ? Math.floor((overtimeHour * 3600) / timePerPcs)
              : 0;
          const hasilProduksi = planningPcs + overtimePcs;
          const prevStock = runningStock;
          const rencanaStock = prevStock + hasilProduksi - delivery;
          runningStock = rencanaStock;
          return {
            No: index + 1,
            Hari: item.day,
            Shift: item.shift,
            Waktu: item.time,
            Status: item.status,
            "Stok Awal": prevStock,
            Delivery: delivery,
            "Planning Hour": planningHour,
            "Overtime Hour": overtimeHour,
            "Planning PCS": planningPcs,
            "Overtime PCS": overtimePcs,
            "Hasil Produksi": hasilProduksi,
            "Stok Akhir": rencanaStock,
            "Jam Produksi Aktual": item.jamProduksiAktual || 0,
            Catatan: item.notes || "",
          };
        },
      );
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(scheduleData);
      XLSX.utils.book_append_sheet(wb, ws, "Schedule");
      XLSX.writeFile(wb, `${saved.name}.xlsx`);
    } catch (e) {}
  };

  // Fungsi untuk menyimpan data dari komponen ke backend
  const saveProductionDataToBackend = async (
    productionData: ScheduleItem[],
  ) => {
    try {
      const { ProductionService } = await import(
        "../../../services/API_Services"
      );

      // Cari schedule yang sedang aktif
      const currentSchedule = savedSchedules.find(
        (s) =>
          s.form.part === selectedPart && s.form.customer === selectedCustomer,
      );

      if (currentSchedule && currentSchedule.backendId) {
        // Update data produksi harian menggunakan backend ID
        const productionDataForUpdate = productionData.map((item: any) => ({
          ...item,
          year: selectedYear,
          month: selectedMonth + 1,
        }));

        const response =
          await ProductionService.updateDailyProductionBySchedule(
            currentSchedule.backendId,
            productionDataForUpdate,
          );

        console.log("Data produksi berhasil diupdate:", response);
        return response;
      } else {
        // Fallback ke metode lama jika tidak ada backend ID
        const response =
          await ProductionService.saveProductionDataFromComponents(
            productionData,
          );
        console.log("Data produksi berhasil disimpan:", response);
        return response;
      }
    } catch (error) {
      console.error("Error saving production data:", error);
      throw error;
    }
  };

  // Handler untuk menyimpan perubahan dari komponen
  const handleSaveProductionChanges = async (updatedRows: ScheduleItem[]) => {
    try {
      console.log(
        "🔄 handleSaveProductionChanges called with updatedRows:",
        updatedRows.length,
        "rows",
      );

      // Hitung ulang akumulasi untuk semua hari
      const { validGroupedRows } = prepareTableViewData(
        updatedRows,
        "",
        getScheduleName(selectedMonth, selectedYear),
      );

      console.log(
        "📊 Prepared validGroupedRows:",
        validGroupedRows.length,
        "groups",
      );
      console.log(
        "📊 ValidGroupedRows data:",
        validGroupedRows.map((group) => ({
          day: group.day,
          shift1Delivery:
            group.rows.find((r) => r.shift === "1")?.delivery || 0,
          shift2Delivery:
            group.rows.find((r) => r.shift === "2")?.delivery || 0,
        })),
      );

      recalculateAllAkumulasi(validGroupedRows);

      // Cari schedule yang sedang aktif
      const currentSchedule = savedSchedules.find(
        (s) =>
          s.form.part === selectedPart && s.form.customer === selectedCustomer,
      );

      if (currentSchedule && currentSchedule.backendId) {
        // Update data produksi harian menggunakan backend ID
        const { ProductionService } = await import(
          "../../../services/API_Services"
        );

        // Konversi data untuk update
        const productionDataForUpdate = updatedRows
          .filter((item: any) => item.shift === "1" || item.shift === "2")
          .map((item: any) => ({
            ...item,
            year: selectedYear,
            month: selectedMonth + 1,
          }));

        await ProductionService.updateDailyProductionBySchedule(
          currentSchedule.backendId,
          productionDataForUpdate,
        );

        // Update local state
        setSchedule(updatedRows);
        setHasScheduleChanges(false);

        showSuccess("Perubahan berhasil disimpan ke database!");
      } else {
        // Fallback ke metode lama jika tidak ada backend ID
        await saveProductionDataToBackend(updatedRows);
        // Setelah fallback create, coba refresh productPlannings agar backendId tersedia lagi
        try {
          const { PlanningSystemService } = await import(
            "../../../services/API_Services"
          );
          const refreshed = await PlanningSystemService.getAllProductPlanning();
          console.log(
            "Refreshed product plannings after fallback save:",
            refreshed,
          );
        } catch (e) {
          console.warn(
            "Failed to refresh product plannings after fallback save",
            e,
          );
        }
        showSuccess("Perubahan berhasil disimpan ke database!");
      }
    } catch (error) {
      console.error("Error saving production changes:", error);
      showAlert("Gagal menyimpan perubahan ke database", "Error");
    }
  };

  return (
    <div className="w-full min-h-screen flex items-start justify-center pt-16 sm:pt-20">
      {/* Navigation Loading Screen */}
      {navigationLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4 text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              🚀 Navigasi Otomatis
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Sedang membuka schedule dan scroll ke field yang bermasalah...
            </p>
            <div className="mt-4 space-y-2 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Membuka schedule...</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Scroll ke tanggal...</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span>Highlight field...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SchedulerPage main content */}
      <div className="w-full max-w-none mx-auto px-2 sm:px-4 lg:px-6">
        {/* Jadwal Produksi Section */}
        {savedSchedules.length > 0 && !isViewingSchedule && (
          <div className="mb-8" data-section="jadwal-bulanan">
            {!selectedPart ? (
              <div>
                <div className="max-w-7xl mx-auto w-full">
                  {/* Header dengan tombol Tambah Jadwal */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h1
                        className={`text-2xl sm:text-3xl font-bold ${uiColors.text.primary} mb-2`}
                      >
                        📋 Jadwal Produksi
                      </h1>
                      <p className={`${uiColors.text.tertiary} text-base`}>
                        Kelola dan monitor jadwal produksi Anda
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        resetFormAndSchedule();
                        setIsEditMode(false);
                        setShowProductionForm(true);
                      }}
                      className={`px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 shadow-lg flex items-center gap-2`}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Tambah Jadwal
                    </button>
                  </div>

                  <div
                    className={`${theme === "dark" ? "bg-gray-900" : "bg-gray-200"} ${uiColors.border.secondary} rounded-2xl p-4 sm:p-6 shadow-sm`}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2">
                      {parts.map((p) => (
                        <div
                          key={`${p.name}-${p.customer}`}
                          onClick={() => {
                            setSelectedPart(p.name);
                            setSelectedCustomer(p.customer);
                          }}
                          className={`group relative bg-white border ${p.borderColor} rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer grid grid-cols-12`}
                          style={{ minHeight: "150px" }}
                        >
                          <div className="col-span-5 md:col-span-5 relative">
                            {p.imageUrl ? (
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="absolute inset-0 w-full h-full object-cover object-center"
                              />
                            ) : (
                              <div
                                className={`absolute inset-0 ${p.bgColor} flex items-center justify-center`}
                              >
                                <Package className="w-10 h-10 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="col-span-7 md:col-span-7 p-5 md:p-6 flex flex-col justify-between bg-white">
                            <div className="flex items-start justify-between">
                              <div className="min-w-0">
                                <div
                                  className={`text-lg sm:text-xl font-bold text-gray-900 truncate`}
                                >
                                  {p.name} - {p.customer}
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingPartId(p.name);
                                  setEditingPartName(p.name);
                                  setEditingPartCustomer(p.customer);
                                  // Set gambar yang sudah ada jika ada
                                  setEditingPartImagePreview(
                                    p.imageUrl || null,
                                  );
                                  setEditingPartImage(null);
                                  setShowEditPartModal(true);
                                }}
                                className={`p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 shadow-lg border border-gray-300 transition-all duration-200 hover:scale-110`}
                                title="Edit part"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            </div>
                            <div>
                              <p className={`text-gray-600 text-xs mb-3`}>
                                {p.description}
                              </p>
                              <div
                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-white bg-gradient-to-r ${p.color} text-xs font-semibold shadow-md`}
                              >
                                <Calendar className="w-4 h-4" />
                                {
                                  getSchedulesByPart(p.name, p.customer).length
                                }{" "}
                                jadwal tersimpan
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {showEditPartModal && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                    onClick={handleCancelPartEdit}
                    onKeyDown={handleEditPartKeyDown}
                    tabIndex={-1}
                  >
                    <div
                      className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Edit3 className="w-5 h-5 text-blue-500" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">
                              Edit Part
                            </h3>
                            <p className="text-sm text-gray-300">
                              Ubah nama part, customer, dan gambar
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleCancelPartEdit}
                          className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">
                            Nama Part
                          </label>
                          <input
                            type="text"
                            value={editingPartName}
                            onChange={(e) => setEditingPartName(e.target.value)}
                            onKeyDown={handleEditPartKeyDown}
                            className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                            placeholder="Masukkan nama part"
                            autoFocus
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">
                            Nama Customer
                          </label>
                          <input
                            type="text"
                            value={editingPartCustomer}
                            onChange={(e) =>
                              setEditingPartCustomer(e.target.value)
                            }
                            onKeyDown={handleEditPartKeyDown}
                            className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                            placeholder="Masukkan nama customer"
                          />
                        </div>

                        {/* Part Image Upload Section */}
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">
                            Gambar Part
                          </label>
                          <div className="space-y-3">
                            {editingPartImagePreview ? (
                              <div className="relative">
                                <img
                                  src={editingPartImagePreview}
                                  alt="Part preview"
                                  className="w-full h-32 object-cover rounded-lg border border-gray-600"
                                />
                                <button
                                  onClick={handleRemoveEditPartImage}
                                  className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-lg"
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
                              </div>
                            ) : (
                              <div className="border-2 border-dashed border-gray-600 bg-gray-800/40 rounded-lg p-4 text-center">
                                <svg
                                  className="w-8 h-8 mx-auto text-gray-400 mb-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                  />
                                </svg>
                                <p className="text-sm text-gray-400">
                                  Belum ada gambar part
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Upload gambar untuk part ini
                                </p>
                              </div>
                            )}

                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleEditPartImageUpload}
                              className="hidden"
                              id="edit-part-image-upload"
                            />
                            <label
                              htmlFor="edit-part-image-upload"
                              className={`block w-full px-4 py-3 text-center bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold rounded-lg cursor-pointer transition-all duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            >
                              {editingPartImagePreview
                                ? "Ubah Gambar"
                                : "Upload Gambar"}
                            </label>
                          </div>
                        </div>

                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-gray-300">
                          <strong>Tips:</strong> Tekan Enter untuk simpan, Esc
                          untuk batal. Gambar akan otomatis tersimpan.
                        </div>
                      </div>
                      <div className="flex gap-3 mt-6">
                        <button
                          onClick={handleCancelPartEdit}
                          className="flex-1 px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105"
                        >
                          Batal
                        </button>
                        <button
                          onClick={handleSavePartEdit}
                          className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105"
                        >
                          Simpan
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div
                  className={`mb-6 p-6 ${theme === "dark" ? "bg-gray-800" : "bg-gray-100"} ${uiColors.border.secondary} rounded-2xl flex items-center gap-4 shadow-lg`}
                >
                  <button
                    onClick={() => {
                      setSelectedPart(null);
                      setSelectedCustomer(null);
                    }}
                    className={`p-2.5 ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"} hover:${theme === "dark" ? "bg-gray-600" : "bg-gray-300"} rounded-lg transition-all duration-200 hover:scale-105`}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="p-3 bg-blue-500/10 rounded-xl">
                    <Package className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className={`text-xl font-bold ${uiColors.text.primary} truncate mb-1`}
                    >
                      {selectedPart} - {selectedCustomer}
                    </div>
                  </div>
                  <div
                    className={`px-4 py-3 ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"} ${uiColors.border.secondary} rounded-xl text-center shadow-md`}
                  >
                    <div className={`text-sm ${uiColors.text.tertiary} mb-1`}>
                      Total Schedules
                    </div>
                    <div
                      className={`text-2xl font-bold ${uiColors.text.primary}`}
                    >
                      {
                        getSchedulesByPart(selectedPart, selectedCustomer)
                          .length
                      }
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getSchedulesByPart(selectedPart, selectedCustomer).map(
                    (s) => (
                      <div
                        key={s.id}
                        className={`group ${theme === "dark" ? "bg-gray-800" : "bg-gray-100"} ${uiColors.border.secondary} rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:scale-105`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-blue-500/10 rounded-xl">
                                <Calendar className="w-6 h-6 text-blue-500" />
                              </div>
                              <div>
                                <div
                                  className={`font-bold ${uiColors.text.primary} text-lg mb-1`}
                                >
                                  {s.name}
                                </div>
                                <div
                                  className={`text-sm ${uiColors.text.tertiary} flex items-center gap-1`}
                                >
                                  <Clock className="w-4 h-4" /> Dibuat:{" "}
                                  {new Date(s.date).toLocaleString("id-ID")}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleEditSchedule(s)}
                              className="p-1.5 bg-orange-500/10 hover:bg-orange-500/20 rounded-full transition-all duration-200 hover:scale-110"
                              title="Edit Jadwal"
                            >
                              <Edit3 className="w-5 h-5 text-orange-500" />
                            </button>
                          </div>

                          <div className="mb-6 space-y-3">
                            <div
                              className={`flex items-center gap-3 text-sm ${uiColors.text.secondary}`}
                            >
                              <Package className="w-5 h-5 text-blue-500" />
                              <span>
                                <span className="font-semibold">Part:</span>{" "}
                                {s.form.part}
                              </span>
                            </div>
                            <div
                              className={`flex items-center gap-3 text-sm ${uiColors.text.secondary}`}
                            >
                              <Cog className="w-5 h-5 text-purple-500" />
                              <span>
                                <span className="font-semibold">Customer:</span>{" "}
                                {s.form.customer}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <button
                              onClick={() => handleShowSchedule(s)}
                              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2 shadow-md"
                            >
                              <Eye className="w-4 h-4" /> Tampilkan
                            </button>
                            <button
                              onClick={() => handleDownloadExcel(s)}
                              className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2 shadow-md"
                              title="Download Excel"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteScheduleFromDatabase(s.id)
                              }
                              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2 shadow-md"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Production Form Modal */}
        {showProductionForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4"
            onClick={() => {
              setShowProductionForm(false);
              // Reset edit mode dan tracking jika modal ditutup
              if (isEditMode) {
                setIsEditMode(false);
                setEditingScheduleId(null);
                setEditingScheduleBackendId(null);
              }
            }}
          >
            <div
              className="bg-gray-900 rounded-3xl shadow-2xl w-full max-w-3xl relative border border-gray-800 animate-fadeInUp overflow-y-auto"
              style={{ maxWidth: "800px", maxHeight: "90vh" }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-red-400 text-xl sm:text-2xl font-bold z-10"
                onClick={() => {
                  setShowProductionForm(false);
                  // Reset edit mode dan tracking jika modal ditutup
                  if (isEditMode) {
                    setIsEditMode(false);
                    setEditingScheduleId(null);
                    setEditingScheduleBackendId(null);
                  }
                }}
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
                generateSchedule={async () => {
                  if (isEditMode) {
                    // Mode edit: Update jadwal yang sudah ada
                    console.log(
                      "🔄 Edit mode: Memanggil saveSchedule untuk update jadwal",
                    );
                    try {
                      await saveSchedule();
                      setShowProductionForm(false);
                      setIsEditMode(false);
                      // Reset tracking edit
                      setEditingScheduleId(null);
                      setEditingScheduleBackendId(null);

                      // Update jadwal yang sudah ada di state lokal
                      if (editingScheduleId) {
                        const updatedSchedules = savedSchedules.map((s) => {
                          if (s.id === editingScheduleId) {
                            return {
                              ...s,
                              name: `${MONTHS[selectedMonth]} ${selectedYear}`,
                              form: {
                                ...s.form,
                                stock: form.stock,
                                partImageUrl:
                                  form.partImageUrl || s.form.partImageUrl,
                              },
                              productInfo: {
                                ...s.productInfo,
                                lastSavedAt: new Date().toISOString(),
                              },
                            };
                          }
                          return s;
                        });
                        setSavedSchedules(updatedSchedules);
                      }

                      // Jangan masuk ke dashboard, tetap di card view
                      console.log(
                        "✅ Edit mode: Jadwal berhasil diupdate, tetap di card view",
                      );
                      showSuccess("Jadwal berhasil diupdate!");
                    } catch (error) {
                      console.error("Error updating schedule:", error);
                      showAlert("Gagal mengupdate jadwal", "Error");
                    }
                  } else {
                    // Mode create: Generate jadwal baru
                    console.log(
                      "🆕 Create mode: Memanggil generateSchedule untuk jadwal baru",
                    );
                    await generateSchedule();
                    setShowProductionForm(false);
                    setIsEditMode(false);
                    // Untuk mode create, set selectedPart untuk masuk ke dashboard
                    setSelectedPart(form.part);
                    console.log("✅ Create mode: Masuk ke dashboard produksi");
                  }
                }}
                saveSchedule={saveSchedule}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                setSelectedMonth={setSelectedMonth}
                setSelectedYear={setSelectedYear}
                onSaveToBackend={handleSaveToBackend}
                onSuccess={(msg) => {
                  showSuccess(
                    msg ||
                      (isEditMode
                        ? "Perubahan berhasil disimpan!"
                        : "Jadwal berhasil digenerate!"),
                  );
                  setShowProductionForm(false);
                  setIsEditMode(false);

                  if (isEditMode) {
                    // Mode edit: Reset tracking edit dan tetap di card view
                    setEditingScheduleId(null);
                    setEditingScheduleBackendId(null);
                    console.log(
                      "✅ Edit mode onSuccess: Reset tracking, tetap di card view",
                    );
                    // Jangan reset form, biarkan user melihat perubahan di card view
                  } else {
                    // Mode create: Kembali ke view cards setelah generate berhasil
                    console.log(
                      "✅ Create mode onSuccess: Kembali ke view cards",
                    );

                    // Reset form dan schedule untuk kembali ke tampilan awal
                    resetFormAndSchedule();

                    // Pastikan user kembali ke view cards
                    setSelectedPart(null);
                    setSelectedCustomer(null);
                    setSchedule([]);
                    setIsNewlyGeneratedSchedule(false);
                    setHasUnsavedChanges(false);
                    setHasScheduleChanges(false);
                    setHasUnsavedChildPartChanges(false);
                    setChildPartChanges(new Set());

                    // Scroll ke atas untuk menampilkan cards
                    setTimeout(() => {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }, 100);
                  }
                }}
                isEditMode={isEditMode}
                editingScheduleId={editingScheduleId}
                editingScheduleBackendId={editingScheduleBackendId}
              />
            </div>
          </div>
        )}

        {/* If no schedule, show blank state */}
        {schedule.length === 0 ? (
          savedSchedules.length > 0 ? (
            <div className="h-0" />
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] sm:h-[500px] px-4 overflow-hidden">
              <div
                className={`${theme === "dark" ? "bg-gray-800" : "bg-gray-100"} ${uiColors.border.secondary} rounded-3xl p-12 sm:p-16 shadow-xl max-w-lg w-full text-center`}
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 sm:mb-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center shadow-lg">
                  <svg
                    className="w-10 h-10 sm:w-12 sm:h-12 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
                <h3
                  className={`text-2xl sm:text-3xl font-bold ${uiColors.text.primary} mb-4`}
                >
                  Belum Ada Jadwal Tersimpan
                </h3>
                <p
                  className={`${uiColors.text.secondary} mb-8 max-w-md mx-auto text-base sm:text-lg leading-relaxed`}
                >
                  Anda belum memiliki jadwal produksi yang tersimpan. Buat
                  jadwal baru di halaman Scheduler untuk melihatnya di sini.
                </p>
                <button
                  onClick={() => {
                    resetFormAndSchedule();
                    setIsEditMode(false);
                    setShowProductionForm(true);
                  }}
                  className="px-8 sm:px-10 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl transition-all duration-300 hover:scale-105 shadow-xl font-semibold text-base sm:text-lg flex items-center gap-2 mx-auto"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Tambah Jadwal
                </button>
              </div>
            </div>
          )
        ) : (
          <div id="schedule-table-section">
            {/* Dashboard Produksi Header dengan gradasi full */}
            <div
              className={`${theme === "dark" ? "bg-gray-700" : "bg-gray-200"} px-6 sm:px-10 py-6 sm:py-8 rounded-t-3xl ${uiColors.border.primary}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="flex items-center gap-4">
                  {/* Tombol Kembali di sebelah kiri */}
                  <button
                    onClick={handleBackToCards}
                    className={`px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 shadow-lg flex items-center gap-2`}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                      />
                    </svg>
                    Kembali
                  </button>

                  <div>
                    <h2
                      className={`text-2xl sm:text-3xl font-bold ${uiColors.text.primary} mb-2`}
                    >
                      🏭 Dashboard Produksi
                    </h2>
                    <p
                      className={`${uiColors.text.tertiary} mt-2 text-base sm:text-lg`}
                    >
                      Monitoring dan perencanaan produksi harian
                    </p>
                  </div>
                </div>

                {/* Combined Controls */}
                <div className="flex flex-row items-center gap-2 sm:gap-4">
                  {/* Search */}
                  <div className="relative flex-1 sm:flex-none">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg
                        className={`w-5 h-5 ${uiColors.text.tertiary}`}
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
                      className={`w-full max-w-[200px] sm:w-48 pl-12 pr-4 py-2.5 ${uiColors.bg.primary} ${uiColors.border.secondary} rounded-xl ${uiColors.text.primary} placeholder-${uiColors.text.tertiary} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm shadow-md`}
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

                  {/* View Mode Toggle */}
                  <ViewModeToggle
                    currentView={viewMode}
                    onViewChange={setViewMode}
                  />

                  {/* Tombol Simpan Jadwal */}
                  <button
                    onClick={handleSaveClick}
                    disabled={isSavingSchedule}
                    className={`px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 shadow-lg flex items-center gap-2 ${
                      isSavingSchedule
                        ? "opacity-70 cursor-not-allowed hover:scale-100"
                        : "hover:scale-105"
                    }`}
                    title="Simpan jadwal ke database"
                  >
                    {isSavingSchedule ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5"
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
                        <span>Simpan Jadwal</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div
              data-section="schedule-table"
              className={`${theme === "dark" ? "bg-gray-800" : "bg-gray-100"} ${uiColors.border.primary} rounded-b-3xl`}
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

                  {/* Search and Add Button Row */}
                  <div className="flex flex-row items-center gap-4 w-full sm:w-auto order-1 sm:order-2">
                    {/* Search Input */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg
                          className="w-5 h-5 text-gray-400"
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
                        value={childPartSearch}
                        onChange={(e) => {
                          setChildPartSearch(e.target.value);
                          resetChildPartPagination(); // Reset pagination ketika search berubah
                        }}
                        placeholder="Cari Child Part..."
                        className="w-full max-w-[200px] sm:w-48 pl-12 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm shadow-md"
                      />
                      {childPartSearch && (
                        <button
                          onClick={() => {
                            setChildPartSearch("");
                            resetChildPartPagination(); // Reset pagination ketika search dibersihkan
                          }}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-red-400"
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

                    {/* Button Tambahkan Material */}
                    <button
                      onClick={() => setShowChildPartModal(true)}
                      className="h-12 px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg text-base"
                    >
                      Tambahkan Material
                    </button>
                  </div>
                </div>
              </div>

              {/* Render ChildPartTable dengan pagination */}
              {childParts.length > 0 ? (
                <div className="relative px-4 pb-8">
                  {(() => {
                    // Filter childParts by filter dropdown dan search
                    const filtered = getFilteredChildParts();

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

                    // Pagination logic
                    const totalPages = Math.ceil(
                      filtered.length / childPartsPerPage,
                    );
                    const startIndex = currentChildPartPage * childPartsPerPage;
                    const endIndex = startIndex + childPartsPerPage;
                    const currentItems = filtered.slice(startIndex, endIndex);
                    return (
                      <>
                        <div
                          data-section="child-parts"
                          className={`grid gap-8 ${viewMode === "cards" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}
                        >
                          {currentItems.map((cp, idx) => {
                            const realIdx = childParts.findIndex(
                              (c) => c === cp,
                            );
                            const commonProps = {
                              partName: cp.partName,
                              customerName: cp.customerName,
                              initialStock: cp.stock,
                              days: days,
                              schedule: schedule,
                              onEdit: (data: {
                                partName: string;
                                customerName: string;
                                stock: number | null;
                              }) => {
                                // Update state lokal + dedupe
                                setChildParts((prev) => {
                                  const updated = prev.map((c, i) =>
                                    i === realIdx
                                      ? {
                                          ...c,
                                          partName: data.partName,
                                          customerName: data.customerName,
                                          stock: data.stock ?? c.stock,
                                        }
                                      : c,
                                  );
                                  return dedupeChildParts(updated);
                                });

                                // Update backend jika ada ID
                                try {
                                  const current = childParts[realIdx];
                                  if (
                                    current?.id &&
                                    typeof current.id === "number"
                                  ) {
                                    ChildPartService.updateChildPart(
                                      current.id,
                                      {
                                        partName: data.partName,
                                        customerName: data.customerName,
                                        stockAvailable: data.stock ?? 0,
                                      },
                                    )
                                      .then(() => {
                                        showSuccess(
                                          "Child part berhasil diupdate!",
                                        );
                                      })
                                      .catch((err: any) => {
                                        console.error(
                                          "Gagal update child part ke server:",
                                          err,
                                        );
                                        showAlert(
                                          "Gagal update child part ke database",
                                          "Peringatan",
                                        );
                                      });
                                  }
                                } catch (e) {
                                  console.error(
                                    "Error updating child part:",
                                    e,
                                  );
                                }
                              },
                              onDelete: () => {
                                handleDeleteChildPart(realIdx);
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
                              <ChildPartCardView key={idx} {...commonProps} />
                            ) : (
                              <ChildPartTable key={idx} {...commonProps} />
                            );
                          })}
                        </div>

                        {/* Pagination Navigation */}
                        {totalPages > 1 && (
                          <div className="flex items-center justify-center gap-6 mt-10 mb-4">
                            {/* Previous Button */}
                            <button
                              onClick={goToPreviousChildPartPage}
                              disabled={currentChildPartPage === 0}
                              className={`group flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg ${
                                currentChildPartPage === 0
                                  ? "bg-gray-500/20 border border-gray-600 text-gray-500 cursor-not-allowed"
                                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border border-blue-500/30 hover:border-blue-400/50 hover:scale-105 hover:shadow-xl"
                              }`}
                            >
                              <svg
                                className={`w-5 h-5 transition-transform duration-300 ${
                                  currentChildPartPage === 0
                                    ? "text-gray-500"
                                    : "text-white group-hover:-translate-x-1"
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2.5}
                                  d="M15 19l-7-7 7-7"
                                />
                              </svg>
                              <span className="text-sm font-medium">
                                Sebelumnya
                              </span>
                            </button>

                            {/* Page Info - Enhanced Design */}
                            <div className="flex flex-col items-center gap-1.5 px-6 py-3 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-lg">
                              {/* Page Numbers */}
                              <div className="flex items-center gap-2">
                                <span className="text-xl font-bold text-white">
                                  {currentChildPartPage + 1}
                                </span>
                                <span className="text-gray-400 text-sm font-medium">
                                  dari
                                </span>
                                <span className="text-xl font-bold text-blue-400">
                                  {totalPages}
                                </span>
                              </div>

                              {/* Total Items Info */}
                              <div className="flex items-center gap-1.5 text-gray-300">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                                <span className="text-xs font-medium">
                                  {filtered.length} total Child Part
                                </span>
                              </div>

                              {/* Progress Bar */}
                              <div className="w-24 h-1 bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
                                  style={{
                                    width: `${((currentChildPartPage + 1) / totalPages) * 100}%`,
                                  }}
                                ></div>
                              </div>
                            </div>

                            {/* Next Button */}
                            <button
                              onClick={goToNextChildPartPage}
                              disabled={currentChildPartPage >= totalPages - 1}
                              className={`group flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg ${
                                currentChildPartPage >= totalPages - 1
                                  ? "bg-gray-500/20 border border-gray-600 text-gray-500 cursor-not-allowed"
                                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border border-blue-500/30 hover:border-blue-400/50 hover:scale-105 hover:shadow-xl"
                              }`}
                            >
                              <span className="text-sm font-medium">
                                Selanjutnya
                              </span>
                              <svg
                                className={`w-5 h-5 transition-transform duration-300 ${
                                  currentChildPartPage >= totalPages - 1
                                    ? "text-gray-500"
                                    : "text-white group-hover:translate-x-1"
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2.5}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
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

        {/* Edit Schedule Modal */}
        {editingScheduleData && (
          <EditScheduleModal
            isOpen={showEditScheduleModal}
            onClose={() => {
              setShowEditScheduleModal(false);
              setEditingScheduleData(null);
              setEditingScheduleId(null);
              setEditingScheduleBackendId(null);
            }}
            onSave={handleSaveEditSchedule}
            initialData={editingScheduleData}
            isLoading={isUpdatingSchedule}
          />
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
      </div>
    </div>
  );
};

export default SchedulerPage;
