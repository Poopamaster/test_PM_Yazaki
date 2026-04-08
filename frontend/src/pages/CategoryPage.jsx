import React, { useEffect, useState } from 'react';
import { pmService } from '../api/pmService';
import '../css/Equipment.css';

// ==========================================
// Component: Category Modal (หน้าต่างเพิ่ม/แก้ไข)
// ==========================================
const CategoryModal = ({ isOpen, onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState({
        name: '',
        interval_months: '',
        default_price: '',
        isActive: true
    });

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    name: initialData.name || '',
                    interval_months: initialData.interval_months || '',
                    default_price: initialData.default_price || '',
                    isActive: initialData.isActive !== false // ถ้าไม่มีค่าให้ถือว่า true
                });
            } else {
                setFormData({ name: '', interval_months: '', default_price: '', isActive: true });
            }
        }
    }, [isOpen, initialData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formData,
            interval_months: Number(formData.interval_months),
            default_price: Number(formData.default_price)
        });
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content animate-in fade-in" style={{ maxWidth: '400px' }}>
                <div className="modal-header">
                    <h3>{initialData ? 'แก้ไขกลุ่มอุปกรณ์' : 'เพิ่มกลุ่มอุปกรณ์ใหม่'}</h3>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-group">
                        <label>ชื่อกลุ่มอุปกรณ์ <span style={{ color: 'red' }}>*</span></label>
                        <input
                            type="text"
                            name="name"
                            className="form-control"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="เช่น Air Conditioner, CCTV..."
                        />
                    </div>
                    <div className="form-group">
                        <label>รอบการทำ PM (เดือน) <span style={{ color: 'red' }}>*</span></label>
                        <input
                            type="number"
                            name="interval_months"
                            className="form-control"
                            value={formData.interval_months}
                            onChange={handleChange}
                            required
                            min="1"
                            placeholder="เช่น 3, 6, 12"
                        />
                    </div>
                    <div className="form-group">
                        <label>ค่าใช้จ่ายประมาณการ (บาท/ครั้ง) <span style={{ color: 'red' }}>*</span></label>
                        <input
                            type="number"
                            name="default_price"
                            className="form-control"
                            value={formData.default_price}
                            onChange={handleChange}
                            required
                            min="0"
                            placeholder="เช่น 1500"
                        />
                    </div>
                    {initialData && (
                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '15px' }}>
                            <input 
                                type="checkbox" 
                                id="isActive" 
                                name="isActive" 
                                checked={formData.isActive} 
                                onChange={handleChange} 
                                style={{ width: '18px', height: '18px' }}
                            />
                            <label htmlFor="isActive" style={{ margin: 0, cursor: 'pointer' }}>เปิดใช้งานกลุ่มอุปกรณ์นี้</label>
                        </div>
                    )}
                    <div className="modal-footer" style={{ marginTop: '20px' }}>
                        <button type="button" className="btn btn-outline" onClick={onClose}>ยกเลิก</button>
                        <button type="submit" className="btn btn-primary">บันทึกข้อมูล</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ==========================================
