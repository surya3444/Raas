import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from '../../firebase';
import { useNexus } from '../../context/NexusContext';
import MapCanvas from '../../components/nexus/map/MapCanvas';
import MapToolbar from '../../components/nexus/map/MapToolbar';
import NewElementModal from '../../components/nexus/modals/NewElementModal';
import { ArrowLeft, Save, MousePointer2, Ruler, Loader2, CheckCircle2 } from 'lucide-react';

const NexusBlueprintEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { activeCollection } = useNexus();
    const [layout, setLayout] = useState(null);
    
    // Editor State
    const [tool, setTool] = useState('select');
    const [selectedId, setSelectedId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    
    // Drawing Workflow
    const [pendingPoints, setPendingPoints] = useState(null); 

    useEffect(() => {
        const unsub = onSnapshot(doc(db, activeCollection, id), (docSnap) => {
            if (docSnap.exists()) setLayout({ id: docSnap.id, ...docSnap.data() });
        });
        return () => unsub();
    }, [id, activeCollection]);

    // 1. Drawing Finished -> Open Unified Modal
    const handleDrawComplete = (pointsStr) => {
        setPendingPoints(pointsStr); 
    };

    // 2. Universal Save Handler (Handles both Plots & Infra)
    const handleSaveElement = async (data) => {
        if (!layout) return;
        setIsSaving(true);

        let newElement = {};

        if (data.type === 'plot') {
            newElement = {
                id: data.id,
                type: 'plot',
                status: 'open', // Default status for sellable units
                points: data.points,
                dimensions: data.dimensions,
                facing: data.facing,
                price: data.price,
                createdAt: new Date().toISOString()
            };
        } else {
            // Infrastructure (Roads, Parks, Amenities)
            newElement = {
                id: `INF-${Date.now()}`, // Auto-generate ID
                type: 'infra',
                name: data.name,
                category: data.category,
                points: data.points,
                createdAt: new Date().toISOString()
            };
        }

        try {
            await updateDoc(doc(db, activeCollection, id), { elements: arrayUnion(newElement) });
            setPendingPoints(null); 
            setTool('select'); // Reset to select mode after successful save
        } catch (e) {
            console.error(e);
            alert("Error saving element: " + e.message);
        }
        setIsSaving(false);
    };

    if (!layout) return <div className="bg-[#050505] h-screen flex items-center justify-center text-white"><Loader2 className="animate-spin text-blue-500" size={32}/></div>;

    return (
        <div className="h-screen w-screen bg-[#050505] flex flex-col overflow-hidden font-sans text-white">
            
            {/* --- PREMIUM HEADER --- */}
            <div className="h-16 bg-[#09090b]/90 backdrop-blur-md border-b border-white/10 flex justify-between items-center px-6 shrink-0 z-50">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate(`/nexus/view/${id}`)} className="text-slate-400 hover:text-white flex items-center gap-2 text-xs font-bold transition group">
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition"/> Exit Editor
                    </button>
                    <div className="h-6 w-px bg-white/10"></div>
                    <div>
                        <h1 className="text-white text-sm font-bold flex items-center gap-3">{layout.name}</h1>
                        <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-0.5 font-medium font-mono">
                            <span>ID: {layout.id}</span>
                            {layout.totalArea && <span className="flex items-center gap-1 border-l border-white/10 pl-3"><Ruler size={10}/> {layout.totalArea}</span>}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5 transition-all">
                        <div className={`w-2 h-2 rounded-full ${tool === 'select' ? 'bg-slate-500' : 'bg-blue-500 animate-pulse'}`}></div>
                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wide">
                            {tool === 'select' ? 'Select Mode' : `Drawing: ${tool}`}
                        </span>
                    </div>
                    <div className="text-emerald-500 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                        {isSaving ? <Loader2 size={12} className="animate-spin"/> : <CheckCircle2 size={12} />}
                        {isSaving ? "Syncing..." : "Auto-Save On"}
                    </div>
                </div>
            </div>

            {/* --- WORKSPACE --- */}
            <div className="flex-1 relative overflow-hidden cursor-crosshair bg-[#0e0e10]">
                {/* Floating Toolbar */}
                <div className="absolute top-6 left-6 z-40">
                    <MapToolbar tool={tool} setTool={setTool} />
                </div>
                
                {/* Canvas Engine */}
                <div className="absolute inset-0 z-0">
                    <MapCanvas 
                        layout={layout}
                        mode="edit"
                        tool={tool}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                        onDrawComplete={handleDrawComplete}
                    />
                </div>
            </div>

            {/* --- UNIFIED CREATION MODAL --- */}
            {pendingPoints && (
                <NewElementModal 
                    points={pendingPoints}
                    onSave={handleSaveElement}
                    onCancel={() => setPendingPoints(null)}
                />
            )}
        </div>
    );
};

export default NexusBlueprintEditor;