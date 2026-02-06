import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useOutletContext } from 'react-router-dom';
import { db } from '../firebase';
import StatsGrid from '../components/dashboard/StatsGrid';
import ProjectGrid from '../components/dashboard/ProjectGrid';
import ChartsSection from '../components/dashboard/ChartsSection';
import CreateLayoutModal from '../components/modals/CreateLayoutModal';
import { Plus } from 'lucide-react';

const DashboardPage = () => {
    const { user } = useOutletContext(); 
    
    const [layouts, setLayouts] = useState([]);
    const [isModalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "layouts"), where("devId", "==", user.id));
        const unsub = onSnapshot(q, (snap) => {
            setLayouts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, [user]);

    // --- 1. CALCULATE GLOBAL USAGE ---
    const totalPlotsUsed = layouts.reduce((sum, layout) => sum + (layout.elements?.length || 0), 0);

    if (!user) return null;

    return (
        <div className="h-full overflow-y-auto p-6 flex flex-col gap-8 custom-scrollbar">
            
            <div className="flex justify-between items-end order-1 md:order-2 shrink-0">
                <h2 className="text-lg font-bold text-white">Your Layouts</h2>
                <button 
                    onClick={() => setModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition"
                >
                    <Plus size={16} /> Create Layout
                </button>
            </div>

            <div className="order-1 md:order-2 shrink-0">
                <ProjectGrid layouts={layouts} />
            </div>

            <div className="order-2 md:order-1 shrink-0">
                <StatsGrid layouts={layouts} limits={user.limits || {}} />
            </div>

            <div className="order-3 shrink-0 pb-10">
                <ChartsSection layouts={layouts} />
            </div>

            {isModalOpen && (
                <CreateLayoutModal 
                    user={user} 
                    currentLayoutCount={layouts.length}
                    currentTotalPlots={totalPlotsUsed} // <--- 2. PASS TO MODAL
                    onClose={() => setModalOpen(false)} 
                />
            )}
        </div>
    );
};

export default DashboardPage;