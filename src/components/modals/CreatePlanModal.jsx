import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../../firebase';
import { collection, addDoc } from "firebase/firestore";
import { X, Loader2 } from 'lucide-react';

const CreatePlanModal = ({ onClose }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '', validity: 365, maxLogins: 3, maxLayouts: 5, maxPlots: 500, maintenanceCharges: 0
    });
    const [features, setFeatures] = useState({
        interactive: false, grid: false, upload: false
    });

    const handleSave = async () => {
        if(!formData.name) return alert("Plan name is required");
        setLoading(true);

        const featureList = [];
        if(features.interactive) featureList.push('Interactive Layout');
        if(features.grid) featureList.push('Grid View');
        if(features.upload) featureList.push('Map Upload');

        try {
            await addDoc(collection(db, "plans"), {
                ...formData,
                features: featureList,
                createdAt: new Date()
            });
            onClose();
        } catch (error) {
            alert("Error: " + error.message);
        }
        setLoading(false);
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="glass-panel w-full max-w-lg p-6 bg-[#121214] m-4 relative border border-white/10 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-white">Create Subscription Plan</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
                </div>
                
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Plan Name</label>
                            <input className="form-input" placeholder="e.g. Gold Tier" onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Validity (Days)</label>
                            <input type="number" className="form-input" defaultValue={365} onChange={e => setFormData({...formData, validity: parseInt(e.target.value)})} />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Max Logins</label>
                            <input type="number" className="form-input" defaultValue={3} onChange={e => setFormData({...formData, maxLogins: parseInt(e.target.value)})} />
                        </div>
                        <div className="col-span-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Maintenance Charges</label>
                            <input type="number" className="form-input" placeholder="e.g. 5000" onChange={e => setFormData({...formData, maintenanceCharges: Number(e.target.value)})} />
                        </div>
                    </div>

                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                        <p className="text-[10px] font-bold text-brand uppercase mb-3">Resource Limits</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] text-gray-400 block mb-1">Max Layouts</label>
                                <input type="number" className="form-input" defaultValue={5} onChange={e => setFormData({...formData, maxLayouts: parseInt(e.target.value)})} />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-400 block mb-1">Max Plots (Global)</label>
                                <input type="number" className="form-input" defaultValue={500} onChange={e => setFormData({...formData, maxPlots: parseInt(e.target.value)})} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 pt-2">
                        <p className="text-[10px] font-bold text-gray-500 uppercase">Features Enabled</p>
                        
                        <label className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition cursor-pointer">
                            <span className="text-sm">Interactive Layout (Draw)</span>
                            <input type="checkbox" className="toggle-checkbox" onChange={e => setFeatures({...features, interactive: e.target.checked})} />
                        </label>
                        
                        <label className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition cursor-pointer">
                            <span className="text-sm">Grid View Table</span>
                            <input type="checkbox" className="toggle-checkbox" onChange={e => setFeatures({...features, grid: e.target.checked})} />
                        </label>
                        
                        <label className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition cursor-pointer">
                            <span className="text-sm">Map Image Upload</span>
                            <input type="checkbox" className="toggle-checkbox" onChange={e => setFeatures({...features, upload: e.target.checked})} />
                        </label>
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
                        <button onClick={handleSave} disabled={loading} className="bg-brand text-white px-6 py-2 rounded-lg text-sm font-bold shadow-lg flex items-center gap-2">
                            {loading ? <Loader2 className="animate-spin" size={16} /> : "Save Plan"}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CreatePlanModal;