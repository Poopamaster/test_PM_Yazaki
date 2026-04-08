import React from 'react';

const PlanGanttTable = ({ 
  loading, 
  ganttData, 
  filterYear, 
  onOpenUpdate 
}) => {
  return (
    <div className="tab-content">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">แผน PM รายปี {filterYear}</h3>
          <div className="legend">
            <span className="legend-item"><span className="dot dot-done"></span>เสร็จแล้ว</span>
            <span className="legend-item"><span className="dot dot-pending"></span>รอทำ</span>
            <span className="legend-item"><span className="dot dot-overdue"></span>เลยกำหนด</span>
          </div>
        </div>
        <div className="table-responsive">
          <table className="data-table gantt-table">
            <thead>
              <tr>
                <th>อุปกรณ์ (SN)</th><th>Zone</th>
                {['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'].map(m => <th key={m} className="text-center">{m}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="14" className="text-center p-4">กำลังโหลดข้อมูล...</td></tr>
              ) : ganttData.length === 0 ? (
                <tr><td colSpan="14" className="text-center p-4 text-gray">ไม่มีข้อมูลแผน PM ในเงื่อนไขที่เลือก</td></tr>
              ) : (
                ganttData.map((row) => (
                  <tr key={row.sn}>
                    <td className="font-mono font-medium">{row.sn}</td>
                    <td className="text-gray text-sm">{row.zone}</td>
                    {row.months.map((sch, index) => {
                      if (!sch) return <td key={index}></td>;
                      return (
                        <td 
                          key={index} 
                          className="text-center" 
                          onClick={() => onOpenUpdate(sch)} 
                          style={{ cursor: 'pointer' }}
                        >
                          {sch.status === 'Completed' && <span className="g-cell g-done">✓</span>}
                          {sch.status === 'Overdue' && <span className="g-cell g-overdue">!</span>}
                          {(sch.status === 'Pending' || !sch.status) && <span className="g-cell g-pending"></span>}
                        </td>
                      )
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PlanGanttTable;