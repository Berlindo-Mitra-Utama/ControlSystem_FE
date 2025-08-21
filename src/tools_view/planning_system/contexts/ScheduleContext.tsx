import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { ScheduleItem } from "../types/scheduleTypes";
import { ChildPartData } from "../types/childPartTypes";
import { MONTHS } from "../utils/scheduleDateUtils";

export interface SavedSchedule {
  id: string;
  backendId?: number; // ID dari database backend
  name: string;
  date: string;
  form: any;
  schedule: ScheduleItem[];
  childParts?: ChildPartData[];
  productInfo?: {
    partName?: string;
    customer?: string;
    partImageUrl?: string;
    lastSavedBy?: {
      nama: string;
      role: string;
    };
    lastSavedAt?: string;
  };
}

interface ScheduleContextType {
  savedSchedules: SavedSchedule[];
  setSavedSchedules: React.Dispatch<React.SetStateAction<SavedSchedule[]>>;
  loadedSchedule: SavedSchedule | null;
  setLoadedSchedule: React.Dispatch<React.SetStateAction<SavedSchedule | null>>;
  loadSchedule: (savedSchedule: SavedSchedule) => void;
  deleteSchedule: (id: string) => void;
  checkExistingSchedule: (
    partName: string,
    month: number,
    year: number,
    customerName?: string,
  ) => SavedSchedule | null;
  updateSchedule: (id: string, updatedSchedule: SavedSchedule) => void;
  saveSchedulesToStorage: (schedules: SavedSchedule[]) => void;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(
  undefined,
);

export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (context === undefined) {
    throw new Error("useSchedule must be used within a ScheduleProvider");
  }
  return context;
};

interface ScheduleProviderProps {
  children: ReactNode;
}

