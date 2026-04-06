import React from 'react';

const AddPlanModal = ({ isOpen, onClose, onSave, addFormData, setAddFormData, equipmentList }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>เพิ่มแผน PM ใหม่</h3>
        </div>
        <form onSubmit={onSave}>
          <div className="modal-body">
            <div className="form-group">
              <label>เลือกอุปกรณ์ (SN)</label>
              <select required className="form-control" value={addFormData.equipmentSN} onChange={(e) => setAddFormData({...addFormData, equipmentSN: e.target.value})}>
                <option value="">-- เลือกอุปกรณ์ --</option>
                {equipmentList.map(eq => <option key={eq.sn} value={eq.sn}>{eq.sn} - {eq.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>วันที่วางแผน (Planed Date)</label>
              <input required type="date" className="form-control" value={addFormData.planedDate} onChange={(e) => setAddFormData({...addFormData, planedDate: e.target.value})} />
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

export default AddPlanModal;