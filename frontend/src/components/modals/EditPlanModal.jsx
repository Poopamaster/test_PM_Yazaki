import React from 'react';

const EditPlanModal = ({ isOpen, onClose, onSave, editFormData, setEditFormData }) => {
  if (!isOpen || !editFormData) return null;

  return (
    <div className="modal-overlay" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}>
      <div className="modal-content" style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
        
        <div className="modal-header" style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>แก้ไขข้อมูลแผน PM</h3>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '13px' }}>อุปกรณ์ SN: {editFormData.equipmentSN}</p>
        </div>

        <form onSubmit={onSave}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>วันที่วางแผน (Planed Date)</label>
              <input 
                type="date" 
                className="form-control" 
                required 
                value={editFormData.planedDate || ''} 
                onChange={(e) => setEditFormData({...editFormData, planedDate: e.target.value})}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              />
            </div>
            
            {/* สามารถแก้ไขค่าใช้จ่ายประเมินล่วงหน้าได้ หรือใส่หมายเหตุ */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>หมายเหตุ (เหตุผลการเลื่อน ฯลฯ)</label>
              <textarea 
                className="form-control" 
                rows="2"
                value={editFormData.require || ''} 
                onChange={(e) => setEditFormData({...editFormData, require: e.target.value})}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              />
            </div>
          </div>
          
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#fff', cursor: 'pointer' }}>ยกเลิก</button>
            <button type="submit" style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#f59e0b', color: '#fff', cursor: 'pointer' }}>บันทึกการแก้ไข</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPlanModal;