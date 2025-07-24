import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { ScheduleItem } from "../types/scheduleTypes";

export interface SavedSchedule {
  id: string;
  name: string;
  date: string;
  form: any;
  schedule: ScheduleItem[];
}

interface ScheduleContextType {
  savedSchedules: SavedSchedule[];
  setSavedSchedules: React.Dispatch<React.SetStateAction<SavedSchedule[]>>;
  loadedSchedule: SavedSchedule | null;
  setLoadedSchedule: React.Dispatch<React.SetStateAction<SavedSchedule | null>>;
  loadSchedule: (savedSchedule: SavedSchedule) => void;
  deleteSchedule: (id: string) => void;
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

  return (
    <ScheduleContext.Provider
      value={{
        savedSchedules,
        setSavedSchedules,
        loadedSchedule,
        setLoadedSchedule,
        loadSchedule,
        deleteSchedule,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
};
