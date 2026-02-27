import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from '../../firebase';
import { useNexus } from '../../context/NexusContext'; 

import MapCanvas from '../../components/nexus/map/MapCanvas';
import MapToolbar from '../../components/nexus/map/MapToolbar';
import NewElementModal from '../../components/nexus/modals/NewElementModal';
import { ArrowLeft, Ruler, Loader2, CheckCircle2 } from 'lucide-react';

const NexusBlueprintEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    // --- CRITICAL FIX: Fetch dynamic collection instead of hardcoding "layouts" ---
    const { activeCollection } = useNexus(); 

    const [layout, setLayout] = useState(null);
    
    // Editor State
    const [tool, setTool] = useState('select');
    const [selectedId, setSelectedId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [pendingPoints, setPendingPoints] = useState(null); 

    useEffect(() => {
        if (!activeCollection || !id) return;

        const unsub = onSnapshot(doc(db, activeCollection, id), (docSnap) => {
            if (docSnap.exists()) {
                setLayout({ id: docSnap.id, ...docSnap.data() });
            } else {
                alert("Layout not found in current Database Mode.");
                navigate('/nexus');
            }
        });
        return () => unsub();
    }, [id, activeCollection, navigate]);

    // --- KEYBOARD SHORTCUTS (DELETE) ---
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
                handleDeleteElement();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedId, layout]); 

    // --- ACTIONS ---

    const handleMapUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
            const base64Image = ev.target.result;
            setLayout(prev => ({ ...prev, bgImage: base64Image }));
            setIsSaving(true);
            try {
                await updateDoc(doc(db, activeCollection, id), { bgImage: base64Image });
            } catch (error) {
                console.error("Error saving map:", error);
                alert("Failed to save map image.");
            }
            setIsSaving(false);
        };
        reader.readAsDataURL(file);
    };

    const handleDrawComplete = (drawData) => {
        setPendingPoints(drawData); 
    };

    const handleSaveElement = async (data) => {
        if (!layout) return;
        setIsSaving(true);
        
        try {
            // --- 1. HANDLE ASSIGNMENT TO EXISTING PLOT ---
            if (data.isUpdate) {
                const updatedElements = layout.elements.map(el => 
                    el.id === data.id ? data : el
                );
                await updateDoc(doc(db, activeCollection, id), { elements: updatedElements });
            } 
            
            // --- 2. HANDLE BRAND NEW PLOT OR INFRASTRUCTURE ---
            else {
                let newElement = {};
                const finalSize = data.size || data.dimensions || '';
    
                if (data.type === 'plot' || data.price || data.facing) {
                    newElement = {
                        id: data.id,
                        type: 'plot',
                        status: 'open',
                        points: data.points,
                        size: finalSize,             
                        facing: data.facing || '',   
                        price: data.price || '',     
                        createdAt: new Date().toISOString()
                    };
                } else {
                    newElement = {
                        id: `INF-${Date.now()}`,
                        type: 'infra',
                        name: data.name,
                        category: data.category,
                        points: data.points,
                        createdAt: new Date().toISOString()
                    };
                }
                await updateDoc(doc(db, activeCollection, id), { elements: arrayUnion(newElement) });
            }
    
            setPendingPoints(null); 
            setTool('select'); 
        } catch (e) {
            console.error(e);
            alert("Error saving element: " + e.message);
        }
        setIsSaving(false);
    };
    
    // --- DELETE HANDLER ---
    const handleDeleteElement = async () => {
        if (!selectedId || !layout) return;

        if(!window.confirm("Are you sure you want to delete this element?")) return;

        setIsSaving(true);
        try {
            const updatedElements = layout.elements.filter(el => el.id !== selectedId);
            
            await updateDoc(doc(db, activeCollection, id), { elements: updatedElements });
            
            setSelectedId(null); 
        } catch (e) {
            console.error(e);
            alert("Delete failed: " + e.message);
        }
        setIsSaving(false);
    };

    if (!layout) return <div className="bg-[#050505] h-screen flex items-center justify-center text-white"><Loader2 className="animate-spin text-blue-500" size={32}/></div>;

    return (
        <div className="h-screen w-screen bg-[#050505] flex flex-col overflow-hidden font-sans text-white">
            
            {/* Header */}
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

            {/* Workspace */}
            <div className="flex-1 relative overflow-hidden cursor-crosshair bg-[#0e0e10]">
                {/* Floating Toolbar */}
                <div className="absolute top-6 left-6 z-40">
                    <MapToolbar 
                        tool={tool} 
                        setTool={setTool} 
                        onUpload={handleMapUpload} 
                        selectedId={selectedId}     
                        onDelete={handleDeleteElement} 
                    />
                </div>
                
                {/* Canvas */}
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

            {/* Creation Modal */}
            {pendingPoints && (
                <NewElementModal 
                    points={pendingPoints}
                    layout={layout} // <-- ADDED: Pass layout data so modal can see unassigned plots
                    onSave={handleSaveElement}
                    onCancel={() => setPendingPoints(null)}
                />
            )}
        </div>
    );
};

export default NexusBlueprintEditor;