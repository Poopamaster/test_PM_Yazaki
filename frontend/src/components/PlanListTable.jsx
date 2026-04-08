import React from 'react';

const PlanListTable = ({
  loading,
  currentItems,
  indexOfFirstItem,
  formatDate,
  onOpenDetails,
  onOpenUpdate,
  onOpenEdit,
  onCancelClick,
  onDeleteClick,
  // Pagination Props
  totalItems,
  totalPages,
  currentPage,
  paginate,
  indexOfLastItem
}) => {
  return (
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
                <tr><td colSpan="10" className="text-center p-4">กำลังโหลดข้อมูล...</td></tr>
              ) : currentItems.length === 0 ? (
                <tr><td colSpan="10" className="text-center p-4 text-gray">ไม่มีข้อมูลแผน PM</td></tr>
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
                    <td>
                      {sch.status === 'Completed' && <span className="badge badge-green">เสร็จแล้ว</span>}
                      {sch.status === 'Overdue' && <span className="badge badge-red">เลยกำหนด</span>}
                      {(sch.status === 'Pending' || !sch.status) && <span className="badge badge-orange">รอทำ</span>}
                      {sch.status === 'Cancelled' && <span className="badge" style={{ backgroundColor: '#9ca3af', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>ยกเลิก</span>}
                    </td>
                    <td>{sch.require || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {sch.status === 'Completed' || sch.status === 'Cancelled' ? (
                          <button className="btn btn-sm btn-outline" onClick={() => onOpenDetails(sch)}>
                            รายละเอียด
                          </button>
                        ) : (
                          <>
                            <button className="btn btn-sm btn-primary" onClick={() => onOpenUpdate(sch)}>
                              บันทึก PM
                            </button>
                            <button className="btn btn-sm" style={{ backgroundColor: '#f59e0b', color: '#fff', border: 'none' }} onClick={() => onOpenEdit(sch)}>
                              เลื่อนแผน
                            </button>
                            <button className="btn btn-sm" style={{ backgroundColor: '#6b7280', color: '#fff', border: 'none' }} onClick={() => onCancelClick(sch._id)}>
                              ยกเลิก
                            </button>
                          </>
                        )}
                        <button className="btn btn-sm" style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none' }} onClick={() => onDeleteClick(sch._id)}>
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
  );
};

export default PlanListTable;