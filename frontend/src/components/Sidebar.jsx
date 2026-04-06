import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">
          <div className="brand-icon">PM</div>
          <div className="brand-text">
            <div className="title">PM System</div>
            <div className="sub">Preventive Maintenance</div>
          </div>
        </div>
      </div>
      
      <div className="nav-group">
        <div className="nav-label">MAIN MENU</div>
        
        <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <svg className="ni" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>
          Dashboard
        </NavLink>
        
        <NavLink to="/master" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <svg className="ni" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 8h6M5 11h4"/><path d="M5 5h6" strokeWidth="1.5"/></svg>
          Master อุปกรณ์
        </NavLink>
        
        <NavLink to="/plan" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <svg className="ni" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 2v3M11 2v3M2 7h12"/></svg>
          วางแผน PM
        </NavLink>
        
        <NavLink to="/alert" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <svg className="ni" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 1l1.5 4h4l-3 2.5 1 4L8 9l-3.5 2.5 1-4L2.5 5h4z"/></svg>
          แจ้งเตือน (Alert)
          <span className="nav-badge">3</span>
        </NavLink>
        
        <NavLink to="/history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <svg className="ni" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v3.5l2.5 1.5"/></svg>
          ประวัติ PM
        </NavLink>
        
        <NavLink to="/report" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <svg className="ni" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 12l4-4 3 3 5-6"/><rect x="1" y="1" width="14" height="14" rx="2"/></svg>
          รายงาน & Export
        </NavLink>
      </div>
      
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar">AD</div>
          <div className="user-info">
            <div className="name">Admin IT</div>
            <div className="role">System Administrator</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;