import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useOutletContext } from 'react-router-dom';
import { db } from '../firebase';
import { Plus } from 'lucide-react';

// Reuse existing dashboard components (Modular!)
import StatsGrid from '../components/dashboard/StatsGrid';
import ProjectGrid from '../components/dashboard/ProjectGrid';
import ChartsSection from '../components/dashboard/ChartsSection';

// New Modals
import CreateInteractiveModal from '../components/modals/CreateInteractiveModal';

const InteractivePage = () => {
    const { user } = useOutletContext();
    const [layouts, setLayouts] = useState([]);
    const [isModalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        if (!user) return;
        // Filter specifically for interactive layouts if you distinguish them, 
        // otherwise query all layouts for this developer
        const q = query(collection(db, "layouts"), where("devId", "==", user.id));
        const unsub = onSnapshot(q, (snap) => {
            setLayouts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, [user]);

    // Calculate total plots used for limit checking
    const totalPlotsUsed = layouts.reduce((sum, l) => sum + (l.elements?.length || 0), 0);

    return (
        <div className="h-full overflow-y-auto p-6 flex flex-col gap-8 custom-scrollbar">
            
            {/* Header */}
            <div className="flex justify-between items-end order-1 md:order-2 shrink-0">
                <div>
                    <h2 className="text-lg font-bold text-white">Interactive Grids</h2>
                    <p className="text-xs text-gray-500">Manage visual plot layouts</p>
                </div>
                <button 
                    onClick={() => setModalOpen(true)}
                    className="bg-brand hover:bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition"
                >
                    <Plus size={16} /> New Interactive Layout
                </button>
            </div>

            {/* Reuse Project Grid, but clicking navigates to /interactive/layout/:id */}
            <div className="order-1 md:order-2 shrink-0">
                {/* Note: We will update App.jsx to handle the routing difference */}
                <ProjectGrid layouts={layouts} linkPrefix="/interactive/layout" />
            </div>

            {/* Reuse Stats */}
            <div className="order-2 md:order-1 shrink-0">
                <StatsGrid layouts={layouts} limits={user.limits || {}} />
            </div>

            {/* Reuse Charts */}
            <div className="order-3 shrink-0 pb-10">
                <ChartsSection layouts={layouts} />
            </div>

            {/* Create Modal */}
            {isModalOpen && (
                <CreateInteractiveModal 
                    user={user} 
                    currentLayoutCount={layouts.length}
                    currentTotalPlots={totalPlotsUsed}
                    onClose={() => setModalOpen(false)} 
                />
            )}
        </div>
    );
};

export default InteractivePage;