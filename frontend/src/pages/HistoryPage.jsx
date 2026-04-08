import React, { useState, useEffect, useRef } from 'react';
import { pmService } from '../api/pmService';
import * as XLSX from 'xlsx';

const History = () => {
  const [historyData, setHistoryData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Filter States ---
  const [filterCategory, setFilterCategory] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEquipmentSn, setSelectedEquipmentSn] = useState('');

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);

  // ✅ เพิ่ม State ควบคุมชนิดของ Input เพื่อทำเทคนิคโชว์ DD/MM/YYYY
  const [startInputType, setStartInputType] = useState('text');
  const [endInputType, setEndInputType] = useState('text');

  const [categories, setCategories] = useState([]);
  const [zones, setZones] = useState([]);
  const [uniqueEquipments, setUniqueEquipments] = useState([]);

  // --- Column Visibility State ---
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const columnMenuRef = useRef(null);

  const [visibleCols, setVisibleCols] = useState({
    no: true,
    planDate: true,
    actualDate: true,
    category: true,
    type: true,
    sn: true,
    brand: true,
    model: true,
    equipmentName: true,
    zone: true,
    operator: true,
    cost: true,
    require: true
  });

  // ปิดเมนู Column ถ้าคลิกที่อื่น
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(event.target)) {
        setShowColumnMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [historyData, filterCategory, filterZone, startDate, endDate, searchTerm, selectedEquipmentSn]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [resSchedules, resEquipments, resCategories] = await Promise.all([
        pmService.getAllSchedules(),
        pmService.getAllEquipments(), // ต้องส่ง Inactive/Cancelled มาด้วย
        pmService.getAllCategories()
      ]);

      const rawSchedules = resSchedules.data?.data || resSchedules.data || [];
      const rawEquipments = resEquipments.data?.data || resEquipments.data || [];
      const rawCategories = resCategories.data?.data || resCategories.data || [];

      const completedPMs = rawSchedules.filter(s => s.status === 'Completed');

      const combinedData = completedPMs.map(schedule => {
        const eq = rawEquipments.find(e => e.sn === schedule.equipmentSN) || {};

        let categoryName = 'N/A';
        if (eq.category) {
          const catStatus = eq.category.isActive;
          if (eq.category.name) {
            categoryName = catStatus === false ? `${eq.category.name} (ปิดใช้งาน)` : eq.category.name;
          } else {
            const foundCat = rawCategories.find(c => c._id === eq.category || c.id === eq.category);
            if (foundCat) {
              categoryName = foundCat.isActive === false ? `${foundCat.name} (ปิดใช้งาน)` : foundCat.name;
            }
          }
        }

        return {
          id: schedule._id || Math.random().toString(),
          planedDate: schedule.planedDate,
          actualDate: schedule.actualDate || schedule.planedDate,
          category: categoryName,
          type: eq.type || 'N/A',
          brand: eq.brand || 'N/A',
          model: eq.model || 'N/A',
          sn: schedule.equipmentSN,
          equipmentName: eq.name || schedule.equipmentSN,
          zone: eq.zone || 'N/A',
          operator: schedule.operator || '-',
          actualCost: schedule.actualCost || 0,
          require: schedule.require || '-'
        };
      });

      const uniqueCats = [...new Set(combinedData.map(item => item.category))].filter(c => c !== 'N/A');
      const uniqueZones = [...new Set(combinedData.map(item => item.zone))].filter(z => z !== 'N/A');
      const eqs = [...new Map(combinedData.map(item => [item.sn, item])).values()];

      setCategories(uniqueCats);
      setZones(uniqueZones);
      setUniqueEquipments(eqs);
      setHistoryData(combinedData);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = historyData;

    if (filterCategory) result = result.filter(item => item.category === filterCategory);
    if (filterZone) result = result.filter(item => item.zone === filterZone);
    if (selectedEquipmentSn) result = result.filter(item => item.sn === selectedEquipmentSn);
    if (searchTerm) {
      result = result.filter(item =>
        item.equipmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sn.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (startDate) result = result.filter(item => new Date(item.actualDate) >= new Date(startDate));
    if (endDate) {
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);
      result = result.filter(item => new Date(item.actualDate) < end);
    }

    // เรียงจาก อดีต -> อนาคต
    result.sort((a, b) => new Date(a.actualDate) - new Date(b.actualDate));
    
    setFilteredData(result);
  };

  const toggleColumn = (col) => {
    setVisibleCols(prev => ({ ...prev, [col]: !prev[col] }));
  };

  const formatToDDMMYYYY = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear(); // หากต้องการ พ.ศ. ให้เปลี่ยนเป็น d.getFullYear() + 543
    return `${day}/${month}/${year}`;
  };

  const formatInputDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const handleExportExcel = () => {
    if (filteredData.length === 0) return alert("ไม่มีข้อมูลสำหรับ Export");

    let headerTitle = selectedEquipmentSn
      ? `รายงานประวัติการ PM ของอุปกรณ์: ${selectedEquipmentSn} (${formatInputDate(startDate)} ถึง ${formatInputDate(endDate)})`
      : `รายงานประวัติการ PM ตั้งแต่: ${formatInputDate(startDate)} ถึง ${formatInputDate(endDate)}`;

    // เตรียม Header ตามที่แสดงผลอยู่
    const headers = [];
    if (visibleCols.no) headers.push("No");
    if (visibleCols.planDate) headers.push("PM Plan Date");
    if (visibleCols.actualDate) headers.push("วันที่ PM อุปกรณ์");
    if (visibleCols.category) headers.push("กลุ่มอุปกรณ์");
    if (visibleCols.type) headers.push("ชนิด");
    if (visibleCols.sn) headers.push("SN อุปกรณ์");
    if (visibleCols.brand) headers.push("BRAND");
    if (visibleCols.model) headers.push("MODEL");
    if (visibleCols.equipmentName) headers.push("ชื่อของอุปกรณ์");
    if (visibleCols.zone) headers.push("Zone");
    if (visibleCols.operator) headers.push("ผู้ดำเนินการ");
    if (visibleCols.cost) headers.push("ค่าใช้จ่าย");
    if (visibleCols.require) headers.push("หมายเหตุ");

    const wsData = [
      [headerTitle],
      [],
      headers
    ];

    filteredData.forEach((item, index) => {
      const row = [];
      if (visibleCols.no) row.push(index + 1);
      if (visibleCols.planDate) row.push(formatToDDMMYYYY(item.planedDate));
      if (visibleCols.actualDate) row.push(formatToDDMMYYYY(item.actualDate));
      if (visibleCols.category) row.push(item.category);
      if (visibleCols.type) row.push(item.type);
      if (visibleCols.sn) row.push(item.sn);
      if (visibleCols.brand) row.push(item.brand);
      if (visibleCols.model) row.push(item.model);
      if (visibleCols.equipmentName) row.push(item.equipmentName);
      if (visibleCols.zone) row.push(item.zone);
      if (visibleCols.operator) row.push(item.operator);
      if (visibleCols.cost) row.push(item.actualCost);
      if (visibleCols.require) row.push(item.require);

      wsData.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PM Log");

    const fileName = selectedEquipmentSn ? `PM_History_${selectedEquipmentSn}.xlsx` : `PM_History_${startDate}_to_${endDate}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const totalCost = filteredData.reduce((sum, item) => sum + Number(item.actualCost), 0);

  if (loading) return <div className="p-4">กำลังโหลดข้อมูลประวัติการ PM...</div>;

  return (
    <div className="page active animate-in fade-in">
      {/* ----------------- Filter Bar ----------------- */}
      <div className="filter-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>

        <select className="form-control" style={{ width: 'auto', minWidth: '150px' }} value={selectedEquipmentSn} onChange={(e) => setSelectedEquipmentSn(e.target.value)}>
          <option value="">ทุกอุปกรณ์ (รวมทั้งหมด)</option>
          {uniqueEquipments.map(eq => <option key={eq.sn} value={eq.sn}>{eq.sn} - {eq.equipmentName}</option>)}
        </select>

        <select className="form-control" style={{ width: 'auto' }} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">ทุกกลุ่ม</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select className="form-control" style={{ width: 'auto' }} value={filterZone} onChange={(e) => setFilterZone(e.target.value)}>
          <option value="">ทุก Zone</option>
          {zones.map(z => <option key={z} value={z}>{z}</option>)}
        </select>

        {/* ✅ แก้ไขตรงนี้: ใช้เทคนิคสลับ Text <-> Date Picker เพื่อบังคับโชว์ DD/MM/YYYY */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <input 
            type={startInputType} 
            className="form-control" 
            style={{ width: '130px' }} 
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
            style={{ width: '130px' }} 
            value={endInputType === 'date' ? endDate : formatInputDate(endDate)} 
            onFocus={() => setEndInputType('date')}
            onBlur={() => setEndInputType('text')}
            onChange={(e) => setEndDate(e.target.value)} 
            placeholder="DD/MM/YYYY"
          />
        </div>

        <input type="text" placeholder="ค้นหาชื่อ, SN..." className="form-control" style={{ width: '150px' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />

        {/* Dropdown เลือกคอลัมน์ */}
        <div style={{ position: 'relative' }} ref={columnMenuRef}>
          <button className="btn" style={{ backgroundColor: '#e5e7eb', color: '#374151', border: '1px solid #d1d5db' }} onClick={() => setShowColumnMenu(!showColumnMenu)}>
            เลือก Column ▼
          </button>

          {showColumnMenu && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: '4px',
              backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '6px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '10px',
              zIndex: 50, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '8px',
              maxHeight: '300px', overflowY: 'auto'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                <input type="checkbox" checked={visibleCols.no} onChange={() => toggleColumn('no')} /> No.
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                <input type="checkbox" checked={visibleCols.planDate} onChange={() => toggleColumn('planDate')} /> วันที่ Plan
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                <input type="checkbox" checked={visibleCols.actualDate} onChange={() => toggleColumn('actualDate')} /> วันที่ PM จริง
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                <input type="checkbox" checked={visibleCols.category} onChange={() => toggleColumn('category')} /> กลุ่ม
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                <input type="checkbox" checked={visibleCols.type} onChange={() => toggleColumn('type')} /> ชนิด
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                <input type="checkbox" checked={visibleCols.sn} onChange={() => toggleColumn('sn')} /> SN
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                <input type="checkbox" checked={visibleCols.brand} onChange={() => toggleColumn('brand')} /> BRAND
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                <input type="checkbox" checked={visibleCols.model} onChange={() => toggleColumn('model')} /> MODEL
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                <input type="checkbox" checked={visibleCols.equipmentName} onChange={() => toggleColumn('equipmentName')} /> ชื่ออุปกรณ์
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                <input type="checkbox" checked={visibleCols.zone} onChange={() => toggleColumn('zone')} /> Zone
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                <input type="checkbox" checked={visibleCols.operator} onChange={() => toggleColumn('operator')} /> ผู้ดำเนินการ
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                <input type="checkbox" checked={visibleCols.cost} onChange={() => toggleColumn('cost')} /> ค่าใช้จ่าย
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                <input type="checkbox" checked={visibleCols.require} onChange={() => toggleColumn('require')} /> หมายเหตุ
              </label>
            </div>
          )}
        </div>

        <button className="btn btn-success btn-sm" onClick={handleExportExcel}>Export Excel</button>
      </div>

      {/* ----------------- Table Data ----------------- */}
      <div className="card" style={{ overflowX: 'auto' }}>
        <div className="table-wrap">
          <table style={{ minWidth: '1000px' }}>
            <thead>
              <tr>
                {visibleCols.no && <th>No</th>}
                {visibleCols.planDate && <th>วันที่ Plan</th>}
                {visibleCols.actualDate && <th>วันที่ PM จริง</th>}
                {visibleCols.category && <th>กลุ่ม</th>}
                {visibleCols.type && <th>ชนิด</th>}
                {visibleCols.sn && <th>SN อุปกรณ์</th>}
                {visibleCols.brand && <th>BRAND</th>}
                {visibleCols.model && <th>MODEL</th>}
                {visibleCols.equipmentName && <th>ชื่ออุปกรณ์</th>}
                {visibleCols.zone && <th>Zone</th>}
                {visibleCols.operator && <th>ผู้ดำเนินการ</th>}
                {visibleCols.cost && <th>ค่าใช้จ่าย</th>}
                {visibleCols.require && <th>หมายเหตุ</th>}
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((item, idx) => (
                  <tr key={item.id}>
                    {visibleCols.no && <td>{idx + 1}</td>}
                    {visibleCols.planDate && <td>{formatToDDMMYYYY(item.planedDate)}</td>}
                    {visibleCols.actualDate && <td>{formatToDDMMYYYY(item.actualDate)}</td>}
                    {visibleCols.category && <td>{item.category}</td>}
                    {visibleCols.type && <td>{item.type}</td>}
                    {visibleCols.sn && <td>{item.sn}</td>}
                    {visibleCols.brand && <td>{item.brand}</td>}
                    {visibleCols.model && <td>{item.model}</td>}
                    {visibleCols.equipmentName && <td style={{ fontWeight: 600, color: 'var(--navy-light)' }}>{item.equipmentName}</td>}
                    {visibleCols.zone && <td>{item.zone}</td>}
                    {visibleCols.operator && <td>{item.operator}</td>}
                    {visibleCols.cost && <td style={{ fontFamily: 'IBM Plex Mono', fontWeight: 600 }}>฿{item.actualCost.toLocaleString()}</td>}
                    {visibleCols.require && <td>{item.require}</td>}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={Object.values(visibleCols).filter(Boolean).length} style={{ textAlign: 'center', padding: '20px' }}>
                    ไม่พบข้อมูลในช่วงเวลาและเงื่อนไขที่เลือก
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="flex justify-between items-center" style={{ paddingTop: '10px', marginTop: '8px', borderTop: '1px solid var(--gray-100)' }}>
          <span className="text-sm text-gray">รวม {filteredData.length} รายการ</span>
          {visibleCols.cost && (
            <span className="text-sm" style={{ fontWeight: 600, color: 'var(--gray-800)' }}>
              รวมค่าใช้จ่าย: <span style={{ color: 'var(--primary)', fontFamily: 'IBM Plex Mono' }}>฿{totalCost.toLocaleString()}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;