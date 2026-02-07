import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { addDoc, collection } from "firebase/firestore";
import { db } from '../../firebase';
import { Upload, X, Loader2 } from 'lucide-react';

const CreateLayoutModal = ({ user, currentLayoutCount, currentTotalPlots, onClose }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        count: 50,
        address: '',
        addressLink: ''
    });
    const [files, setFiles] = useState([]);

    // --- LIMITS ---
    const maxLayouts = user.limits?.maxLayouts || 1;
    const globalMaxPlots = user.limits?.maxPlots || 50; 
    
    // Calculate remaining plots available globally
    const remainingPlots = globalMaxPlots - currentTotalPlots;

    // --- FIXED: Append new files instead of replacing ---
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            // Append new files to the existing list
            setFiles(prevFiles => [...prevFiles, ...Array.from(e.target.files)]);
        }
    };

    const removeFile = (idx) => {
        setFiles(files.filter((_, i) => i !== idx));
    };

    const handleCreate = async () => {
        // 1. Check Layout Count
        if (currentLayoutCount >= maxLayouts) {
            return alert(`Plan Limit Reached: You can only create ${maxLayouts} layouts.`);
        }

        if (!formData.name) return alert("Layout name is required.");

        const requestedPlots = Number(formData.count);

        // 2. GLOBAL PLOT CHECK (Total Used + New Request > Global Max)
        if ((currentTotalPlots + requestedPlots) > globalMaxPlots) {
            return alert(`Global Limit Exceeded. \n\nYou have used ${currentTotalPlots} plots.\nYour limit is ${globalMaxPlots}.\nYou can only add ${remainingPlots} more plots.`);
        }

        setIsLoading(true);

        try {
            // Process Files
            const processedDocs = await Promise.all(files.map(file => {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve({ name: file.name, url: e.target.result });
                    reader.readAsDataURL(file);
                });
            }));

            // Generate Plots
            const elements = Array.from({ length: requestedPlots }, (_, i) => ({ 
                id: `P-${i+1}`, status: 'open', price: '', type: 'plot' 
            }));

            // Save
            await addDoc(collection(db, "layouts"), {
                ...formData,
                count: requestedPlots,
                devId: user.id, 
                elements, 
                milestones: [], 
                docs: processedDocs,
                createdAt: new Date() 
            });

            onClose();
        } catch (e) {
            alert("Error creating layout: " + e.message);
        }
        setIsLoading(false);
    };

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="glass-panel w-full max-w-lg p-6 bg-[#121214] border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-white">Create New Layout</h2>
                        {/* HELPER TEXT */}
                        <p className="text-[10px] text-gray-500 mt-1">
                            Global Capacity: <span className="text-white">{currentTotalPlots}</span> used of <span className="text-blue-400">{globalMaxPlots}</span> allowed.
                            <br/>
                            Available for this layout: <span className="text-green-400 font-bold">{remainingPlots}</span>
                        </p>
                    </div>
                    <button onClick={onClose}><X size={20} className="text-gray-500 hover:text-white" /></button>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Layout Name *</label>
                            <input 
                                className="w-full bg-black/40 border border-white/10 rounded p-2.5 text-sm text-white focus:border-blue-500 outline-none"
                                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                                placeholder="e.g. Green Valley Phase 1"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Total Plots *</label>
                            <input 
                                type="number"
                                className={`w-full bg-black/40 border rounded p-2.5 text-sm text-white focus:outline-none 
                                    ${Number(formData.count) > remainingPlots ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-blue-500'}`}
                                value={formData.count} 
                                onChange={e => setFormData({...formData, count: e.target.value})}
                                max={remainingPlots}
                            />
                            {Number(formData.count) > remainingPlots && (
                                <p className="text-[10px] text-red-500 mt-1">Exceeds remaining capacity ({remainingPlots})</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Project Address</label>
                        <textarea 
                            className="w-full bg-black/40 border border-white/10 rounded p-2.5 text-sm text-white focus:border-blue-500 outline-none min-h-[60px]"
                            value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}
                            placeholder="Full physical address..."
                        />
                    </div>

                    <div>
                        <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Google Maps Link</label>
                        <input 
                            className="w-full bg-black/40 border border-white/10 rounded p-2.5 text-sm text-blue-400 focus:border-blue-500 outline-none"
                            value={formData.addressLink} onChange={e => setFormData({...formData, addressLink: e.target.value})}
                            placeholder="http://maps.google.com..."
                        />
                    </div>

                    <div>
                        <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Project Documents</label>
                        <div className="border border-dashed border-white/20 rounded-lg p-4 bg-white/5 flex flex-col items-center justify-center relative cursor-pointer hover:bg-white/10 transition">
                            <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} />
                            <Upload size={20} className="text-gray-400 mb-2" />
                            <p className="text-xs text-gray-400">Click to upload brochures, legal docs, etc.</p>
                        </div>
                        
                        {/* Display list of selected files */}
                        {files.length > 0 && (
                            <div className="mt-2 space-y-1">
                                {files.map((f, i) => (
                                    <div key={i} className="flex justify-between items-center text-xs bg-white/5 p-2 rounded">
                                        <span className="truncate max-w-[200px]">{f.name}</span>
                                        <button onClick={() => removeFile(i)} className="text-red-400 hover:text-red-300"><X size={14} /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-white/10">
                        <button onClick={onClose} className="flex-1 bg-white/5 hover:bg-white/10 text-xs font-bold py-3 rounded text-gray-300 transition">Cancel</button>
                        <button 
                            onClick={handleCreate} 
                            disabled={isLoading || Number(formData.count) > remainingPlots} 
                            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-3 rounded transition flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={16} /> : "Create Layout"}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CreateLayoutModal;