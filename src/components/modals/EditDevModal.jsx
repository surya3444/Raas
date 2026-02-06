import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../../firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, getDoc, setDoc } from "firebase/firestore";
import { X, Loader2, Trash2, ShieldAlert, Upload, FileText } from 'lucide-react';

const EditDevModal = ({ user, onClose }) => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Editable State
    const [formData, setFormData] = useState({ ...user });
    const [documents, setDocuments] = useState(user.documents || []);
    const [panicActive, setPanicActive] = useState(false);
    const [expiryDate, setExpiryDate] = useState('');

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        const init = async () => {
            // 1. Fetch Plans
            try {
                const snap = await getDocs(collection(db, "plans"));
                const fetchedPlans = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setPlans(fetchedPlans);

                // If user has no plan set, default form to first available plan to avoid 'undefined' state
                if (!user.planId && fetchedPlans.length > 0) {
                    setFormData(prev => ({ ...prev, planId: fetchedPlans[0].id }));
                }
            } catch (e) {
                console.error("Error fetching plans:", e);
            }

            // 2. Check Panic Status
            try {
                const settingsSnap = await getDoc(doc(db, "settings", user.id));
                if((settingsSnap.exists() && settingsSnap.data().panicMode) || user.panicMode) {
                    setPanicActive(true);
                }
            } catch(e) {}

            // 3. Date Formatting
            if (user.subscriptionEnd) {
                const date = new Date(user.subscriptionEnd.seconds * 1000);
                setExpiryDate(date.toISOString().split('T')[0]);
            }
        };
        init();
        return () => document.body.style.overflow = 'unset';
    }, [user]);

    const handleSave = async () => {
        setLoading(true);
        
        // 1. Prepare Base Updates
        const updates = {
            name: formData.name || "",
            email: formData.email || "",
            password: formData.password || "", 
            address: formData.address || "", 
            documents: documents || []
        };

        // 2. FORCE UPDATE PLAN DETAILS
        // Instead of checking if (changed), we always find the selected plan and enforce its limits.
        if (formData.planId && plans.length > 0) {
            const selectedPlan = plans.find(p => p.id === formData.planId);
            
            if (selectedPlan) {
                updates.planId = selectedPlan.id;
                updates.planName = selectedPlan.name;
                // Crucial: Overwrite limits with the plan's current defaults
                updates.limits = {
                    maxLogins: Number(selectedPlan.maxLogins) || 1,
                    maxLayouts: Number(selectedPlan.maxLayouts) || 1,
                    maxPlots: Number(selectedPlan.maxPlots) || 50,
                    features: selectedPlan.features || []
                };
            }
        }

        // 3. Update Date if Changed
        if (expiryDate) {
            updates.subscriptionEnd = new Date(expiryDate);
        }

        try {
            await updateDoc(doc(db, "users", user.id), updates);
            onClose();
        } catch (error) { 
            console.error(error);
            alert("Update failed: " + error.message); 
        }
        setLoading(false);
    };

    const recoverPanic = async () => {
        if(!confirm("Recover system from Panic Mode?")) return;
        try {
            await updateDoc(doc(db, "users", user.id), { panicMode: false });
            await setDoc(doc(db, "settings", user.id), { panicMode: false }, { merge: true });
            setPanicActive(false);
            alert("System Recovered Successfully");
        } catch(e) { alert("Recovery Failed: " + e.message); }
    };

    const handleDeleteUser = async () => {
        if(!confirm("PERMANENTLY DELETE this developer?")) return;
        try {
            await deleteDoc(doc(db, "users", user.id));
            onClose();
        } catch(e) { alert(e.message); }
    };

    const removeDocument = (index) => {
        const newDocs = [...documents];
        newDocs.splice(index, 1);
        setDocuments(newDocs);
    };

    const handleFileUpload = (e) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).map(f => ({
                name: f.name, type: f.type, uploadedAt: new Date()
            }));
            setDocuments([...documents, ...newFiles]);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="glass-panel w-full max-w-2xl flex flex-col max-h-[90vh] bg-[#121214] border border-white/10 shadow-2xl relative overflow-hidden">
                
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/5 bg-[#121214] z-10 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-white">Manage Developer</h2>
                        <p className="text-xs text-gray-500 mt-1">ID: <span className="font-mono">{user.id}</span></p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition"><X size={20} className="text-gray-400" /></button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
                    
                    {/* Panic Mode Alert */}
                    {panicActive && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between animate-pulse">
                            <div className="flex items-center gap-3">
                                <ShieldAlert className="text-red-500" size={24} />
                                <div>
                                    <h4 className="font-bold text-red-500">Panic Mode Active!</h4>
                                    <p className="text-xs text-red-400/80">System is showing dummy data.</p>
                                </div>
                            </div>
                            <button onClick={recoverPanic} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg transition">Recover System</button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Company Name</label>
                            <input className="form-input" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Email</label>
                            <input className="form-input" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                        </div>
                        
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Password</label>
                            <input 
                                className="form-input font-mono text-brand border-brand/30" 
                                value={formData.password || ''} 
                                onChange={e => setFormData({...formData, password: e.target.value})} 
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Address</label>
                        <textarea className="form-input min-h-[60px]" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} />
                    </div>

                    <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-4">
                        <h3 className="text-xs font-bold text-brand uppercase">Subscription Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Current Plan</label>
                                <select 
                                    className="form-input bg-[#18181b]" 
                                    value={formData.planId || ''} 
                                    onChange={e => setFormData({...formData, planId: e.target.value})}
                                >
                                    <option value="" disabled>Select a Plan</option>
                                    {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Expiry Date</label>
                                <input type="date" className="form-input text-white bg-[#18181b]" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-end">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Legal Documents</label>
                            <label className="text-xs text-brand hover:underline cursor-pointer flex items-center gap-1">
                                <Upload size={12} /> Upload New
                                <input type="file" className="hidden" onChange={handleFileUpload} />
                            </label>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2">
                            {documents.length === 0 && <p className="text-sm text-gray-600 italic">No documents uploaded.</p>}
                            {documents.map((doc, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5 hover:border-white/20 transition group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-brand/10 text-brand rounded"><FileText size={16} /></div>
                                        <div>
                                            <p className="text-sm text-white font-medium">{doc.name}</p>
                                            <p className="text-[10px] text-gray-500">Uploaded: {doc.uploadedAt?.toDate ? doc.uploadedAt.toDate().toLocaleDateString() : 'Just now'}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => removeDocument(idx)} className="text-red-500 opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/10 rounded transition"><Trash2 size={16} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer / Danger Zone */}
                <div className="p-6 border-t border-white/5 flex justify-between items-center bg-[#121214] z-10 shrink-0">
                    <button onClick={handleDeleteUser} className="text-red-500 hover:text-red-400 text-xs font-bold flex items-center gap-2 hover:bg-red-500/10 px-3 py-2 rounded transition">
                        <Trash2 size={14} /> Delete Developer
                    </button>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-bold text-gray-400 hover:bg-white/5 transition">Cancel</button>
                        <button onClick={handleSave} disabled={loading} className="px-6 py-2 rounded-lg text-sm font-bold bg-brand hover:bg-blue-600 text-white shadow-lg shadow-brand/20 flex items-center gap-2">
                            {loading ? <Loader2 className="animate-spin" size={16} /> : "Save Changes"}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default EditDevModal;