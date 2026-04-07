import React, { useState, useEffect } from 'react';
import { pmService } from '../api/pmService'; // ปรับ Path ตามโปรเจกต์
import * as XLSX from 'xlsx';

const History = () => {
  const [historyData, setHistoryData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [filterCategory, setFilterCategory] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Set default dates (ต้นเดือน - สิ้นเดือน)
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);

  // ตัวเลือกสำหรับ Dropdown
  const [categories, setCategories] = useState([]);
  const [zones, setZones] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [historyData, filterCategory, filterZone, startDate, endDate, searchTerm]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. ดึงข้อมูล 3 ส่วนให้ครบเพื่อป้องกันปัญหา Category แสดงเป็น Object ID
      const [resSchedules, resEquipments, resCategories] = await Promise.all([
        pmService.getAllSchedules(),
        pmService.getAllEquipments(),
        pmService.getAllCategories() // ดึง Category Master มาด้วย
      ]);

      const rawSchedules = resSchedules.data?.data || resSchedules.data || [];
      const rawEquipments = resEquipments.data?.data || resEquipments.data || [];
      const rawCategories = resCategories.data?.data || resCategories.data || [];

      // ดึงเฉพาะที่สถานะเป็น Completed
      const completedPMs = rawSchedules.filter(s => s.status === 'Completed');

      const combinedData = completedPMs.map(schedule => {
        // หาข้อมูลเครื่อง
        const eq = rawEquipments.find(e => e.sn === schedule.equipmentSN) || {};

        // 2. หาชื่อ Category
        let categoryName = 'N/A';
        if (eq.category) {
          // ถ้า Backend ส่งแบบ Populated มาให้แล้ว (เป็น Object)
          if (eq.category.name) {
            categoryName = eq.category.name;
          } else {
            // ถ้า Backend ส่งมาเป็นแค่ ID string ให้ไปเทียบกับ rawCategories
            const foundCat = rawCategories.find(c => c._id === eq.category || c.id === eq.category);
            if (foundCat) categoryName = foundCat.name;
          }
        }

        return {
          id: schedule._id,
          planedDate: schedule.planedDate,
          actualDate: schedule.actualDate || schedule.planedDate, // ใช้วันที่ทำจริง
          category: categoryName, // ใช้ชื่อที่เราดึงมาให้ชัวร์
          type: eq.type || 'N/A',
          brand: eq.brand || 'N/A',
          model: eq.model || 'N/A',
          sn: schedule.equipmentSN,
          equipmentName: eq.name || 'N/A',
          zone: eq.zone || 'N/A',
          operator: schedule.operator || '-',
          actualCost: schedule.actualCost || 0,
          require: schedule.require || '-' // หมายเหตุ
        };
      });

      // ดึงข้อมูลที่ไม่ซ้ำไปใส่ Dropdown
      const uniqueCats = [...new Set(combinedData.map(item => item.category))].filter(c => c !== 'N/A');
      const uniqueZones = [...new Set(combinedData.map(item => item.zone))].filter(z => z !== 'N/A');

      setCategories(uniqueCats);
      setZones(uniqueZones);
      setHistoryData(combinedData);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = historyData;

    if (filterCategory) {
      result = result.filter(item => item.category === filterCategory);
    }
    if (filterZone) {
      result = result.filter(item => item.zone === filterZone);
    }
    if (searchTerm) {
      result = result.filter(item =>
        item.equipmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sn.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (startDate) {
      result = result.filter(item => new Date(item.actualDate) >= new Date(startDate));
    }
    if (endDate) {
      // +1 วันเพื่อให้ครอบคลุมเวลาถึง 23:59 น. ของวัน endDate
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);
      result = result.filter(item => new Date(item.actualDate) < end);
    }

    // เรียงวันที่ทำ PM จากล่าสุดไปเก่าสุด
    result.sort((a, b) => new Date(b.actualDate) - new Date(a.actualDate));

    setFilteredData(result);
  };

  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      alert("ไม่มีข้อมูลสำหรับ Export");
      return;
    }

    // 1. สร้างแถวหัวตารางแบบในไฟล์ตัวอย่าง
    const headerTitle = `รายงานประวัติการ PM ตั้งแต่: ${startDate} ถึง ${endDate}`;

    const wsData = [
      [headerTitle, "", "", "", "", "", "", "", "", "", "", ""], // Row 1: Title
      [], // Row 2: เว้นวรรค
      ["No", "PM Plan Date", "วันที่ PM อุปกรณ์", "กลุ่มอุปกรณ์", "ชนิด", "SN อุปกรณ์", "BRAND", "MODEL", "ชื่อของอุปกรณ์", "ผู้ดำเนินการ", "ค่าใช้จ่าย", "หมายเหตุ"] // Row 3: Headers
    ];

    // 2. ใส่ข้อมูล
    filteredData.forEach((item, index) => {
      wsData.push([
        index + 1,
        new Date(item.planedDate).toLocaleDateString('en-CA'), // Format YYYY-MM-DD
        new Date(item.actualDate).toLocaleDateString('en-CA'),
        item.category,
        item.type,
        item.sn,
        item.brand,
        item.model,
        item.equipmentName,
        item.operator,
        item.actualCost,
        item.require
      ]);
    });

    // 3. สร้าง Worksheet และ Workbook
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // จัดความกว้างคอลัมน์ให้อ่านง่าย
    ws['!cols'] = [
      { wch: 5 },  // No
      { wch: 15 }, // Plan Date
      { wch: 15 }, // Actual Date
      { wch: 15 }, // Category
      { wch: 10 }, // Type
      { wch: 20 }, // SN
      { wch: 15 }, // Brand
      { wch: 15 }, // Model
      { wch: 25 }, // Name
      { wch: 15 }, // Operator
      { wch: 10 }, // Cost
      { wch: 20 }  // Require
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PM Log");

    // 4. สั่งดาวน์โหลด
    XLSX.writeFile(wb, `PM_History_${startDate}_to_${endDate}.xlsx`);
  };

  const totalCost = filteredData.reduce((sum, item) => sum + Number(item.actualCost), 0);

  if (loading) return <div className="p-4">กำลังโหลดข้อมูลประวัติการ PM...</div>;

  return (
    <div className="page active animate-in fade-in">
      <div className="filter-bar">
        <select className="form-control" style={{ width: 'auto' }} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">ทุกกลุ่ม</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="form-control" style={{ width: 'auto' }} value={filterZone} onChange={(e) => setFilterZone(e.target.value)}>
          <option value="">ทุก Zone</option>
          {zones.map(z => <option key={z} value={z}>{z}</option>)}
        </select>
        <input type="date" className="form-control" style={{ width: 'auto' }} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <span className="text-sm text-gray">ถึง</span>
        <input type="date" className="form-control" style={{ width: 'auto' }} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <input
          type="text"
          placeholder="ค้นหาชื่อ, SN อุปกรณ์..."
          className="form-control"
          style={{ width: '180px' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="btn btn-success btn-sm" onClick={handleExportExcel}>Export Excel</button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>วันที่ PM</th>
                <th>กลุ่ม</th>
                <th>ชนิด</th>
                <th>SN อุปกรณ์</th>
                <th>ชื่ออุปกรณ์</th>
                <th>Zone</th>
                <th>ผู้ดำเนินการ</th>
                <th>ค่าใช้จ่าย</th>
                <th>หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((item, idx) => (
                  <tr key={item.id}>
                    <td>{idx + 1}</td>
                    <td>{new Date(item.actualDate).toLocaleDateString('th-TH')}</td>
                    <td>{item.category}</td>
                    <td>{item.type}</td>
                    <td>{item.sn}</td>
                    <td style={{ fontWeight: 600, color: 'var(--navy-light)' }}>{item.equipmentName}</td>
                    <td>{item.zone}</td>
                    <td>{item.operator}</td>
                    <td style={{ fontFamily: 'IBM Plex Mono', fontWeight: 600 }}>฿{item.actualCost.toLocaleString()}</td>
                    <td>{item.require}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '20px' }}>ไม่พบข้อมูลในช่วงเวลาและเงื่อนไขที่เลือก</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center" style={{ paddingTop: '10px', marginTop: '8px', borderTop: '1px solid var(--gray-100)' }}>
          <span className="text-sm text-gray">รวม {filteredData.length} รายการ</span>
          <span className="text-sm" style={{ fontWeight: 600, color: 'var(--gray-800)' }}>
            รวมค่าใช้จ่าย: <span style={{ color: 'var(--primary)', fontFamily: 'IBM Plex Mono' }}>฿{totalCost.toLocaleString()}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default History;