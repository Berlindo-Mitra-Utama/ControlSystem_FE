import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { ScheduleTableProps } from "../../types/scheduleTypes";
import { calculateOutputFields } from "../../utils/scheduleCalcUtils";
import ScheduleCardsView from "./ScheduleCardsView";
import ScheduleTableView from "./ScheduleTableView";

const ScheduleProduction: React.FC<ScheduleTableProps> = (props) => {
  const [viewMode, setViewMode] = useState<"cards" | "timeline">(
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

  // Prepare data for ScheduleTableView
  const prepareTableViewData = () => {
    // Filter schedule berdasarkan search box (if any)
    const filteredSchedule = searchDate
      ? props.schedule.filter((row) =>
          row.day.toString().includes(searchDate.trim()),
        )
      : props.schedule;

    // Group data berdasarkan hari
    const groupedRows: { day: number; rows: typeof filteredSchedule }[] = [];
    filteredSchedule.forEach((row) => {
      const lastGroup = groupedRows[groupedRows.length - 1];
      if (lastGroup && lastGroup.day === row.day) {
        lastGroup.rows.push(row);
      } else {
        groupedRows.push({ day: row.day, rows: [row] });
      }
    });

    // Filter groupedRows berdasarkan hari valid dalam bulan
    const months = [
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
    ];

    let monthIndex = -1;
    let year = new Date().getFullYear();

    // Cari bulan dalam scheduleName
    for (let i = 0; i < months.length; i++) {
      if (props.scheduleName?.includes(months[i])) {
        monthIndex = i;
        break;
      }
    }

    // Extract tahun menggunakan regex
    const yearMatch = props.scheduleName?.match(/(\d{4})/);
    if (yearMatch && yearMatch[1]) {
      year = parseInt(yearMatch[1]);
    }

    // Jika bulan tidak ditemukan, gunakan default
    if (monthIndex === -1) {
      monthIndex = 6; // Juli sebagai default
      year = 2025;
    }

    // Import getDaysInMonth function
    const getDaysInMonth = (month: number, year: number): number => {
      return new Date(year, month + 1, 0).getDate();
    };

    const maxDaysInMonth = getDaysInMonth(monthIndex, year);
    const validGroupedRows = groupedRows.filter(
      (group) => group.day >= 1 && group.day <= maxDaysInMonth,
    );

    const flatRows = validGroupedRows.flatMap((g) => g.rows);

    return { validGroupedRows, flatRows };
  };

  const { validGroupedRows, flatRows } = prepareTableViewData();

  // Fungsi untuk download schedule sebagai file Excel
  const handleDownloadExcel = () => {
    // Persiapkan data untuk Excel
    const scheduleData = flatRows.map((item, index) => {
      const calculated = calculateOutputFields(
        item,
        index,
        flatRows,
        props.timePerPcs,
        props.initialStock,
      );
      return {
        No: index + 1,
        Hari: item.day,
        Shift: item.shift,
        Waktu: item.shift === "1" ? "07:30-16:30" : "19:30-04:30",
        Status: item.status,
        "Stok Awal": calculated.prevStock,
        Delivery: item.delivery || 0,
        "Planning Hour": item.planningHour || 0,
        "Overtime Hour": item.overtimeHour || 0,
        "Planning PCS": calculated.planningPcs,
        "Overtime PCS": calculated.overtimePcs,
        "Hasil Produksi": calculated.hasilProduksi,
        "Actual Stock": calculated.actualStock,
        "Jam Produksi Aktual": item.jamProduksiAktual || 0,
        Catatan: item.notes || "",
      };
    });

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

  return (
    <div className="w-full">
      {viewMode === "cards" ? (
        <ScheduleCardsView
          schedule={props.schedule}
          editingRow={props.editingRow}
          editForm={props.editForm}
          startEdit={props.startEdit}
          saveEdit={props.saveEdit}
          cancelEdit={props.cancelEdit}
          setEditForm={props.setEditForm}
          initialStock={props.initialStock}
          timePerPcs={props.timePerPcs}
          scheduleName={props.scheduleName}
          searchDate={searchDate}
        />
      ) : (
        <ScheduleTableView
          validGroupedRows={validGroupedRows}
          flatRows={flatRows}
          timePerPcs={props.timePerPcs}
          initialStock={props.initialStock}
          scheduleName={props.scheduleName}
        />
      )}
    </div>
  );
};

export default ScheduleProduction;
