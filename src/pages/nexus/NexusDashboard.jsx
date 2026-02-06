import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, deleteDoc, updateDoc, doc } from "firebase/firestore";
import { db } from '../../firebase';
import { useNexus } from '../../context/NexusContext';
import NexusStats from '../../components/nexus/dashboard/NexusStats';
import NexusCharts from '../../components/nexus/dashboard/NexusCharts';
import NexusNavbar from '../../components/nexus/NexusNavbar';
import { ShieldAlert, Plus, Layout, Loader2, FolderOpen, ArrowRight, MoreVertical, Trash2, Edit2 } from 'lucide-react';
import CreateNexusProjectModal from '../../components/nexus/modals/CreateNexusProjectModal';

const NexusDashboard = () => {
    const { user, activeCollection, triggerPanic } = useNexus();
    const navigate = useNavigate();
    const [layouts, setLayouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [activeMenuId, setActiveMenuId] = useState(null);

    useEffect(() => {
        if (!user || !user.id) {
            setLoading(false);
            return;
        }

        const q = query(collection(db, activeCollection), where("devId", "==", user.id));
        const unsub = onSnapshot(q, (snap) => {
            const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setLayouts(fetched);
            setLoading(false);
        });
        
        const closeMenu = () => setActiveMenuId(null);
        window.addEventListener('click', closeMenu);

        return () => {
            unsub();
            window.removeEventListener('click', closeMenu);
        };
    }, [user, activeCollection]);

    const handleRename = async (e, id, currentName) => {
        e.stopPropagation(); 
        setActiveMenuId(null);
        const newName = prompt("Enter new project name:", currentName);
        if (newName && newName.trim() !== "") {
            try {
                await updateDoc(doc(db, activeCollection, id), { name: newName });
            } catch (err) {
                alert("Error renaming: " + err.message);
            }
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation(); 
        setActiveMenuId(null);
        if (window.confirm("Are you sure you want to permanently delete this project? This action cannot be undone.")) {
            try {
                await deleteDoc(doc(db, activeCollection, id));
            } catch (err) {
                alert("Error deleting: " + err.message);
            }
        }
    };

    const totalPlotsUsed = layouts.reduce((sum, l) => sum + (l.elements?.length || 0), 0);

    return (
        <div className="flex flex-col h-screen w-screen bg-[#050505] relative overflow-hidden">
            
            {/* WATERMARK BACKGROUND */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <img 
                    src="/rajchavin-removebg-preview.png" 
                    alt="Watermark" 
                    className="w-[50%] opacity-[0.03] grayscale invert" 
                />
            </div>

            <NexusNavbar title="Overview" />
            
            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 custom-scrollbar relative z-10 pb-20">
                
                {/* Header Actions */}
                <div className="flex justify-between items-end border-b border-white/5 pb-6">
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">Overview</h2>
                        <p className="text-sm text-gray-400 mt-1">Manage layouts & track sales</p>
                    </div>
                    <div className="flex gap-2">
                        
                        <button 
                            onClick={() => setCreateModalOpen(true)} 
                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/20 transition transform hover:scale-105"
                        >
                            <Plus size={16} /> Create Project
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="h-64 flex items-center justify-center text-gray-500">
                        <Loader2 className="animate-spin mr-2" /> Loading Nexus Engine...
                    </div>
                ) : (
                    <>
                        <NexusStats layouts={layouts} />
                        
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                            <div className="lg:col-span-3">
                                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">Active Projects ({layouts.length})</h3>
                                {layouts.length === 0 ? (
                                    <div className="glass-panel p-10 flex flex-col items-center justify-center text-gray-500 border-dashed border-2 border-white/10">
                                        <FolderOpen size={48} className="mb-4 opacity-50" />
                                        <p className="text-sm">No projects found.</p>
                                        <button onClick={() => setCreateModalOpen(true)} className="mt-4 text-blue-500 hover:underline text-xs font-bold">Create your first layout</button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                        {layouts.map(l => {
                                            const plots = (l.elements || []).filter(e => e.type === 'plot');
                                            const count = plots.length;
                                            const sold = plots.filter(p => p.status === 'sold').length;
                                            const booked = plots.filter(p => p.status === 'booked').length;
                                            const progress = count > 0 ? ((sold + booked) / count) * 100 : 0;

                                            return (
                                                <div 
                                                    key={l.id} 
                                                    // FIX: Updated route to 'view' instead of 'editor'
                                                    onClick={() => navigate(`/nexus/view/${l.id}`)} 
                                                    className="relative group cursor-pointer overflow-visible rounded-2xl border border-white/5 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]"
                                                    style={{
                                                        background: 'linear-gradient(145deg, rgba(17, 24, 39, 0.7) 0%, rgba(10, 10, 12, 0.9) 100%)',
                                                        backdropFilter: 'blur(10px)'
                                                    }}
                                                >
                                                    <div className="absolute top-3 right-3 z-30">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveMenuId(activeMenuId === l.id ? null : l.id);
                                                            }}
                                                            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
                                                        >
                                                            <MoreVertical size={16} />
                                                        </button>

                                                        {activeMenuId === l.id && (
                                                            <div className="absolute right-0 mt-1 w-32 bg-[#18181b] border border-white/10 rounded-lg shadow-xl z-40 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                                <button 
                                                                    onClick={(e) => handleRename(e, l.id, l.name)}
                                                                    className="w-full text-left px-3 py-2 text-[10px] font-bold text-gray-300 hover:bg-blue-600 hover:text-white flex items-center gap-2 transition"
                                                                >
                                                                    <Edit2 size={12} /> Rename
                                                                </button>
                                                                <button 
                                                                    onClick={(e) => handleDelete(e, l.id)}
                                                                    className="w-full text-left px-3 py-2 text-[10px] font-bold text-red-400 hover:bg-red-900/30 flex items-center gap-2 transition"
                                                                >
                                                                    <Trash2 size={12} /> Delete
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none rounded-2xl"></div>
                                                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-600 to-transparent opacity-50 group-hover:opacity-100 rounded-t-2xl"></div>

                                                    <div className="p-6 relative z-10">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition shadow-lg shadow-blue-900/20">
                                                                    <Layout size={20} />
                                                                </div>
                                                                <div className="pr-6">
                                                                    <h3 className="font-bold text-white text-lg tracking-tight group-hover:text-blue-400 transition truncate max-w-[140px]">{l.name}</h3>
                                                                    <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">{l.address ? 'Location Set' : 'No Address'}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-2 my-4">
                                                            <div className="bg-black/30 rounded-lg p-2 border border-white/5">
                                                                <p className="text-[9px] text-gray-500 uppercase font-bold">Total Plots</p>
                                                                <p className="text-sm font-bold text-white">{count}</p>
                                                            </div>
                                                            <div className="bg-black/30 rounded-lg p-2 border border-white/5">
                                                                <p className="text-[9px] text-gray-500 uppercase font-bold">Available</p>
                                                                <p className="text-sm font-bold text-green-400">{count - sold - booked}</p>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <div className="flex justify-between text-[10px] font-bold">
                                                                <span className="text-gray-400">Sales Progress</span>
                                                                <span className="text-blue-400">{Math.round(progress)}%</span>
                                                            </div>
                                                            <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                                                <div 
                                                                    className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-700 ease-out relative"
                                                                    style={{ width: `${progress}%` }}
                                                                >
                                                                    <div className="absolute inset-0 bg-white/30 w-full animate-[shimmer_2s_infinite] skew-x-12 translate-x-[-100%]"></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                                            <ArrowRight className="text-blue-400" size={16} />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            <div className="lg:col-span-1">
                                <NexusCharts layouts={layouts} />
                            </div>
                        </div>
                    </>
                )}
            </div>

            {isCreateModalOpen && user && (
                <CreateNexusProjectModal 
                    onClose={() => setCreateModalOpen(false)}
                />
            )}
        </div>
    );
};

export default NexusDashboard;