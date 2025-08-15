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
  backendId?: number;
  name: string;
  date: string;
  form: any;
  schedule: ScheduleItem[];
  childParts?: ChildPartData[];
  productInfo?: {
    partName?: string;
    customer?: string;
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
                const newId = `${partName}-${monthIndex}-${year}`
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
    setLoadedSchedule(savedSchedule);
  };

  const deleteSchedule = (id: string) => {
    const updatedSchedules = savedSchedules.filter((s) => s.id !== id);
    setSavedSchedules(updatedSchedules);
    localStorage.setItem("savedSchedules", JSON.stringify(updatedSchedules));
  };

  // Fungsi untuk mengecek jadwal yang sudah ada berdasarkan part, bulan, dan tahun
  const checkExistingSchedule = (
    partName: string,
    month: number,
    year: number,
  ): SavedSchedule | null => {
    // Buat ID yang konsisten berdasarkan part, bulan, dan tahun
    const scheduleId = `${partName}-${month}-${year}`
      .replace(/\s+/g, "-")
      .toLowerCase();

    const existingSchedule = savedSchedules.find((schedule) => {
      return schedule.id === scheduleId;
    });

    return existingSchedule || null;
  };

  // Fungsi untuk mengupdate jadwal yang sudah ada
  const updateSchedule = (id: string, updatedSchedule: SavedSchedule) => {
    const updatedSchedules = savedSchedules.map((schedule) =>
      schedule.id === id ? updatedSchedule : schedule,
    );
    setSavedSchedules(updatedSchedules);
    localStorage.setItem("savedSchedules", JSON.stringify(updatedSchedules));
  };

  // Fungsi untuk menyimpan jadwal ke localStorage
  const saveSchedulesToStorage = (schedules: SavedSchedule[]) => {
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
