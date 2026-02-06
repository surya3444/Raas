import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from '../../firebase';
import { useNexus } from '../../context/NexusContext';
import MapCanvas from '../../components/nexus/map/MapCanvas';
import MapToolbar from '../../components/nexus/map/MapToolbar';
import InspectorPanel from '../../components/nexus/map/InspectorPanel';
import InteractiveGrid from '../../components/interactive/InteractiveGrid';
import NexusNavbar from '../../components/nexus/NexusNavbar';

const NexusEditor = () => {
    const { id } = useParams();
    const { activeCollection } = useNexus();
    const [layout, setLayout] = useState(null);
    const [viewMode, setViewMode] = useState('map'); 
    const [selectedId, setSelectedId] = useState(null);
    const [tool, setTool] = useState('select'); 

    useEffect(() => {
        const unsub = onSnapshot(doc(db, activeCollection, id), (docSnap) => {
            if (docSnap.exists()) setLayout({ id: docSnap.id, ...docSnap.data() });
        });
        return () => unsub();
    }, [id, activeCollection]);

    if (!layout) return <div className="flex h-screen items-center justify-center text-gray-500 bg-[#050505]">Loading Nexus Engine...</div>;

    // --- Actions ---
    const handleElementCreate = async (newElement) => {
        await updateDoc(doc(db, activeCollection, id), { elements: arrayUnion(newElement) });
    };

    const handleUpdateElement = async (updatedElement) => {
        const updatedElements = layout.elements.map(e => e.id === updatedElement.id ? updatedElement : e);
        await updateDoc(doc(db, activeCollection, id), { elements: updatedElements });
        setSelectedId(null);
    };

    const handleDeleteElement = async (elementId) => {
        const updatedElements = layout.elements.filter(e => e.id !== elementId);
        await updateDoc(doc(db, activeCollection, id), { elements: updatedElements });
        setSelectedId(null);
    };

    return (
        // FIX: Changed h-full to h-screen to force full viewport height
        <div className="flex flex-col h-screen w-screen bg-[#050505] overflow-hidden"> 
            
            <NexusNavbar title={layout.name} isEditor={true} onViewChange={setViewMode} currentView={viewMode} />

            {/* Main Workspace */}
            <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-0 overflow-hidden min-h-0 relative">
                
                {/* LEFT: EDITOR CANVAS */}
                <div className="col-span-12 lg:col-span-9 flex flex-col h-full relative bg-[#0e0e10] border-r border-white/10 overflow-hidden">
                    
                    {viewMode === 'map' ? (
                        <>
                            {/* Toolbar */}
                            <MapToolbar tool={tool} setTool={setTool} />
                            
                            {/* Canvas Wrapper - Explicit Full Size */}
                            <div className="absolute inset-0 w-full h-full z-0">
                                <MapCanvas 
                                    layout={layout} 
                                    tool={tool} 
                                    selectedId={selectedId}
                                    onSelect={setSelectedId}
                                    onDrawComplete={handleElementCreate} 
                                />
                            </div>
                        </>
                    ) : (
                        // Grid View Wrapper
                        <div className="h-full w-full overflow-hidden flex flex-col">
                            <InteractiveGrid layout={layout} />
                        </div>
                    )}
                </div>

                {/* RIGHT: INSPECTOR */}
                <div className="col-span-12 lg:col-span-3 bg-[#050505] border-l border-white/10 h-full overflow-y-auto custom-scrollbar z-10">
                    <InspectorPanel 
                        layout={layout}
                        selectedId={selectedId} 
                        onUpdate={handleUpdateElement}
                        onDelete={handleDeleteElement}
                        onClose={() => setSelectedId(null)}
                    />
                </div>
            </div>
        </div>
    );
};

export default NexusEditor;