import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from '../firebase';
import { ChevronLeft, Grid, Map as MapIcon, MapPin, ExternalLink, Users, Pencil, Check, X, IndianRupee, TrendingUp, Wallet, FileText } from 'lucide-react';

// Components
import InteractiveGrid from '../components/interactive/InteractiveGrid';
import InteractiveMap from '../components/interactive/InteractiveMap';
import MilestoneList from '../components/project/MilestoneList';
import DocumentList from '../components/project/DocumentList';
import LayoutStatsChart from '../components/project/LayoutStatsChart';
import CustomerModal from '../components/modals/CustomerModal';
import ReportModal from '../components/modals/ReportModal'; 

const InteractiveLayoutPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [layout, setLayout] = useState(null);
    const [viewMode, setViewMode] = useState('grid'); 
    const [isEditingInfo, setIsEditingInfo] = useState(false);
    const [editData, setEditData] = useState({ address: '', addressLink: '' });
    
    // Modal States
    const [activeCustomerIndex, setActiveCustomerIndex] = useState(null);
    const [isReportModalOpen, setReportModalOpen] = useState(false); 

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "layouts", id), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setLayout({ id: doc.id, ...data });
                if (!isEditingInfo) {
                    setEditData({ address: data.address || '', addressLink: data.addressLink || '' });
                }
            }
        });
        return () => unsub();
    }, [id, isEditingInfo]);

    if (!layout) return <div className="p-10 text-center text-gray-500">Loading...</div>;

    const activeCustomers = (layout.elements || [])
        .map((p, index) => ({ ...p, originalIndex: index }))
        .filter(p => p.customerName && p.customerName.trim().length > 0);

    // Financials
    const totalProjectValue = (layout.elements || []).reduce((sum, p) => sum + (Number(p.price) || 0), 0);
    const totalCollected = (layout.elements || []).reduce((sum, p) => {
        if (p.status === 'sold') return sum + (Number(p.price) || 0);
        else if (p.status === 'booked') return sum + (Number(p.bookingAmount) || 0);
        return sum;
    }, 0);

    const formatCurrency = (val) => {
        if(val >= 10000000) return `₹ ${(val/10000000).toFixed(2)} Cr`;
        if(val >= 100000) return `₹ ${(val/100000).toFixed(2)} L`;
        return `₹ ${val.toLocaleString('en-IN')}`;
    };

    const handleSaveInfo = async () => {
        try {
            await updateDoc(doc(db, "layouts", id), {
                address: editData.address,
                addressLink: editData.addressLink
            });
            setIsEditingInfo(false);
        } catch (e) {
            alert("Failed to save info: " + e.message);
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-[#09090b] overflow-hidden">
            
            {/* --- HEADER --- */}
            <div className="h-14 border-b border-white/10 flex justify-between items-center px-4 md:px-6 bg-[#121214] shrink-0 z-20">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/interactive')} className="text-xs text-gray-400 hover:text-white flex items-center gap-2 font-bold transition">
                        <ChevronLeft size={16} /> Back
                    </button>
                    <h2 className="font-bold text-white text-sm tracking-wide truncate max-w-[150px]">{layout.name}</h2>
                </div>
                
                <div className="flex gap-2">
                    {/* REPORTS BUTTON */}
                    <button 
                        onClick={() => setReportModalOpen(true)}
                        className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold px-3 py-1.5 rounded flex items-center gap-1 transition"
                    >
                        <FileText size={12} /> Reports
                    </button>

                    <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
                        <button onClick={() => setViewMode('grid')} className={`px-3 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition ${viewMode === 'grid' ? 'bg-brand text-white' : 'text-gray-400 hover:text-white'}`}><Grid size={12} /> Grid</button>
                        <button onClick={() => setViewMode('map')} className={`px-3 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition ${viewMode === 'map' ? 'bg-brand text-white' : 'text-gray-400 hover:text-white'}`}><MapIcon size={12} /> Map</button>
                    </div>
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-0 min-h-0 overflow-hidden">
                
                {/* LEFT COLUMN */}
                <div className="col-span-12 lg:col-span-9 flex flex-col h-full overflow-y-auto custom-scrollbar border-r border-white/10 bg-[#0e0e10]">
                    
                    {/* DETAILS AREA (MOVED TO TOP) */}
                    <div className="p-6 bg-[#09090b] space-y-6">
                        
                        {/* PROJECT INFO */}
                        <div className="glass-panel p-5 border border-white/5 relative group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-2 text-white">
                                    <MapPin className="text-brand" size={18} />
                                    <h3 className="font-bold text-lg">Project Details</h3>
                                </div>
                                {!isEditingInfo ? (
                                    <button onClick={() => setIsEditingInfo(true)} className="text-gray-500 hover:text-white p-1 rounded hover:bg-white/10 transition"><Pencil size={14} /></button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button onClick={() => setIsEditingInfo(false)} className="p-1.5 rounded bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition"><X size={14}/></button>
                                        <button onClick={handleSaveInfo} className="p-1.5 rounded bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition"><Check size={14}/></button>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] text-gray-500 uppercase font-bold block mb-2">Project Address</label>
                                    {isEditingInfo ? (
                                        <textarea className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white focus:border-brand outline-none min-h-[80px]" value={editData.address} onChange={(e) => setEditData({...editData, address: e.target.value})} placeholder="Enter full address..." />
                                    ) : (
                                        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{layout.address || "No address details provided."}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-500 uppercase font-bold block mb-2">Google Maps Link</label>
                                    {isEditingInfo ? (
                                        <input className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-brand focus:border-brand outline-none" value={editData.addressLink} onChange={(e) => setEditData({...editData, addressLink: e.target.value})} placeholder="http://googleusercontent.com/..." />
                                    ) : (
                                        layout.addressLink ? (
                                            <a href={layout.addressLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition p-2 bg-blue-500/5 rounded border border-blue-500/10 hover:border-blue-500/30">
                                                <ExternalLink size={14} /> Open Location in Maps
                                            </a>
                                        ) : <p className="text-gray-600 text-xs italic">No map link added.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* DASHBOARD GRID */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
                            
                            {/* 1. Financials */}
                            <div className="glass-panel p-5 border border-white/5 relative overflow-hidden flex flex-col justify-between" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)' }}>
                                <div className="absolute right-[-10px] top-[-10px] opacity-10 text-green-500 pointer-events-none"><IndianRupee size={80} strokeWidth={1} /></div>
                                <div className="space-y-4 relative z-10">
                                    <div>
                                        <div className="flex items-center gap-2 text-green-400 mb-1"><Wallet size={16} /><h3 className="text-xs font-bold uppercase tracking-wider">Collected</h3></div>
                                        <p className="text-2xl font-bold text-white tracking-tight">{formatCurrency(totalCollected)}</p>
                                    </div>
                                    <div className="border-t border-green-500/20 pt-3">
                                        <div className="flex items-center gap-2 text-gray-400 mb-1"><TrendingUp size={16} /><h3 className="text-[10px] font-bold uppercase tracking-wider">Balance Amount</h3></div>
                                        <p className="text-lg font-bold text-gray-200">{formatCurrency(totalProjectValue - totalCollected)}</p>
                                    </div>
                                    <div className="border-t border-green-500/20 pt-3">
                                        <div className="flex items-center gap-2 text-gray-400 mb-1"><TrendingUp size={16} /><h3 className="text-[10px] font-bold uppercase tracking-wider">Total Value</h3></div>
                                        <p className="text-lg font-bold text-gray-200">{formatCurrency(totalProjectValue)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Stats */}
                            <div className="glass-panel p-4 border border-white/5 flex flex-col">
                                <h3 className="text-xs font-bold uppercase text-gray-500 mb-4">Inventory Stats</h3>
                                <div className="flex-1 min-h-[150px]">
                                    <LayoutStatsChart elements={layout.elements || []} />
                                </div>
                            </div>

                            {/* 3. Milestones */}
                            <div className="glass-panel p-0 border border-white/5 overflow-hidden flex flex-col max-h-[300px]">
                                <div className="overflow-y-auto custom-scrollbar h-full">
                                    <MilestoneList layout={layout} />
                                </div>
                            </div>

                            {/* 4. Documents */}
                            <div className="glass-panel p-4 border border-white/5 flex flex-col max-h-[300px]">
                                <div className="overflow-y-auto custom-scrollbar h-full">
                                    <DocumentList layout={layout} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* VISUALIZER (MOVED TO BOTTOM) */}
                    <div className="min-h-[600px] flex-1 flex flex-col border-t border-white/10 relative shrink-0">
                        {viewMode === 'grid' ? <InteractiveGrid layout={layout} /> : <InteractiveMap layout={layout} />}
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="col-span-12 lg:col-span-3 bg-[#121214] h-full overflow-hidden flex flex-col border-t lg:border-t-0 border-white/10">
                    <div className="p-4 border-b border-white/5 bg-[#121214] shrink-0">
                        <h3 className="text-xs font-bold uppercase text-gray-400 flex items-center gap-2"><Users size={14} /> Customer Registry</h3>
                        <p className="text-[10px] text-gray-600 mt-1">Showing {activeCustomers.length} registered owners</p>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2 pb-20">
                        {activeCustomers.length === 0 ? (
                            <div className="text-center py-10 opacity-50"><Users size={32} className="mx-auto mb-2 text-gray-600" /><p className="text-xs text-gray-500">No customers yet</p></div>
                        ) : (
                            activeCustomers.map((p, i) => (
                                <div key={i} onClick={() => setActiveCustomerIndex(p.originalIndex)} className="glass-panel p-3 cursor-pointer hover:bg-white/5 transition border-l-2 border-transparent hover:border-brand group relative">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-[10px] font-bold text-brand bg-brand/10 px-1.5 py-0.5 rounded">{p.id}</span>
                                            <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${p.status === 'sold' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>{p.status}</span>
                                        </div>
                                    </div>
                                    <h4 className="text-sm font-bold text-gray-200 group-hover:text-white truncate">{p.customerName}</h4>
                                    <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-1">{p.customerPhone || "No Phone"}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>

            {/* MODALS */}
            {activeCustomerIndex !== null && <CustomerModal layout={layout} index={activeCustomerIndex} data={layout.elements[activeCustomerIndex]} onClose={() => setActiveCustomerIndex(null)} />}
            
            {/* Report Modal */}
            {isReportModalOpen && <ReportModal layout={layout} onClose={() => setReportModalOpen(false)} />}
        </div>
    );
};

export default InteractiveLayoutPage;