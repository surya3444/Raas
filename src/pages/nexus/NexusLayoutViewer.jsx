import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from '../../firebase';
import { useNexus } from '../../context/NexusContext'; 

// Chart.js
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
ChartJS.register(ArcElement, Tooltip, Legend);

// Components
import MapCanvas from '../../components/nexus/map/MapCanvas';
import InteractiveGrid from '../../components/interactive/InteractiveGrid'; 
import NexusNavbar from '../../components/nexus/NexusNavbar';
import InspectorPanel from '../../components/nexus/map/InspectorPanel';
import ReportModal from '../../components/nexus/modals/ReportModal';
import LayoutSettingsModal from '../../components/nexus/modals/LayoutSettingsModal';
import SharePlotModal from '../../components/nexus/modals/SharePlotModal';
import ExpenseCalculatorModal from '../../components/nexus/modals/ExpenseCalculatorModal'; 

// Icons
import { 
    ZoomIn, ZoomOut, RefreshCw, MapPin, Search, Maximize2, Minimize2,
    PieChart, DollarSign, Layers, Printer, Plus, Trash2, Calendar, 
    Settings, Map as MapIcon, Grid, Users, BarChart3, FileText, ChevronRight, Share2, EyeOff,
    X, Edit3, ArrowUpRight, Ruler, ExternalLink, TrendingUp, Calculator, 
    Unlock, Clock, CheckCircle 
} from 'lucide-react';

// --- STATS CARD COMPONENT ---
const StatsCard = ({ title, value, sub, icon: Icon, color, action, onEdit, isPublicMode }) => {
    const colorClasses = {
        green: "text-emerald-400 group-hover:border-emerald-500/30 group-hover:shadow-emerald-500/10",
        blue: "text-blue-400 group-hover:border-blue-500/30 group-hover:shadow-blue-500/10",
        purple: "text-purple-400 group-hover:border-purple-500/30 group-hover:shadow-purple-500/10",
        amber: "text-amber-400 group-hover:border-amber-500/30 group-hover:shadow-amber-500/10",
        orange: "text-orange-400 group-hover:border-orange-500/30 group-hover:shadow-orange-500/10",
        slate: "text-slate-400 group-hover:border-slate-500/30 group-hover:shadow-slate-500/10"
    };
    
    return (
        <div className={`relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-5 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 group ${colorClasses[color] || 'text-white'}`}>
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-current opacity-[0.03] blur-2xl group-hover:opacity-[0.08] transition-opacity pointer-events-none"></div>
            
            <div className="flex justify-between items-start mb-2 relative z-10">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{title}</p>
                <div className="flex items-center gap-2">
                    {onEdit && !isPublicMode && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onEdit(); }} 
                            className="opacity-0 group-hover:opacity-100 p-1.5 bg-white/5 hover:bg-white/20 rounded-lg text-slate-300 hover:text-white transition shadow-sm z-20 cursor-pointer"
                            title="Edit"
                        >
                            <Edit3 size={14}/>
                        </button>
                    )}
                    {Icon && <Icon size={16} className="opacity-50 group-hover:opacity-100 transition-opacity"/>}
                </div>
            </div>
            
            <div className="relative z-10">
                {action ? (
                    <div className="mt-2">{action}</div>
                ) : (
                    <>
                        <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
                        {sub && <p className="text-[10px] text-slate-500 font-medium mt-1">{sub}</p>}
                    </>
                )}
            </div>
        </div>
    );
};

