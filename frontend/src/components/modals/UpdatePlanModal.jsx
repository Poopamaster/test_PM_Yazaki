import React, { useEffect, useState } from 'react';

const UpdatePlanModal = ({ isOpen, onClose, onSave, updateFormData, setUpdateFormData, formatDate }) => {
  const [tasks, setTasks] = useState({
    task1: false, task2: false, task3: false, task4: false
  });

  // เช็คว่าเป็นโหมด "ดูรายละเอียด" (Read Only) หรือไม่?
  const isReadOnly = updateFormData?.isReadOnly || false;

  useEffect(() => {
    if (isOpen && updateFormData && !isReadOnly) {
      // ดึงเวลา Local (ประเทศไทย) ป้องกันบั๊กวันที่เพี้ยนตอนเช้าตรู่
      const todayObj = new Date();
      const offset = todayObj.getTimezoneOffset() * 60000;
      const localToday = new Date(todayObj.getTime() - offset).toISOString().split('T')[0];
      
      setUpdateFormData(prev => ({
        ...prev,
        actualDate: prev.actualDate || localToday,
        status: 'Completed' 
      }));
    }
  }, [isOpen]);

  if (!isOpen || !updateFormData) return null;

  const handleNoteChange = (e) => setUpdateFormData({ ...updateFormData, require: e.target.value });
  const handleTaskChange = (e) => setTasks({ ...tasks, [e.target.name]: e.target.checked });

  return (
    <div className="modal-overlay" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}>
      <div className="modal-content" style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '500px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', color: '#1f2937' }}>
              {isReadOnly ? 'รายละเอียดการ PM (เสร็จสิ้น)' : 'บันทึกการ PM'}
            </h3>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '13px' }}>
              {updateFormData.equipmentSN} — {updateFormData.categoryName} {updateFormData.type && updateFormData.type !== '-' ? updateFormData.type : ''} | Zone {updateFormData.zone}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' }}>✕</button>
        </div>

        <form onSubmit={onSave}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>วันที่ PM จริง</label>
                <input 
                  type="date" className="form-control" required={!isReadOnly} disabled={isReadOnly}
                  value={updateFormData.actualDate ? updateFormData.actualDate.split('T')[0] : ''} 
                  onChange={(e) => setUpdateFormData({...updateFormData, actualDate: e.target.value})}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: isReadOnly ? '#f3f4f6' : '#fff', color: isReadOnly ? '#6b7280' : '#000' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>ช่างเทคนิค</label>
                <input 
                  type="text" className="form-control" required={!isReadOnly} disabled={isReadOnly}
                  placeholder="ชื่อผู้ดำเนินการ" value={updateFormData.operator || ''} 
                  onChange={(e) => setUpdateFormData({...updateFormData, operator: e.target.value})} 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: isReadOnly ? '#f3f4f6' : '#fff', color: isReadOnly ? '#6b7280' : '#000' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>ค่าใช้จ่ายจริง (บาท)</label>
              <input 
                type="number" className="form-control" required={!isReadOnly} disabled={isReadOnly}
                value={updateFormData.actualCost || 0} 
                onChange={(e) => setUpdateFormData({...updateFormData, actualCost: e.target.value})} 
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: isReadOnly ? '#f3f4f6' : '#fff', color: isReadOnly ? '#6b7280' : '#000' }}
              />
            </div>

            {/* Checkboxes หรืองานที่ทำ */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>งานที่ดำเนินการ</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: isReadOnly ? 'default' : 'pointer', color: isReadOnly ? '#6b7280' : '#000' }}>
                  <input type="checkbox" name="task1" checked={tasks.task1} onChange={handleTaskChange} disabled={isReadOnly} /> ทำความสะอาดภายใน
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: isReadOnly ? 'default' : 'pointer', color: isReadOnly ? '#6b7280' : '#000' }}>
                  <input type="checkbox" name="task2" checked={tasks.task2} onChange={handleTaskChange} disabled={isReadOnly} /> ตรวจสอบ / เปลี่ยนอุปกรณ์สิ้นเปลือง
                </label>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>หมายเหตุ / รายละเอียด</label>
              <textarea 
                className="form-control" rows="2" disabled={isReadOnly}
                placeholder={isReadOnly ? "-" : "รายละเอียดงานที่ทำ..."} value={updateFormData.require || ''} 
                onChange={handleNoteChange} 
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', resize: 'vertical', backgroundColor: isReadOnly ? '#f3f4f6' : '#fff', color: isReadOnly ? '#6b7280' : '#000' }}
              />
            </div>

          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            {/* โหมด Read Only จะมีแค่ปุ่ม "ปิดหน้าต่าง" และกดแล้วเป็น onClose (ไม่ใช้ type="submit") */}
            {isReadOnly ? (
              <button type="button" onClick={onClose} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#fff', color: '#374151', cursor: 'pointer', fontWeight: '500' }}>
                ปิดหน้าต่าง
              </button>
            ) : (
              <>
                <button type="button" onClick={onClose} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#fff', color: '#374151', cursor: 'pointer', fontWeight: '500' }}>
                  ยกเลิก
                </button>
                <button type="submit" style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#3b82f6', color: '#fff', cursor: 'pointer', fontWeight: '500' }}>
                  บันทึก PM
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdatePlanModal;