import { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const Report = () => {
  const [activeTab, setActiveTab] = useState('cost');
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (activeTab === 'cost' && chartRef.current) {
      if (chartInstance.current) chartInstance.current.destroy();
      chartInstance.current = new Chart(chartRef.current, {
        type: 'bar',
        data: {
          labels: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.'],
          datasets: [{ label: 'ค่าใช้จ่าย', data: [1200, 5400, 3000, 800], backgroundColor: '#38B2AC' }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }
  }, [activeTab]);

  return (
    <div className="page active animate-in fade-in">
      <div className="tabs">
        <div className={`tab ${activeTab === 'cost' ? 'active' : ''}`} onClick={() => setActiveTab('cost')}>ค่าใช้จ่าย</div>
        <div className={`tab ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>สรุปผล PM</div>
      </div>

      {activeTab === 'cost' && (
        <div id="report-cost">
          <div className="row3">
            <div className="cost-card">
              <div className="cost-amount">฿300</div>
              <div className="cost-label">PRINTER / เครื่อง / ครั้ง</div>
              <div className="cost-detail"><strong>21 เครื่อง → ฿25,200/ปี</strong></div>
            </div>
            <div className="cost-card">
              <div className="cost-amount">฿400</div>
              <div className="cost-label">NETWORK / เครื่อง / ครั้ง</div>
              <div className="cost-detail"><strong>5 เครื่อง → ฿8,000/ปี</strong></div>
            </div>
            <div className="cost-card">
              <div className="cost-amount">฿500</div>
              <div className="cost-label">COMPUTER / เครื่อง / ครั้ง</div>
              <div className="cost-detail"><strong>11 เครื่อง → ฿11,000/ปี</strong></div>
            </div>
          </div>

          <div className="card mb-14" style={{background:'linear-gradient(135deg,#EBF8FF,#F0FFF4)', borderColor:'#BEE3F8'}}>
            <div className="flex items-center justify-between">
              <div>
                <div style={{fontSize:'12px', color:'var(--gray-500)', fontWeight:500}}>ค่าใช้จ่าย PM รวมทั้งปี (ประมาณการ)</div>
                <div style={{fontSize:'28px', fontWeight:700, color:'var(--navy)', fontFamily:'IBM Plex Mono', marginTop:'4px'}}>฿44,200</div>
              </div>
              <button className="btn btn-success btn-sm">Export Excel</button>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">สรุปค่าใช้จ่าย PM รายเดือน</span>
            </div>
            <div style={{position:'relative', height:'200px'}}><canvas ref={chartRef}></canvas></div>
          </div>
        </div>
      )}

      {activeTab === 'summary' && (
        <div id="report-summary">
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>กลุ่มอุปกรณ์</th>
                    <th style={{textAlign:'center'}}>จำนวนเครื่องทั้งหมด</th>
                    <th style={{textAlign:'center'}}>PM ที่ทำแล้ว (เดือนนี้)</th>
                    <th style={{textAlign:'right'}}>ค่าใช้จ่ายรวม</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><span style={{display:'inline-block',width:'10px',height:'10px',background:'#2D8CF0',marginRight:'6px'}}></span>PRINTER</td>
                    <td style={{textAlign:'center'}}>21</td><td style={{textAlign:'center'}}>11</td>
                    <td style={{textAlign:'right', fontFamily:'IBM Plex Mono'}}>฿3,300</td>
                  </tr>
                  <tr style={{background:'var(--gray-50)', fontWeight:600, borderTop:'2px solid var(--gray-200)'}}>
                    <td>รวมทั้งหมด</td><td style={{textAlign:'center'}}>37</td><td style={{textAlign:'center'}}>14</td>
                    <td style={{textAlign:'right', color:'var(--navy)', fontSize:'14px', fontFamily:'IBM Plex Mono'}}>฿5,400</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Report;