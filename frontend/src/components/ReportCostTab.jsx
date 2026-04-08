import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const ReportCostTab = ({
  categoryStats,
  markerColors,
  sumTotalCost,
  grandTotalYearlyEst,
  monthlyChartData,
  monthNames
}) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // --- สร้างและอัปเดตกราฟ Chart.js ---
  useEffect(() => {
    if (chartRef.current) {
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
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } }
        }
      });
    }

    // Cleanup function: ลบกราฟเดิมทิ้งเมื่อ Component ถูกถอดออกป้องกัน Memory leak
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [monthlyChartData, monthNames]);

  return (
    <div id="report-cost">
      <div className="report-grid row3">
        {categoryStats.map((cat, idx) => (
          <div className="cost-card card" key={cat.id} style={{ borderLeft: `4px solid ${markerColors[idx % markerColors.length]}` }}>
            <div className="cost-amount">฿{cat.costPerTime.toLocaleString()}</div>
            <div className="cost-label">{cat.name} / เครื่อง / ครั้ง</div>
            <div className="cost-detail">
              <div className="cost-detail-info">จำนวน {cat.eqCount} เครื่อง (รอบ {cat.interval_months} เดือน)</div>
              <strong><span className="cost-monthly-amount">฿{Math.ceil(cat.estMonthlyCost).toLocaleString()}</span> / เดือน</strong>
              <span className="cost-yearly-amount">(รวม ฿{cat.estYearlyCost.toLocaleString()}/ปี)</span>
            </div>
          </div>
        ))}
      </div>

      <div className="card mb-14" style={{ display: 'flex', flexDirection: 'row', gap: '20px', padding: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, borderRight: '1px solid #eee', paddingRight: '20px', minWidth: '250px' }}>
          <div className="yearly-summary-title">ค่าใช้จ่าย PM จริง (รวมตามช่วงเวลาที่เลือก)</div>
          <div className="yearly-summary-amount" style={{ color: '#10B981' }}>฿{sumTotalCost.toLocaleString()}</div>
        </div>
        <div style={{ flex: 1, paddingLeft: '10px', minWidth: '250px' }}>
          <div className="yearly-summary-title">ค่าใช้จ่าย PM รวมทั้งปี (ประมาณการ)</div>
          <div className="yearly-summary-amount" style={{ color: '#6B7280', fontSize: '1.25rem' }}>฿{grandTotalYearlyEst.toLocaleString()}</div>
        </div>
      </div>

      <div className="card report-chart-card">
        <div className="card-header report-chart-header">
          <span className="card-title report-chart-title">สรุปค่าใช้จ่าย PM จริงรายเดือน (อิงตามช่วงเวลาที่เลือก)</span>
        </div>
        <div className="chart-container">
          <canvas ref={chartRef}></canvas>
        </div>
      </div>
    </div>
  );
};

export default ReportCostTab;