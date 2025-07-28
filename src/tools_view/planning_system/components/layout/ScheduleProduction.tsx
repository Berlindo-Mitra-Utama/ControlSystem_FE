import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { ScheduleTableProps } from "../../types/scheduleTypes";
import {
  calculateOutputFields,
  prepareTableViewData,
  prepareExcelData,
} from "../../utils/scheduleCalcUtils";
import ScheduleCardsView from "./ScheduleCardsView";
import ScheduleTableView from "./ScheduleTableView";

// State and handlers for shared manpower
const useSharedManpower = () => {
  const [manpowerList, setManpowerList] = useState<
    { id: number; name: string }[]
  >([]);
  const [newManpower, setNewManpower] = useState("");
  const reindexManpower = (list: { id: number; name: string }[]) =>
    list.map((mp, idx) => ({ ...mp, id: idx + 1 }));
  const handleAddManpower = () => {
    const name = newManpower.trim();
    if (name && !manpowerList.some((mp) => mp.name === name)) {
      const newList = [...manpowerList, { id: manpowerList.length + 1, name }];
      setManpowerList(reindexManpower(newList));
      setNewManpower("");
    }
  };
  const handleRemoveManpower = (id: number) => {
    const filtered = manpowerList.filter((mp) => mp.id !== id);
    setManpowerList(reindexManpower(filtered));
  };
  return {
    manpowerList,
    setManpowerList,
    newManpower,
    setNewManpower,
    handleAddManpower,
    handleRemoveManpower,
  };
};

const ScheduleProduction: React.FC<ScheduleTableProps> = (props) => {
  const [viewMode, setViewMode] = useState<"cards" | "table">(
    props.viewMode || "cards",
  );
  const [searchDate, setSearchDate] = useState(props.searchDate || "");

  // Update viewMode when props change
  useEffect(() => {
    if (props.viewMode) {
      setViewMode(props.viewMode);
    }
  }, [props.viewMode]);

  // Update searchDate when props change
  useEffect(() => {
    if (props.searchDate !== undefined) {
      setSearchDate(props.searchDate);
    }
  }, [props.searchDate]);

  // Prepare data for ScheduleTableView using utils
  const { validGroupedRows, flatRows } = prepareTableViewData(
    props.schedule,
    searchDate,
    props.scheduleName,
  );

  // Fungsi untuk download schedule sebagai file Excel
  const handleDownloadExcel = () => {
    // Persiapkan data untuk Excel menggunakan utils
    const scheduleData = prepareExcelData(
      flatRows,
      props.timePerPcs || 257,
      props.initialStock,
    );

    // Buat workbook baru
    const wb = XLSX.utils.book_new();

    // Buat worksheet untuk data schedule
    const ws = XLSX.utils.json_to_sheet(scheduleData);

    // Tambahkan worksheet ke workbook
    XLSX.utils.book_append_sheet(wb, ws, "Schedule");

    // Download file Excel
    XLSX.writeFile(
      wb,
      `schedule_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  // Event listeners untuk komunikasi dengan SchedulerPage
  useEffect(() => {
    const handleDownloadExcelEvent = () => {
      handleDownloadExcel();
    };

    window.addEventListener("downloadExcel", handleDownloadExcelEvent);

    return () => {
      window.removeEventListener("downloadExcel", handleDownloadExcelEvent);
    };
  }, [flatRows, props.timePerPcs, props.initialStock]);

  const {
    manpowerList,
    setManpowerList,
    newManpower,
    setNewManpower,
    handleAddManpower,
    handleRemoveManpower,
  } = useSharedManpower();

  return (
    <div className="w-full">
      {viewMode === "cards" ? (
        <ScheduleCardsView
          schedule={props.schedule}
          setEditForm={props.setEditForm}
          initialStock={props.initialStock}
          timePerPcs={props.timePerPcs}
          scheduleName={props.scheduleName}
          searchDate={searchDate}
          manpowerList={manpowerList}
          setManpowerList={setManpowerList}
          newManpower={newManpower}
          setNewManpower={setNewManpower}
          handleAddManpower={handleAddManpower}
          handleRemoveManpower={handleRemoveManpower}
        />
      ) : (
        <ScheduleTableView
          validGroupedRows={validGroupedRows}
          flatRows={flatRows}
          timePerPcs={props.timePerPcs}
          initialStock={props.initialStock}
          scheduleName={props.scheduleName}
          setEditForm={props.setEditForm}
          manpowerList={manpowerList}
          setManpowerList={setManpowerList}
          newManpower={newManpower}
          setNewManpower={setNewManpower}
          handleAddManpower={handleAddManpower}
          handleRemoveManpower={handleRemoveManpower}
        />
      )}
    </div>
  );
};

export default ScheduleProduction;
