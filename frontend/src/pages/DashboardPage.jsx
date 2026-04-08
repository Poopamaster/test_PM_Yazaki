import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { useNavigate } from 'react-router-dom';
import { pmService } from '../api/pmService'; // ปรับ Path ตามโปรเจกต์
import '../css/Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const chartMonthlyRef = useRef(null);
  const chartGroupRef = useRef(null);
  const chartMonthlyInstance = useRef(null);
  const chartGroupInstance = useRef(null);

  // States สำหรับเก็บข้อมูล Dashboard
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, overdue: 0, pending: 0, completedThisMonth: 0 });
  const [alertData, setAlertData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [monthlyData, setMonthlyData] = useState(new Array(12).fill(0));
  const [doughnutData, setDoughnutData] = useState({ labels: [], data: [], backgroundColor: [] });
  const [currentMonthStr, setCurrentMonthStr] = useState('');
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [eqRes, schRes, catRes] = await Promise.all([
        pmService.getAllEquipments(),
        pmService.getAllSchedules(),
        pmService.getAllCategories()
      ]);

      const rawEq = eqRes.data?.data || eqRes.data || [];
      const rawSch = schRes.data?.data || schRes.data || [];
      const rawCat = catRes.data?.data || catRes.data || [];

      // 1. กรองเอาเฉพาะอุปกรณ์ที่ Active
      const activeEq = rawEq.filter(eq => eq.status !== 'Inactive');
      const eqMap = {};
      activeEq.forEach(eq => { eqMap[eq.sn] = eq; });

      // 2. Map Category เพื่อดึงชื่อและสถานะ
      const catMap = {};
      rawCat.forEach(cat => { catMap[cat._id || cat.id] = cat; });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const curMonth = today.getMonth();
      
      const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      setCurrentMonthStr(`${monthNames[curMonth]} ${today.getFullYear() + 543 - 2500}`); // เช่น ก.พ. 68

      let overdueCount = 0;
      let pendingCount = 0;
      let completedThisMonthCount = 0;
      const mData = new Array(12).fill(0);
      const upcomingSchedules = [];

      // 3. คำนวณแผนงาน (Schedules)
      rawSch.forEach(sch => {
        const eq = eqMap[sch.equipmentSN];
        if (!eq) return; // ข้ามเครื่องที่ถูก Inactive ไปแล้ว

        const planDate = new Date(sch.planedDate);
        const actualDate = sch.actualDate ? new Date(sch.actualDate) : null;
        let status = sch.status || 'Pending';

        // Auto Overdue
        if (status === 'Pending' && planDate < today) {
          status = 'Overdue';
        }

        // นับสถิติ
        if (status === 'Overdue') overdueCount++;
        if (status === 'Pending') pendingCount++;
        if (status === 'Completed' && actualDate) {
          if (actualDate.getFullYear() === currentYear) {
            mData[actualDate.getMonth()]++; // เพิ่มข้อมูลกราฟรายเดือน
            if (actualDate.getMonth() === curMonth) {
              completedThisMonthCount++; // นับจำนวนที่ทำเสร็จในเดือนนี้
            }
          }
        }

        // เก็บข้อมูลสำหรับตารางและแจ้งเตือน (เอาเฉพาะที่ยังไม่เสร็จ)
        if (status === 'Pending' || status === 'Overdue') {
          const catId = typeof eq.category === 'object' ? eq.category._id : eq.category;
          
          // --- แก้ไขจุดที่ 1: ดึงชื่อหมวดหมู่และต่อท้ายด้วย (ปิดใช้งาน) ถ้า isActive เป็น false ---
          const catObj = catMap[catId] || (typeof eq.category === 'object' ? eq.category : {});
          const catName = catObj.name ? (catObj.isActive === false ? `${catObj.name} (ปิดใช้งาน)` : catObj.name) : 'N/A';

          upcomingSchedules.push({
            ...sch,
            status,
            equipmentName: eq.name,
            category: catName,
            type: eq.type,
            zone: eq.zone,
            planDateObj: planDate
          });
        }
      });

      // เรียงลำดับแผนงานจากเก่าไปใหม่ (Overdue จะขึ้นก่อนเสมอ)
      upcomingSchedules.sort((a, b) => a.planDateObj - b.planDateObj);

      // 4. คำนวณข้อมูลกราฟโดนัท (สัดส่วนกลุ่มอุปกรณ์)
      const catCounts = {};
      activeEq.forEach(eq => {
        const catId = typeof eq.category === 'object' ? eq.category._id : eq.category;
        
        // --- แก้ไขจุดที่ 2: ดึงชื่อหมวดหมู่สำหรับกราฟโดนัท ---
        const catObj = catMap[catId] || (typeof eq.category === 'object' ? eq.category : {});
        const catName = catObj.name ? (catObj.isActive === false ? `${catObj.name} (ปิดใช้งาน)` : catObj.name) : 'Other';
        
        catCounts[catName] = (catCounts[catName] || 0) + 1;
      });

      const dLabels = [];
      const dData = [];
      const colorsPalette = ['#2D8CF0', '#6B46C1', '#276749', '#D69E2E', '#E53E3E', '#319795'];
      Object.keys(catCounts).forEach((key) => {
        dLabels.push(`${key} (${catCounts[key]})`);
        dData.push(catCounts[key]);
      });

      // เซ็ต State ทั้งหมด
      setStats({
        total: activeEq.length,
        overdue: overdueCount,
        pending: pendingCount,
        completedThisMonth: completedThisMonthCount
      });
      setMonthlyData(mData);
      setDoughnutData({ labels: dLabels, data: dData, backgroundColor: colorsPalette.slice(0, dLabels.length) });
      setAlertData(upcomingSchedules.filter(s => s.status === 'Overdue').slice(0, 3)); // เอาเฉพาะ Overdue มาโชว์แถบแดง 3 อันดับแรก
      setTableData(upcomingSchedules.slice(0, 5)); // เอาเข้าตาราง 5 อันดับแรก

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Render Charts เมื่อข้อมูลโหลดเสร็จ
  useEffect(() => {
    if (loading) return;

    // Bar Chart
    if (chartMonthlyRef.current) {
      if (chartMonthlyInstance.current) chartMonthlyInstance.current.destroy();
      chartMonthlyInstance.current = new Chart(chartMonthlyRef.current, {
        type: 'bar',
        data: {
          labels: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'],
          datasets: [{
            label: 'PM ที่ทำเสร็จแล้ว (รายการ)',
            data: monthlyData,
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
            y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } }, grid: { color: 'rgba(0,0,0,0.05)' } },
            x: { ticks: { font: { size: 10 } }, grid: { display: false } }
          }
        }
      });
    }

    // Doughnut Chart
    if (chartGroupRef.current) {
      if (chartGroupInstance.current) chartGroupInstance.current.destroy();
      chartGroupInstance.current = new Chart(chartGroupRef.current, {
        type: 'doughnut',
        data: {
          labels: doughnutData.labels,
          datasets: [{
            data: doughnutData.data,
            backgroundColor: doughnutData.backgroundColor,
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
  }, [loading, monthlyData, doughnutData]);

  const handleNavigateToTask = (schedule) => {
    const action = schedule.status === 'Overdue' ? 'update' : 'edit';
    navigate(`/plan?id=${schedule._id}&sn=${schedule.equipmentSN}&action=${action}`);
  };

  if (loading) return <div className="p-4">กำลังโหลดข้อมูล Dashboard...</div>;

  return (
    <div className="page active animate-in fade-in">
      
      {/* Alert Banner (โชว์เมื่อมี Overdue) */}
      {alertData.length > 0 && (
        <div className="alert-banner red">
          <svg fill="none" viewBox="0 0 18 18" stroke="#E53E3E" strokeWidth="1.5"><path d="M9 2L1.5 15.5h15L9 2z"/><path d="M9 8v4M9 14v.5" strokeLinecap="round"/></svg>
          <span className="msg">
            <strong>แจ้งเตือน:</strong> มีอุปกรณ์เลยกำหนด PM — {alertData.map(a => a.equipmentName || a.equipmentSN).join(', ')}
          </span>
          <button className="btn btn-sm" style={{ background: '#E53E3E', color: '#fff', padding: '3px 10px', marginLeft: 'auto' }} onClick={() => navigate('/alert')}>
            ดูทั้งหมด
          </button>
        </div>
      )}

      {/* Stat Grid */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon-wrap" style={{ background: '#EBF8FF' }}>
            <svg viewBox="0 0 22 22" fill="none" stroke="#2B6CB0" strokeWidth="1.5"><rect x="2" y="3" width="18" height="16" rx="2"/><path d="M7 7h8M7 11h8M7 15h5"/></svg>
          </div>
          <div><div className="stat-val">{stats.total}</div><div className="stat-lbl">อุปกรณ์ทั้งหมด</div></div>
        </div>
        <div className="stat-card" style={{ borderColor: '#FEB2B2' }}>
          <div className="stat-icon-wrap" style={{ background: 'var(--red-light)' }}>
            <svg viewBox="0 0 22 22" fill="none" stroke="#E53E3E" strokeWidth="1.5"><path d="M11 2L2 19h18L11 2z"/><path d="M11 9v5M11 16v.5" strokeLinecap="round"/></svg>
          </div>
          <div><div className="stat-val" style={{ color: 'var(--red)' }}>{stats.overdue}</div><div className="stat-lbl">เลยกำหนด PM</div></div>
        </div>
        <div className="stat-card" style={{ borderColor: '#FBD38D' }}>
          <div className="stat-icon-wrap" style={{ background: 'var(--orange-light)' }}>
            <svg viewBox="0 0 22 22" fill="none" stroke="#DD6B20" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="M11 7v4.5l3 2" strokeLinecap="round"/></svg>
          </div>
          <div><div className="stat-val" style={{ color: 'var(--orange)' }}>{stats.pending}</div><div className="stat-lbl">รอดำเนินการ</div></div>
        </div>
        <div className="stat-card" style={{ borderColor: '#9AE6B4' }}>
          <div className="stat-icon-wrap" style={{ background: 'var(--green-light)' }}>
            <svg viewBox="0 0 22 22" fill="none" stroke="#276749" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="M7 11l3 3 5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div><div className="stat-val" style={{ color: 'var(--green)' }}>{stats.completedThisMonth}</div><div className="stat-lbl">ทำเสร็จแล้ว ({currentMonthStr})</div></div>
        </div>
      </div>

      {/* Charts */}
      <div className="row2">
        <div className="card">
          <div className="card-header">
            <span className="card-title">สรุป PM รายเดือน — ปี {currentYear + 543}</span>
          </div>
          <div style={{ position: 'relative', height: '190px' }}>
            <canvas ref={chartMonthlyRef}></canvas>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">สัดส่วนอุปกรณ์ตามกลุ่ม</span></div>
          <div style={{ position: 'relative', height: '190px' }}>
            <canvas ref={chartGroupRef}></canvas>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">อุปกรณ์ที่ต้อง PM เร็วๆ นี้ (5 อันดับแรก)</span>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/plan')}>ดูแผน PM ทั้งหมด</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>SN อุปกรณ์</th>
                <th>ชื่ออุปกรณ์</th>
                <th>กลุ่ม</th>
                <th>ชนิด</th>
                <th>Zone</th>
                <th>กำหนด PM ถัดไป</th>
                <th>สถานะ</th>
                <th style={{textAlign: 'center'}}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {tableData.length > 0 ? (
                tableData.map(item => (
                  <tr key={item._id}>
                    <td className="mono">{item.equipmentSN}</td>
                    <td style={{fontWeight: 500}}>{item.equipmentName}</td>
                    <td>{item.category}</td>
                    <td>{item.type || '-'}</td>
                    <td>{item.zone || '-'}</td>
                    <td>{new Date(item.planedDate).toLocaleDateString('th-TH')}</td>
                    <td>
                      <span className={`badge ${item.status === 'Overdue' ? 'badge-red' : 'badge-orange'}`}>
                        {item.status === 'Overdue' ? 'เลยกำหนด' : 'รอทำ'}
                      </span>
                    </td>
                    <td style={{textAlign: 'center'}}>
                      <button 
                        className={`btn btn-xs ${item.status === 'Overdue' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => handleNavigateToTask(item)}
                      >
                        บันทึก PM
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: 'var(--gray-500)' }}>
                    ไม่มีอุปกรณ์ที่รอการซ่อมบำรุงในขณะนี้
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;