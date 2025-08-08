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
      setSavedSchedules(JSON.parse(saved));
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
    const existingSchedule = savedSchedules.find((schedule) => {
      // Cek berdasarkan part name dan nama jadwal yang mengandung bulan dan tahun
      const scheduleName = schedule.name.toLowerCase();
      const monthName = MONTHS[month].toLowerCase();
      const yearStr = year.toString();

      return (
        schedule.form.part === partName &&
        scheduleName.includes(monthName) &&
        scheduleName.includes(yearStr)
      );
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
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
};
