import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, TreePine, Tag, Type } from 'lucide-react';

const NewInfraModal = ({ points, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        category: 'Road' // Default
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name) return alert("Name is required");
        onSave({ ...formData, points });
    };

    return createPortal(
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
            <div className="glass-panel w-full max-w-sm bg-[#121214] border border-white/10 shadow-2xl rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#18181b]">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        <TreePine size={16} className="text-emerald-500"/> Add Infrastructure
                    </h2>
                    <button onClick={onCancel}><X size={20} className="text-gray-500 hover:text-white"/></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    
                    {/* Name */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                            <Tag size={12}/> Name / Label *
                        </label>
                        <input 
                            autoFocus
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-emerald-500 outline-none placeholder:text-gray-600"
                            placeholder="e.g. 40ft Main Road, Central Park"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                    </div>

                    {/* Category */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                            <Type size={12}/> Category
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {['Road', 'Park', 'Amenity'].map(cat => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setFormData({...formData, category: cat})}
                                    className={`py-2 rounded-lg text-xs font-bold border transition ${
                                        formData.category === cat 
                                        ? (cat === 'Road' ? 'bg-gray-600/20 border-gray-500 text-gray-300' : cat === 'Park' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-purple-600/20 border-purple-500 text-purple-400')
                                        : 'bg-black/40 border-white/5 text-gray-500 hover:border-white/20'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition mt-2 shadow-lg shadow-emerald-900/20">
                        <Save size={16}/> Save Element
                    </button>

                </form>
            </div>
        </div>,
        document.body
    );
};

export default NewInfraModal;