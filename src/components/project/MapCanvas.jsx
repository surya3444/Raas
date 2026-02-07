import React, { useState, useRef, useEffect } from 'react';
import { updateDoc, doc } from "firebase/firestore";
import { db } from '../../firebase';
import { Maximize, Minimize, Plus, Minus, Upload, Map as MapIcon, RefreshCw, Move, X } from 'lucide-react';

const MapCanvas = ({ layout }) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    const containerRef = useRef(null);

    // Reset view when toggling fullscreen
    useEffect(() => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    }, [isFullscreen]);

    const handleZoom = (delta) => {
        setScale(prev => Math.min(Math.max(0.2, prev + delta), 5));
    };

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        setPosition({ x: e.clientX - startPos.x, y: e.clientY - startPos.y });
    };

    const handleMouseUp = () => setIsDragging(false);

    // --- TOUCH EVENTS ---
    const handleTouchStart = (e) => {
        if(e.touches.length === 1) {
            setIsDragging(true);
            const touch = e.touches[0];
            setStartPos({ x: touch.clientX - position.x, y: touch.clientY - position.y });
        }
    };

    const handleTouchMove = (e) => {
        if (!isDragging || e.touches.length !== 1) return;
        const touch = e.touches[0];
        setPosition({ x: touch.clientX - startPos.x, y: touch.clientY - startPos.y });
    };

    const handleUpload = (e) => {
        const file = e.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
            await updateDoc(doc(db, "layouts", layout.id), { bgImage: ev.target.result });
        };
        reader.readAsDataURL(file);
    };

    const resetView = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };

    // FIX: Increased z-index from z-50 to z-[9999] to cover global navbar
    const containerClass = isFullscreen 
        ? 'fixed inset-0 z-[9999] bg-[#09090b] flex flex-col h-screen w-screen' 
        : 'glass-panel p-4 flex flex-col relative overflow-hidden group h-[400px] transition-all duration-300';

    return (
        <div className={containerClass}>
            
            {/* 1. FLOATING CLOSE BUTTON (Only in Fullscreen) */}
            {/* FIX: Increased z-index from z-[60] to z-[10000] */}
            {isFullscreen && (
                <button 
                    onClick={() => setIsFullscreen(false)}
                    className="absolute top-40 right-4 z-[10000] bg-red-600/90 hover:bg-red-500 text-white p-2.5 rounded-full shadow-2xl backdrop-blur-sm transition-transform hover:scale-110 flex items-center justify-center border border-white/10"
                >
                    <X size={20} />
                </button>
            )}

            {/* Header / Controls (Visible in Normal Mode or as info bar in Fullscreen) */}
            <div className={`flex justify-between items-center z-20 relative shrink-0 ${isFullscreen ? 'p-4 bg-[#121214]/80 backdrop-blur absolute top-0 left-0 right-0 pointer-events-none' : 'mb-2'}`}>
                <h3 className="text-xs font-bold uppercase text-gray-500 flex items-center gap-2">
                    <MapIcon size={16} className="text-blue-500" /> 
                    {isFullscreen ? <span className="text-white shadow-black drop-shadow-md">{layout.name}</span> : 'Layout Plan'}
                </h3>
                
                <div className="flex gap-2 pointer-events-auto">
                    {!isFullscreen && (
                        <>
                            <label className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded text-[10px] font-bold transition cursor-pointer flex items-center gap-1 text-white">
                                <Upload size={12} /> Upload
                                <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
                            </label>
                            <button 
                                onClick={() => setIsFullscreen(true)} 
                                className="bg-black/50 hover:bg-blue-600 p-1.5 rounded text-white transition font-bold text-xs flex items-center gap-1"
                            >
                                <Maximize size={16}/>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Map Area */}
            <div 
                ref={containerRef}
                className={`flex-1 bg-[#121214] border border-white/5 relative overflow-hidden flex items-center justify-center cursor-move select-none touch-none ${!isFullscreen && 'rounded-lg'}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUp}
                onWheel={(e) => {
                    if(isFullscreen) handleZoom(e.deltaY * -0.001);
                }}
            >
                {layout.bgImage ? (
                    <div
                        style={{ 
                            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                        }}
                        className="origin-center will-change-transform"
                    >
                        <img 
                            src={layout.bgImage} 
                            className="max-w-none pointer-events-none shadow-2xl"
                            alt="Layout Map" 
                        />
                    </div>
                ) : (
                    <div className="text-center">
                        <p className="text-xs text-gray-600 mb-2">No layout plan uploaded.</p>
                        {!isFullscreen && <p className="text-[10px] text-gray-700">Use the Upload button to add an image.</p>}
                    </div>
                )}

                {/* Floating Controls (Bottom Right) */}
                <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-30 pointer-events-auto">
                    <button onClick={resetView} className="bg-black/60 backdrop-blur text-white p-3 rounded-full hover:bg-blue-600 transition shadow-lg border border-white/10" title="Reset View">
                        <RefreshCw size={20} />
                    </button>
                    <button onClick={() => handleZoom(0.2)} className="bg-black/60 backdrop-blur text-white p-3 rounded-full hover:bg-blue-600 transition shadow-lg border border-white/10" title="Zoom In">
                        <Plus size={20} />
                    </button>
                    <button onClick={() => handleZoom(-0.2)} className="bg-black/60 backdrop-blur text-white p-3 rounded-full hover:bg-blue-600 transition shadow-lg border border-white/10" title="Zoom Out">
                        <Minus size={20} />
                    </button>
                </div>

                {/* Helper Text (Top Left in Fullscreen) */}
                {isFullscreen && (
                    <div className="absolute top-16 left-4 bg-black/40 backdrop-blur px-3 py-1.5 rounded-full pointer-events-none z-20">
                        <p className="text-[10px] text-white flex items-center gap-2">
                            <Move size={12} /> Drag to Pan • Buttons to Zoom
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MapCanvas;