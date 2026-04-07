// src/pages/Plan.jsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom'; // เพิ่ม import
import { pmService } from '../api/pmService';
import AddPlanModal from '../components/modals/AddPlanModal';
import UpdatePlanModal from '../components/modals/UpdatePlanModal';
import EditPlanModal from '../components/modals/EditPlanModal'; // นำเข้า Component ใหม่
import '../css/Plan.css';

const Plan = () => {
  const [activeTab, setActiveTab] = useState('gantt');

  const [schedules, setSchedules] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterCategory, setFilterCategory] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterMonth, setFilterMonth] = useState('');
  const [filterStatus, setFilterStatus] = useState(''); // เพิ่มตัวกรองสถานะ

  const [uniqueCategories, setUniqueCategories] = useState([]);
  const [uniqueZones, setUniqueZones] = useState([]);

  // Modals State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addFormData, setAddFormData] = useState({ equipmentSN: '', planedDate: '' });

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateFormData, setUpdateFormData] = useState(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterCategory, filterZone, filterYear, filterMonth, filterStatus]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const targetId = params.get('id');
    const action = params.get('action');

    if (targetId && schedules.length > 0) {
      // หาข้อมูลของ task นั้นจากลิสต์ที่มีอยู่
      const task = schedules.find(s => s._id === targetId);

      if (task) {
        if (action === 'update') {
          // เซ็ตข้อมูลและเปิด Modal บันทึกผล PM
          setUpdateFormData({
            id: task._id,
            equipmentSN: task.equipmentSN,
            planedDate: task.planedDate,
            actualDate: new Date().toISOString().split('T')[0], // วันที่ปัจจุบัน
            operator: '',
            actualCost: 0,
            require: task.require || ''
          });
          setShowUpdateModal(true);
        } else if (action === 'edit') {
          // เซ็ตข้อมูลและเปิด Modal แก้ไขแผน
          setEditFormData({
            id: task._id,
            equipmentSN: task.equipmentSN,
            planedDate: task.planedDate.split('T')[0]
          });
          setShowEditModal(true);
        }
      }
    }
  }, [location.search, schedules]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [scheduleRes, equipmentRes, categoryRes] = await Promise.all([
        pmService.getAllSchedules(),
        pmService.getAllEquipments(),
        pmService.getAllCategories()
      ]);

      const schedulesData = scheduleRes.data?.data || scheduleRes.data || [];
      const equipmentsData = equipmentRes.data?.data || equipmentRes.data || [];
      const categoriesData = categoryRes.data?.data || categoryRes.data || [];

      setEquipmentList(equipmentsData);

      const catMap = {};
      categoriesData.forEach(cat => { catMap[cat._id] = cat; });

      const eqMap = {};
      const zones = new Set();
      const categoryNames = new Set();

      equipmentsData.forEach(eq => {
        eqMap[eq.sn] = eq;
        if (eq.zone) zones.add(eq.zone);

        const catInfo = eq.category?.name ? eq.category : (catMap[eq.category] || {});
        if (catInfo.name) categoryNames.add(catInfo.name);
      });

      setUniqueZones([...zones]);
      setUniqueCategories([...categoryNames]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const mergedSchedules = schedulesData.map(sch => {
        const eqInfo = eqMap[sch.equipmentSN] || {};
        const catInfo = eqInfo.category?.name ? eqInfo.category : (catMap[eqInfo.category] || {});

        // AUTO-OVERDUE LOGIC
        let currentStatus = sch.status || 'Pending';
        const planDate = new Date(sch.planedDate);
        if (currentStatus === 'Pending' && planDate < today) {
          currentStatus = 'Overdue';
        }

        return {
          ...sch,
          status: currentStatus,
          equipmentName: eqInfo.name || 'ไม่พบชื่ออุปกรณ์',
          zone: eqInfo.zone || '-',
          type: eqInfo.type || '-',
          categoryName: catInfo.name || '-',
          intervalMonths: catInfo.interval_months || 0,
          default_price: catInfo.default_price || 0 // ดึงค่าใช้จ่ายขั้นต่ำมาจาก Category
        };
      });

      setSchedules(mergedSchedules);
    } catch (error) {
      console.error("Error fetching plan data:", error);
      alert("ไม่สามารถดึงข้อมูลแผน PM ได้");
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers ---
  const handleExportExcel = () => {
    if (filteredSchedules.length === 0) return alert("ไม่มีข้อมูลสำหรับ Export");
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "Equipment SN,Category,Type,Zone,Planed Date,Operator,Status\n";
    filteredSchedules.forEach(sch => {
      const dateStr = sch.planedDate ? new Date(sch.planedDate).toLocaleDateString('th-TH') : '';
      const row = `${sch.equipmentSN},${sch.categoryName},${sch.type},${sch.zone},${dateStr},${sch.operator || '-'},${sch.status || 'Pending'}`;
      csvContent += row + "\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `PM_Plan_${filterYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const duplicate = schedules.some(s => s.equipmentSN === addFormData.equipmentSN && (s.status !== 'Completed'));
      if (duplicate) {
        alert("อุปกรณ์นี้มีแผน PM อยู่แล้ว");
        return;
      } else {
        await pmService.createSchedule(addFormData);
        alert("เพิ่มแผน PM สำเร็จ!");
        setShowAddModal(false);
        setAddFormData({ equipmentSN: '', planedDate: '' });
        fetchData();
      }
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการเพิ่มแผน");
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        status: updateFormData.status,
        actualDate: updateFormData.actualDate,
        operator: updateFormData.operator,
        actualCost: updateFormData.actualCost,
        require: updateFormData.require
      };

      // 1. บันทึก/อัปเดตข้อมูลรายการนี้ให้เสร็จก่อน
      await pmService.updateSchedule(updateFormData._id, payload);

      // 🚨 2. ตรรกะป้องกันการสร้างแผนซ้ำซ้อน (สำคัญมาก) 🚨
      // เช็คว่าอุปกรณ์เครื่องนี้ (equipmentSN) มีแผนที่ "กำลังรอทำ" (Pending/Overdue) อยู่ในระบบแล้วหรือยัง?
      // (โดยไม่นับรายการที่เรากำลังอัปเดตอยู่ ณ ตอนนี้)
      const hasExistingPendingPlan = schedules.some(s =>
        s.equipmentSN === updateFormData.equipmentSN &&
        (s.status === 'Pending' || s.status === 'Overdue' || !s.status) &&
        s._id !== updateFormData._id
      );

      if (updateFormData.status === 'Completed' && updateFormData.intervalMonths > 0 && !hasExistingPendingPlan) {

        const nextPlanDate = new Date(updateFormData.actualDate || new Date());
        nextPlanDate.setMonth(nextPlanDate.getMonth() + updateFormData.intervalMonths);

        await pmService.createSchedule({
          equipmentSN: updateFormData.equipmentSN,
          planedDate: nextPlanDate.toISOString()
        });

        alert(`บันทึกผลสำเร็จ! และระบบได้สร้างแผนรอบถัดไปอัตโนมัติ (วันที่ ${nextPlanDate.toLocaleDateString('th-TH')})`);
      } else {
        alert("อัปเดตข้อมูล PM สำเร็จ!"); // ถ้ามีแผนถัดไปรออยู่แล้ว ก็แค่อัปเดตรายการนี้เฉยๆ
      }

      setShowUpdateModal(false);
      fetchData(); // โหลดข้อมูลตารางใหม่
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการอัปเดต");
    }
  };

  // บันทึกการแก้ไขแผน (วันที่/หมายเหตุ)
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      // ส่งข้อมูลไปอัปเดตเฉพาะ planedDate และ require
      await pmService.updateSchedule(editFormData._id, {
        planedDate: editFormData.planedDate,
        require: editFormData.require
      });
      alert("เลื่อนแผน PM สำเร็จ!");
      setShowEditModal(false);
      fetchData(); // โหลดข้อมูลใหม่
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการเลื่อนแผน");
    }
  };

  const handleCancelClick = async (id) => {
    if (window.confirm("ต้องการ 'ยกเลิก' แผน PM นี้ใช่หรือไม่? (สถานะจะเปลี่ยนเป็น Cancelled)")) {
      try {
        await pmService.updateSchedule(id, { status: 'Cancelled' });
        alert("ยกเลิกแผนสำเร็จ!");
        fetchData();
      } catch (error) {
        console.error(error);
        alert("เกิดข้อผิดพลาดในการยกเลิกแผน");
      }
    }
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการ 'ลบ' รายการนี้? ข้อมูลจะหายไปถาวร!")) {
      try {
        // ต้องแน่ใจว่าใน pmService.js มีฟังก์ชัน deleteSchedule แล้ว
        await pmService.deleteSchedule(id);
        alert("ลบข้อมูลสำเร็จ!");
        fetchData();
      } catch (error) {
        console.error(error);
        alert("เกิดข้อผิดพลาดในการลบข้อมูล");
      }
    }
  };

  // จำนวนอุปกรณ์ที่ Overdue (เพื่อนำไปโชว์ที่แจ้งเตือน)
  const overdueCount = schedules.filter(s => s.status === 'Overdue').length;

  const handleAlertClick = () => {
    setActiveTab('list');
    setFilterStatus('Overdue'); // กรองให้แสดงเฉพาะงานที่เลยกำหนดทันที
  };

  // --- Filter Logic ---
  const filteredSchedules = schedules.filter(sch => {
    if (!sch.planedDate) return false;
    const planDateObj = new Date(sch.planedDate);

    const matchYear = filterYear ? planDateObj.getFullYear().toString() === filterYear : true;
    const matchMonth = filterMonth ? (planDateObj.getMonth() + 1).toString() === filterMonth : true;
    const matchZone = filterZone ? sch.zone === filterZone : true;
    const matchCategory = filterCategory ? sch.categoryName === filterCategory : true;
    const matchStatus = filterStatus ? sch.status === filterStatus : true;

    return matchYear && matchMonth && matchZone && matchCategory && matchStatus;
  });

  // --- Sorting Logic ---
  const sortedSchedules = [...filteredSchedules].sort((a, b) => {
    const isACompleted = a.status === 'Completed';
    const isBCompleted = b.status === 'Completed';

    if (isACompleted && !isBCompleted) return 1;
    if (!isACompleted && isBCompleted) return -1;

    if (!isACompleted && !isBCompleted) {
      return new Date(a.planedDate) - new Date(b.planedDate);
    }

    return new Date(b.actualDate || b.planedDate) - new Date(a.actualDate || a.planedDate);
  });

  // --- Pagination Logic ---
  const totalItems = sortedSchedules.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedSchedules.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // --- Gantt Chart Logic ---
  const getGanttData = () => {
    const grouped = {};
    schedules.filter(sch => {
      if (!sch.planedDate) return false;
      const planDateObj = new Date(sch.planedDate);
      return (filterYear ? planDateObj.getFullYear().toString() === filterYear : true) &&
        (filterZone ? sch.zone === filterZone : true) &&
        (filterCategory ? sch.categoryName === filterCategory : true);
    }).forEach(sch => {
      if (!grouped[sch.equipmentSN]) {
        grouped[sch.equipmentSN] = {
          sn: sch.equipmentSN,
          zone: sch.zone,
          months: Array(12).fill(null)
        };
      }
      const monthIndex = new Date(sch.planedDate).getMonth();
      grouped[sch.equipmentSN].months[monthIndex] = sch;
    });
    return Object.values(grouped);
  };

  const ganttData = getGanttData();

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    return d.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  return (
    <div className="plan-page animate-in fade-in">

      {/* 🚨 แจ้งเตือน Alert Banner 🚨 */}
      {overdueCount > 0 && (
        <div className="alert-banner red" onClick={handleAlertClick} style={{ cursor: 'pointer', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '12px 16px', borderRadius: '8px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
          <span style={{ color: '#b91c1c', fontWeight: '500', fontSize: '14px' }}>แจ้งเตือน: มีอุปกรณ์ {overdueCount} รายการ ที่เลยกำหนดการ PM (คลิกเพื่อดูรายการ)</span>
        </div>
      )}

      <div className="page-header">
        <div className="tabs">
          <div className={`tab ${activeTab === 'gantt' ? 'active' : ''}`} onClick={() => { setActiveTab('gantt'); setFilterMonth(''); setFilterStatus(''); }}>ตารางรายปี (Gantt)</div>
          <div className={`tab ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>รายการแผน</div>
        </div>
        <div className="action-buttons">
          <button className="btn btn-success" onClick={handleExportExcel}>Export Excel</button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>+ เพิ่มแผน PM</button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar card" style={{ marginBottom: '16px', flexWrap: 'wrap' }}>
        <select className="form-control auto-width" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">ทุกกลุ่ม</option>
          {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <select className="form-control auto-width" value={filterZone} onChange={(e) => setFilterZone(e.target.value)}>
          <option value="">ทุก Zone</option>
          {uniqueZones.map(z => <option key={z} value={z}>{z}</option>)}
        </select>
        <select className="form-control auto-width" value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
          <option value="2024">2024</option>
          <option value="2025">2025</option>
          <option value="2026">2026</option>
          <option value="2027">2027</option>
        </select>

        {activeTab === 'list' && (
          <>
            <select className="form-control auto-width" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
              <option value="">ทุกเดือน</option>
              {['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'].map((m, i) => (
                <option key={i} value={(i + 1).toString()}>{m}</option>
              ))}
            </select>

            {/* ตัวกรองสถานะ */}
            <select className="form-control auto-width" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">ทุกสถานะ</option>
              <option value="Pending">รอทำ</option>
              <option value="Completed">เสร็จแล้ว</option>
              <option value="Overdue">เลยกำหนด</option>
            </select>
          </>
        )}
      </div>

      {/* GANTT TAB */}
      {activeTab === 'gantt' && (
        <div className="tab-content">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">แผน PM รายปี {filterYear}</h3>
              <div className="legend">
                <span className="legend-item"><span className="dot dot-done"></span>เสร็จแล้ว</span>
                <span className="legend-item"><span className="dot dot-pending"></span>รอทำ</span>
                <span className="legend-item"><span className="dot dot-overdue"></span>เลยกำหนด</span>
              </div>
            </div>
            <div className="table-responsive">
              <table className="data-table gantt-table">
                <thead>
                  <tr>
                    <th>อุปกรณ์ (SN)</th><th>Zone</th>
                    {['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'].map(m => <th key={m} className="text-center">{m}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="14" className="text-center p-4">กำลังโหลดข้อมูล...</td></tr>
                  ) : ganttData.length === 0 ? (
                    <tr><td colSpan="14" className="text-center p-4 text-gray">ไม่มีข้อมูลแผน PM ในเงื่อนไขที่เลือก</td></tr>
                  ) : (
                    ganttData.map((row) => (
                      <tr key={row.sn}>
                        <td className="font-mono font-medium">{row.sn}</td>
                        <td className="text-gray text-sm">{row.zone}</td>
                        {row.months.map((sch, index) => {
                          if (!sch) return <td key={index}></td>;
                          return (
                            <td key={index} className="text-center" onClick={() => {
                              // เปิด Update Modal ดึง Cost พื้นฐานมาให้
                              setUpdateFormData({
                                ...sch,
                                actualDate: sch.actualDate ? sch.actualDate.split('T')[0] : '',
                                actualCost: sch.actualCost || sch.default_price || 0
                              });
                              setShowUpdateModal(true);
                            }} style={{ cursor: 'pointer' }}>
                              {sch.status === 'Completed' && <span className="g-cell g-done">✓</span>}
                              {sch.status === 'Overdue' && <span className="g-cell g-overdue">!</span>}
                              {(sch.status === 'Pending' || !sch.status) && <span className="g-cell g-pending"></span>}
                            </td>
                          )
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* LIST TAB */}
      {activeTab === 'list' && (
        <div className="tab-content">
          <div className="card">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>อุปกรณ์ (SN)</th>
                    <th>กลุ่ม</th>
                    <th>Zone</th>
                    <th>วันที่นัดหมาย</th>
                    <th>วันที่ทำจริง</th>
                    <th>ผู้ดำเนินการ</th>
                    <th>สถานะ</th>
                    <th>หมายเหตุ</th>
                    <th>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="8" className="text-center p-4">กำลังโหลดข้อมูล...</td></tr>
                  ) : currentItems.length === 0 ? (
                    <tr><td colSpan="8" className="text-center p-4 text-gray">ไม่มีข้อมูลแผน PM</td></tr>
                  ) : (
                    currentItems.map((sch, index) => (
                      <tr key={sch._id}>
                        <td>{indexOfFirstItem + index + 1}</td>
                        <td className="font-mono">{sch.equipmentSN}</td>
                        <td>{sch.categoryName}</td>
                        <td>{sch.zone}</td>
                        <td>{formatDate(sch.planedDate)}</td>
                        <td>{sch.actualDate ? formatDate(sch.actualDate) : '-'}</td>
                        <td>{sch.operator || '-'}</td>

                        {/* 1. เพิ่ม Badge สถานะ ยกเลิก (Cancelled) */}
                        <td>
                          {sch.status === 'Completed' && <span className="badge badge-green">เสร็จแล้ว</span>}
                          {sch.status === 'Overdue' && <span className="badge badge-red">เลยกำหนด</span>}
                          {(sch.status === 'Pending' || !sch.status) && <span className="badge badge-orange">รอทำ</span>}
                          {sch.status === 'Cancelled' && <span className="badge" style={{ backgroundColor: '#9ca3af', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>ยกเลิก</span>}
                        </td>
                        <td>{sch.require || '-'}</td>

                        {/* 2. ปรับปรุงกลุ่มปุ่มจัดการทั้งหมด */}
                        <td>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>

                            {/* ถ้าสถานะเป็น Completed หรือ Cancelled ให้แสดงแค่ปุ่มรายละเอียด */}
                            {sch.status === 'Completed' || sch.status === 'Cancelled' ? (
                              <button
                                className="btn btn-sm btn-outline"
                                onClick={() => {
                                  setUpdateFormData({
                                    ...sch,
                                    actualDate: sch.actualDate ? sch.actualDate.split('T')[0] : '',
                                    isReadOnly: true // ✅ บังคับให้เป็นโหมดดูรายละเอียดเท่านั้น
                                  });
                                  setShowUpdateModal(true);
                                }}
                              >
                                รายละเอียด
                              </button>
                            ) : (
                              /* ถ้ายังไม่เสร็จ (Pending/Overdue) ให้แสดงปุ่ม บันทึก, เลื่อน, ยกเลิก */
                              <>
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() => {
                                    setUpdateFormData({
                                      ...sch,
                                      actualDate: sch.actualDate ? sch.actualDate.split('T')[0] : '',
                                      actualCost: sch.actualCost || sch.default_price || 0,
                                      isReadOnly: false // ✅ ให้พิมพ์ฟอร์มได้
                                    });
                                    setShowUpdateModal(true);
                                  }}
                                >
                                  บันทึก PM
                                </button>

                                <button
                                  className="btn btn-sm"
                                  style={{ backgroundColor: '#f59e0b', color: '#fff', border: 'none' }}
                                  onClick={() => {
                                    setEditFormData({ ...sch, planedDate: sch.planedDate ? sch.planedDate.split('T')[0] : '' });
                                    setShowEditModal(true);
                                  }}
                                >
                                  เลื่อนแผน
                                </button>

                                <button
                                  className="btn btn-sm"
                                  style={{ backgroundColor: '#6b7280', color: '#fff', border: 'none' }}
                                  onClick={() => handleCancelClick(sch._id)}
                                >
                                  ยกเลิก
                                </button>
                              </>
                            )}

                            {/* ปุ่มลบ แสดงเสมอในทุกสถานะ */}
                            <button
                              className="btn btn-sm"
                              style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none' }}
                              onClick={() => handleDeleteClick(sch._id)}
                            >
                              ลบ
                            </button>

                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 0 && (
              <div className="pagination-container p-4 flex justify-between items-center border-t" style={{ borderTop: '1px solid #e2e8f0' }}>
                <span className="text-sm text-gray">แสดง {indexOfFirstItem + 1} ถึง {Math.min(indexOfLastItem, totalItems)} จากทั้งหมด {totalItems} รายการ</span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button className="btn btn-outline btn-sm" onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>ก่อนหน้า</button>
                  <span style={{ fontSize: '14px', padding: '0 8px' }}>หน้า {currentPage} / {totalPages}</span>
                  <button className="btn btn-outline btn-sm" onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}>ถัดไป</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <AddPlanModal isOpen={showAddModal} onClose={() => setShowAddModal(false)}
        onSave={handleAddSubmit}
        addFormData={addFormData}
        setAddFormData={setAddFormData}
        equipmentList={equipmentList}
        formatDate={formatDate} />

      <UpdatePlanModal isOpen={showUpdateModal} onClose={() => setShowUpdateModal(false)}
        onSave={handleUpdateSubmit}
        updateFormData={updateFormData}
        setUpdateFormData={setUpdateFormData}
        formatDate={formatDate} />

      {/* Modal ใหม่สำหรับแก้ไขแผน */}
      <EditPlanModal isOpen={showEditModal} onClose={() => setShowEditModal(false)}
        onSave={handleEditSubmit}
        editFormData={editFormData}
        setEditFormData={setEditFormData}
        formatDate={formatDate} />

    </div>
  );
};

export default Plan;