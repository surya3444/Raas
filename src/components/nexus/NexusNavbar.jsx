import React, { useState } from 'react';
import { useNexus } from '../../context/NexusContext';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, LogOut, Menu, X } from 'lucide-react';
import { deleteDoc, doc } from "firebase/firestore";
import { db } from '../../firebase';

const NexusNavbar = ({ title, isEditor, onViewChange, currentView }) => {
    const { isDummyMode, toggleDummy, panicMode, user } = useNexus();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = async () => {
        if (window.confirm("End Session?")) {
            try {
                if (user?.sessionId) {
                    await deleteDoc(doc(db, "sessions", user.sessionId));
                }
            } catch (e) {
                console.error("Logout cleanup error", e);
            }
            localStorage.removeItem('rajchavin_user');
            navigate('/');
        }
    };

    // Shared Controls Component (Used in both Desktop & Mobile views)
    const NavbarControls = ({ isMobile = false }) => (
        <div className={`flex ${isMobile ? 'flex-col items-start gap-4 p-4' : 'items-center gap-4'}`}>
            
            {/* 1. NORMAL MODE CONTROLS */}
            {!panicMode ? (
                <>
                    <div className={`flex items-center gap-2 ${!isMobile ? 'border-r border-white/10 pr-4 mr-2' : 'w-full justify-between bg-white/5 p-3 rounded-lg border border-white/5'}`}>
                        <span className="text-[10px] font-bold text-gray-500">DB MODE:</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={isDummyMode}
                                onChange={(e) => toggleDummy(e.target.checked)}
                            />
                            <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                            <span className={`ml-2 text-[10px] font-bold ${isDummyMode ? 'text-blue-400' : 'text-white'}`}>
                                {isDummyMode ? 'DUMMY' : 'REAL'}
                            </span>
                        </label>
                    </div>
                    
                    {/* Standard Logout Button */}
                    <button 
                        onClick={handleLogout}
                        className={`${isMobile ? 'w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-500 py-3 rounded-lg font-bold text-xs' : 'text-gray-400 hover:text-white hover:bg-white/5 p-2 rounded-lg transition'}`}
                        title="Logout"
                    >
                        <LogOut size={isMobile ? 16 : 18} /> {isMobile && "Logout"}
                    </button>
                </>
            ) : (
                /* 2. PANIC MODE CONTROLS */
                <button 
                    onClick={handleLogout}
                    className={`flex items-center gap-2 bg-red-900/20 hover:bg-red-900/40 text-red-500 px-3 py-1.5 rounded-lg text-[10px] font-bold transition border border-red-500/20 animate-pulse ${isMobile ? 'w-full justify-center py-3' : ''}`}
                >
                    <LogOut size={14} /> EMERGENCY LOGOUT
                </button>
            )}

            {/* 3. EDITOR SWITCHER */}
            {isEditor && (
                <div className={`flex bg-black/40 rounded-lg p-1 border border-white/10 ${!isMobile ? 'ml-2' : 'w-full grid grid-cols-2 mt-2'}`}>
                    <button 
                        onClick={() => { onViewChange('map'); if(isMobile) setIsMenuOpen(false); }} 
                        className={`px-3 py-1.5 rounded text-[10px] font-bold transition flex items-center justify-center ${currentView === 'map' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Map View
                    </button>
                    <button 
                        onClick={() => { onViewChange('grid'); if(isMobile) setIsMenuOpen(false); }} 
                        className={`px-3 py-1.5 rounded text-[10px] font-bold transition flex items-center justify-center ${currentView === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Grid View
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <nav className="h-16 border-b border-white/5 flex justify-between items-center px-4 md:px-6 bg-[#050505] shrink-0 z-30 relative shadow-md shadow-blue-900/5">
            <div className="flex items-center gap-3 md:gap-4">
                {isEditor && (
                    <button onClick={() => navigate('/nexus')} className="text-gray-400 hover:text-white transition">
                        <ChevronLeft size={20} />
                    </button>
                )}
                <div className="flex items-center gap-3">
                    <img 
                        src="/rajchavin-removebg-preview.png" 
                        alt="Rajchavin" 
                        className="h-8 md:h-10 w-auto object-contain transition hover:scale-105"
                    />
                    <div>
                        <h1 className="font-bold text-xs md:text-sm tracking-wide text-white">
                            DEVELOPER <span className="text-blue-500 font-normal">NEXUS</span>
                        </h1>
                        <p className="text-[8px] md:text-[9px] text-gray-500 font-mono tracking-wider uppercase truncate max-w-[150px]">{title}</p>
                    </div>
                </div>
            </div>

            {/* DESKTOP MENU (Hidden on Mobile) */}
            <div className="hidden md:block">
                <NavbarControls />
            </div>

            {/* MOBILE HAMBURGER (Visible on Mobile) */}
            <div className="md:hidden">
                <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)} 
                    className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition"
                >
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* MOBILE DROPDOWN MENU */}
            {isMenuOpen && (
                <div className="absolute top-16 left-0 w-full bg-[#0e0e10] border-b border-white/10 shadow-2xl z-50 animate-in slide-in-from-top-2 md:hidden">
                    <NavbarControls isMobile={true} />
                </div>
            )}
        </nav>
    );
};

export default NexusNavbar;