import React, { useRef, useState, useEffect } from 'react';
import { Undo2, X, Check } from 'lucide-react';

const MapCanvas = ({ 
    layout, 
    mode = 'view', 
    tool = 'select', 
    selectedId, 
    onSelect, 
    onDrawComplete, 
    externalView, 
    onViewChange 
}) => {
    const containerRef = useRef(null);
    const svgRef = useRef(null);
    
    // View State
    const [internalView, setInternalView] = useState({ x: 0, y: 0, scale: 1 });
    const view = externalView || internalView;
    const setView = onViewChange || setInternalView;

    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Drawing State
    const [isDrawing, setIsDrawing] = useState(false);
    const [boxStart, setBoxStart] = useState(null); 
    const [penPoints, setPenPoints] = useState([]); 
    const [cursorPt, setCursorPt] = useState({ x: 0, y: 0 }); 
    const [liveArea, setLiveArea] = useState(0); 

    // Helper: Screen -> SVG
    const getSvgPoint = (clientX, clientY) => {
        const svg = svgRef.current;
        if (!svg) return { x: 0, y: 0 };
        const pt = svg.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        return pt.matrixTransform(svg.getScreenCTM().inverse());
    };

    // Helper: Calculate Area (Shoelace)
    const calculateArea = (points) => {
        if (points.length < 3) return 0;
        let area = 0;
        for (let i = 0; i < points.length; i++) {
            let j = (i + 1) % points.length;
            area += points[i].x * points[j].y;
            area -= points[j].x * points[i].y;
        }
        return Math.abs(area / 2);
    };

    // Wheel Zoom
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const handleWheel = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const delta = -e.deltaY * 0.001;
            setView(prev => ({ ...prev, scale: Math.min(Math.max(0.1, prev.scale + delta), 10) }));
        };
        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, [setView]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKey = (e) => {
            if (mode !== 'edit') return;
            if (e.key === 'Escape') cancelDrawing();
            if (e.key === 'Enter') { e.preventDefault(); finishDrawing(); }
            if ((e.key === 'z' && (e.metaKey || e.ctrlKey)) || e.key === 'Backspace') {
                if (tool === 'pen' && penPoints.length > 0) {
                    setPenPoints(prev => prev.slice(0, -1));
                }
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [mode, tool, penPoints, isDrawing]);

    // Actions
    const cancelDrawing = () => {
        setPenPoints([]);
        setBoxStart(null);
        setIsDrawing(false);
        setLiveArea(0);
    };

    const finishDrawing = () => {
        if (tool === 'pen' && penPoints.length >= 3) {
            const pointsStr = penPoints.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
            onDrawComplete(pointsStr); 
            cancelDrawing();
        }
    };

    // Mouse Handlers
    const handleMouseDown = (e) => {
        if (e.target.closest('button')) return;
        if (e.target.tagName === 'polygon' && tool === 'select') return; 

        const pt = getSvgPoint(e.clientX, e.clientY);

        if (tool === 'select') {
            setIsDragging(true);
            setDragStart({ x: e.clientX - view.x, y: e.clientY - view.y });
        } else if (tool === 'box') {
            setIsDrawing(true);
            setBoxStart(pt);
            setCursorPt(pt);
            setLiveArea(0);
        } else if (tool === 'pen') {
            setPenPoints(prev => [...prev, pt]);
            setIsDrawing(true);
        }
    };

    const handleMouseMove = (e) => {
        const pt = getSvgPoint(e.clientX, e.clientY);
        setCursorPt(pt);

        if (isDragging) {
            setView(prev => ({ ...prev, x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }));
            return;
        }

        if (isDrawing) {
            if (tool === 'box' && boxStart) {
                const w = Math.abs(boxStart.x - pt.x);
                const h = Math.abs(boxStart.y - pt.y);
                setLiveArea(w * h);
            } else if (tool === 'pen' && penPoints.length > 0) {
                // Live preview area
                setLiveArea(calculateArea([...penPoints, pt]));
            }
        }
    };

    const handleMouseUp = (e) => {
        if (isDragging) setIsDragging(false);
        
        if (tool === 'box' && isDrawing && boxStart) {
            const dx = Math.abs(boxStart.x - cursorPt.x);
            const dy = Math.abs(boxStart.y - cursorPt.y);
            if (dx > 5 && dy > 5) { 
                const x = Math.min(boxStart.x, cursorPt.x);
                const y = Math.min(boxStart.y, cursorPt.y);
                onDrawComplete(`${x},${y} ${x+dx},${y} ${x+dx},${y+dy} ${x},${y+dy}`);
            }
            cancelDrawing();
        }
    };

    const handleDoubleClick = () => {
        if (tool === 'pen') finishDrawing();
    };

    return (
        <div 
            ref={containerRef}
            className={`w-full h-full overflow-hidden bg-[#0e0e10] relative select-none ${tool === 'select' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onDoubleClick={handleDoubleClick}
        >
            <div style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`, transformOrigin: '0 0', transition: isDragging ? 'none' : 'transform 0.1s ease-out' }} className="absolute top-0 left-0">
                {layout?.bgImage ? <img src={layout.bgImage} className="pointer-events-none" style={{ maxWidth: 'none' }} alt="Blueprint" /> : <div className="w-[3000px] h-[3000px] bg-white/5 border border-white/10 flex items-center justify-center text-gray-700 font-bold text-4xl">NO BLUEPRINT</div>}

                <svg ref={svgRef} className="absolute top-0 left-0 w-full h-full overflow-visible" width="100%" height="100%">
                    
                    {/* RENDER ELEMENTS */}
                    {(layout?.elements || []).map((el, i) => {
                        // --- SAFETY CHECK: Skip elements without points to prevent crash ---
                        if (!el.points) return null;

                        const isInfra = el.type === 'infra';
                        let styleClass = '';

                        if (isInfra) {
                            if (el.category === 'Road') styleClass = 'fill-gray-500/40 stroke-gray-500';
                            else if (el.category === 'Park') styleClass = 'fill-emerald-500/40 stroke-emerald-500';
                            else styleClass = 'fill-purple-500/40 stroke-purple-500';
                        } else {
                            if (el.status === 'sold') styleClass = 'fill-green-500/40 stroke-green-400';
                            else if (el.status === 'booked') styleClass = 'fill-yellow-500/40 stroke-yellow-400';
                            else styleClass = 'fill-blue-500/10 stroke-blue-400/50';
                        }
                        
                        // Safe text positioning
                        const firstPoint = el.points.split(' ')[0] || "0,0";
                        const [tx, ty] = firstPoint.split(',');

                        return (
                            <g key={i} onClick={(e) => { if(tool === 'select') { e.stopPropagation(); onSelect(el.id); } }}>
                                <polygon points={el.points} vectorEffect="non-scaling-stroke" className={`transition-all duration-200 ${tool === 'select' ? 'cursor-pointer hover:stroke-white hover:fill-white/20' : ''} ${styleClass} ${selectedId === el.id ? 'stroke-white stroke-[2px] fill-white/30' : 'stroke-[1px]'}`} />
                                {view.scale > 0.5 && <text x={tx} y={ty} fill="white" fontSize={isInfra ? "14" : "12"} fontWeight="bold" dx="4" dy="14" pointerEvents="none" style={{ textShadow: '0 1px 2px black' }}>{isInfra ? el.name : el.id}</text>}
                            </g>
                        );
                    })}

                    {/* DRAWING PREVIEW */}
                    {isDrawing && (
                        <g>
                            {tool === 'box' && boxStart && (
                                <>
                                    <rect x={Math.min(boxStart.x, cursorPt.x)} y={Math.min(boxStart.y, cursorPt.y)} width={Math.abs(boxStart.x - cursorPt.x)} height={Math.abs(boxStart.y - cursorPt.y)} className="fill-blue-500/20 stroke-blue-400 stroke-[2px] stroke-dashed" vectorEffect="non-scaling-stroke" />
                                    <text x={cursorPt.x} y={cursorPt.y - 10} fill="#22d3ee" fontSize="14" fontWeight="bold" style={{textShadow:'0 2px 4px black'}}>{Math.round(liveArea)} sq.ft</text>
                                </>
                            )}
                            {tool === 'pen' && penPoints.length > 0 && (
                                <>
                                    {/* Real-time blue fill */}
                                    <polygon points={[...penPoints, cursorPt].map(p => `${p.x},${p.y}`).join(' ')} className="fill-blue-500/20 stroke-none" />
                                    <polyline points={penPoints.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#60a5fa" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                                    <line x1={penPoints[penPoints.length-1].x} y1={penPoints[penPoints.length-1].y} x2={cursorPt.x} y2={cursorPt.y} stroke="#60a5fa" strokeWidth="2" strokeDasharray="5,5" vectorEffect="non-scaling-stroke" />
                                    <line x1={cursorPt.x} y1={cursorPt.y} x2={penPoints[0].x} y2={penPoints[0].y} stroke="#60a5fa" strokeWidth="1" strokeDasharray="2,2" strokeOpacity="0.5" vectorEffect="non-scaling-stroke" />
                                    {penPoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={4 / view.scale} fill="#fff" stroke="#3b82f6" strokeWidth="1" />)}
                                    <text x={cursorPt.x + 15} y={cursorPt.y} fill="#22d3ee" fontSize="14" fontWeight="bold" style={{textShadow:'0 2px 4px black'}}>{Math.round(liveArea)} sq.ft</text>
                                </>
                            )}
                        </g>
                    )}
                </svg>
            </div>
            
            {/* FLOATING ACTION BAR */}
            {isDrawing && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 animate-in slide-in-from-bottom-4">
                    <div className="bg-black/90 backdrop-blur-md text-white px-5 py-2 rounded-full text-xs font-bold border border-white/10 flex items-center gap-3 shadow-xl">
                        <span className="text-cyan-400 text-base">{Math.round(liveArea)} <span className="text-xs text-gray-400">sq.ft</span></span>
                        <div className="h-4 w-px bg-white/20"></div>
                        <span className="text-gray-300">{tool === 'pen' ? `Points: ${penPoints.length}` : 'Drag to size'}</span>
                    </div>
                    <div className="flex items-center gap-2 p-1 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl">
                        {tool === 'pen' && <button onClick={() => setPenPoints(prev => prev.slice(0, -1))} className="p-2 hover:bg-white/10 rounded-lg text-white" disabled={penPoints.length === 0}><Undo2 size={18} className={penPoints.length === 0 ? "opacity-30" : ""}/></button>}
                        <button onClick={cancelDrawing} className="p-2 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition"><X size={18}/></button>
                        {(tool === 'box' || (tool === 'pen' && penPoints.length >= 3)) && <button onClick={finishDrawing} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition shadow-lg"><Check size={14}/> Finish</button>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapCanvas;