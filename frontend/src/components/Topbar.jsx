import { useLocation } from 'react-router-dom';

const Topbar = () => {
  const location = useLocation();
  
  // แปลง Path เป็นชื่อหน้า
  const getPageTitle = () => {
    switch(location.pathname) {
      case '/dashboard': return 'Dashboard';
      case '/master': return 'Master อุปกรณ์';
      case '/plan': return 'วางแผน PM';
      case '/alert': return 'แจ้งเตือน (Alert)';
      case '/history': return 'ประวัติ PM';
      case '/report': return 'รายงาน & Export';
      default: return 'PM System';
    }
  };

  const today = new Date().toLocaleDateString('th-TH', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="topbar-title">{getPageTitle()}</div>
        <span className="text-sm text-gray">— ระบบบำรุงรักษาเชิงป้องกัน</span>
      </div>
      <div className="topbar-right">
        <span className="text-sm text-gray">วันที่: <span>{today}</span></span>
      </div>
    </div>
  );
};

export default Topbar;