export const ScheduleProvider: React.FC<ScheduleProviderProps> = ({
  children,
}) => {
  const [savedSchedules, setSavedSchedules] = useState<SavedSchedule[]>([]);
  const [loadedSchedule, setLoadedSchedule] = useState<SavedSchedule | null>(
    null,
  );

  useEffect(() => {
    const saved = localStorage.getItem("savedSchedules");
    if (saved) {
      const parsedSchedules = JSON.parse(saved);

      // Bersihkan jadwal lama dengan ID yang tidak konsisten
      const cleanedSchedules = parsedSchedules.map(
        (schedule: SavedSchedule) => {
          // Jika ID menggunakan format lama (timestamp), buat ID baru yang konsisten
          if (
            schedule.id &&
            schedule.id.length > 20 &&
            !isNaN(Number(schedule.id))
          ) {
            const partName =
              schedule.form?.part || schedule.productInfo?.partName || "";
            const scheduleName = schedule.name || "";

            // Extract bulan dan tahun dari nama jadwal
            const monthMatch = scheduleName.match(
              /(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)/i,
            );
            const yearMatch = scheduleName.match(/(\d{4})/);

            if (monthMatch && yearMatch) {
              const monthIndex = MONTHS.findIndex(
                (m) => m.toLowerCase() === monthMatch[1].toLowerCase(),
              );
              const year = parseInt(yearMatch[1]);

              if (monthIndex !== -1 && year) {
                // Gunakan customer jika tersedia, jika tidak gunakan format lama
                const customerName =
                  schedule.form?.customer ||
                  schedule.productInfo?.customer ||
                  "";
                const newId = customerName
                  ? `${partName}-${customerName}-${monthIndex}-${year}`
                      .replace(/\s+/g, "-")
                      .toLowerCase()
                  : `${partName}-${monthIndex}-${year}`
                      .replace(/\s+/g, "-")
                      .toLowerCase();
                return { ...schedule, id: newId };
              }
            }
          }
          return schedule;
        },
      );

      // Hapus duplikat berdasarkan ID baru
      const uniqueSchedules = cleanedSchedules.filter(
        (schedule: SavedSchedule, index: number, self: SavedSchedule[]) =>
          index === self.findIndex((s) => s.id === schedule.id),
      );

      setSavedSchedules(uniqueSchedules);
      localStorage.setItem("savedSchedules", JSON.stringify(uniqueSchedules));
    }
  }, []);

  const loadSchedule = (savedSchedule: SavedSchedule) => {
    // Pastikan partImageUrl tersimpan dengan benar
    if (savedSchedule.productInfo?.partImageUrl) {
      console.log(
        "✅ Loading schedule with image:",
        savedSchedule.productInfo.partImageUrl,
      );
    }
    setLoadedSchedule(savedSchedule);
  };

  const deleteSchedule = (id: string) => {
    const updatedSchedules = savedSchedules.filter((s) => s.id !== id);
    setSavedSchedules(updatedSchedules);
    localStorage.setItem("savedSchedules", JSON.stringify(updatedSchedules));
  };

  // Fungsi untuk mengecek jadwal yang sudah ada berdasarkan part, customer, bulan, dan tahun
  const checkExistingSchedule = (
    partName: string,
    month: number,
    year: number,
    customerName?: string,
  ): SavedSchedule | null => {
    // Buat ID yang konsisten berdasarkan part, customer, bulan, dan tahun
    const scheduleId = customerName
      ? `${partName}-${customerName}-${month}-${year}`
          .replace(/\s+/g, "-")
          .toLowerCase()
      : `${partName}-${month}-${year}`.replace(/\s+/g, "-").toLowerCase();

    // Cari berdasarkan ID yang konsisten
    let existingSchedule = savedSchedules.find((schedule) => {
      return schedule.id === scheduleId;
    });

    // Jika tidak ditemukan berdasarkan ID, cari berdasarkan part, customer, bulan, dan tahun
    if (!existingSchedule) {
      existingSchedule = savedSchedules.find((schedule) => {
        const schedulePart =
          schedule.form?.part || schedule.productInfo?.partName || "";
        const scheduleCustomer =
          schedule.form?.customer || schedule.productInfo?.customer || "";

        // Parse bulan dan tahun dari nama schedule
        const monthMatch = schedule.name.match(
          /(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)/i,
        );
        const yearMatch = schedule.name.match(/(\d{4})/);

        if (monthMatch && yearMatch) {
          const scheduleMonthIndex = [
            "Januari",
            "Februari",
            "Maret",
            "April",
            "Mei",
            "Juni",
            "Juli",
            "Agustus",
            "September",
            "Oktober",
            "November",
            "Desember",
          ].findIndex((m) => m.toLowerCase() === monthMatch[1].toLowerCase());
          const scheduleYear = parseInt(yearMatch[1]);

          return (
            schedulePart === partName &&
            scheduleCustomer === (customerName || "") &&
            scheduleMonthIndex === month &&
            scheduleYear === year
          );
        }

        return false;
      });
    }

    return existingSchedule || null;
  };

  // Fungsi untuk mengupdate jadwal yang sudah ada
  const updateSchedule = (id: string, updatedSchedule: SavedSchedule) => {
    const updatedSchedules = savedSchedules.map((schedule) =>
      schedule.id === id ? updatedSchedule : schedule,
    );
    setSavedSchedules(updatedSchedules);
    localStorage.setItem("savedSchedules", JSON.stringify(updatedSchedules));

    // Log untuk debugging gambar
    if (updatedSchedule.productInfo?.partImageUrl) {
      console.log(
        "✅ Updated schedule with image:",
        updatedSchedule.productInfo.partImageUrl,
      );
    }
  };

  // Fungsi untuk menyimpan jadwal ke localStorage
  const saveSchedulesToStorage = (schedules: SavedSchedule[]) => {
    // Log untuk debugging gambar
    schedules.forEach((schedule) => {
      if (schedule.productInfo?.partImageUrl) {
        console.log("💾 Saving schedule with image to localStorage:", {
          id: schedule.id,
          partImageUrl:
            schedule.productInfo.partImageUrl.substring(0, 50) + "...",
        });
      }
    });

    localStorage.setItem("savedSchedules", JSON.stringify(schedules));
  };

  return (
    <ScheduleContext.Provider
      value={{
        savedSchedules,
        setSavedSchedules,
        loadedSchedule,
        setLoadedSchedule,
        loadSchedule,
        deleteSchedule,
        checkExistingSchedule,
        updateSchedule,
        saveSchedulesToStorage,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
};
