import React, { useEffect, useState } from 'react';
import { Share2, User, FileText, Plus, Upload, Download, Phone, Compass, Ruler, Lock, Trash2 } from 'lucide-react';

const InspectorPanel = ({ 
    layout, 
    selectedId, 
    onUpdate, 
    onClose, 
    onShare,
    isPublicView = false,     
    showPublicPrice = true    
}) => {
    const [data, setData] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (selectedId && layout) {
            const el = layout.elements.find(e => e.id === selectedId);
            if (el) setData({ ...el });
        } else {
            setData(null);
        }
    }, [selectedId, layout]);

    if (!data) return <div className="p-10 text-center text-gray-500 text-xs">Select a plot to view details</div>;

    const handleChange = (field, value) => {
        if (isPublicView) return; 
        setData(prev => ({ ...prev, [field]: value }));
    };
    
    const handleSave = async () => {
        if (isPublicView) return; 
        setIsSaving(true);
        await onUpdate(data); 
        setIsSaving(false);
    };

    const handleDocUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
            const newDoc = { name: file.name, url: ev.target.result, date: new Date().toISOString() };
            const newData = { ...data, documents: [...(data.documents || []), newDoc] };
            setData(newData);
            await onUpdate(newData);
        };
        reader.readAsDataURL(file);
    };

    const deleteDoc = async (idx) => {
        if(!confirm("Delete document?")) return;
        const updatedDocs = data.documents.filter((_, i) => i !== idx);
        const newData = { ...data, documents: updatedDocs };
        setData(newData);
        await onUpdate(newData);
    };

    return (
        <div className="p-0 space-y-6">
            
            {/* 1. HEADER & SHARE */}
            {!isPublicView && (
                <div className="flex gap-2 mb-2">
                    <button onClick={() => onShare(data)} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition">
                        <Share2 size={14} /> Share Plot
                    </button>
                </div>
            )}

            {/* 2. MAIN DETAILS CARD */}
            <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/5 relative">
                {isPublicView && <div className="absolute top-2 right-2 opacity-20"><Lock size={12}/></div>}
                
                {/* Status Toggle */}
                <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-400">Status</span>
                    <div className="flex gap-1 bg-black/40 p-1 rounded-lg">
                        {['open', 'booked', 'sold'].map(s => (
                            <button 
                                key={s}
                                onClick={() => { if(!isPublicView) { const newData = {...data, status: s}; setData(newData); onUpdate(newData); }}}
                                disabled={isPublicView}
                                className={`px-2 py-1 rounded text-[9px] font-bold uppercase transition ${data.status === s ? (s === 'sold' ? 'bg-green-500 text-black' : s === 'booked' ? 'bg-yellow-500 text-black' : 'bg-gray-600 text-white') : 'text-gray-500 hover:text-white'} ${isPublicView ? 'cursor-default' : ''}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* Price */}
                {(showPublicPrice || !isPublicView) && (
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Price (₹)</label>
                        <input 
                            type="number"
                            readOnly={isPublicView}
                            className={`w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm font-mono focus:border-blue-500 outline-none ${isPublicView ? 'text-gray-400' : ''}`}
                            value={data.price || ''} 
                            onChange={e => handleChange('price', e.target.value)}
                            onBlur={handleSave}
                            placeholder={isPublicView && !data.price ? "Contact for Price" : "0.00"} 
                        />
                    </div>
                )}

                {/* Dimensions & Facing */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1 flex items-center gap-1"><Ruler size={10}/> Dimensions</label>
                        <input 
                            readOnly={isPublicView}
                            className={`w-full bg-black/40 border border-white/10 rounded p-2 text-white text-xs focus:border-blue-500 outline-none ${isPublicView ? 'text-gray-400' : ''}`}
                            placeholder={!isPublicView ? "e.g. 30x40" : "-"}
                            value={data.dimensions || ''} 
                            onChange={e => handleChange('dimensions', e.target.value)}
                            onBlur={handleSave} 
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1 flex items-center gap-1"><Compass size={10}/> Facing</label>
                        <select 
                            disabled={isPublicView}
                            className={`w-full bg-black/40 border border-white/10 rounded p-2 text-white text-xs focus:border-blue-500 outline-none ${isPublicView ? 'text-gray-400' : ''}`}
                            value={data.facing || ''} 
                            onChange={e => { handleChange('facing', e.target.value); handleSave(); }} 
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
            </div>

            {/* 3. CUSTOMER DETAILS (Visible to Admin ALWAYS, Hidden in Public) */}
            {!isPublicView && (
                <div className={`p-4 rounded-xl border transition-all duration-300 ${data.status === 'open' ? 'bg-white/5 border-white/5 opacity-70 hover:opacity-100' : 'bg-blue-900/10 border-blue-500/20'}`}>
                    <h3 className="text-[10px] font-bold text-blue-400 uppercase flex items-center gap-2 mb-3">
                        <User size={12}/> {data.status === 'open' ? 'Customer Info (Optional)' : 'Owner Details'}
                    </h3>
                    <div className="space-y-3">
                        <input 
                            className="w-full bg-black/20 border border-white/10 rounded p-2 text-sm text-white placeholder:text-gray-600 focus:border-blue-500 outline-none"
                            placeholder="Customer Name"
                            value={data.customerName || ''}
                            onChange={e => handleChange('customerName', e.target.value)}
                            onBlur={handleSave}
                        />
                        <div className="relative">
                            <Phone className="absolute left-2.5 top-2.5 text-gray-500" size={14} />
                            <input 
                                className="w-full bg-black/20 border border-white/10 rounded p-2 pl-8 text-sm text-white placeholder:text-gray-600 focus:border-blue-500 outline-none"
                                placeholder="Phone Number"
                                value={data.customerPhone || ''}
                                onChange={e => handleChange('customerPhone', e.target.value)}
                                onBlur={handleSave}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* 4. PLOT DOCUMENTS (COMPLETELY HIDDEN IN PUBLIC MODE) */}
            {!isPublicView && (
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <h3 className="text-[10px] font-bold text-gray-500 uppercase">Plot Documents</h3>
                        <label className="cursor-pointer text-[10px] bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded flex items-center gap-1 transition">
                            <Plus size={10} /> Upload
                            <input type="file" className="hidden" onChange={handleDocUpload} /> 
                        </label>
                    </div>
                    
                    <div className="space-y-1">
                        {(data.documents || []).length === 0 ? <p className="text-[10px] text-gray-600 italic">No files attached.</p> : (
                            data.documents.map((doc, i) => (
                                <div key={i} className="flex items-center justify-between bg-white/5 p-2 rounded border border-white/5 group">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <FileText size={12} className="text-blue-400 flex-shrink-0" />
                                        <span className="text-[10px] text-gray-300 truncate max-w-[150px]">{doc.name}</span>
                                    </div>
                                    <div className="flex gap-1 opacity-50 group-hover:opacity-100 transition">
                                        <a href={doc.url} download={doc.name} className="p-1 hover:text-blue-400"><Download size={12}/></a>
                                        <button onClick={() => deleteDoc(i)} className="p-1 hover:text-red-400"><Trash2 size={12}/></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {!isPublicView && (
                <button onClick={handleSave} disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg text-xs transition shadow-lg shadow-blue-900/20">
                    {isSaving ? "Syncing..." : "Save Changes"}
                </button>
            )}
        </div>
    );
};

export default InspectorPanel;