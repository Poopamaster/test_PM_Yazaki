import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// นำเข้า Layout หลักที่มี Sidebar และ Topbar
import MainLayout from './layouts/MainLayout';
// นำเข้าหน้าจอต่างๆ (Pages) ที่เราเพิ่งสร้าง
import Dashboard from './pages/DashboardPage';
import Equipment from './pages/EquipmentPage';
import Plan from './pages/planPMPage';
import Alert from './pages/AlertPage';
import History from './pages/HistoryPage';
import Report from './pages/ReportPage';
import Category from './pages/CategoryPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          {/* กำหนด Path ให้ตรงกับแต่ละหน้า */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="category" element={<Category />} />
          <Route path="master" element={<Equipment />} />
          <Route path="plan" element={<Plan />} />
          <Route path="alert" element={<Alert />} />
          <Route path="history" element={<History />} />
          <Route path="report" element={<Report />} />
          
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;