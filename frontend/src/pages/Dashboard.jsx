import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { useNavigate } from 'react-router-dom';
import '../css/Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const chartMonthlyRef = useRef(null);
  const chartGroupRef = useRef(null);
  const chartMonthlyInstance = useRef(null);
  const chartGroupInstance = useRef(null);

  useEffect(() => {
    // Render Bar Chart (รายเดือน)
    if (chartMonthlyRef.current) {
      if (chartMonthlyInstance.current) chartMonthlyInstance.current.destroy();
      chartMonthlyInstance.current = new Chart(chartMonthlyRef.current, {
        type: 'bar',
        data: {
          labels: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'],
          datasets: [{
            label: 'PM ที่ทำแล้ว',
            data: [0, 14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            backgroundColor: '#2D8CF0',
            borderRadius: 4,
            barThickness: 18
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 5, font: { size: 10 } }, grid: { color: 'rgba(0,0,0,0.05)' } },
            x: { ticks: { font: { size: 10 } }, grid: { display: false } }
          }
        }
      });
    }

    // Render Doughnut Chart (สัดส่วน)
    if (chartGroupRef.current) {
      if (chartGroupInstance.current) chartGroupInstance.current.destroy();
      chartGroupInstance.current = new Chart(chartGroupRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Printer (21)', 'Computer (11)', 'Network (5)'],
          datasets: [{
            data: [21, 11, 5],
            backgroundColor: ['#2D8CF0', '#6B46C1', '#276749'],
            borderWidth: 0,
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '65%',
          plugins: { legend: { position: 'bottom', labels: { font: { size: 10 }, boxWidth: 10, padding: 8 } } }
        }
      });
    }

    return () => {
      if (chartMonthlyInstance.current) chartMonthlyInstance.current.destroy();
      if (chartGroupInstance.current) chartGroupInstance.current.destroy();
    };
  }, []);

  return (
    <div className="page active animate-in fade-in">
      <div className="alert-banner red">
        <svg fill="none" viewBox="0 0 18 18" stroke="#E53E3E" strokeWidth="1.5"><path d="M9 2L1.5 15.5h15L9 2z"/><path d="M9 8v4M9 14v.5" strokeLinecap="round"/></svg>
        <span className="msg"><strong>แจ้งเตือน:</strong> มี 3 รายการถึงรอบ PM แล้ว — PT.MTS004069, PT.BON004072, HBC_MTS_STORE</span>
        <button className="btn btn-sm" style={{ background: '#E53E3E', color: '#fff', padding: '3px 10px' }} onClick={() => navigate('/alert')}>ดูทั้งหมด</button>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon-wrap" style={{ background: '#EBF8FF' }}>
            <svg viewBox="0 0 22 22" fill="none" stroke="#2B6CB0" strokeWidth="1.5"><rect x="2" y="3" width="18" height="16" rx="2"/><path d="M7 7h8M7 11h8M7 15h5"/></svg>
          </div>
          <div><div className="stat-val">37</div><div className="stat-lbl">อุปกรณ์ทั้งหมด</div></div>
        </div>
        <div className="stat-card" style={{ borderColor: '#FEB2B2' }}>
          <div className="stat-icon-wrap" style={{ background: 'var(--red-light)' }}>
            <svg viewBox="0 0 22 22" fill="none" stroke="#E53E3E" strokeWidth="1.5"><path d="M11 2L2 19h18L11 2z"/><path d="M11 9v5M11 16v.5" strokeLinecap="round"/></svg>
          </div>
          <div><div className="stat-val" style={{ color: 'var(--red)' }}>3</div><div className="stat-lbl">เลยกำหนด PM</div></div>
        </div>
        <div className="stat-card" style={{ borderColor: '#FBD38D' }}>
          <div className="stat-icon-wrap" style={{ background: 'var(--orange-light)' }}>
            <svg viewBox="0 0 22 22" fill="none" stroke="#DD6B20" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="M11 7v4.5l3 2" strokeLinecap="round"/></svg>
          </div>
          <div><div className="stat-val" style={{ color: 'var(--orange)' }}>14</div><div className="stat-lbl">รอดำเนินการ</div></div>
        </div>
        <div className="stat-card" style={{ borderColor: '#9AE6B4' }}>
          <div className="stat-icon-wrap" style={{ background: 'var(--green-light)' }}>
            <svg viewBox="0 0 22 22" fill="none" stroke="#276749" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="M7 11l3 3 5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div><div className="stat-val" style={{ color: 'var(--green)' }}>14</div><div className="stat-lbl">ทำเสร็จแล้ว (ก.พ. 68)</div></div>
        </div>
      </div>

      <div className="row2">
        <div className="card">
          <div className="card-header">
            <span className="card-title">สรุป PM รายเดือน — ปี 2568</span>
          </div>
          <div style={{ position: 'relative', height: '190px' }}>
            <canvas ref={chartMonthlyRef}></canvas>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">สัดส่วนตามกลุ่ม</span></div>
          <div style={{ position: 'relative', height: '190px' }}>
            <canvas ref={chartGroupRef}></canvas>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">อุปกรณ์ที่ต้อง PM เร็วๆ นี้</span>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/plan')}>ดูแผน PM ทั้งหมด</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>ชื่ออุปกรณ์</th><th>กลุ่ม</th><th>ชนิด</th><th>Zone</th><th>PM ล่าสุด</th><th>กำหนด PM ถัดไป</th><th>สถานะ</th><th></th></tr>
            </thead>
            <tbody>
              <tr>
                <td className="mono">PT.MTS004069</td><td>PRINTER</td><td>LASER</td><td>B1</td><td>03/02/68</td><td>03/05/68</td>
                <td><span className="badge badge-red">เลยกำหนด</span></td>
                <td><button className="btn btn-primary btn-xs">บันทึก PM</button></td>
              </tr>
              <tr>
                <td className="mono">HBC_MTS_STORE</td><td>NETWORK</td><td>SWITCH</td><td>B1</td><td>26/02/68</td><td>26/05/68</td>
                <td><span className="badge badge-red">เลยกำหนด</span></td>
                <td><button className="btn btn-primary btn-xs">บันทึก PM</button></td>
              </tr>
              <tr>
                <td className="mono">PT.BON004076</td><td>PRINTER</td><td>LASER</td><td>B1</td><td>03/02/68</td><td>03/05/68</td>
                <td><span className="badge badge-orange">รอทำ</span></td>
                <td><button className="btn btn-outline btn-xs">บันทึก PM</button></td>
              </tr>
              <tr>
                <td className="mono">OKI 395_PE1</td><td>PRINTER</td><td>DOTMATRIX</td><td>B1</td><td>06/02/68</td><td>06/05/68</td>
                <td><span className="badge badge-orange">รอทำ</span></td>
                <td><button className="btn btn-outline btn-xs">บันทึก PM</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;