import { Link, Outlet } from 'react-router-dom';
import { Wrench, Monitor, Home } from 'lucide-react';

const Layout = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <nav className="bg-blue-900 text-white p-4 shadow-md">
                <div className="container mx-auto flex items-center justify-between">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <Wrench size={24} /> PM System
                    </h1>
                    <div className="flex gap-6">
                        <Link to="/" className="flex items-center gap-1 hover:text-blue-300"><Home size={18} /> Dashboard</Link>
                        <Link to="/equipments" className="flex items-center gap-1 hover:text-blue-300"><Monitor size={18} /> อุปกรณ์</Link>
                        <Link to="/schedules" className="flex items-center gap-1 hover:text-blue-300"><Wrench size={18} /> แผน PM</Link>
                    </div>
                </div>
            </nav>

            {/* ส่วนที่จะเปลี่ยนไปตามแต่ละหน้า (Pages) */}
            <main className="container mx-auto p-6">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;