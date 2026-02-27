import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Ruler, Compass, DollarSign, Tag, PlusSquare, Link as LinkIcon } from 'lucide-react';

// Notice we added `layout` to the props here!
const NewPlotModal = ({ points, layout, onSave, onCancel }) => {
    
    // Extract points and auto-size securely
    const pointsStr = typeof points === 'object' && points !== null ? points.points : points;
    const autoSize = typeof points === 'object' && points !== null ? points.calculatedSize : '';

    // --- NEW: Toggle State & Unassigned Plots Logic ---
    const [mode, setMode] = useState('new'); // 'new' or 'assign'
    const [selectedAssignId, setSelectedAssignId] = useState('');

    // Find all plots in the layout that do NOT have points assigned yet
    const unassignedPlots = (layout?.elements || []).filter(
        el => el.type === 'plot' && (!el.points || el.points.trim() === '')
    );

    const [formData, setFormData] = useState({
        id: '',
        size: autoSize || '', 
        facing: '',
        price: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        // MODE 1: ASSIGN TO EXISTING PLOT
        if (mode === 'assign') {
            if (!selectedAssignId) return alert("Please select a plot to assign.");
            
            const targetPlot = unassignedPlots.find(p => p.id === selectedAssignId);
            
            onSave({
                ...targetPlot,           // Keep all existing customer/payment data
                points: pointsStr,       // Attach the new SVG shape
                size: targetPlot.size || autoSize || '', // Add size if it didn't have one
                isUpdate: true           // FLAG FOR PARENT: Tells the parent to UPDATE, not ADD
            });
            return;
        }

        // MODE 2: CREATE COMPLETELY NEW PLOT
        if (!formData.id) return alert("Plot Number/ID is required");
        
        const newPlotData = {
            id: formData.id,
            size: formData.size,
            facing: formData.facing,
            price: formData.price,
            type: 'plot',        
            status: 'open',      
            points: pointsStr,
            isUpdate: false      // FLAG FOR PARENT: Tells the parent to ADD
        };

        onSave(newPlotData);
    };

    return createPortal(
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
            <div className="glass-panel w-full max-w-sm bg-[#121214] border border-white/10 shadow-2xl rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#18181b]">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        {mode === 'new' ? <PlusSquare size={16} className="text-blue-500"/> : <LinkIcon size={16} className="text-purple-500"/>}
                        {mode === 'new' ? 'New Plot Details' : 'Assign Plot Shape'}
                    </h2>
                    <button onClick={onCancel}><X size={20} className="text-gray-500 hover:text-white transition"/></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    
                    {/* --- TOGGLE BUTTONS --- */}
                    <div className="flex bg-black/40 border border-white/10 rounded-lg p-1">
                        <button 
                            type="button" 
                            onClick={() => setMode('new')} 
                            className={`flex-1 py-2 text-xs font-bold rounded-md transition ${mode === 'new' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                        >
                            Create New
                        </button>
                        <button 
                            type="button" 
                            onClick={() => setMode('assign')} 
                            className={`flex-1 py-2 text-xs font-bold rounded-md transition flex justify-center items-center gap-2 ${mode === 'assign' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                        >
                            Assign Existing
                            {unassignedPlots.length > 0 && (
                                <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{unassignedPlots.length}</span>
                            )}
                        </button>
                    </div>

                    {/* --- MODE: ASSIGN EXISTING --- */}
                    {mode === 'assign' ? (
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

                            <button 
                                type="submit" 
                                disabled={unassignedPlots.length === 0}
                                className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition mt-2 shadow-lg shadow-purple-900/20"
                            >
                                <Save size={16}/> Assign Shape to Plot
                            </button>
                        </div>
                    ) : (
                        /* --- MODE: CREATE NEW (Original Form) --- */
                        <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                            {/* Plot ID */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                                    <Tag size={12}/> Plot Number / ID *
                                </label>
                                <input 
                                    autoFocus
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-blue-500 outline-none font-bold placeholder:font-normal"
                                    placeholder="e.g. 101, A-45"
                                    value={formData.id}
                                    onChange={e => setFormData({...formData, id: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Size */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                        <Ruler size={12}/> Size (Sq.ft)
                                    </label>
                                    <input 
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
                                        placeholder="e.g. 1200"
                                        value={formData.size}
                                        onChange={e => setFormData({...formData, size: e.target.value})}
                                    />
                                </div>
                                {/* Facing */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                        <Compass size={12}/> Facing
                                    </label>
                                    <select 
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 outline-none appearance-none cursor-pointer"
                                        value={formData.facing}
                                        onChange={e => setFormData({...formData, facing: e.target.value})}
                                    >
                                        <option value="">Select</option>
                                        <option value="North">North</option>
                                        <option value="South">South</option>
                                        <option value="East">East</option>
                                        <option value="West">West</option>
                                        <option value="NE">North-East</option>
                                        <option value="NW">North-West</option>
                                        <option value="SE">South-East</option>
                                        <option value="SW">South-West</option>
                                    </select>
                                </div>
                            </div>

                            {/* Price */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-green-500 uppercase tracking-wider flex items-center gap-1">
                                    <DollarSign size={12}/> Price (₹)
                                </label>
                                <input 
                                    type="number"
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-green-500 outline-none font-mono"
                                    placeholder="0.00"
                                    value={formData.price}
                                    onChange={e => setFormData({...formData, price: e.target.value})}
                                />
                            </div>

                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition mt-2 shadow-lg shadow-blue-900/20">
                                <Save size={16}/> Save Plot
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>,
        document.body
    );
};

export default NewPlotModal;