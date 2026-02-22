import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from '../../../firebase';
import { X, Loader2, ShieldCheck, Map, User, Mail, Lock } from 'lucide-react';

const CreateManagerModal = ({ developer, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [availableLayouts, setAvailableLayouts] = useState([]);
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        assignedLayouts: [] // Array of Layout IDs
    });

    // 1. Fetch all layouts belonging to this Developer
    useEffect(() => {
        const fetchLayouts = async () => {
            try {
                const q = query(collection(db, "layouts"), where("devId", "==", developer.id));
                const snap = await getDocs(q);
                const layouts = snap.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
                setAvailableLayouts(layouts);
            } catch (error) {
                console.error("Error fetching layouts:", error);
            }
        };
        fetchLayouts();
    }, [developer.id]);

    // 2. Handle Checkbox Toggle
    const toggleLayout = (layoutId) => {
        setFormData(prev => {
            const isSelected = prev.assignedLayouts.includes(layoutId);
            if (isSelected) {
                return { ...prev, assignedLayouts: prev.assignedLayouts.filter(id => id !== layoutId) };
            } else {
                return { ...prev, assignedLayouts: [...prev.assignedLayouts, layoutId] };
            }
        });
    };

    // 3. Save Manager to 'users' collection
    const handleCreateManager = async () => {
        if (!formData.name || !formData.email || !formData.password) {
            return alert("Please fill all required fields.");
        }
        if (formData.assignedLayouts.length === 0) {
            return alert("Please assign at least one layout to this manager.");
        }

        setLoading(true);
        try {
            await addDoc(collection(db, "users"), {
                name: formData.name,
                email: formData.email,
                password: formData.password, // Storing as requested by your current auth setup
                role: 'manager',             // CRITICAL: New Role
                parentId: developer.id,      // Links manager to this developer
                parentName: developer.name,
                assignedLayouts: formData.assignedLayouts,
                limits: {
                    features: developer.limits?.features || [], // Inherit features like 'Nexus'
                    maxLogins: 1 // Managers get 1 device login
                },
                createdAt: new Date(),
                status: 'active'
            });

            alert("Manager created successfully! They can now log in.");
            onClose();
        } catch (error) {
            console.error("Error creating manager:", error);
            alert("Failed to create manager: " + error.message);
        }
        setLoading(false);
    };

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="glass-panel w-full max-w-lg p-6 bg-[#121214] border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                
                {/* Header */}
                <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <ShieldCheck className="text-blue-500" /> Add New Manager
                        </h2>
                        <p className="text-[10px] text-gray-500 mt-1">Create staff accounts with restricted layout access.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition"><X size={20} /></button>
                </div>

                <div className="space-y-5">
                    {/* Credentials Section */}
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1 mb-1"><User size={12}/> Manager Name *</label>
                            <input 
                                className="w-full bg-black/40 border border-white/10 rounded p-2.5 text-sm text-white focus:border-blue-500 outline-none"
                                placeholder="e.g. Ramesh Kumar"
                                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1 mb-1"><Mail size={12}/> Email Login *</label>
                                <input 
                                    type="email"
                                    className="w-full bg-black/40 border border-white/10 rounded p-2.5 text-sm text-white focus:border-blue-500 outline-none"
                                    placeholder="manager@company.com"
                                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1 mb-1"><Lock size={12}/> Password *</label>
                                <input 
                                    type="text"
                                    className="w-full bg-black/40 border border-white/10 rounded p-2.5 text-sm text-white font-mono focus:border-blue-500 outline-none"
                                    placeholder="••••••••"
                                    value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Permissions Section (Layout Assignment) */}
                    <div className="pt-4 border-t border-white/10">
                        <label className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1 mb-3">
                            <Map size={12}/> Assign Layouts (Permissions) *
                        </label>
                        
                        {availableLayouts.length === 0 ? (
                            <p className="text-xs text-yellow-500 bg-yellow-500/10 p-3 rounded border border-yellow-500/20">
                                You need to create a layout first before assigning a manager.
                            </p>
                        ) : (
                            <div className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar pr-2">
                                {availableLayouts.map(layout => (
                                    <label key={layout.id} className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 hover:border-blue-500/50 rounded-lg cursor-pointer transition group">
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 accent-blue-600 cursor-pointer"
                                            checked={formData.assignedLayouts.includes(layout.id)}
                                            onChange={() => toggleLayout(layout.id)}
                                        />
                                        <span className="text-sm text-gray-300 group-hover:text-white transition font-medium">
                                            {layout.name}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        )}
                        <p className="text-[10px] text-gray-500 mt-2">
                            Managers will only see data, plots, and financial statistics for the selected layouts.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-white/10">
                        <button onClick={onClose} className="flex-1 bg-white/5 hover:bg-white/10 text-sm font-bold py-3 rounded text-gray-300 transition">Cancel</button>
                        <button 
                            onClick={handleCreateManager} 
                            disabled={loading || availableLayouts.length === 0}
                            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold py-3 rounded transition shadow-lg shadow-blue-900/20 flex justify-center items-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" size={16} /> : "Create Manager"}
                        </button>
                    </div>

                </div>
            </div>
        </div>,
        document.body
    );
};

export default CreateManagerModal;