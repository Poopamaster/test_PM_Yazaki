import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const MainLayout = () => {
  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <Topbar />
        <div className="content">
          <Outlet /> {/* ตรงนี้คือพื้นที่ที่ Page ย่อยๆ จะมาแสดงผล */}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;