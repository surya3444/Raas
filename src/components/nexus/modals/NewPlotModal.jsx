import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Ruler, Compass, DollarSign, Tag, PlusSquare } from 'lucide-react';

const NewPlotModal = ({ points, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        id: '',
        dimensions: '',
        facing: '',
        price: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.id) return alert("Plot Number/ID is required");
        onSave({ ...formData, points });
    };

    return createPortal(
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
            <div className="glass-panel w-full max-w-sm bg-[#121214] border border-white/10 shadow-2xl rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#18181b]">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        <PlusSquare size={16} className="text-blue-500"/> New Plot Details
                    </h2>
                    <button onClick={onCancel}><X size={20} className="text-gray-500 hover:text-white"/></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    
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
                        {/* Dimensions */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                <Ruler size={12}/> Dimensions
                            </label>
                            <input 
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
                                placeholder="30x40"
                                value={formData.dimensions}
                                onChange={e => setFormData({...formData, dimensions: e.target.value})}
                            />
                        </div>
                        {/* Facing */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                <Compass size={12}/> Facing
                            </label>
                            <select 
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 outline-none appearance-none"
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

                </form>
            </div>
        </div>,
        document.body
    );
};

export default NewPlotModal;