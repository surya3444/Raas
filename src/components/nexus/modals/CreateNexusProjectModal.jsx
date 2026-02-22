import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { addDoc, collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from '../../../firebase'; 
import { X, Loader2, MapPin, Tag, Link as LinkIcon, Upload, FileText, Trash2, Ruler, Lock, Calendar, Image as ImageIcon } from 'lucide-react';
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
        areaMeasurementType: 'Acres & Guntas',
        areaAcres: '',
        areaGuntas: '',
        areaValue: '', 
        areaUnit: 'Sq.Ft.',
        launchDate: '' 
    });
    
    // Separate states for general files vs the specific layout plan image
    const [files, setFiles] = useState([]);
    const [planImageFile, setPlanImageFile] = useState(null);

    // --- 1. DEFINE LIMITS ---
    const maxLayouts = Number(user?.limits?.maxLayouts || 1); 

    // --- 2. SELF-CHECK: COUNT EXISTING PROJECTS ---
    useEffect(() => {
        const verifyLimits = async () => {
            if (!user?.id) return;
            setIsCheckingLimits(true);
            try {
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

    const handlePlanImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setPlanImageFile(e.target.files[0]);
        }
    };

    // --- Submit Handler ---
    const handleCreate = async () => {
        if (isLimitReached) {
            return alert(`Plan Limit Reached: You have ${currentCount}/${maxLayouts} projects.`);
        }

        if (!formData.name) return alert("Project name is required.");

        setIsLoading(true);
        try {
            // Smart Area String Combination
            let combinedTotalArea = '';
            if (formData.areaMeasurementType === 'Acres & Guntas') {
                const acres = formData.areaAcres ? `${formData.areaAcres} Acres` : '';
                const guntas = formData.areaGuntas ? `${formData.areaGuntas} Guntas` : '';
                combinedTotalArea = [acres, guntas].filter(Boolean).join(' '); 
            } else {
                combinedTotalArea = formData.areaValue ? `${formData.areaValue} ${formData.areaUnit}` : '';
            }

            // 1. Create Initial Document (to get the ID for storage paths)
            const docRef = await addDoc(collection(db, activeCollection), {
                ...formData,
                totalArea: combinedTotalArea, 
                devId: user.id, 
                elements: [], 
                docs: [], // will be updated after upload
                backgroundImage: null, // will be updated after upload
                createdAt: new Date().toISOString(),
                publicMapVisible: true
            });

            const storage = getStorage();
            const updates = {};

            // 2. Upload Layout Plan Image (if provided)
            if (planImageFile) {
                const safeName = planImageFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
                const imageRef = ref(storage, `layouts/${docRef.id}/plan/${Date.now()}_${safeName}`);
                await uploadBytes(imageRef, planImageFile);
                const imageUrl = await getDownloadURL(imageRef);
                updates.backgroundImage = imageUrl;
            }

            // 3. Upload General Documents
            if (files.length > 0) {
                const processedDocs = await Promise.all(files.map(async (file) => {
                    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
                    const fileRef = ref(storage, `layouts/${docRef.id}/docs/${Date.now()}_${safeName}`);
                    await uploadBytes(fileRef, file);
                    const fileUrl = await getDownloadURL(fileRef);
                    return { name: file.name, url: fileUrl };
                }));
                updates.docs = processedDocs;
            }

            // 4. Finalize Document if we have uploads
            if (Object.keys(updates).length > 0) {
                await updateDoc(docRef, updates);
            }

            onClose();
        } catch (e) {
            console.error("Error creating project:", e);
            alert("Error creating project: " + e.message);
        }
        setIsLoading(false);
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="glass-panel w-full max-w-lg p-6 bg-[#121214] border border-white/10 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar rounded-2xl">
                
                {/* Header */}
                <div className="flex justify-between items-start mb-6 shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            Initialize Nexus Project
                            {!isCheckingLimits && isLimitReached && (
                                <span className="text-[10px] bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                                    <Lock size={10}/> Limit Reached
                                </span>
                            )}
                        </h2>
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
                    <div className="py-20 flex flex-col items-center justify-center text-gray-500 gap-3">
                        <Loader2 size={32} className="animate-spin text-blue-500"/>
                        <p className="text-xs">Checking account capacity...</p>
                    </div>
                ) : isLimitReached ? (
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
                    <div className="space-y-4 pb-2">
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
                                <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Launch Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-3 text-gray-500" size={16} />
                                    <input 
                                        type="date"
                                        className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 pl-9 pr-3 text-sm text-white focus:border-blue-500 outline-none transition"
                                        value={formData.launchDate}
                                        onChange={e => setFormData({...formData, launchDate: e.target.value})}
                                        style={{ colorScheme: 'dark' }} 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* --- TOTAL SIZE UI --- */}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-[10px] text-gray-500 uppercase font-bold block">Total Size</label>
                                <select 
                                    className="bg-transparent text-[10px] font-bold uppercase text-blue-400 outline-none cursor-pointer"
                                    value={formData.areaMeasurementType}
                                    onChange={e => setFormData({...formData, areaMeasurementType: e.target.value})}
                                >
                                    <option className="bg-[#121214]" value="Acres & Guntas">Acres & Guntas</option>
                                    <option className="bg-[#121214]" value="Single Unit">Other Units</option>
                                </select>
                            </div>

                            {formData.areaMeasurementType === 'Acres & Guntas' ? (
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex bg-black/40 border border-white/10 rounded-lg overflow-hidden focus-within:border-blue-500 transition">
                                        <input 
                                            type="number" 
                                            className="w-full bg-transparent py-2.5 px-3 text-sm text-white outline-none placeholder:text-gray-700"
                                            placeholder="Acres"
                                            value={formData.areaAcres}
                                            onChange={e => setFormData({...formData, areaAcres: e.target.value})}
                                        />
                                        <div className="border-l border-white/10 flex items-center bg-black/20 px-3 text-xs text-gray-400">
                                            Acres
                                        </div>
                                    </div>
                                    <div className="flex bg-black/40 border border-white/10 rounded-lg overflow-hidden focus-within:border-blue-500 transition">
                                        <input 
                                            type="number" 
                                            className="w-full bg-transparent py-2.5 px-3 text-sm text-white outline-none placeholder:text-gray-700"
                                            placeholder="Guntas"
                                            value={formData.areaGuntas}
                                            onChange={e => setFormData({...formData, areaGuntas: e.target.value})}
                                        />
                                        <div className="border-l border-white/10 flex items-center bg-black/20 px-3 text-xs text-gray-400">
                                            Guntas
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex bg-black/40 border border-white/10 rounded-lg overflow-hidden focus-within:border-blue-500 transition">
                                    <input 
                                        type="number"
                                        className="w-full bg-transparent py-2.5 px-3 text-sm text-white outline-none placeholder:text-gray-700"
                                        placeholder="Value"
                                        value={formData.areaValue}
                                        onChange={e => setFormData({...formData, areaValue: e.target.value})}
                                    />
                                    <div className="border-l border-white/10 flex items-center bg-black/20 pr-2">
                                        <select 
                                            className="bg-transparent text-sm text-gray-300 py-2.5 px-2 outline-none cursor-pointer hover:text-white"
                                            value={formData.areaUnit}
                                            onChange={e => setFormData({...formData, areaUnit: e.target.value})}
                                        >
                                            <option className="bg-[#121214]" value="Sq.Ft.">Sq.Ft.</option>
                                            <option className="bg-[#121214]" value="Sq.Yards">Sq.Yards</option>
                                            <option className="bg-[#121214]" value="Hectares">Hectares</option>
                                            <option className="bg-[#121214]" value="Acres">Acres Only</option>
                                        </select>
                                    </div>
                                </div>
                            )}
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
                                    placeholder="https://maps.google.com/..."
                                    value={formData.addressLink}
                                    onChange={e => setFormData({...formData, addressLink: e.target.value})}
                                />
                            </div>
                        </div>

                        {/* --- NEW: LAYOUT PLAN UPLOAD --- */}
                        <div>
                            <label className="text-[10px] text-blue-400 uppercase font-bold block mb-1 flex items-center gap-1">
                                <ImageIcon size={12}/> Interactive Map Blueprint
                            </label>
                            <div className="border border-blue-500/30 rounded-lg p-3 bg-blue-500/5 flex items-center justify-between">
                                <span className="text-xs text-gray-300 truncate max-w-[200px]">
                                    {planImageFile ? planImageFile.name : "Select layout image (JPG/PNG)"}
                                </span>
                                <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-[10px] font-bold transition">
                                    {planImageFile ? 'Change' : 'Browse'}
                                    <input type="file" accept="image/*" className="hidden" onChange={handlePlanImageChange} />
                                </label>
                            </div>
                        </div>

                        {/* --- GENERAL DOCUMENTS UPLOAD --- */}
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Other Project Documents</label>
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
                                                <FileText size={14} className="text-gray-400 flex-shrink-0" />
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
                            {isLoading ? (
                                <><Loader2 className="animate-spin" size={16} /> Creating & Uploading...</>
                            ) : "Create Project"}
                        </button>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default CreateNexusProjectModal;