import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// นำเข้า Layout หลักที่มี Sidebar และ Topbar
import MainLayout from './layouts/MainLayout';
// นำเข้าหน้าจอต่างๆ (Pages) ที่เราเพิ่งสร้าง
import Dashboard from './pages/Dashboard';
import Equipment from './pages/Equipment';
import Plan from './pages/plan';
import Alert from './pages/Alert';
import History from './pages/History';
import Report from './pages/Report';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ครอบทุกหน้าด้วย MainLayout เพื่อให้มีเมนูด้านซ้ายและแถบด้านบนเสมอ */}
        <Route path="/" element={<MainLayout />}>
          
          {/* เมื่อผู้ใช้เข้ามาที่เว็บแบบไม่มี path (เช่น localhost:5173/) ให้เด้งไปหน้า /dashboard อัตโนมัติ */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          {/* กำหนด Path ให้ตรงกับแต่ละหน้า */}
          <Route path="dashboard" element={<Dashboard />} />
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