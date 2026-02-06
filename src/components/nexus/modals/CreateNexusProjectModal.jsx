import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { addDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from '../../../firebase'; 
import { X, Loader2, MapPin, Tag, Link as LinkIcon, Upload, FileText, Trash2, Ruler, Lock, AlertTriangle } from 'lucide-react';
import { useNexus } from '../../../context/NexusContext';

const CreateNexusProjectModal = ({ onClose }) => {
    const { user, activeCollection } = useNexus();
    
    // States
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingLimits, setIsCheckingLimits] = useState(true);
    const [currentCount, setCurrentCount] = useState(0);
    
    const [formData, setFormData] = useState({ 
        name: '', 
        address: '',
        addressLink: '',
        prefix: 'P-',
        totalArea: '' 
    });
    
    const [files, setFiles] = useState([]);

    // --- 1. DEFINE LIMITS ---
    // Safely get limits, defaulting to 1 if plan data is missing
    const maxLayouts = Number(user?.limits?.maxLayouts || 1); 

    // --- 2. SELF-CHECK: COUNT EXISTING PROJECTS ---
    useEffect(() => {
        const verifyLimits = async () => {
            if (!user?.id) return;
            setIsCheckingLimits(true);
            try {
                // Query database for REAL count of projects owned by this user
                const q = query(
                    collection(db, activeCollection), 
                    where("devId", "==", user.id)
                );
                const snapshot = await getDocs(q);
                setCurrentCount(snapshot.size);
            } catch (error) {
                console.error("Limit check failed:", error);
            }
            setIsCheckingLimits(false);
        };

        verifyLimits();
    }, [user, activeCollection]);

    // Check if limit reached based on the FETCHED count
    const isLimitReached = currentCount >= maxLayouts;

    // --- File Handlers ---
    const handleFileChange = (e) => {
        if (e.target.files) {
            setFiles(prev => [...prev, ...Array.from(e.target.files)]);
        }
    };

    const removeFile = (index) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    // --- Submit Handler ---
    const handleCreate = async () => {
        // Double check limit before submission
        if (isLimitReached) {
            return alert(`Plan Limit Reached: You have ${currentCount}/${maxLayouts} projects.`);
        }

        if (!formData.name) return alert("Project name is required.");

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

            // Create Document
            await addDoc(collection(db, activeCollection), {
                ...formData,
                devId: user.id, 
                elements: [], 
                docs: processedDocs,
                createdAt: new Date().toISOString(),
                publicMapVisible: true
            });

            onClose();
        } catch (e) {
            console.error(e);
            alert("Error creating project: " + e.message);
        }
        setIsLoading(false);
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="glass-panel w-full max-w-lg p-6 bg-[#121214] border border-white/10 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar rounded-2xl">
                
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            Initialize Nexus Project
                            {/* Visual Badge */}
                            {!isCheckingLimits && isLimitReached && (
                                <span className="text-[10px] bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                                    <Lock size={10}/> Limit Reached
                                </span>
                            )}
                        </h2>
                        {/* Status Text */}
                        <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-2">
                            {isCheckingLimits ? (
                                <span className="flex items-center gap-1 text-blue-400"><Loader2 size={10} className="animate-spin"/> Verifying plan limits...</span>
                            ) : (
                                <>
                                    Projects Used: <span className={isLimitReached ? "text-red-400 font-bold" : "text-white"}>{currentCount}</span> / {maxLayouts}
                                </>
                            )}
                        </p>
                    </div>
                    <button onClick={onClose}><X size={20} className="text-gray-500 hover:text-white" /></button>
                </div>

                {/* --- CONTENT SWITCHER --- */}
                {isCheckingLimits ? (
                    // 1. LOADING STATE
                    <div className="py-20 flex flex-col items-center justify-center text-gray-500 gap-3">
                        <Loader2 size={32} className="animate-spin text-blue-500"/>
                        <p className="text-xs">Checking account capacity...</p>
                    </div>
                ) : isLimitReached ? (
                    // 2. BLOCKED STATE
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center space-y-4 my-4 animate-in zoom-in-95">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                            <Lock size={28}/>
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-sm">Plan Limit Reached</h3>
                            <p className="text-xs text-red-300 mt-1 leading-relaxed">
                                You have used <b>{currentCount}</b> of your <b>{maxLayouts}</b> allowed projects.<br/>
                                Upgrade your plan to create more layouts.
                            </p>
                        </div>
                        <button onClick={onClose} className="bg-red-600 hover:bg-red-500 text-white px-6 py-2.5 rounded-lg text-xs font-bold transition w-full shadow-lg shadow-red-900/20">
                            Close
                        </button>
                    </div>
                ) : (
                    // 3. CREATE FORM
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Project Name *</label>
                            <input 
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none placeholder:text-gray-700 transition"
                                placeholder="e.g. Green Valley Phase 1"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                autoFocus
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Auto-ID Prefix</label>
                                <div className="relative">
                                    <Tag className="absolute left-3 top-3 text-gray-500" size={16} />
                                    <input 
                                        className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 pl-9 pr-3 text-sm text-white focus:border-blue-500 outline-none placeholder:text-gray-700 transition"
                                        placeholder="P-"
                                        value={formData.prefix}
                                        onChange={e => setFormData({...formData, prefix: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Total Size</label>
                                <div className="relative">
                                    <Ruler className="absolute left-3 top-3 text-gray-500" size={16} />
                                    <input 
                                        className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 pl-9 pr-3 text-sm text-white focus:border-blue-500 outline-none placeholder:text-gray-700 transition"
                                        placeholder="e.g. 5 Acres"
                                        value={formData.totalArea}
                                        onChange={e => setFormData({...formData, totalArea: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Project Address</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 text-gray-500" size={16} />
                                <textarea 
                                    className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 pl-9 pr-3 text-sm text-white focus:border-blue-500 outline-none placeholder:text-gray-700 min-h-[60px] transition"
                                    placeholder="Full physical address..."
                                    value={formData.address}
                                    onChange={e => setFormData({...formData, address: e.target.value})}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Google Maps Link</label>
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-3 text-gray-500" size={16} />
                                <input 
                                    className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 pl-9 pr-3 text-sm text-blue-400 focus:border-blue-500 outline-none placeholder:text-gray-700 transition"
                                    placeholder="http://googleusercontent.com/maps..."
                                    value={formData.addressLink}
                                    onChange={e => setFormData({...formData, addressLink: e.target.value})}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Project Documents</label>
                            <div className="border border-dashed border-white/20 rounded-lg p-4 bg-white/5 flex flex-col items-center justify-center relative cursor-pointer hover:bg-white/10 transition group">
                                <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleFileChange} />
                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                                    <Upload size={20} className="text-gray-400 group-hover:text-white" />
                                </div>
                                <p className="text-xs text-gray-400">Click to upload brochures, legal docs, etc.</p>
                            </div>
                            
                            {files.length > 0 && (
                                <div className="mt-3 space-y-2 max-h-[100px] overflow-y-auto custom-scrollbar">
                                    {files.map((f, i) => (
                                        <div key={i} className="flex justify-between items-center bg-white/5 p-2 rounded border border-white/5">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <FileText size={14} className="text-blue-400 flex-shrink-0" />
                                                <span className="text-xs text-gray-300 truncate">{f.name}</span>
                                            </div>
                                            <button onClick={() => removeFile(i)} className="text-gray-500 hover:text-red-400 p-1">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={handleCreate} 
                            disabled={isLoading} 
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-xs mt-4 flex justify-center items-center gap-2 shadow-lg shadow-blue-900/20 transition disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={16} /> : "Create Project"}
                        </button>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default CreateNexusProjectModal;