import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Ruler, Compass, DollarSign, Tag, TreePine, Layout, Type } from 'lucide-react';

const NewElementModal = ({ points, onSave, onCancel }) => {
    const [activeTab, setActiveTab] = useState('plot'); // Default to 'plot'

    // Form States
    const [plotData, setPlotData] = useState({ id: '', dimensions: '', facing: '', price: '' });
    const [infraData, setInfraData] = useState({ name: '', category: 'Road' });

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (activeTab === 'plot') {
            if (!plotData.id) return alert("Plot ID is required");
            onSave({
                type: 'plot',
                ...plotData,
                points
            });
        } else {
            if (!infraData.name) return alert("Infra Name is required");
            onSave({
                type: 'infra',
                ...infraData,
                points
            });
        }
    };

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
                    
                    {/* Tab Switcher */}
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
                    
                    {/* --- PLOT FORM --- */}
                    {activeTab === 'plot' && (
                        <>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1"><Tag size={12}/> Plot Number / ID *</label>
                                <input autoFocus className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-blue-500 outline-none font-bold" placeholder="e.g. 101, A-45"
                                    value={plotData.id} onChange={e => setPlotData({...plotData, id: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1"><Ruler size={12}/> Dimensions</label>
                                    <input className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 outline-none" placeholder="30x40"
                                        value={plotData.dimensions} onChange={e => setPlotData({...plotData, dimensions: e.target.value})} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1"><Compass size={12}/> Facing</label>
                                    <select className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 outline-none appearance-none"
                                        value={plotData.facing} onChange={e => setPlotData({...plotData, facing: e.target.value})} >
                                        <option value="">Select</option><option value="North">North</option><option value="South">South</option><option value="East">East</option><option value="West">West</option><option value="NE">NE</option><option value="NW">NW</option><option value="SE">SE</option><option value="SW">SW</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-green-500 uppercase tracking-wider flex items-center gap-1"><DollarSign size={12}/> Price (₹)</label>
                                <input type="number" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-green-500 outline-none font-mono" placeholder="0.00"
                                    value={plotData.price} onChange={e => setPlotData({...plotData, price: e.target.value})} />
                            </div>
                        </>
                    )}

                    {/* --- INFRA FORM --- */}
                    {activeTab === 'infra' && (
                        <>
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
                        </>
                    )}

                    <button type="submit" className={`w-full text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition mt-2 shadow-lg ${activeTab === 'plot' ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20'}`}>
                        <Save size={16}/> {activeTab === 'plot' ? 'Save Plot' : 'Save Infrastructure'}
                    </button>

                </form>
            </div>
        </div>,
        document.body
    );
};

export default NewElementModal;