const NexusLayoutViewer = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { activeCollection, user } = useNexus(); 
    
    // Data State
    const [layout, setLayout] = useState(null);
    const [viewMode, setViewMode] = useState('map'); 
    
    // UI State
    const [selectedId, setSelectedId] = useState(null);
    const [viewConfig, setViewConfig] = useState({ scale: 1, x: 0, y: 0 });
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // NEW: Registry Filter State
    const [isFullScreen, setIsFullScreen] = useState(false);
    
    // Public/Shared Mode State
    const [isPublicMode, setIsPublicMode] = useState(false);
    const [showPublicPrice, setShowPublicPrice] = useState(true);

    const [activeModal, setActiveModal] = useState(null); 
    const [sharePlot, setSharePlot] = useState(null); 
    const [mobileTab, setMobileTab] = useState('dashboard'); // Default to dashboard

    useEffect(() => {
        // --- CRITICAL PUBLIC FIX: Always fallback to "layouts" collection if no user is active ---
        const collectionToUse = activeCollection || 'layouts'; 

        const unsub = onSnapshot(doc(db, collectionToUse, id), (docSnap) => {
            if (docSnap.exists()) {
                setLayout({ id: docSnap.id, ...docSnap.data() });
            }
        });
        const handleEsc = (e) => { if (e.key === 'Escape') setIsFullScreen(false); };
        window.addEventListener('keydown', handleEsc);
        return () => { unsub(); window.removeEventListener('keydown', handleEsc); };
    }, [id, activeCollection]);

    // --- CRITICAL PUBLIC ENFORCEMENT ---
    useEffect(() => {
        const focusId = searchParams.get('focus');
        const mode = searchParams.get('mode');
        const priceParam = searchParams.get('price');

        // FORCE Public Mode if there is no logged-in user OR if mode=public is in URL
        if (mode === 'public' || !user) {
            setIsPublicMode(true);
            setIsFullScreen(true); 
            if (priceParam === 'false') setShowPublicPrice(false);
        } else {
            setIsPublicMode(false);
        }

        if (focusId && layout && layout.elements) {
            const targetPlot = layout.elements.find(e => e.id === focusId);
            if (targetPlot && targetPlot.points) {
                setSelectedId(focusId);
                const points = targetPlot.points.split(' ').map(p => {
                    const [x, y] = p.split(',').map(Number);
                    return { x, y };
                });
                const xs = points.map(p => p.x);
                const ys = points.map(p => p.y);
                const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
                const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
                const zoomScale = 2.5;
                const screenW = window.innerWidth > 768 ? window.innerWidth * 0.6 : window.innerWidth;
                const screenH = window.innerHeight * 0.6;
                const newX = (screenW / 2) - (centerX * zoomScale);
                const newY = (screenH / 2) - (centerY * zoomScale);
                setViewConfig({ scale: zoomScale, x: newX, y: newY });
                setMobileTab('map');
            }
        }
    }, [searchParams, layout, user]);

    const memoizedGridLayout = useMemo(() => {
        if (!layout) return null;
        return {
            ...layout,
            elements: (layout.elements || []).filter(e => e.type === 'plot')
        };
    }, [layout]);

    // --- ACTIONS (SECURE & GUARDED) ---
    const exitPreviewMode = () => {
        // Prevent real public users from escaping fullscreen/preview mode
        if (!user) return; 
        setIsPublicMode(false);
        setIsFullScreen(false);
        window.history.replaceState(null, '', `/nexus/view/${id}`);
    };

    const handlePlotUpdate = async (updatedPlot) => {
        if (isPublicMode || !user) return; 
        const updatedElements = layout.elements.map(e => e.id === updatedPlot.id ? updatedPlot : e);
        await updateDoc(doc(db, activeCollection, id), { elements: updatedElements });
    };

    const handleSaveExpenses = async (expenseData) => {
        if (isPublicMode || !user) return; 
        try {
            const updatePayload = {
                expenses: expenseData.expenses,
                totalProjectCost: expenseData.totalProjectCost,
                costPerSqft: expenseData.costPerSqft,
                lastExpenseCalc: expenseData.lastCalculated,
                areaDetails: expenseData.areaDetails,
                sellableArea: expenseData.sellableArea
            };
            if (expenseData.totalArea) {
                updatePayload.totalArea = expenseData.totalArea;
            }
            await updateDoc(doc(db, activeCollection, id), updatePayload);
            setActiveModal(null);
        } catch (e) {
            console.error(e);
            alert("Failed to save expenses");
        }
    };

    const getFormattedArea = () => {
        if (!layout?.totalArea) return null;
        let areaStr = layout.totalArea.toString().toLowerCase();
        if (areaStr.includes('acre')) return layout.totalArea;
        
        const rawVal = parseFloat(areaStr.replace(/[^0-9.]/g, ''));
        if (!rawVal) return layout.totalArea;

        const acres = rawVal / 43560;
        return `${acres.toFixed(2)} Acres`;
    };

    const addMilestone = async () => {
        if (isPublicMode || !user) return; 
        const title = prompt("Enter Milestone Name:");
        if (!title) return;
        const newM = { title, done: false, date: new Date().toISOString() };
        await updateDoc(doc(db, activeCollection, id), { milestones: [...(layout.milestones || []), newM] });
    };

    const toggleMilestone = async (idx) => {
        if (isPublicMode || !user) return; 
        const updated = [...(layout.milestones || [])];
        updated[idx].done = !updated[idx].done;
        await updateDoc(doc(db, activeCollection, id), { milestones: updated });
    };

    const deleteMilestone = async (idx) => {
        if (isPublicMode || !user) return; 
        if(!confirm("Delete milestone?")) return;
        const updated = layout.milestones.filter((_, i) => i !== idx);
        await updateDoc(doc(db, activeCollection, id), { milestones: updated });
    };

    const toggleFullScreenMode = () => {
        if (!isFullScreen) {
            if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch((e) => console.log(e));
            setIsFullScreen(true);
        } else {
            if (document.exitFullscreen && document.fullscreenElement) document.exitFullscreen().catch((e) => console.log(e));
            setIsFullScreen(false);
        }
    };

    if (!layout) return <div className="h-screen w-screen flex items-center justify-center bg-[#050505] text-white font-sans">
        <div className="flex flex-col items-center gap-4 animate-pulse">
            <div className="w-12 h-12 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
            <span className="text-sm tracking-widest uppercase text-blue-500">Initializing Nexus Engine...</span>
        </div>
    </div>;

    // --- DERIVED METRICS ---
    const plots = (layout.elements || []).filter(e => e.type === 'plot');
    
    // Status Counts
    const sold = plots.filter(p => p.status === 'sold').length;
    const booked = plots.filter(p => p.status === 'booked').length;
    const open = plots.length - sold - booked;

    const revenue = plots.reduce((sum, p) => {
        if (p.status === 'sold') return sum + (Number(p.price) || 0);
        else if (p.status === 'booked') return sum + (Number(p.bookingAmount) || 0);
        return sum;
    }, 0);

    const totalValue = plots.reduce((sum, p) => sum + (Number(p.price) || 0), 0);

    const chartData = {
        labels: ['Sold', 'Booked', 'Open'],
        datasets: [{
            data: [sold, booked, open],
            backgroundColor: ['#10b981', '#f59e0b', '#334155'], 
            borderColor: '#000000',
            borderWidth: 2,
            hoverOffset: 15
        }]
    };

    const customers = isPublicMode ? [] : plots
        .filter(e => e.status === 'sold' || e.status === 'booked')
        .filter(e => filterStatus === 'all' || e.status === filterStatus)
        .filter(e => (e.customerName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || e.id.toLowerCase().includes(searchTerm.toLowerCase()));

    const renderDashboardSection = () => (
        <div className="flex flex-col p-4 md:p-8 space-y-8 bg-gradient-to-b from-[#09090b] via-[#050505] to-black">
            
            {/* Header */}
            <div className="relative rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-2xl shadow-2xl flex flex-col md:flex-row justify-between md:items-center gap-6 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition duration-700 pointer-events-none"></div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
                            {layout.name}
                        </h2>
                        {!isPublicMode && (
                            <div className="flex gap-1">
                                <button onClick={() => navigate(`/nexus/design/${id}`)} className="p-2 rounded-full bg-white/5 hover:bg-blue-600 hover:text-white text-slate-400 transition-all duration-300 transform hover:scale-110" title="Edit Blueprint">
                                    <Edit3 size={14}/>
                                </button>
                                <button onClick={() => setActiveModal('settings')} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all duration-300" title="Settings">
                                    <Settings size={14}/>
                                </button>
                            </div>
                        )}
                    </div>
                    {/* INFO ROW */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-medium mt-1">
                        <div className="flex items-center gap-1.5"><MapPin size={12} className="text-blue-500"/> {layout.address || "Location Unspecified"}</div>
                        
                        {/* AREA (Editable) */}
                        {getFormattedArea() && (
                            <div 
                                className={`flex items-center gap-2 border-l border-white/10 pl-4 ${!isPublicMode ? 'cursor-pointer hover:text-white group/area' : ''}`}
                                onClick={() => !isPublicMode && setActiveModal('expense')}
                                title={!isPublicMode ? "Click to Edit Area" : undefined}
                            >
                                <Ruler size={12} className="text-purple-500"/> 
                                <span>{getFormattedArea()}</span>
                                {!isPublicMode && <Edit3 size={10} className="text-gray-500 group-hover/area:text-white"/>}
                            </div>
                        )}

                        {layout.addressLink && <a href={layout.addressLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 border-l border-white/10 pl-4 hover:text-blue-400 transition cursor-pointer"><ExternalLink size={12} className="text-blue-500"/> View Map</a>}
                    </div>
                </div>
                {!isPublicMode && (
                    <div className="relative z-10 flex gap-3">
                        <button onClick={() => setActiveModal('report')} className="group flex items-center gap-2 px-5 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.05] hover:border-white/[0.1] transition-all duration-300">
                            <Printer size={16} className="text-slate-400 group-hover:text-white"/>
                            <span className="text-xs font-bold text-slate-300 group-hover:text-white">Export Report</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatsCard title="Project Value" value={`₹${(totalValue/10000000).toFixed(2)}Cr`} sub="Potential Worth" icon={TrendingUp} color="amber" isPublicMode={isPublicMode} />
                <StatsCard title="Revenue" value={`₹${(revenue/100000).toFixed(2)}L`} sub="Sold + Booking Amts" icon={DollarSign} color="green" isPublicMode={isPublicMode} />
                <StatsCard title="Balance Value" value={`₹${((totalValue - revenue)/10000000).toFixed(2)}Cr`} sub="Potential Worth" icon={TrendingUp} color="amber" isPublicMode={isPublicMode} />

                {/* Expenses Card */}
                {layout.costPerSqft ? (
                    <StatsCard 
                        title="Expenses" 
                        value={`₹${layout.costPerSqft}/sqft`} 
                        sub={!isPublicMode ? `Total: ₹${(layout.totalProjectCost/10000000).toFixed(2)}Cr` : ''} 
                        icon={Calculator} 
                        color="orange" 
                        isPublicMode={isPublicMode}
                        onEdit={() => setActiveModal('expense')} 
                    />
                ) : (
                    <StatsCard 
                        title="Expenses" 
                        isPublicMode={isPublicMode}
                        action={!isPublicMode ? <button onClick={(e) => {e.stopPropagation(); setActiveModal('expense');}} className="w-full bg-orange-600/20 text-orange-500 border border-orange-500/50 hover:bg-orange-600 hover:text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition animate-pulse z-20 relative cursor-pointer"><Calculator size={14}/> Calculate Now</button> : <span className="text-sm font-bold text-gray-500">Not Disclosed</span>} 
                        sub="Set Costs" 
                        icon={Calculator} 
                        color="orange" 
                    />
                )}

                <StatsCard title="Total Plots" value={plots.length} sub="100% Inventory" icon={Layers} color="purple" isPublicMode={isPublicMode} />
                <StatsCard title="Sold Units" value={sold} sub={`${((sold/Math.max(plots.length,1))*100).toFixed(0)}% Sold`} icon={CheckCircle} color="green" isPublicMode={isPublicMode} />
                <StatsCard title="Booked Units" value={booked} sub="Pending Final" icon={Clock} color="amber" isPublicMode={isPublicMode} />
                <StatsCard title="Open Inventory" value={open} sub="Available" icon={Unlock} color="blue" isPublicMode={isPublicMode} />

                <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-4 flex items-center justify-center group hover:border-white/20 transition duration-300">
                     <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</span>
                        <span className="text-xl font-bold text-white">{plots.length}</span>
                     </div>
                    <div className="w-24 h-24 relative z-10 opacity-90 group-hover:opacity-100 transition-opacity">
                        <Doughnut data={chartData} options={{ cutout: '75%', responsive: true, plugins: { legend: { display: false } } }} />
                    </div>
                </div>
            </div>

            {/* Split Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                <div className="flex flex-col rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-6 min-h-[300px]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xs font-bold text-slate-300 uppercase flex items-center gap-2 tracking-widest"><Calendar size={14} className="text-blue-500"/> Milestones</h3>
                        {!isPublicMode && <button onClick={addMilestone} className="text-[10px] bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-full hover:bg-blue-500 hover:text-white transition flex items-center gap-1 font-bold"><Plus size={12}/> New</button>}
                    </div>
                    <div className="space-y-3 flex-1">
                        {(layout.milestones || []).length === 0 ? <p className="text-xs text-slate-600 italic text-center py-10">No active milestones.</p> : (
                            (layout.milestones || []).map((m, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-black/20 border border-white/[0.03] hover:border-white/[0.1] hover:bg-white/[0.02] transition group">
                                    <button onClick={() => toggleMilestone(i)} disabled={isPublicMode} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${m.done ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'border-slate-700 hover:border-blue-500'} ${isPublicMode ? 'cursor-default pointer-events-none' : ''}`}>{m.done && <div className="w-2 h-2 bg-black rounded-full"></div>}</button>
                                    <span className={`text-xs flex-1 font-medium ${m.done ? 'text-slate-600 line-through' : 'text-slate-200'}`}>{m.title}</span>
                                    {!isPublicMode && <button onClick={() => deleteMilestone(i)} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-2"><Trash2 size={14}/></button>}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="flex flex-col rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-6 min-h-[300px]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xs font-bold text-slate-300 uppercase flex items-center gap-2 tracking-widest"><FileText size={14} className="text-purple-500"/> Project Files</h3>
                        {!isPublicMode && <button onClick={() => setActiveModal('settings')} className="text-[10px] text-slate-500 hover:text-white font-medium hover:underline">Manage All</button>}
                    </div>
                    <div className="space-y-3 flex-1">
                        {(layout.docs || []).length === 0 ? <p className="text-xs text-slate-600 italic text-center py-10">No documents uploaded.</p> : (
                            (layout.docs || []).map((d, i) => (
                                <a key={i} href={d.url} download={d.name} className="flex items-center gap-4 p-4 rounded-2xl bg-black/20 border border-white/[0.03] hover:border-purple-500/30 hover:bg-purple-500/5 transition group">
                                    <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.1)]"><FileText size={18} /></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-slate-200 font-bold truncate group-hover:text-white transition">{d.name}</p>
                                        <p className="text-[10px] text-slate-600">Click to download</p>
                                    </div>
                                    <div className="p-2 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 transition"><ArrowUpRight size={14} className="text-white"/></div>
                                </a>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-screen w-screen bg-[#050505] text-white overflow-hidden relative font-sans selection:bg-blue-500/30 items-center justify-center">
            
            {/* Background Atmosphere */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/40 via-[#050505] to-black"></div>
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>
            </div>

            {/* --- MAIN CONTAINER --- */}
            <div className="flex flex-col w-full h-full bg-[#09090b]/80 backdrop-blur-2xl shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden relative z-10">

                {!isFullScreen && (
                    <NexusNavbar title={layout.name} isEditor={false} /> 
                )}

                {isPublicMode && user && (
                    <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50">
                        <button onClick={exitPreviewMode} className="bg-red-500/90 backdrop-blur-md text-white px-6 py-2.5 rounded-full font-bold text-xs shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center gap-2 hover:bg-red-500 transition-all border border-red-400/30">
                            <EyeOff size={14}/> Admin Preview Mode
                        </button>
                    </div>
                )}

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10">
                    
                    {/* --- LEFT COLUMN --- */}
                    <div className="flex-1 flex flex-col min-w-0 bg-transparent relative overflow-y-auto custom-scrollbar scroll-smooth transition-all duration-300">
                        
                        {/* A. DASHBOARD VIEW (TOP) */}
                        <div className={`flex-col ${mobileTab === 'dashboard' ? 'flex-1' : 'hidden'} ${(!isFullScreen && mobileTab !== 'dashboard') ? 'md:flex' : ''} ${isFullScreen ? 'md:hidden' : ''} `}>
                             {renderDashboardSection()}
                        </div>

                        {/* --- MAP/GRID TOGGLE --- */}
                        <div className={`
                            px-4 py-2 flex justify-between items-center
                            ${mobileTab === 'map' ? 'flex' : 'hidden md:flex'} 
                            ${isFullScreen ? 'hidden' : ''}
                        `}>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-2">Inventory View</h3>
                            <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                                <button 
                                    onClick={() => setViewMode('map')} 
                                    className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'map' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <MapIcon size={14}/> Map
                                </button>
                                <button 
                                    onClick={() => setViewMode('grid')} 
                                    className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <Grid size={14}/> Grid
                                </button>
                            </div>
                        </div>

                        {/* B. MAP/GRID VIEW (BOTTOM) */}
                        <div className={`
                            relative flex-col 
                            ${mobileTab === 'map' ? 'flex h-full' : 'hidden md:flex'} 
                            ${isFullScreen ? 'h-full flex-1 p-0' : 'md:h-[65vh] md:shrink-0 md:px-4 md:pb-8'} 
                        `}>
                            {/* Map Container */}
                            <div className={`
                                relative w-full h-full overflow-hidden bg-[#0e0e10] shadow-2xl
                                ${!isFullScreen ? 'md:rounded-2xl md:border md:border-white/10' : ''}
                            `}>
                                
                                {viewMode === 'map' && (
                                    <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
                                        {!isPublicMode && (
                                            <>
                                                <button onClick={() => navigate(`/nexus/design/${id}`)} className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition shadow-lg mb-2" title="Edit Map">
                                                    <Edit3 size={18}/>
                                                </button>
                                                <button onClick={toggleFullScreenMode} className="bg-black/50 hover:bg-black/80 text-white p-2 rounded-lg backdrop-blur-md border border-white/10 transition shadow-lg hidden md:block">
                                                    {isFullScreen ? <Minimize2 size={18}/> : <Maximize2 size={18}/>}
                                                </button>
                                            </>
                                        )}
                                        <div className="h-px bg-white/10 w-full my-1 hidden md:block"></div>
                                        <button onClick={() => setViewConfig(p => ({...p, scale: p.scale + 0.2}))} className="bg-black/50 text-white p-2 rounded-lg hover:bg-black border border-white/10 shadow-lg"><ZoomIn size={18}/></button>
                                        <button onClick={() => setViewConfig(p => ({...p, scale: Math.max(0.1, p.scale - 0.2)}))} className="bg-black/50 text-white p-2 rounded-lg hover:bg-black border border-white/10 shadow-lg"><ZoomOut size={18}/></button>
                                        <button onClick={() => setViewConfig({scale: 1, x: 0, y: 0})} className="bg-black/50 text-white p-2 rounded-lg hover:bg-black border border-white/10 shadow-lg"><RefreshCw size={18}/></button>
                                    </div>
                                )}

                                {viewMode === 'map' ? (
                                    <MapCanvas 
                                        layout={layout} 
                                        mode="view" 
                                        selectedId={selectedId} 
                                        onSelect={(id) => { setSelectedId(id); if(window.innerWidth < 768) setMobileTab('registry'); }} 
                                        externalView={viewConfig} 
                                        onViewChange={setViewConfig}
                                    />
                                ) : (
                                    <div className="h-full w-full overflow-y-auto custom-scrollbar p-6 bg-[#0e0e10]">
                                        <InteractiveGrid layout={memoizedGridLayout} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* C. REGISTRY VIEW (Mobile Only) */}
                        {mobileTab === 'registry' && (
                            <div className="flex-1 bg-black p-4 md:hidden overflow-y-auto pb-24">
                                {selectedId ? (
                                    <InspectorPanel 
                                        layout={layout} 
                                        selectedId={selectedId} 
                                        onUpdate={handlePlotUpdate} 
                                        onClose={() => setSelectedId(null)} 
                                        onShare={!isPublicMode ? (plot) => setSharePlot(plot) : undefined}
                                        isPublicView={isPublicMode}
                                        showPublicPrice={showPublicPrice}
                                    />
                                ) : (
                                    !isPublicMode && (
                                        <div className="space-y-4">
                                            {/* Mobile Registry Search & Filter */}
                                            <div className="space-y-3 mb-2">
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-3 text-gray-500" size={14} />
                                                    <input type="text" placeholder="Search..." className="w-full bg-[#18181b] border border-white/10 rounded-lg py-2.5 pl-9 pr-3 text-xs text-white focus:border-blue-500 outline-none transition" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                                                </div>
                                                <div className="flex bg-[#18181b] rounded-lg p-1 border border-white/10">
                                                    <button onClick={() => setFilterStatus('all')} className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition ${filterStatus === 'all' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>All</button>
                                                    <button onClick={() => setFilterStatus('booked')} className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition ${filterStatus === 'booked' ? 'bg-yellow-500/20 text-yellow-500' : 'text-gray-500 hover:text-gray-300'}`}>Booked</button>
                                                    <button onClick={() => setFilterStatus('sold')} className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition ${filterStatus === 'sold' ? 'bg-green-500/20 text-green-500' : 'text-gray-500 hover:text-gray-300'}`}>Sold</button>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                {customers.map(c => (
                                                    <div key={c.id} onClick={() => setSelectedId(c.id)} className="bg-white/5 border border-white/5 p-4 rounded-xl flex justify-between items-center">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded">#{c.id}</span>
                                                                <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-md ${c.status === 'sold' ? 'text-green-400 bg-green-500/10' : 'text-yellow-400 bg-yellow-500/10'}`}>{c.status}</span>
                                                            </div>
                                                            <h4 className="text-sm font-bold text-white">{c.customerName || "Unknown Owner"}</h4>
                                                        </div>
                                                        <ChevronRight size={16} className="text-gray-600"/>
                                                    </div>
                                                ))}
                                                {customers.length === 0 && <div className="text-center text-xs text-gray-500 py-6 border border-white/5 rounded-xl border-dashed">No customers found.</div>}
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        )}
                    </div>

                    {/* --- RIGHT SIDEBAR (Desktop) --- */}
                    {(!isFullScreen || (isPublicMode && selectedId)) && (
                        <div className="w-[380px] flex-shrink-0 bg-[#0a0a0a]/95 backdrop-blur-2xl border-l border-white/[0.08] hidden md:flex flex-col z-20 h-full shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                            {!isPublicMode && (
                                <div className="p-6 border-b border-white/[0.08]">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2"><Users size={16} className="text-blue-500"/> Registry</h2>
                                        <button onClick={() => setActiveModal('settings')} className="text-gray-500 hover:text-white transition"><Settings size={16}/></button>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-3 text-gray-500" size={14} />
                                            <input type="text" placeholder="Search..." className="w-full bg-[#18181b] border border-white/10 rounded-lg py-2.5 pl-9 pr-3 text-xs text-white focus:border-blue-500 outline-none transition" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                                        </div>
                                        {/* Desktop Registry Filter */}
                                        <div className="flex bg-[#18181b] rounded-lg p-1 border border-white/10">
                                            <button onClick={() => setFilterStatus('all')} className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition ${filterStatus === 'all' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>All</button>
                                            <button onClick={() => setFilterStatus('booked')} className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition ${filterStatus === 'booked' ? 'bg-yellow-500/20 text-yellow-500' : 'text-gray-500 hover:text-gray-300'}`}>Booked</button>
                                            <button onClick={() => setFilterStatus('sold')} className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition ${filterStatus === 'sold' ? 'bg-green-500/20 text-green-500' : 'text-gray-500 hover:text-gray-300'}`}>Sold</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0e0e10] p-4">
                                {selectedId ? (
                                    <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                                        <div className="flex justify-between items-center mb-4 px-1">
                                            {!isPublicMode && <button onClick={() => setSelectedId(null)} className="text-xs font-bold text-blue-400 hover:text-white flex items-center gap-1 transition">← Back to List</button>}
                                            <span className="text-[10px] font-bold text-gray-500 uppercase bg-white/5 px-2 py-1 rounded border border-white/5">Plot {selectedId}</span>
                                            {isPublicMode && <button onClick={() => setSelectedId(null)} className="text-xs text-gray-500 hover:text-white"><X size={16}/></button>}
                                        </div>
                                        <InspectorPanel 
                                            layout={layout} 
                                            selectedId={selectedId} 
                                            onUpdate={handlePlotUpdate} 
                                            onClose={() => setSelectedId(null)} 
                                            onShare={!isPublicMode ? (plot) => setSharePlot(plot) : undefined}
                                            isPublicView={isPublicMode}
                                            showPublicPrice={showPublicPrice}
                                        />
                                    </div>
                                ) : (
                                    !isPublicMode && (
                                        <div className="space-y-2">
                                            {customers.map(c => (
                                                <div key={c.id} onClick={() => setSelectedId(c.id)} className="bg-[#18181b] p-4 rounded-xl border border-white/5 hover:border-blue-500/50 cursor-pointer transition group relative overflow-hidden">
                                                    <div className={`absolute top-0 left-0 w-1 h-full ${c.status === 'sold' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                                    <div className="pl-3">
                                                        <div className="flex justify-between items-start mb-1"><span className="font-mono text-[11px] font-bold text-gray-400 group-hover:text-white transition">{c.id}</span><span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-md ${c.status === 'sold' ? 'text-green-400 bg-green-500/10' : 'text-yellow-400 bg-yellow-500/10'}`}>{c.status}</span></div>
                                                        <h4 className="text-sm font-bold text-gray-200 truncate group-hover:text-blue-400 transition">{c.customerName || "Unknown Owner"}</h4>
                                                    </div>
                                                </div>
                                            ))}
                                            {customers.length === 0 && <div className="text-center text-xs text-gray-500 py-10 border border-white/5 rounded-xl border-dashed">No customers found.</div>}
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="md:hidden h-20 bg-[#121214] border-t border-white/10 flex justify-around items-center px-4 shrink-0 z-50 fixed bottom-0 w-full pb-4">
                    {!isPublicMode && <button onClick={() => setMobileTab('dashboard')} className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition w-16 ${mobileTab === 'dashboard' ? 'text-blue-500 bg-blue-500/10' : 'text-gray-500'}`}><BarChart3 size={22}/><span className="text-[10px] font-bold">Dash</span></button>}
                    <button onClick={() => setMobileTab('map')} className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition w-16 ${mobileTab === 'map' ? 'text-blue-500 bg-blue-500/10' : 'text-gray-500'}`}><MapIcon size={22}/><span className="text-[10px] font-bold">Map</span></button>
                    <button onClick={() => setMobileTab('registry')} className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition w-16 ${mobileTab === 'registry' ? 'text-blue-500 bg-blue-500/10' : 'text-gray-500'}`}><Users size={22}/><span className="text-[10px] font-bold">{isPublicMode ? 'Details' : 'List'}</span></button>
                </div>

                {activeModal === 'report' && <ReportModal layout={layout} onClose={() => setActiveModal(null)} />}
                {activeModal === 'settings' && <LayoutSettingsModal layout={layout} onClose={() => setActiveModal(null)} />}
                {activeModal === 'expense' && <ExpenseCalculatorModal layout={layout} onSave={handleSaveExpenses} onClose={() => setActiveModal(null)} />}
                {sharePlot && <SharePlotModal layout={layout} plot={sharePlot} onClose={() => setSharePlot(null)} />}
            </div>
        </div>
    );
};

export default NexusLayoutViewer;