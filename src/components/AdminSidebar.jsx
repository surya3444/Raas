import React from 'react';
import { NavLink } from 'react-router-dom';
import { Users, Crown, LogOut } from 'lucide-react';
import { db } from '../firebase'; // Ensure this path is correct
import { doc, deleteDoc } from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth"; // <--- NEW IMPORT

const AdminSidebar = () => {
    
    const handleLogout = async (e) => {
        e.preventDefault();
        console.log("Starting Logout Process...");

        // 1. CLEAR LOCAL STORAGE
        const session = JSON.parse(localStorage.getItem('rajchavin_user'));
        localStorage.removeItem('rajchavin_user');
        sessionStorage.clear();

        // 2. SIGN OUT OF FIREBASE (Crucial for "Cookie" cleanup)
        try {
            const auth = getAuth();
            await signOut(auth);
            console.log("Firebase Auth Signed Out");
        } catch (error) {
            console.warn("Firebase SignOut Warning:", error);
        }

        // 3. CLEANUP DB SESSION (Fire & Forget)
        if(session?.sessionId && session.sessionId !== 'master') {
            try {
                await deleteDoc(doc(db, "sessions", session.sessionId));
            } catch(err) {
                console.warn("DB Cleanup Warning:", err);
            }
        }

        // 4. FORCE HARD REDIRECT
        window.location.href = "/";
    };

    const navClass = ({ isActive }) => 
        `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition font-medium ${
            isActive ? 'bg-brand text-white' : 'text-gray-400 hover:bg-white/5'
        }`;

    return (
        <aside className="w-64 glass-sidebar flex flex-col justify-between z-20 h-screen shrink-0">
            <div>
                <div className="h-16 flex items-center px-6 border-b border-[#27272a] gap-3">
                    <img 
                        src="/rajchavin-removebg-preview.png" 
                        alt="Raj Chavin" 
                        className="h-10 w-auto object-contain" 
                    />
                    <div>
                        
                        <span className="text-[15px] text-gray-500 font-mono">ADMIN CONSOLE</span>
                    </div>
                </div>
                
                <nav className="p-4 space-y-1">
                    <NavLink to="/admin/developers" className={navClass}>
                        <Users size={18} /> Developers
                    </NavLink>
                    <NavLink to="/admin/plans" className={navClass}>
                        <Crown size={18} /> Plans & Pricing
                    </NavLink>
                </nav>
            </div>

            <div className="p-4 border-t border-[#27272a]">
                <button 
                    type="button" 
                    onClick={handleLogout} 
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition font-bold cursor-pointer"
                >
                    <LogOut size={16} /> Logout System
                </button>
            </div>
        </aside>
    );
};

export default AdminSidebar;