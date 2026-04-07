

const History = () => {
  return (
    <div className="page active animate-in fade-in">
      <div className="filter-bar">
        <select className="form-control" style={{width:'auto'}}><option value="">ทุกกลุ่ม</option><option>PRINTER</option></select>
        <select className="form-control" style={{width:'auto'}}><option value="">ทุก Zone</option><option>B1</option></select>
        <input type="date" className="form-control" style={{width:'auto'}} defaultValue="2025-02-01" />
        <span className="text-sm text-gray">ถึง</span>
        <input type="date" className="form-control" style={{width:'auto'}} defaultValue="2025-02-28" />
        <input type="text" placeholder="ค้นหาชื่ออุปกรณ์..." className="form-control" style={{width:'180px'}} />
        <button className="btn btn-outline btn-sm">ค้นหา</button>
        <button className="btn btn-success btn-sm">Export Excel</button>
      </div>
      
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>No</th><th>วันที่ PM</th><th>กลุ่ม</th><th>ชนิด</th><th>SN อุปกรณ์</th><th>ชื่ออุปกรณ์</th><th>Zone</th><th>ช่างเทคนิค</th><th>ค่าใช้จ่าย</th><th>หมายเหตุ</th></tr></thead>
            <tbody>
              <tr>
                <td>1</td><td>03/02/68</td><td>PRINTER</td><td>LASER</td><td>CNBKL4X717</td>
                <td style={{fontWeight:600, color:'var(--navy-light)'}}>PT.MTS004069</td>
                <td>B1</td><td>ช่างสมชาย</td><td style={{fontFamily:'IBM Plex Mono', fontWeight:600}}>฿300</td><td>ทำความสะอาด</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center" style={{paddingTop:'10px',marginTop:'8px',borderTop:'1px solid var(--gray-100)'}}>
          <span className="text-sm text-gray">รวม 14 รายการ</span>
          <span className="text-sm" style={{fontWeight:600, color:'var(--gray-800)'}}>
            รวมค่าใช้จ่าย: 
          </span>
        </div>
      </div>
    </div>
  );
};

export default History;