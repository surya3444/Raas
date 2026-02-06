import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';

const AdminHeader = () => {
    const location = useLocation();
    const title = location.pathname.includes('plans') ? 'Subscription Plans' : 'Overview';
    
    return (
        // Updated background color to match the new slight blue tint with transparency
        <header className="h-16 border-b border-[#27272a] flex justify-between items-center px-8 bg-[#0c0e1c]/80 backdrop-blur z-10 shrink-0">
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="opacity-50">/</span><span className="text-white font-medium">{title}</span>
            </div>
            <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-mono text-gray-400">SECURE CONNECTION</span>
            </div>
        </header>
    );
};

const AdminLayout = () => {
    // SECURITY CHECK: If no user, kick them out immediately
    const user = JSON.parse(localStorage.getItem('rajchavin_user'));
    
    if (!user) {
        return <Navigate to="/" replace />;
    }

    return (
        // Changed main background color to a slight bluish-black (#0c0e1c)
        <div className="flex h-screen bg-[#0c0e1c] relative overflow-hidden">
            
            {/* --- SUBTLE BACKGROUND LOGO --- */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <img 
                    src="/rajchavin-removebg-preview.png" 
                    alt="Background Watermark" 
                    className="w-[40%] opacity-[0.03] grayscale invert-0" // Very subtle opacity (3%)
                />
            </div>

            {/* Sidebar (z-10 to stay above background) */}
            <div className="relative z-10 h-full">
                <AdminSidebar />
            </div>
            
            {/* Main Content (z-10 to stay above background) */}
            <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
                <AdminHeader />
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;