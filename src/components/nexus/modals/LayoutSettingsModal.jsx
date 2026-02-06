import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { updateDoc, doc } from "firebase/firestore";
import { db } from '../../../firebase';
import { X, Save, Upload, Trash2, FileText, MapPin, Link as LinkIcon, Type } from 'lucide-react';

const LayoutSettingsModal = ({ layout, onClose }) => {
    const [formData, setFormData] = useState({
        name: layout.name || '',
        address: layout.address || '',
        addressLink: layout.addressLink || ''
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveInfo = async () => {
        setIsSaving(true);
        try {
            await updateDoc(doc(db, "layouts", layout.id), formData);
            alert("Project details updated!");
        } catch(e) {
            alert("Error: " + e.message);
        }
        setIsSaving(false);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
            const newDoc = { name: file.name, url: ev.target.result, date: new Date().toISOString() };
            await updateDoc(doc(db, "layouts", layout.id), { docs: [...(layout.docs || []), newDoc] });
        };
        reader.readAsDataURL(file);
    };

    const handleDeleteDoc = async (idx) => {
        if (!confirm("Remove this document?")) return;
        const updatedDocs = layout.docs.filter((_, i) => i !== idx);
        await updateDoc(doc(db, "layouts", layout.id), { docs: updatedDocs });
    };

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="glass-panel w-full max-w-lg bg-[#121214] border border-white/10 shadow-2xl flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-5 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-white">Project Settings</h2>
                    <button onClick={onClose}><X size={20} className="text-gray-500 hover:text-white"/></button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
                    
                    {/* 1. General Info */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">General Information</h3>
                        <div className="space-y-3">
                            <div className="relative">
                                <Type className="absolute left-3 top-3 text-gray-500" size={16} />
                                <input 
                                    className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 pl-10 pr-3 text-sm text-white focus:border-blue-500 outline-none"
                                    placeholder="Project Name"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 text-gray-500" size={16} />
                                <textarea 
                                    className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 pl-10 pr-3 text-sm text-white focus:border-blue-500 outline-none min-h-[80px]"
                                    placeholder="Full Address"
                                    value={formData.address}
                                    onChange={e => setFormData({...formData, address: e.target.value})}
                                />
                            </div>
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-3 text-gray-500" size={16} />
                                <input 
                                    className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 pl-10 pr-3 text-sm text-blue-400 focus:border-blue-500 outline-none"
                                    placeholder="Google Maps Link"
                                    value={formData.addressLink}
                                    onChange={e => setFormData({...formData, addressLink: e.target.value})}
                                />
                            </div>
                            <button onClick={handleSaveInfo} disabled={isSaving} className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-2 rounded-lg text-xs transition border border-white/5">
                                {isSaving ? "Saving..." : "Update Information"}
                            </button>
                        </div>
                    </div>

                    {/* 2. Project Documents */}
                    <div className="space-y-4 pt-4 border-t border-white/10">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Project Documents</h3>
                            <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-2 transition">
                                <Upload size={12} /> Upload
                                <input type="file" className="hidden" onChange={handleFileUpload} />
                            </label>
                        </div>

                        <div className="space-y-2">
                            {(layout.docs || []).length === 0 ? <p className="text-xs text-gray-600 italic">No master documents uploaded.</p> : (
                                (layout.docs || []).map((d, i) => (
                                    <div key={i} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5 group">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="bg-blue-500/20 p-2 rounded text-blue-400"><FileText size={16}/></div>
                                            <div className="min-w-0">
                                                <p className="text-xs text-white font-bold truncate">{d.name}</p>
                                                <p className="text-[10px] text-gray-500">{new Date(d.date || Date.now()).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteDoc(i)} className="text-gray-500 hover:text-red-500 p-2"><Trash2 size={16}/></button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default LayoutSettingsModal;