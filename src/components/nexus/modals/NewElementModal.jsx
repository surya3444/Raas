import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Ruler, Compass, DollarSign, Tag, TreePine, Layout, Type, Link as LinkIcon } from 'lucide-react';

// --- UTILITY: Convert Number to Words (Indian Format) ---
const numberToWords = (num) => {
    const val = Number(num);
    if (!val || isNaN(val) || val === 0) return '';
    
    const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

    const n = ('000000000' + val).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';

    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';

    return str ? str.trim() + ' only' : '';
};

const NewElementModal = ({ points, layout, onSave, onCancel }) => {
    
    // --- SAFELY EXTRACT DATA ---
    const pointsStr = typeof points === 'object' && points !== null ? points.points : points;
    const autoSize = typeof points === 'object' && points !== null ? points.calculatedSize : '';

    // --- STATES ---
    const [activeTab, setActiveTab] = useState('plot'); // 'plot' or 'infra'
    const [plotMode, setPlotMode] = useState('new'); // 'new' or 'assign'
    
    const [selectedAssignId, setSelectedAssignId] = useState('');
    const [plotData, setPlotData] = useState({ id: '', size: autoSize || '', facing: '', price: '' });
    const [infraData, setInfraData] = useState({ name: '', category: 'Road' });

    // --- BUG FIX: Safely find unassigned plots without crashing on arrays/objects ---
    const unassignedPlots = (layout?.elements || []).filter(el => {
        if (el.type !== 'plot') return false;
        if (!el.points) return true; 
        if (typeof el.points === 'string') return el.points.trim() === ''; 
        if (Array.isArray(el.points)) return el.points.length === 0; 
        return false;
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (activeTab === 'plot') {
            if (plotMode === 'assign') {
                // MODE: ASSIGN TO EXISTING PLOT
                if (!selectedAssignId) return alert("Please select a plot to assign.");
                
                const targetPlot = unassignedPlots.find(p => p.id === selectedAssignId);
                
                onSave({
                    ...targetPlot,           
                    points: pointsStr,       
                    size: targetPlot.size || plotData.size || autoSize || '', 
                    isUpdate: true           
                });
            } else {
                // MODE: CREATE NEW PLOT
                if (!plotData.id) return alert("Plot ID is required");
                onSave({
                    type: 'plot',
                    status: 'open',
                    ...plotData,
                    points: pointsStr,
                    isUpdate: false
                });
            }
        } else {
            // MODE: CREATE INFRASTRUCTURE
            if (!infraData.name) return alert("Infra Name is required");
            onSave({
                type: 'infra',
                ...infraData,
                points: pointsStr,
                isUpdate: false
            });
        }
    };

    // --- DYNAMIC SUBMIT BUTTON STYLING ---
    let btnText = "Save Element";
    let btnColor = "bg-blue-600 hover:bg-blue-500 shadow-blue-900/20";
    
    if (activeTab === 'plot') {
        if (plotMode === 'assign') {
            btnText = "Assign Shape to Plot";
            btnColor = "bg-purple-600 hover:bg-purple-500 shadow-purple-900/20";
        } else {
            btnText = "Save Plot";
            btnColor = "bg-blue-600 hover:bg-blue-500 shadow-blue-900/20";
        }
    } else {
        btnText = "Save Infrastructure";
        btnColor = "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20";
    }

    const isAssignDisabled = activeTab === 'plot' && plotMode === 'assign' && unassignedPlots.length === 0;

    return createPortal(
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
            <div className="glass-panel w-full max-w-sm bg-[#121214] border border-white/10 shadow-2xl rounded-2xl overflow-hidden">
                
                {/* Header & Tabs */}
                <div className="bg-[#18181b] border-b border-white/10">
                    <div className="flex justify-between items-center p-4">
                        <h2 className="text-sm font-bold text-white flex items-center gap-2">
                            {activeTab === 'plot' ? <Layout size={16} className="text-blue-500"/> : <TreePine size={16} className="text-emerald-500"/>}
                            New Element
                        </h2>
                        <button onClick={onCancel}><X size={20} className="text-gray-500 hover:text-white"/></button>
                    </div>
                    
                    {/* Main Tab Switcher */}
                    <div className="grid grid-cols-2 px-4 pb-4 gap-2">
                        <button 
                            onClick={() => setActiveTab('plot')}
                            className={`py-2 text-xs font-bold rounded-lg transition border ${activeTab === 'plot' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'}`}
                        >
                            Plot
                        </button>
                        <button 
                            onClick={() => setActiveTab('infra')}
                            className={`py-2 text-xs font-bold rounded-lg transition border ${activeTab === 'infra' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'}`}
                        >
                            Infrastructure
                        </button>
                    </div>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    
                    {/* ======================= */}
                    {/* PLOT FORM         */}
                    {/* ======================= */}
                    {activeTab === 'plot' && (
                        <div className="space-y-4">
                            
                            {/* Toggle New vs Assign */}
                            <div className="flex bg-black/40 border border-white/10 rounded-lg p-1">
                                <button 
                                    type="button" 
                                    onClick={() => setPlotMode('new')} 
                                    className={`flex-1 py-2 text-xs font-bold rounded-md transition ${plotMode === 'new' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                                >
                                    Create New
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setPlotMode('assign')} 
                                    className={`flex-1 py-2 text-xs font-bold rounded-md transition flex justify-center items-center gap-2 ${plotMode === 'assign' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                                >
                                    Assign Existing
                                    {unassignedPlots.length > 0 && (
                                        <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{unassignedPlots.length}</span>
                                    )}
                                </button>
                            </div>

                            {plotMode === 'assign' ? (
                                // --- PLOT: ASSIGN EXISTING ---
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                    {unassignedPlots.length === 0 ? (
                                        <div className="text-center py-6 px-4 bg-white/5 border border-white/10 rounded-lg border-dashed">
                                            <p className="text-sm font-bold text-gray-400">All caught up!</p>
                                            <p className="text-xs text-gray-500 mt-1">There are no plots waiting for a map shape.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                                                <LinkIcon size={12}/> Select Plot to Link *
                                            </label>
                                            <select 
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-3 text-sm text-white focus:border-purple-500 outline-none appearance-none cursor-pointer"
                                                value={selectedAssignId}
                                                onChange={e => setSelectedAssignId(e.target.value)}
                                            >
                                                <option value="">-- Choose a Plot --</option>
                                                {unassignedPlots.map(p => (
                                                    <option key={p.id} value={p.id}>
                                                        Plot {p.id} {p.customerName ? `(${p.customerName})` : ''} - {p.status.toUpperCase()}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                // --- PLOT: CREATE NEW ---
                                <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1"><Tag size={12}/> Plot Number / ID *</label>
                                        <input autoFocus className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-blue-500 outline-none font-bold placeholder:font-normal" placeholder="e.g. 101, A-45"
                                            value={plotData.id} onChange={e => setPlotData({...plotData, id: e.target.value})} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1"><Ruler size={12}/> Size (Sq.ft)</label>
                                            <input className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 outline-none" placeholder="e.g. 1200"
                                                value={plotData.size} onChange={e => setPlotData({...plotData, size: e.target.value})} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1"><Compass size={12}/> Facing</label>
                                            <select className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 outline-none appearance-none cursor-pointer"
                                                value={plotData.facing} onChange={e => setPlotData({...plotData, facing: e.target.value})} >
                                                <option value="">Select</option><option value="North">North</option><option value="South">South</option><option value="East">East</option><option value="West">West</option><option value="NE">NE</option><option value="NW">NW</option><option value="SE">SE</option><option value="SW">SW</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-green-500 uppercase tracking-wider flex items-center gap-1"><DollarSign size={12}/> Price (₹)</label>
                                        <input type="number" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-green-500 outline-none font-mono" placeholder="0.00"
                                            value={plotData.price} onChange={e => setPlotData({...plotData, price: e.target.value})} />
                                        {/* --- NEW: Price in Words Display --- */}
                                        {plotData.price && Number(plotData.price) > 0 && (
                                            <p className="text-[10px] text-green-400 mt-1 italic capitalize pl-1">
                                                {numberToWords(plotData.price)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ======================= */}
                    {/* INFRA FORM         */}
                    {/* ======================= */}
                    {activeTab === 'infra' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1"><Tag size={12}/> Name / Label *</label>
                                <input autoFocus className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-emerald-500 outline-none" placeholder="e.g. Main Road, Park A"
                                    value={infraData.name} onChange={e => setInfraData({...infraData, name: e.target.value})} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1"><Type size={12}/> Category</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['Road', 'Park', 'Amenity'].map(cat => (
                                        <button key={cat} type="button" onClick={() => setInfraData({...infraData, category: cat})}
                                            className={`py-2 rounded-lg text-xs font-bold border transition ${infraData.category === cat ? (cat === 'Road' ? 'bg-gray-600/20 border-gray-500 text-gray-300' : cat === 'Park' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-purple-600/20 border-purple-500 text-purple-400') : 'bg-black/40 border-white/5 text-gray-500 hover:border-white/20'}`}>
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={isAssignDisabled}
                        className={`w-full text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition mt-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${btnColor}`}
                    >
                        <Save size={16}/> {btnText}
                    </button>

                </form>
            </div>
        </div>,
        document.body
    );
};

export default NewElementModal;