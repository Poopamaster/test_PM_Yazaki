import React, { useState, useEffect } from 'react';
import '../../css/EquipmentModal.css';

const EquipmentModal = ({ isOpen, onClose, onSave, initialData, categories }) => {
  // เปลี่ยน zoneCode เป็น zone ให้ตรงกับ EquipmentModel.js
  const [formData, setFormData] = useState({
    sn: '',
    name: '',
    category: '', 
    type: '',     
    brand: '',    
    model: '',    
    zone: '',     
    status: 'Active'
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({ 
        sn: '', name: '', category: '', type: '', brand: '', model: '', zone: '', status: 'Active' 
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{initialData ? 'แก้ไขอุปกรณ์' : 'เพิ่มอุปกรณ์ใหม่'}</h3>
          <button type="button" className="btn-close" onClick={onClose}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* เอา full-width ออกให้หมด จะได้จัดเป็น 2 คอลัมน์ */}
          <div className="modal-body">
            <div className="form-group">
              <label>SN อุปกรณ์ *</label>
              <input type="text" name="sn" className="form-control" value={formData.sn} onChange={handleChange} readOnly={!!initialData} required />
            </div>
            
            <div className="form-group">
              <label>ชื่ออุปกรณ์ *</label>
              <input type="text" name="name" className="form-control" value={formData.name} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>หมวดหมู่ *</label>
              <select name="category" className="form-control" value={formData.category} onChange={handleChange} required>
                <option value="">-- เลือกหมวดหมู่ --</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>ชนิด (Type) *</label>
                <input type="text" name="type" className="form-control" value={formData.type} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Brand *</label>
              <input type="text" name="brand" className="form-control" value={formData.brand} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Model *</label>
              <input type="text" name="model" className="form-control" value={formData.model} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Zone Code *</label>
              <input type="text" name="zone" className="form-control" value={formData.zone} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>สถานะ</label>
              <select name="status" className="form-control" value={formData.status} onChange={handleChange}>
                <option value="Active">ใช้งานปกติ (Active)</option>
                <option value="Inactive">ระงับการใช้งาน (Inactive)</option>
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn btn-primary">บันทึกข้อมูล</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EquipmentModal;