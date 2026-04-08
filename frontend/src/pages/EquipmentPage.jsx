// src/pages/Equipment.jsx
import React, { useEffect, useState, useRef } from 'react';
import { pmService } from '../api/pmService';
import EquipmentModal from '../components/modals/EquipmentModal';
import '../css/Equipment.css';

const Equipment = () => {
    // --- States พื้นฐาน ---
    const [equipments, setEquipments] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- States สำหรับ กรอง และ ค้นหา (Search & Filter) ---
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterZone, setFilterZone] = useState('');
    const [showInactive, setShowInactive] = useState(false);

    // --- States สำหรับ แบ่งหน้า (Pagination) ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // --- States สำหรับ Modal ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingData, setEditingData] = useState(null);

    // --- Ref สำหรับปุ่ม Import ---
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterCategory, filterZone, showInactive]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [eqRes, catRes] = await Promise.all([
                pmService.getAllEquipments(),
                pmService.getAllCategories()
            ]);
            setEquipments(eqRes.data.data || eqRes.data || []);
            setCategories(catRes.data.data || catRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('ไม่สามารถโหลดข้อมูลได้');
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // 1. ระบบค้นหา กรอง และซ่อนรายการที่ถูกลบ
    // ==========================================
    const filteredEquipments = equipments.filter((eq) => {
        if (!showInactive && eq.status === 'Inactive') return false;

        // ใส่ ( || '') เพื่อป้องกันบัคเวลาข้อมูลบางตัวเป็น null แล้วใช้ toLowerCase() ไม่ได้
        const safeSN = (eq.sn || '').toLowerCase();
        const safeName = (eq.name || '').toLowerCase();
        const search = searchTerm.toLowerCase();

        const matchSearch = safeSN.includes(search) || safeName.includes(search);
        const matchCategory = filterCategory ? (eq.category?._id === filterCategory || eq.category === filterCategory) : true;
        const matchZone = filterZone ? eq.zone === filterZone : true;

        return matchSearch && matchCategory && matchZone;
    });

    const uniqueZones = [...new Set(equipments.map(eq => eq.zone))].filter(Boolean);

    // ==========================================
    // 2. ระบบแบ่งหน้า (Pagination)
    // ==========================================
    const totalPages = Math.ceil(filteredEquipments.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentEquipments = filteredEquipments.slice(startIndex, startIndex + itemsPerPage);

    // ==========================================
    // 3. ระบบ Import / Export
    // ==========================================
    const handleExportCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
        csvContent += "ลำดับ,SN,ชื่ออุปกรณ์,หมวดหมู่,ชนิด,ยี่ห้อ,รุ่น,Zone,สถานะ\n";

        filteredEquipments.forEach((eq, index) => {
            const row = [
                index + 1, eq.sn, eq.name, eq.category?.name || '', eq.type, eq.brand, eq.model, eq.zone, eq.status
            ].join(",");
            csvContent += row + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "equipments_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            alert(`รับไฟล์ ${file.name} แล้ว!\n(รอเชื่อมต่อ Library นำเข้า Excel)`);
            e.target.value = null;
        }
    };

    // ==========================================
    // 4. ระบบ Soft Delete & Modal
    // ==========================================
    const handleSoftDelete = async (eq) => {
        if (window.confirm(`คุณแน่ใจหรือไม่ที่จะ "เลิกใช้งาน" อุปกรณ์ SN: ${eq.sn} ?`)) {
            try {
                const payload = {
                    ...eq,
                    category: eq.category?._id || eq.category,
                    status: 'Inactive'
                };
                await pmService.updateEquipment(eq.sn, payload);
                alert('เปลี่ยนสถานะเป็นเลิกใช้งานสำเร็จ');
                fetchInitialData();
            } catch (error) {
                console.error('Error soft deleting:', error);
                alert('ไม่สามารถเปลี่ยนสถานะข้อมูลได้');
            }
        }
    };

    const handleOpenAddModal = () => {
        setEditingData(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (eq) => {
        setEditingData({
            sn: eq.sn,
            name: eq.name,
            category: eq.category?._id || eq.category || '',
            type: eq.type || '',
            brand: eq.brand || '',
            model: eq.model || '',
            zone: eq.zone || '',
            status: eq.status
        });
        setIsModalOpen(true);
    };

    const handleSaveEquipment = async (formData) => {
        try {
            if (editingData) {
                await pmService.updateEquipment(formData.sn, formData);
                alert('แก้ไขข้อมูลสำเร็จ');
            } else {
                await pmService.createEquipment(formData);
                alert('เพิ่มอุปกรณ์สำเร็จ');
            }
            setIsModalOpen(false);
            fetchInitialData();
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message;
            alert(`ไม่สามารถบันทึกข้อมูลได้!\nสาเหตุ: ${errorMsg}`);
        }
    };

    if (loading) return <div className="page active"><p style={{ padding: '24px' }}>กำลังโหลดข้อมูล...</p></div>;

    return (
        <div className="page active animate-in fade-in">

            {/* --- Filter Bar --- */}
            <div className="filter-bar">
                <select className="form-control" style={{ width: 'auto' }} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                    <option value="">ทุกหมวดหมู่</option>
                    {categories.map(cat => (
                        <option key={cat._id} value={cat._id}>
                            {cat.name} {cat.isActive === false ? '(ปิดใช้งาน)' : ''}
                        </option>
                    ))}
                </select>

                <select className="form-control" style={{ width: 'auto' }} value={filterZone} onChange={(e) => setFilterZone(e.target.value)}>
                    <option value="">ทุก Zone</option>
                    {uniqueZones.map(zone => (
                        <option key={zone} value={zone}>Zone {zone}</option>
                    ))}
                </select>

                <input
                    type="text"
                    placeholder="ค้นหา SN หรือ ชื่ออุปกรณ์..."
                    className="form-control search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                <label className="checkbox-label">
                    <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
                    แสดงเครื่องที่ยกเลิกการใช้งาน
                </label>

                <div className="filter-actions">
                    <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".csv, .xlsx" onChange={handleFileChange} />
                    <button className="btn btn-success btn-sm" onClick={handleExportCSV}>Export CSV</button>
                </div>
            </div>

            <div className="eq-container">
                <div className="eq-header">
                    <h2>จัดการอุปกรณ์ (Equipments)</h2>
                    <button className="btn btn-primary" onClick={handleOpenAddModal}>
                        + เพิ่มอุปกรณ์
                    </button>
                </div>

                <div className="table-wrap">
                    <table className="eq-table">
                        <thead>
                            <tr>
                                <th style={{ width: '60px', textAlign: 'center' }}>ลำดับ</th>
                                <th>SN อุปกรณ์</th>
                                <th>ชื่ออุปกรณ์</th>
                                <th>หมวดหมู่</th>
                                <th>ชนิด (Type)</th>
                                <th>ยี่ห้อ (Brand)</th>
                                <th>รุ่น (Model)</th>
                                <th>Zone</th>
                                <th>สถานะ</th>
                                <th style={{ textAlign: 'center' }}>จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentEquipments.length === 0 ? (
                                <tr><td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>ไม่พบข้อมูลอุปกรณ์ที่ค้นหา</td></tr>
                            ) : (
                                currentEquipments.map((eq, index) => (
                                    <tr key={eq.sn} style={{ opacity: eq.status === 'Inactive' ? 0.6 : 1 }}>
                                        {/* คำนวณลำดับที่จาก Pagination */}
                                        <td style={{ textAlign: 'center', color: 'var(--gray-500)' }}>
                                            {startIndex + index + 1}
                                        </td>
                                        <td className="mono">{eq.sn}</td>
                                        <td style={{ fontWeight: 500 }}>{eq.name}</td>
                                        <td>
                                            {eq.category?.name || 'N/A'}
                                            {eq.category?.isActive === false ? ' (ปิดใช้งาน)' : ''}
                                        </td>
                                        <td>{eq.type || '-'}</td>
                                        <td>{eq.brand || '-'}</td>
                                        <td>{eq.model || '-'}</td>
                                        <td>{eq.zone || '-'}</td>
                                        <td>
                                            <span className={`badge ${eq.status === 'Active' ? 'badge-green' : 'badge-red'}`}>
                                                {eq.status === 'Active' ? 'ใช้งานปกติ' : 'ยกเลิกใช้งาน'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons justify-center">
                                                <button className="btn btn-outline btn-xs" onClick={() => handleOpenEditModal(eq)}>
                                                    แก้ไข
                                                </button>
                                                {eq.status === 'Active' && (
                                                    <button
                                                        className="btn btn-xs"
                                                        style={{ background: 'var(--red-light)', color: 'var(--red)', border: '1px solid #FEB2B2' }}
                                                        onClick={() => handleSoftDelete(eq)}
                                                    >
                                                        ยกเลิกใช้งาน
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* --- Pagination UI --- */}
                {totalPages > 0 && (
                    <div className="pagination-container">
                        <span>แสดง {startIndex + 1} ถึง {Math.min(startIndex + itemsPerPage, filteredEquipments.length)} จากทั้งหมด {filteredEquipments.length} รายการ</span>
                        <div className="pagination-controls">
                            <button className="btn btn-outline btn-xs" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                                ก่อนหน้า
                            </button>
                            <span className="page-info">หน้า {currentPage} / {totalPages}</span>
                            <button className="btn btn-outline btn-xs" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                                ถัดไป
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <EquipmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveEquipment}
                initialData={editingData}
                categories={categories}
            />
        </div>
    );
};

export default Equipment;