// Component: หน้าหลัก Category (ตารางแสดงข้อมูล)
// ==========================================
const Category = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingData, setEditingData] = useState(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const res = await pmService.getAllCategories();
            setCategories(res.data?.data || res.data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
            alert('ไม่สามารถโหลดข้อมูลกลุ่มอุปกรณ์ได้');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAddModal = () => {
        setEditingData(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (category) => {
        setEditingData(category);
        setIsModalOpen(true);
    };

    const handleSaveCategory = async (formData) => {
        try {
            if (editingData) {
                const id = editingData._id || editingData.id;
                await pmService.updateCategory(id, formData);
                alert('แก้ไขข้อมูลสำเร็จ');
            } else {
                await pmService.createCategory(formData);
                alert('เพิ่มกลุ่มอุปกรณ์สำเร็จ');
            }
            setIsModalOpen(false);
            fetchCategories();
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message;
            alert(`ไม่สามารถบันทึกข้อมูลได้!\nสาเหตุ: ${errorMsg}`);
        }
    };

    // ==========================================
    // ฟังก์ชันสลับสถานะ (Soft Delete / Restore)
    // ==========================================
    const handleToggleStatus = async (category) => {
        const id = category._id || category.id;
        const currentStatus = category.isActive !== false; // ถ้าไม่มีค่าถือว่า true
        const actionText = currentStatus ? "ปิดใช้งาน" : "เปิดใช้งานกลับมา";

        if (window.confirm(`คุณต้องการ "${actionText}" กลุ่มอุปกรณ์: ${category.name} ใช่หรือไม่?`)) {
            try {
                // ใช้การ Update เพื่อสลับสถานะ (พ่นค่า isActive ตรงข้ามของเดิมไป)
                await pmService.updateCategory(id, { isActive: !currentStatus });
                fetchCategories();
            } catch (error) {
                const errorMsg = error.response?.data?.message || error.message;
                alert(`เกิดข้อผิดพลาด!\nสาเหตุ: ${errorMsg}`);
            }
        }
    };

    const filteredCategories = categories.filter(cat => 
        (cat.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="page active"><p style={{ padding: '24px' }}>กำลังโหลดข้อมูล...</p></div>;

    return (
        <div className="page active animate-in fade-in">
            <div className="filter-bar" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <input
                    type="text"
                    placeholder="ค้นหาชื่อกลุ่มอุปกรณ์..."
                    className="form-control search-input"
                    style={{ width: '300px' }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="eq-container">
                <div className="eq-header">
                    <h2>จัดการกลุ่มอุปกรณ์ (Master Categories)</h2>
                    <button className="btn btn-primary" onClick={handleOpenAddModal}>
                        + เพิ่มกลุ่มอุปกรณ์
                    </button>
                </div>

                <div className="table-wrap">
                    <table className="eq-table">
                        <thead>
                            <tr>
                                <th style={{ width: '60px', textAlign: 'center' }}>ลำดับ</th>
                                <th>ชื่อกลุ่มอุปกรณ์ (Name)</th>
                                <th style={{ textAlign: 'center' }}>รอบการทำ PM</th>
                                <th style={{ textAlign: 'right' }}>ค่าใช้จ่ายเฉลี่ย</th>
                                <th style={{ textAlign: 'center' }}>สถานะ</th>
                                <th style={{ width: '180px', textAlign: 'center' }}>จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCategories.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>
                                        ไม่พบข้อมูลกลุ่มอุปกรณ์
                                    </td>
                                </tr>
                            ) : (
                                filteredCategories.map((cat, index) => {
                                    const isActive = cat.isActive !== false;
                                    return (
                                        <tr key={cat._id || cat.id} style={{ opacity: isActive ? 1 : 0.6 }}>
                                            <td style={{ textAlign: 'center', color: 'var(--gray-500)' }}>{index + 1}</td>
                                            <td style={{ fontWeight: 600, textDecoration: isActive ? 'none' : 'line-through' }}>
                                                {cat.name}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>{cat.interval_months} เดือน</td>
                                            <td style={{ textAlign: 'right', fontFamily: 'IBM Plex Mono' }}>
                                                ฿{Number(cat.default_price).toLocaleString()}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span style={{ 
                                                    padding: '4px 8px', 
                                                    borderRadius: '12px', 
                                                    fontSize: '0.8rem',
                                                    background: isActive ? '#E6FFFA' : '#FEE2E2',
                                                    color: isActive ? '#047857' : '#B91C1C',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="action-buttons justify-center">
                                                    <button 
                                                        className="btn btn-outline btn-xs" 
                                                        onClick={() => handleOpenEditModal(cat)}
                                                    >
                                                        แก้ไข
                                                    </button>
                                                    <button
                                                        className="btn btn-xs"
                                                        style={{ 
                                                            background: isActive ? 'var(--red-light)' : '#ecfdf5', 
                                                            color: isActive ? 'var(--red)' : '#059669', 
                                                            border: `1px solid ${isActive ? '#FEB2B2' : '#a7f3d0'}` 
                                                        }}
                                                        onClick={() => handleToggleStatus(cat)}
                                                    >
                                                        {isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <CategoryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveCategory}
                initialData={editingData}
            />
        </div>
    );
};

export default Category;