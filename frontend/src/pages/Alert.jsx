import { useState } from 'react';

const Alert = () => {
  const [activeTab, setActiveTab] = useState('all');

  return (
    <div className="page active animate-in fade-in">
      <div className="tabs">
        <div className={`tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>ทั้งหมด (17)</div>
        <div className={`tab ${activeTab === 'overdue' ? 'active' : ''}`} onClick={() => setActiveTab('overdue')}>เลยกำหนด (3)</div>
        <div className={`tab ${activeTab === 'soon' ? 'active' : ''}`} onClick={() => setActiveTab('soon')}>ครบกำหนดใน 30 วัน (14)</div>
      </div>
      
      <div id="alert-list">
        {/* ตัวอย่าง Alert สีแดง */}
        {(activeTab === 'all' || activeTab === 'overdue') && (
          <div className="alert-card overdue">
            <div className="alert-card-icon" style={{background:'var(--red-light)', color:'var(--red)'}}>
              <svg fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth="1.5"><path d="M10 2L2 16h16L10 2z"/><path d="M10 7v4M10 13v.5" strokeLinecap="round"/></svg>
            </div>
            <div className="alert-card-body">
              <div className="alert-card-title">PT.MTS004069 — เลยกำหนด PM</div>
              <div className="alert-card-detail">PRINTER | LASER | HP M706N | Zone B1 <span style={{margin:'0 6px'}}>•</span> กำหนด: 03/05/68</div>
            </div>
            <div className="alert-card-actions">
              <span className="badge badge-red">เลยกำหนด 14 วัน</span>
              <button className="btn btn-primary btn-sm">บันทึก PM ทันที</button>
            </div>
          </div>
        )}

        {/* ตัวอย่าง Alert สีส้ม */}
        {(activeTab === 'all' || activeTab === 'soon') && (
          <div className="alert-card pending">
            <div className="alert-card-icon" style={{background:'var(--orange-light)', color:'var(--orange)'}}>
              <svg fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth="1.5"><circle cx="10" cy="10" r="8"/><path d="M10 6v4.5l2.5 1.5"/></svg>
            </div>
            <div className="alert-card-body">
              <div className="alert-card-title">OKI 395_PE1 — ใกล้ถึงกำหนด PM</div>
              <div className="alert-card-detail">PRINTER | DOTMATRIX | OKI 395 | Zone B1 <span style={{margin:'0 6px'}}>•</span> กำหนด: 06/05/68</div>
            </div>
            <div className="alert-card-actions">
              <span className="badge badge-orange">รอทำ</span>
              <button className="btn btn-outline btn-sm">บันทึก PM</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alert;