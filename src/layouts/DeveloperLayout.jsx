import React from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { db } from '../firebase';
import { doc, deleteDoc } from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";

const DeveloperLayout = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('rajchavin_user'));

    if (!user || user.role !== 'developer') {
        return <Navigate to="/" replace />;
    }

    const handleLogout = async () => {
        const session = JSON.parse(localStorage.getItem('rajchavin_user'));
        localStorage.clear();
        sessionStorage.clear();
        const auth = getAuth();
        try { await signOut(auth); } catch(e){}
        if(session?.sessionId) {
            deleteDoc(doc(db, "sessions", session.sessionId)).catch(e=>console.warn(e));
        }
        window.location.href = '/';
    };

    return (
        // GLOBAL BACKGROUND: Dark Blue-Black (#0b0f19)
        <div className="flex flex-col h-screen bg-[#0b0f19] text-white overflow-hidden relative">
            
            {/* --- GLOBAL WATERMARK --- */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <img 
                    src="/rajchavin-removebg-preview.png" 
                    alt="Watermark" 
                    className="w-[40%] opacity-[0.03] grayscale invert-0" 
                />
            </div>

            {/* --- NAVBAR --- */}
            <nav className="h-16 border-b border-white/10 flex justify-between items-center px-6 bg-[#0b0f19]/80 backdrop-blur z-20 shrink-0 relative">
                <div className="flex items-center gap-3">
                    <img src="/rajchavin-removebg-preview.png" alt="Raj Chavin" className="h-10 w-auto object-contain" />
                    <div>
                        <p className="text-[15px] text-gray-500 font-mono">DEVELOPER SUITE</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-white">{user.name}</p>
                        <p className="text-[10px] text-blue-500">{user.planName || "Standard Plan"}</p>
                    </div>
                    <button onClick={handleLogout} className="bg-red-500/10 text-red-500 p-2 rounded-lg hover:bg-red-500/20 transition" title="Logout">
                        <LogOut size={18} />
                    </button>
                </div>
            </nav>

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 relative overflow-hidden h-full z-10">
                <Outlet context={{ user }} />
            </main>
        </div>
    );
};

export default DeveloperLayout;