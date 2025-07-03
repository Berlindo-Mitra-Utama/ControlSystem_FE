import React, { useState, useEffect } from 'react';
import data from '../data.json';

interface DataItem {
  part: string;
  customer: string;
  timePerPcs: number;
  cycle1: number;
  cycle7: number;
  cycle35: number;
}

interface ScheduleItem {
  day: number;
  shift: string;
  type: string;
  pcs: number;
  time: string;
  processes: string;
}

function App() {
  const [form, setForm] = useState({
    machine: '',
    part: '',
    customer: '',
    timePerPcs: 257,
    cycle1: 14,
    cycle7: 98,
    cycle35: 49,
    processes: 'Welding,Assembly,Packing',
    stock: 332,
    delivery: 5100,
    planningHour: 274,
    overtimeHour: 119,
    planningPcs: 3838,
    overtimePcs: 1672
  });

  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);

  useEffect(() => {
    updateCalculatedFields();
  }, [form.timePerPcs, form.planningHour, form.overtimeHour]);

  const updateCalculatedFields = () => {
    const { timePerPcs, planningHour, overtimeHour } = form;

    if (timePerPcs > 0) {
      const cycle1 = timePerPcs;
      const cycle7 = timePerPcs * 7;
      const cycle35 = timePerPcs * 3.5;
      const planningPcs = Math.floor((planningHour * 3600) / timePerPcs);
      const overtimePcs = Math.floor((overtimeHour * 3600) / timePerPcs);

      setForm(prev => ({
        ...prev,
        cycle1,
        cycle7,
        cycle35,
        planningPcs,
        overtimePcs
      }));
    }
  };

  const handleSelectPart = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = (data as DataItem[]).find(item => item.part === e.target.value);
    if (selected) {
      setForm(prev => ({
        ...prev,
        part: selected.part,
        customer: selected.customer,
        timePerPcs: selected.timePerPcs,
        cycle1: selected.cycle1,
        cycle7: selected.cycle7,
        cycle35: selected.cycle35
      }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: ['machine', 'part', 'customer', 'processes'].includes(name)
        ? value
        : parseFloat(value)
    }));
  };

  const generateSchedule = () => {
    const {
      delivery,
      stock,
      timePerPcs,
      planningHour,
      overtimeHour,
      processes
    } = form;

    const totalNeed = delivery - stock;
    if (totalNeed <= 0) {
      alert("✅ Stock sudah cukup, tidak perlu produksi.");
      return;
    }

    const totalPlanningSeconds = planningHour * 3600;
    const totalOvertimeSeconds = overtimeHour * 3600;
    const totalAvailableSeconds = totalPlanningSeconds + totalOvertimeSeconds;
    const maxTotalPcs = Math.floor(totalAvailableSeconds / timePerPcs);

    if (maxTotalPcs < totalNeed) {
      alert(`⚠️ Waktu tersedia hanya cukup untuk ${maxTotalPcs} PCS, sedangkan kebutuhan produksi: ${totalNeed} PCS`);
    }

    const processList = processes.split(',').map(p => p.trim());
    const scheduleList: ScheduleItem[] = [];

    let remaining = totalNeed;
    let availableSeconds = totalAvailableSeconds;
    let currentDay = 1;

    while (remaining > 0 && availableSeconds > 0) {
      const shift1Seconds = Math.min(25200, availableSeconds);
      const shift1Pcs = Math.min(Math.floor(shift1Seconds / timePerPcs), remaining);
      const shift1Used = shift1Pcs * timePerPcs;

      if (shift1Pcs > 0) {
        scheduleList.push({
          day: currentDay,
          shift: '1',
          type: 'Normal',
          pcs: shift1Pcs,
          time: (shift1Used / 60).toFixed(2),
          processes: processList.join(', ')
        });
        remaining -= shift1Pcs;
        availableSeconds -= shift1Used;
      }

      const shift2Seconds = Math.min(37800, availableSeconds);
      const shift2Pcs = Math.min(Math.floor(shift2Seconds / timePerPcs), remaining);
      const shift2Used = shift2Pcs * timePerPcs;

      if (shift2Pcs > 0) {
        const isLembur = shift2Seconds > 25200;
        scheduleList.push({
          day: currentDay,
          shift: '2',
          type: isLembur ? 'Normal + Lembur' : 'Normal',
          pcs: shift2Pcs,
          time: (shift2Used / 60).toFixed(2),
          processes: processList.join(', ')
        });
        remaining -= shift2Pcs;
        availableSeconds -= shift2Used;
      }

      currentDay++;
    }

    if (remaining > 0) {
      alert(`⚠️ Sisa PCS yang belum terjadwal: ${remaining}`);
    }

    setSchedule(scheduleList);
  };

  return (
    <div className="p-8 font-sans">
      <h2 className="text-xl font-bold mb-4">🛠️ Input Parameter Produksi</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="font-semibold">Pilih Part</label>
          <select onChange={handleSelectPart} className="w-full p-2 border rounded mt-1">
            <option value="">-- Pilih Part --</option>
            {(data as DataItem[]).map((item, idx) => (
              <option key={idx} value={item.part}>{item.part}</option>
            ))}
          </select>
        </div>
        {[
          { label: 'Machine Name', name: 'machine' },
          { label: 'Part Name', name: 'part' },
          { label: 'Customer Name', name: 'customer' },
          { label: 'Time per Pieces (sec)', name: 'timePerPcs' },
          { label: 'Cycle Time 1 Jam (sec)', name: 'cycle1' },
          { label: 'Cycle Time 7 Jam (sec)', name: 'cycle7' },
          { label: 'Cycle Time 3.5 Jam (sec)', name: 'cycle35' },
          { label: 'Processes (comma separated)', name: 'processes' },
          { label: 'Stock (PCS)', name: 'stock' },
          { label: 'Delivery (PCS)', name: 'delivery' },
          { label: 'Planning Duration (Hours)', name: 'planningHour' },
          { label: 'Overtime Duration (Hours)', name: 'overtimeHour' },
          { label: 'Planning Target (PCS)', name: 'planningPcs' },
          { label: 'Overtime Target (PCS)', name: 'overtimePcs' }
        ].map(({ label, name }) => (
          <div key={name}>
            <label className="font-semibold">{label}</label>
            <input
              type="text"
              name={name}
              value={(form as any)[name]}
              onChange={handleChange}
              className="w-full p-2 border rounded mt-1"
            />
          </div>
        ))}
      </div>

      <button onClick={generateSchedule} className="mt-6 px-4 py-2 bg-blue-600 text-white rounded">
        Generate Schedule
      </button>

      {schedule.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-4">📅 Jadwal Produksi</h2>
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">No</th>
                <th className="border p-2">Tanggal</th>
                <th className="border p-2">Shift</th>
                <th className="border p-2">Tipe Shift</th>
                <th className="border p-2">Target Produksi (PCS)</th>
                <th className="border p-2">Waktu Produksi (Menit)</th>
                <th className="border p-2">Proses</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((row, idx) => (
                <tr key={idx}>
                  <td className="border p-2">{idx + 1}</td>
                  <td className="border p-2">{`${row.day} Juli`}</td>
                  <td className="border p-2">{row.shift}</td>
                  <td className="border p-2">{row.type}</td>
                  <td className="border p-2">{row.pcs}</td>
                  <td className="border p-2">{row.time}</td>
                  <td className="border p-2">{row.processes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
