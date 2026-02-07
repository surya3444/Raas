import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../../firebase';
import { collection, addDoc, getDocs } from "firebase/firestore";
import { X, Loader2, Upload, FileText } from 'lucide-react';

const CreateDevModal = ({ onClose }) => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', planId: '', address: '' });
    const [files, setFiles] = useState([]);

    // Disable background scrolling when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        const fetchPlans = async () => {
            const snap = await getDocs(collection(db, "plans"));
            setPlans(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        };
        fetchPlans();
        return () => document.body.style.overflow = 'unset';
    }, []);

    // --- FIX: Append new files to the existing list instead of replacing them ---
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFiles(prevFiles => [...prevFiles, ...Array.from(e.target.files)]);
        }
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.email || !formData.password || !formData.planId) return alert("Fill all required fields");
        setLoading(true);

        const selectedPlan = plans.find(p => p.id === formData.planId);
        const now = new Date();
        const expiry = new Date();
        expiry.setDate(now.getDate() + (selectedPlan.validity || 365));

        try {
            // Mocking file storage - in prod, upload these to Firebase Storage
            const docReferences = files.map(f => ({ name: f.name, type: f.type, uploadedAt: new Date() }));
            
            await addDoc(collection(db, "users"), {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                address: formData.address,
                role: 'developer',
                planId: selectedPlan.id,
                planName: selectedPlan.name,
                documents: docReferences,
                limits: { 
                    maxLogins: selectedPlan.maxLogins, 
                    maxLayouts: selectedPlan.maxLayouts, 
                    maxPlots: selectedPlan.maxPlots, 
                    features: selectedPlan.features || [] 
                },
                subscriptionStart: now,
                subscriptionEnd: expiry,
                createdAt: now,
                panicMode: false
            });
            onClose();
        } catch (error) {
            alert("Error creating user: " + error.message);
        }
        setLoading(false);
    };

    // Use createPortal to render outside the main layout
    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="glass-panel w-full max-w-2xl flex flex-col max-h-[90vh] bg-[#121214] border border-white/10 shadow-2xl relative overflow-hidden">
                
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/5 bg-[#121214] z-10 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-white">Onboard Developer</h2>
                        <p className="text-xs text-gray-500 mt-1">Create a new partner account.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition"><X size={20} className="text-gray-400" /></button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Company / Name *</label>
                            <input className="form-input" placeholder="Raj Chavin Developers" onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Email Address *</label>
                            <input className="form-input" type="email" placeholder="admin@company.com" onChange={e => setFormData({...formData, email: e.target.value})} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Password *</label>
                            <input className="form-input font-mono text-brand" placeholder="••••••" onChange={e => setFormData({...formData, password: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Subscription Plan *</label>
                            <select className="form-input bg-[#18181b]" onChange={e => setFormData({...formData, planId: e.target.value})}>
                                <option value="">Select Plan...</option>
                                {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Billing Address</label>
                        <textarea className="form-input min-h-[80px]" placeholder="#123, Tech Park..." onChange={e => setFormData({...formData, address: e.target.value})}></textarea>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Upload Documents</label>
                        <div className="border border-dashed border-white/20 rounded-xl p-6 flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 transition cursor-pointer relative">
                            <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} />
                            <Upload className="text-gray-400 mb-2" size={24} />
                            <p className="text-sm text-gray-300 font-medium">Click to upload files</p>
                            <p className="text-xs text-gray-500 mt-1">PDF, DOCX, JPG (Max 1MB)</p>
                        </div>
                        {files.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                {files.map((f, i) => (
                                    <div key={i} className="flex items-center gap-2 p-2 bg-white/5 rounded border border-white/10">
                                        <FileText size={14} className="text-brand" />
                                        <span className="text-xs text-gray-300 truncate">{f.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 flex justify-end gap-3 bg-[#121214] z-10 shrink-0">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-bold text-gray-400 hover:bg-white/5 transition">Cancel</button>
                    <button onClick={handleSubmit} disabled={loading} className="px-6 py-2 rounded-lg text-sm font-bold bg-brand hover:bg-blue-600 text-white shadow-lg shadow-brand/20 flex items-center gap-2">
                        {loading ? <Loader2 className="animate-spin" size={16} /> : "Create Account"}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CreateDevModal;