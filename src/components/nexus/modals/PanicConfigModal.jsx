import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { updateDoc, doc } from "firebase/firestore";
import { db } from '../../../firebase';
import { useNexus } from '../../../context/NexusContext';
import { X, ShieldAlert, Save } from 'lucide-react';

const PanicConfigModal = ({ onClose }) => {
    const { user, configData, triggerPanic } = useNexus();
    const [formData, setFormData] = useState({ 
        dummyRevenue: configData.dummyRevenue, 
        dummyName: configData.dummyName 
    });

    const handleSaveConfig = async () => {
        await updateDoc(doc(db, "settings", user.id), formData);
        alert("Configuration Saved");
    };

    const handleActivate = async () => {
        if(confirm("ACTIVATE PANIC PROTOCOL? This will instantly switch all views to dummy data.")) {
            await triggerPanic();
            onClose();
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <div className="glass-panel w-full max-w-sm p-6 bg-[#0e0e10] border-red-500/30 border shadow-2xl relative overflow-hidden">
                
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-red-500 flex items-center gap-2">
                        <ShieldAlert size={20} /> Security Protocol
                    </h2>
                    <button onClick={onClose}><X size={20} className="text-gray-500 hover:text-white" /></button>
                </div>

                <div className="space-y-4">
                    <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                        <p className="text-xs text-gray-400 mb-3">Safe Mode Data Configuration</p>
                        <div className="space-y-2">
                            <input 
                                type="number" 
                                className="w-full bg-black/40 border border-white/10 rounded p-2.5 text-sm text-white"
                                placeholder="Safe Revenue Value"
                                value={formData.dummyRevenue}
                                onChange={e => setFormData({...formData, dummyRevenue: e.target.value})}
                            />
                            <input 
                                type="text" 
                                className="w-full bg-black/40 border border-white/10 rounded p-2.5 text-sm text-white"
                                placeholder="Safe Client Name"
                                value={formData.dummyName}
                                onChange={e => setFormData({...formData, dummyName: e.target.value})}
                            />
                        </div>
                        <button onClick={handleSaveConfig} className="w-full mt-3 bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-2 rounded flex items-center justify-center gap-2">
                            <Save size={12} /> Save Config
                        </button>
                    </div>

                    <div className="h-px bg-white/10"></div>

                    <button 
                        onClick={handleActivate}
                        className="w-full bg-red-900/50 hover:bg-red-800/50 text-red-400 py-4 rounded-xl text-sm font-bold border border-red-900/50 animate-pulse flex flex-col items-center justify-center gap-1 shadow-[0_0_20px_rgba(220,38,38,0.2)]"
                    >
                        <ShieldAlert size={24} />
                        ACTIVATE PANIC MODE
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default PanicConfigModal;