import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pmService } from '../api/pmService';
import '../css/Alert.css';

const AlertPage = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resSchedules, resEquipments] = await Promise.all([
        pmService.getAllSchedules(),
        pmService.getAllEquipments()
      ]);

      const rawSchedules = resSchedules.data?.data || resSchedules.data || [];
      const rawEquipments = resEquipments.data?.data || resEquipments.data || [];

      const combinedData = rawSchedules.map(schedule => {
        // เชื่อมด้วย equipmentSN (จากตารางแผน) ให้ตรงกับ sn (จากตารางอุปกรณ์)
        const masterInfo = rawEquipments.find(eq => eq.sn === schedule.equipmentSN);

        return {
            ...schedule,
            // ดึงชื่อจาก Database (อ้างอิงตาม EquipmentModel.js)
            category: masterInfo?.category?.name || masterInfo?.category || "Device",
            model: masterInfo?.model || "-",
            zone: masterInfo?.zone || "N/A",
            equipmentName: masterInfo?.name || "",
            equipmentStatus: masterInfo?.status || "Active", // เพิ่มการเก็บค่า status
            sn: schedule.equipmentSN
          };
        })
        // 🛑 เพิ่ม .filter() ตรงนี้ เพื่อเอาเฉพาะอุปกรณ์ที่ status ไม่ใช่ Inactive
        .filter(item => item.equipmentStatus !== "Inactive");

      setSchedules(combinedData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToTask = (alert) => {
    const action = alert.type === 'overdue' ? 'update' : 'edit';
    navigate(`/plan?id=${alert.id}&sn=${alert.sn}&action=${action}`);
  };

  const getDaysDiff = (targetDate) => {
    if (!targetDate) return 999;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    if (isNaN(target.getTime())) return 999;
    const diffTime = target - today;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const processedAlerts = (Array.isArray(schedules) ? schedules : []).map(item => {
    const daysDiff = getDaysDiff(item.planedDate);
    let type = 'normal';

    if (daysDiff < 0) {
      type = 'overdue';
    } else if (daysDiff <= 500) {
      type = 'soon';
    }

    return {
      ...item,
      id: item._id,
      sn: item.equipmentSN,
      type,
      daysDiff: Math.abs(daysDiff),
      planned_date: item.planedDate
    };
  })
    .filter(item => item.type !== 'normal')
    .sort((a, b) => {
      // 1. เรียงตามประเภท: ให้ 'overdue' ขึ้นก่อน 'soon'
      if (a.type === 'overdue' && b.type !== 'overdue') return -1;
      if (a.type !== 'overdue' && b.type === 'overdue') return 1;

      // 2. ถ้าประเภทเดียวกัน ให้เรียงตามวันที่ (เก่าที่สุดขึ้นก่อน)
      return new Date(a.planedDate) - new Date(b.planedDate);
    });

  const filteredAlerts = processedAlerts.filter(item => {
    if (activeTab === 'all') return true;
    return item.type === activeTab;
  });

  if (loading) return <div className="p-4">กำลังโหลดข้อมูลการแจ้งเตือน...</div>;

  return (
    <div className="page active animate-in fade-in">
      <div className="alert-header">
        <div>
          <h2>การแจ้งเตือน (Alert) <span className="sub-title">— ระบบบำรุงรักษาเชิงป้องกัน</span></h2>
        </div>
      </div>

      {/* แก้ไขส่วน Tabs ให้ใช้คลาสจาก CSS ใหม่ */}
      <div className="tabs-container">
        <div className={`tab-item ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
          ทั้งหมด ({processedAlerts.length})
        </div>
        <div className={`tab-item ${activeTab === 'overdue' ? 'active' : ''}`} onClick={() => setActiveTab('overdue')}>
          เลยกำหนด ({processedAlerts.filter(a => a.type === 'overdue').length})
        </div>
        <div className={`tab-item ${activeTab === 'soon' ? 'active' : ''}`} onClick={() => setActiveTab('soon')}>
          ครบกำหนดใน 30 วัน ({processedAlerts.filter(a => a.type === 'soon').length})
        </div>
      </div>

      <div id="alert-list">
        {filteredAlerts.map((alert) => (
          <div key={alert.id} className={`alert-card-new ${alert.type}`}>
            <div className="alert-side-border"></div>

            <div className="alert-content">
              <div className="alert-title-row">
                {/* แสดงชื่ออุปกรณ์คู่กับ SN เพื่อความชัดเจน */}
                <span className="alert-sn">{alert.equipmentName || alert.sn}</span>
                <span className="alert-sep">—</span>
                <span className="alert-status-text">
                  {alert.type === 'overdue' ? `เลยกำหนด PM ${alert.daysDiff} วัน` : `ครบกำหนดใน ${alert.daysDiff} วัน`}
                </span>
              </div>
              <div className="alert-sub-detail">
                {alert.category} | {alert.model} | Zone {alert.zone}
                <span className="dot">•</span> กำหนด: {new Date(alert.planedDate).toLocaleDateString('th-TH')}
              </div>
            </div>

            <div className="alert-actions-new">
              <span className={`status-badge-outline ${alert.type}`}>
                {alert.type === 'overdue' ? `เลยกำหนด ${alert.daysDiff} วัน` : `รอทำ ${alert.daysDiff} วัน`}
              </span>

              {/* 4. ใส่ onClick ให้กับปุ่ม */}
              <button
                className={`btn-sm ${alert.type === 'overdue' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => handleNavigateToTask(alert)}
              >
                {alert.type === 'overdue' ? 'บันทึก PM ทันที' : 'วางแผน PM'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlertPage;