import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { pmService } from '../api/pmService'; 
import * as XLSX from 'xlsx'; 
import '../css/Report.css'; // นำเข้าไฟล์ CSS ที่แยกไว้

const Report = () => {
  const [activeTab, setActiveTab] = useState('cost');
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const [loading, setLoading] = useState(true);
  const [categoryStats, setCategoryStats] = useState([]);
  const [grandTotalYearlyEst, setGrandTotalYearlyEst] = useState(0);
  const [monthlyChartData, setMonthlyChartData] = useState(new Array(12).fill(0));
  const [summaryData, setSummaryData] = useState([]);

  const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const [resCategories, resEquipments, resSchedules] = await Promise.all([
        pmService.getAllCategories(),
        pmService.getAllEquipments(),
        pmService.getAllSchedules()
      ]);

      const rawCats = resCategories.data?.data || resCategories.data || [];
      const rawEqs = resEquipments.data?.data || resEquipments.data || [];
      const rawScheds = resSchedules.data?.data || resSchedules.data || [];

      const completedPMs = rawScheds.filter(s => s.status === 'Completed' && s.actualDate);

      let totalEst = 0;
      const stats = rawCats.map(cat => {
        const catId = cat._id || cat.id;

        const eqInCat = rawEqs.filter(eq => {
          const eqCatId = typeof eq.category === 'object' ? eq.category._id : eq.category;
          return eqCatId === catId;
        });
        const eqCount = eqInCat.length;

        const timesPerYear = 12 / (cat.interval_months || 12);
        const costPerTime = cat.default_price || 0;
        const estYearlyCost = eqCount * timesPerYear * costPerTime;
        totalEst += estYearlyCost;

        const eqSns = eqInCat.map(eq => eq.sn);
        const pmsThisMonth = completedPMs.filter(s => {
          const d = new Date(s.actualDate);
          return d.getFullYear() === currentYear && d.getMonth() === currentMonth && eqSns.includes(s.equipmentSN);
        });

        const pmDoneCount = pmsThisMonth.length;
        const costThisMonth = pmsThisMonth.reduce((sum, s) => sum + (Number(s.actualCost) || 0), 0);

        return {
          id: catId,
          name: cat.name,
          eqCount,
          costPerTime,
          timesPerYear,
          estYearlyCost,
          interval_months: cat.interval_months || 12,
          estMonthlyCost: estYearlyCost / 12,
          pmDoneCount,
          costThisMonth
        };
      });

      setCategoryStats(stats);
      setGrandTotalYearlyEst(totalEst);
      setSummaryData(stats);

      const mData = new Array(12).fill(0);
      completedPMs.forEach(s => {
        const d = new Date(s.actualDate);
        if (d.getFullYear() === currentYear) {
          mData[d.getMonth()] += (Number(s.actualCost) || 0);
        }
      });
      setMonthlyChartData(mData);

    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'cost' && chartRef.current && !loading) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      chartInstance.current = new Chart(chartRef.current, {
        type: 'bar',
        data: {
          labels: monthNames,
          datasets: [{
            label: 'ค่าใช้จ่าย PM จริง (บาท)',
            data: monthlyChartData,
            backgroundColor: '#38B2AC',
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
    }
  }, [activeTab, monthlyChartData, loading]);

  const handleExportExcel = () => {
    const wsData = [
      ["กลุ่มอุปกรณ์", "จำนวนเครื่องทั้งหมด", "PM ที่ทำแล้ว (เดือนนี้)", "ค่าใช้จ่ายรวม (บาท)"]
    ];

    summaryData.forEach(item => {
      wsData.push([item.name, item.eqCount, item.pmDoneCount, item.costThisMonth]);
    });

    const totalEq = summaryData.reduce((sum, item) => sum + item.eqCount, 0);
    const totalDone = summaryData.reduce((sum, item) => sum + item.pmDoneCount, 0);
    const totalCost = summaryData.reduce((sum, item) => sum + item.costThisMonth, 0);
    wsData.push(["รวมทั้งหมด", totalEq, totalDone, totalCost]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PM Summary");
    XLSX.writeFile(wb, `PM_Summary_${monthNames[currentMonth]}_${currentYear}.xlsx`);
  };

  if (loading) return <div className="p-4">กำลังประมวลผลรายงาน...</div>;

  const sumTotalEq = summaryData.reduce((sum, item) => sum + item.eqCount, 0);
  const sumTotalDone = summaryData.reduce((sum, item) => sum + item.pmDoneCount, 0);
  const sumTotalCost = summaryData.reduce((sum, item) => sum + item.costThisMonth, 0);

  const markerColors = ['#2D8CF0', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6'];

  return (
    <div className="page active animate-in fade-in">
      <div className="tabs">
        <div className={`tab ${activeTab === 'cost' ? 'active' : ''}`} onClick={() => setActiveTab('cost')}>ค่าใช้จ่าย</div>
        <div className={`tab ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>สรุปผล PM</div>
      </div>

      {activeTab === 'cost' && (
        <div id="report-cost">
          <div className="report-grid row3">
            {categoryStats.map((cat, idx) => (
              <div 
                className="cost-card card" 
                key={cat.id} 
                style={{ borderLeft: `4px solid ${markerColors[idx % markerColors.length]}` }}
              >
                <div className="cost-amount">฿{cat.costPerTime.toLocaleString()}</div>
                <div className="cost-label">{cat.name} / เครื่อง / ครั้ง</div>
                
                <div className="cost-detail">
                  <div className="cost-detail-info">
                    จำนวน {cat.eqCount} เครื่อง (รอบ {cat.interval_months} เดือน)
                  </div>
                  <strong>
                    <span className="cost-monthly-amount">฿{Math.ceil(cat.estMonthlyCost).toLocaleString()}</span> / เดือน
                  </strong>
                  <span className="cost-yearly-amount">
                    (รวม ฿{cat.estYearlyCost.toLocaleString()}/ปี)
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="card yearly-summary-card mb-14">
            <div className="yearly-summary-content flex items-center justify-between">
              <div>
                <div className="yearly-summary-title">ค่าใช้จ่าย PM รวมทั้งปี (ประมาณการตามฐานข้อมูลอุปกรณ์)</div>
                <div className="yearly-summary-amount">฿{grandTotalYearlyEst.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="card report-chart-card">
            <div className="card-header report-chart-header">
              <span className="card-title report-chart-title">สรุปค่าใช้จ่าย PM จริงรายเดือน (ปี {currentYear})</span>
            </div>
            <div className="chart-container">
              <canvas ref={chartRef}></canvas>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'summary' && (
        <div id="report-summary">
          <div className="summary-header flex justify-between items-center">
            <h3 className="summary-title">ผลการดำเนินงานประจำเดือน {monthNames[currentMonth]} {currentYear}</h3>
            <button className="btn btn-success btn-sm" onClick={handleExportExcel}>Export Excel</button>
          </div>
          
          <div className="card">
            <div className="table-wrap">
              <table className="report-table">
                <thead>
                  <tr>
                    <th className="text-left">กลุ่มอุปกรณ์</th>
                    <th className="text-center">จำนวนเครื่องทั้งหมด</th>
                    <th className="text-center">PM ที่ทำแล้ว (เดือนนี้)</th>
                    <th className="text-right">ค่าใช้จ่ายรวม</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryData.map((item, idx) => (
                    <tr key={item.id}>
                      <td>
                        <span 
                          className="marker-box" 
                          style={{ background: markerColors[idx % markerColors.length] }}
                        ></span>
                        {item.name}
                      </td>
                      <td className="text-center">{item.eqCount}</td>
                      <td className="text-center">{item.pmDoneCount}</td>
                      <td className="text-right cost-val">฿{item.costThisMonth.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="report-table-footer">
                    <td>รวมทั้งหมด</td>
                    <td className="text-center">{sumTotalEq}</td>
                    <td className="text-center">{sumTotalDone}</td>
                    <td className="text-right total-cost">฿{sumTotalCost.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Report;