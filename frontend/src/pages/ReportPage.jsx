// src/pages/Report.jsx
import React, { useState, useEffect } from 'react';
import { pmService } from '../api/pmService';
import * as XLSX from 'xlsx';
import ReportCostTab from '../components/ReportCostTab';
import ReportSummaryTab from '../components/ReportSummaryTab';
import '../css/Report.css';

// ฟังก์ชันช่วยแปลงวันที่ให้อยู่ในฟอร์แมต YYYY-MM-DD
const getLocalYYYYMMDD = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const Report = () => {
  const [activeTab, setActiveTab] = useState('cost');

  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState({ cats: [], eqs: [], scheds: [] });

  const [categoryStats, setCategoryStats] = useState([]);
  const [grandTotalYearlyEst, setGrandTotalYearlyEst] = useState(0);
  const [monthlyChartData, setMonthlyChartData] = useState(new Array(12).fill(0));
  const [summaryData, setSummaryData] = useState([]);

  const today = new Date();
  const firstDay = getLocalYYYYMMDD(new Date(today.getFullYear(), today.getMonth(), 1));
  const lastDay = getLocalYYYYMMDD(new Date(today.getFullYear(), today.getMonth() + 1, 0));

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);

  const [startInputType, setStartInputType] = useState('text');
  const [endInputType, setEndInputType] = useState('text');

  const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

  const formatInputDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        const [resCategories, resEquipments, resSchedules] = await Promise.all([
          pmService.getAllCategories(),
          pmService.getAllEquipments(),
          pmService.getAllSchedules()
        ]);

        setRawData({
          cats: resCategories.data?.data || resCategories.data || [],
          eqs: resEquipments.data?.data || resEquipments.data || [],
          scheds: resSchedules.data?.data || resSchedules.data || []
        });
      } catch (error) {
        console.error("Error fetching report data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, []);

  useEffect(() => {
    if (rawData.cats.length === 0) return;

    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T23:59:59.999`);

    const { cats, eqs, scheds } = rawData;
    const completedPMs = scheds.filter(s => s.status?.toLowerCase() === 'completed' && s.actualDate);

    let totalEst = 0;
    const stats = cats.map(cat => {
      const catId = cat._id || cat.id;
      const eqInCat = eqs.filter(eq => {
        const eqCatId = typeof eq.category === 'object' ? eq.category._id : eq.category;
        return eqCatId === catId;
      });
      const eqCount = eqInCat.length;

      const timesPerYear = 12 / (cat.interval_months || 12);
      const costPerTime = cat.default_price || 0;
      const estYearlyCost = eqCount * timesPerYear * costPerTime;
      totalEst += estYearlyCost;

      const eqSns = eqInCat.map(eq => eq.sn);

      const pmsInPeriod = completedPMs.filter(s => {
        const d = new Date(s.actualDate);
        return d >= start && d <= end && eqSns.includes(s.equipmentSN);
      });

      const pmDoneCount = pmsInPeriod.length;
      const costInPeriod = pmsInPeriod.reduce((sum, s) => sum + (Number(s.actualCost) || 0), 0);

      return {
        id: catId,
        name: cat.isActive === false ? `${cat.name} (ปิดใช้งาน)` : cat.name,
        eqCount,
        costPerTime,
        timesPerYear,
        estYearlyCost,
        interval_months: cat.interval_months || 12,
        estMonthlyCost: estYearlyCost / 12,
        pmDoneCount,
        costInPeriod
      };
    });

    setCategoryStats(stats);
    setGrandTotalYearlyEst(totalEst);
    setSummaryData(stats);

    const mData = new Array(12).fill(0);
    completedPMs.forEach(s => {
      const d = new Date(s.actualDate);
      if (d >= start && d <= end) {
        mData[d.getMonth()] += (Number(s.actualCost) || 0);
      }
    });
    setMonthlyChartData(mData);

  }, [rawData, startDate, endDate]);

  const handleExportExcel = () => {
    const wsData = [
      [`รายงานสรุปผล PM ตั้งแต่: ${startDate} ถึง ${endDate}`],
      [],
      ["กลุ่มอุปกรณ์", "จำนวนเครื่องทั้งหมด", "PM ที่ทำแล้ว (ตามช่วงเวลา)", "ค่าใช้จ่ายรวม (บาท)"]
    ];

    summaryData.forEach(item => {
      wsData.push([item.name, item.eqCount, item.pmDoneCount, item.costInPeriod]);
    });

    const totalEq = summaryData.reduce((sum, item) => sum + item.eqCount, 0);
    const totalDone = summaryData.reduce((sum, item) => sum + item.pmDoneCount, 0);
    const totalCost = summaryData.reduce((sum, item) => sum + item.costInPeriod, 0);
    wsData.push(["รวมทั้งหมด", totalEq, totalDone, totalCost]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PM Summary");
    XLSX.writeFile(wb, `PM_Summary_${startDate}_to_${endDate}.xlsx`);
  };

  if (loading) return <div className="p-4">กำลังโหลดข้อมูลรายงาน...</div>;

  const sumTotalEq = summaryData.reduce((sum, item) => sum + item.eqCount, 0);
  const sumTotalDone = summaryData.reduce((sum, item) => sum + item.pmDoneCount, 0);
  const sumTotalCost = summaryData.reduce((sum, item) => sum + item.costInPeriod, 0);
  const markerColors = ['#2D8CF0', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6'];

  return (
    <div className="page active animate-in fade-in">

      <div className="tabs">
        <div className={`tab ${activeTab === 'cost' ? 'active' : ''}`} onClick={() => setActiveTab('cost')}>ค่าใช้จ่าย</div>
        <div className={`tab ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>สรุปผล PM</div>
      </div>

      <div className="card" style={{ padding: '15px 20px', marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 'bold', color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          เลือกรอบบิล/ช่วงเวลา:
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type={startInputType}
            className="form-control"
            style={{ width: '150px' }}
            value={startInputType === 'date' ? startDate : formatInputDate(startDate)}
            onFocus={() => setStartInputType('date')}
            onBlur={() => setStartInputType('text')}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="DD/MM/YYYY"
          />
          <span className="text-sm text-gray">ถึง</span>
          <input
            type={endInputType}
            className="form-control"
            style={{ width: '150px' }}
            value={endInputType === 'date' ? endDate : formatInputDate(endDate)}
            onFocus={() => setEndInputType('date')}
            onBlur={() => setEndInputType('text')}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="DD/MM/YYYY"
          />
        </div>
      </div>

      {activeTab === 'cost' && (
        <ReportCostTab
          categoryStats={categoryStats}
          markerColors={markerColors}
          sumTotalCost={sumTotalCost}
          grandTotalYearlyEst={grandTotalYearlyEst}
          monthlyChartData={monthlyChartData}
          monthNames={monthNames}
        />
      )}

      {activeTab === 'summary' && (
        <ReportSummaryTab
          startDate={startDate}
          endDate={endDate}
          summaryData={summaryData}
          markerColors={markerColors}
          sumTotalEq={sumTotalEq}
          sumTotalDone={sumTotalDone}
          sumTotalCost={sumTotalCost}
          onExportExcel={handleExportExcel}
        />
      )}

    </div>
  );
};

export default Report;