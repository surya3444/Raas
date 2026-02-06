import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from "firebase/firestore";
import { db } from '../firebase';
import { ChevronLeft } from 'lucide-react';
import MapCanvas from '../components/project/MapCanvas';
import MilestoneList from '../components/project/MilestoneList';
import CustomerList from '../components/project/CustomerList';
import LayoutStatsChart from '../components/project/LayoutStatsChart';
import ProjectInfo from '../components/project/ProjectInfo'; // <--- New Import

const ProjectDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [layout, setLayout] = useState(null);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "layouts", id), (doc) => {
            if (doc.exists()) setLayout({ id: doc.id, ...doc.data() });
        });
        return () => unsub();
    }, [id]);

    if (!layout) return <div className="p-10 text-center text-gray-500">Loading Project...</div>;

    return (
        <div className="flex flex-col h-full w-full overflow-hidden bg-[#09090b]">
            
            {/* Toolbar */}
            <div className="h-14 border-b border-white/10 flex justify-between items-center px-6 bg-white/5 shrink-0 z-20">
                <button onClick={() => navigate('/static')} className="text-xs text-gray-400 hover:text-white flex items-center gap-2 font-bold transition">
                    <ChevronLeft size={16} /> Back to Dashboard
                </button>
                <h2 className="font-bold text-white text-sm tracking-wide">{layout.name}</h2>
                <div className="w-20"></div>
            </div>

            {/* Main Content */}
            <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden min-h-0 relative">
                
                {/* Left Panel: Scrollable */}
                <div className="col-span-12 lg:col-span-7 h-full overflow-y-auto p-6 gap-6 flex flex-col border-r border-white/10 custom-scrollbar pb-20">
                    
                    {/* Map */}
                    <div className="shrink-0">
                        <MapCanvas layout={layout} />
                    </div>
                    
                    {/* Stats & Milestones Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0">
                         {/* Stats Chart */}
                         <div className="glass-panel p-4 flex flex-col justify-center min-h-[180px]">
                            <LayoutStatsChart elements={layout.elements || []} />
                        </div>
                        {/* Milestones */}
                        <div className="shrink-0">
                            <MilestoneList layout={layout} />
                        </div>
                    </div>

                    {/* NEW: Project Info (Address, Link, Docs) at the BOTTOM */}
                    <div className="shrink-0">
                        <ProjectInfo layout={layout} />
                    </div>
                </div>

                {/* Right Panel: Customer List */}
                <div className="col-span-12 lg:col-span-5 h-full bg-[#0e0e10] flex flex-col border-l border-white/5 overflow-hidden">
                    <CustomerList layout={layout} />
                </div>
            </div>
        </div>
    );
};

export default ProjectDetailsPage;