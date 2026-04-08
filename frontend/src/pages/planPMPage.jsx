import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { pmService } from '../api/pmService';
import AddPlanModal from '../components/modals/AddPlanModal';
import UpdatePlanModal from '../components/modals/UpdatePlanModal';
import EditPlanModal from '../components/modals/EditPlanModal';
import PlanGanttTable from '../components/PlanGanttTable'; 
import PlanListTable from '../components/PlanListTable';   
import * as XLSX from 'xlsx';
import '../css/Plan.css';

const Plan = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('gantt');

  const [schedules, setSchedules] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterCategory, setFilterCategory] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterMonth, setFilterMonth] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

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
      const task = schedules.find(s => s._id === targetId);

      if (task) {
        if (action === 'update') {
          setUpdateFormData({
            id: task._id,
            equipmentSN: task.equipmentSN,
            planedDate: task.planedDate,
            actualDate: new Date().toISOString().split('T')[0],
            operator: '',
            actualCost: 0,
            require: task.require || ''
          });
          setShowUpdateModal(true);
        } else if (action === 'edit') {
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

      const activeEquipments = equipmentsData.filter(eq => eq.status !== 'Inactive');
      setEquipmentList(activeEquipments);

      const catMap = {};
      categoriesData.forEach(cat => { catMap[cat._id] = cat; });

      const eqMap = {};
      const zones = new Set();
      const categoryNames = new Set();

      activeEquipments.forEach(eq => {
        eqMap[eq.sn] = eq;
        if (eq.zone) zones.add(eq.zone);

        const catInfo = eq.category?.name ? eq.category : (catMap[eq.category] || {});
        if (catInfo.name) {
          const displayCatName = catInfo.isActive === false ? `${catInfo.name} (ปิดใช้งาน)` : catInfo.name;
          categoryNames.add(displayCatName);
        }
      });

      setUniqueZones([...zones]);
      setUniqueCategories([...categoryNames]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const mergedSchedules = schedulesData
        .filter(sch => eqMap[sch.equipmentSN])
        .map(sch => {
          const eqInfo = eqMap[sch.equipmentSN] || {};
          const catInfo = eqInfo.category?.name ? eqInfo.category : (catMap[eqInfo.category] || {});

          let currentStatus = sch.status || 'Pending';
          const planDate = new Date(sch.planedDate);
          if (currentStatus === 'Pending' && planDate < today) {
            currentStatus = 'Overdue';
          }

          const displayCatName = catInfo.name ? (catInfo.isActive === false ? `${catInfo.name} (ปิดใช้งาน)` : catInfo.name) : '-';

          return {
            ...sch,
            status: currentStatus,
            equipmentName: eqInfo.name || 'ไม่พบชื่ออุปกรณ์',
            zone: eqInfo.zone || '-',
            type: eqInfo.type || '-',
            categoryName: displayCatName,
            intervalMonths: catInfo.interval_months || 0,
            default_price: catInfo.default_price || 0
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

  const formatToDDMMYYYY = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear() + 543;
    return `${day}/${month}/${year}`;
  };

  const formatDate = (dateString) => {
    return formatToDDMMYYYY(dateString);
  };

  const handleExportExcel = () => {
    if (filteredSchedules.length === 0) return alert("ไม่มีข้อมูลสำหรับ Export");

    const wsData = [
      ["Equipment SN", "Category", "Type", "Zone", "Planed Date", "Operator", "Status"]
    ];

    filteredSchedules.forEach(sch => {
      const eq = equipmentList.find(e => e.sn === sch.equipmentSN) || {};
      const type = eq.type || sch.type || '-';
      const zone = eq.zone || sch.zone || '-';
      const categoryName = sch.categoryName || eq.category?.name || '-';
      const dateStr = formatToDDMMYYYY(sch.planedDate);

      wsData.push([
        sch.equipmentSN,
        categoryName,
        type,
        zone,
        dateStr,
        sch.operator || '-',
        sch.status || 'Pending'
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [
      { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 10 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PM Plan");
    XLSX.writeFile(wb, `PM_Plan_Export.xlsx`);
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

      await pmService.updateSchedule(updateFormData._id, payload);

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

        alert(`บันทึกผลสำเร็จ! และระบบได้สร้างแผนรอบถัดไปอัตโนมัติ (วันที่ ${formatToDDMMYYYY(nextPlanDate)})`);
      } else {
        alert("อัปเดตข้อมูล PM สำเร็จ!");
      }

      setShowUpdateModal(false);
      fetchData();
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการอัปเดต");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await pmService.updateSchedule(editFormData._id, {
        planedDate: editFormData.planedDate,
        require: editFormData.require
      });
      alert("เลื่อนแผน PM สำเร็จ!");
      setShowEditModal(false);
      fetchData();
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
        await pmService.deleteSchedule(id);
        alert("ลบข้อมูลสำเร็จ!");
        fetchData();
      } catch (error) {
        console.error(error);
        alert("เกิดข้อผิดพลาดในการลบข้อมูล");
      }
    }
  };

  const overdueCount = schedules.filter(s => s.status === 'Overdue').length;

  const handleAlertClick = () => {
    setActiveTab('list');
    setFilterStatus('Overdue');
  };

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

  const totalItems = sortedSchedules.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedSchedules.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

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

  // ✅ Helper Functions สำหรับจัดการ Modals
  const openUpdateModal = (sch) => {
    setUpdateFormData({
      ...sch,
      actualDate: sch.actualDate ? sch.actualDate.split('T')[0] : '',
      actualCost: sch.actualCost || sch.default_price || 0,
      isReadOnly: false
    });
    setShowUpdateModal(true);
  };

  const openDetailsModal = (sch) => {
    setUpdateFormData({
      ...sch,
      actualDate: sch.actualDate ? sch.actualDate.split('T')[0] : '',
      isReadOnly: true
    });
    setShowUpdateModal(true);
  };

  const openEditModal = (sch) => {
    setEditFormData({ ...sch, planedDate: sch.planedDate ? sch.planedDate.split('T')[0] : '' });
    setShowEditModal(true);
  };

  return (
    <div className="plan-page animate-in fade-in">
      {overdueCount > 0 && (
        <div className="alert-banner red" onClick={handleAlertClick} style={{ cursor: 'pointer', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '12px 16px', borderRadius: '8px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
          <span style={{ color: '#b91c1c', fontWeight: '500', fontSize: '14px' }}>แจ้งเตือน: มีอุปกรณ์ {overdueCount} รายการ ที่เลยกำหนดการ PM (คลิกเพื่อดูรายการ)</span>
        </div>
      )}

      <div className="page-header">
        <div className="tabs">
          <div className={`tab ${activeTab === 'gantt' ? 'active' : ''}`} onClick={() => { setActiveTab('gantt'); setFilterMonth(''); setFilterStatus(''); }}>ตารางรายปี</div>
          <div className={`tab ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>รายการแผน</div>
        </div>
        <div className="action-buttons">
          <button className="btn btn-success" onClick={handleExportExcel}>Export Excel</button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>+ เพิ่มแผน PM</button>
        </div>
      </div>

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

            <select className="form-control auto-width" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">ทุกสถานะ</option>
              <option value="Pending">รอทำ</option>
              <option value="Completed">เสร็จแล้ว</option>
              <option value="Overdue">เลยกำหนด</option>
            </select>
          </>
        )}
      </div>

      {/* ✅ เรียกใช้ Component ตารางแบบ Gantt */}
      {activeTab === 'gantt' && (
        <PlanGanttTable 
          loading={loading}
          ganttData={ganttData}
          filterYear={filterYear}
          onOpenUpdate={openUpdateModal}
        />
      )}

      {/* ✅ เรียกใช้ Component ตารางแบบ List */}
      {activeTab === 'list' && (
        <PlanListTable 
          loading={loading}
          currentItems={currentItems}
          indexOfFirstItem={indexOfFirstItem}
          formatDate={formatDate}
          onOpenDetails={openDetailsModal}
          onOpenUpdate={openUpdateModal}
          onOpenEdit={openEditModal}
          onCancelClick={handleCancelClick}
          onDeleteClick={handleDeleteClick}
          totalItems={totalItems}
          totalPages={totalPages}
          currentPage={currentPage}
          paginate={paginate}
          indexOfLastItem={indexOfLastItem}
        />
      )}

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

      <EditPlanModal isOpen={showEditModal} onClose={() => setShowEditModal(false)}
        onSave={handleEditSubmit}
        editFormData={editFormData}
        setEditFormData={setEditFormData}
        formatDate={formatDate} />
    </div>
  );
};

export default Plan;