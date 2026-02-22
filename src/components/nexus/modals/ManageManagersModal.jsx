import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { collection, query, where, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from '../../../firebase';
import { X, Loader2, Users, Trash2, Edit2, ShieldCheck, Mail, Map, Save, ArrowLeft } from 'lucide-react';

const ManageManagersModal = ({ developer, onClose }) => {
    const [managers, setManagers] = useState([]);
    const [availableLayouts, setAvailableLayouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    
    // State for editing a specific manager
    const [editingManager, setEditingManager] = useState(null);

    // Fetch Managers and Layouts
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch both managers and layouts in parallel
                const [managersSnap, layoutsSnap] = await Promise.all([
                    getDocs(query(collection(db, "users"), where("parentId", "==", developer.id), where("role", "==", "manager"))),
                    getDocs(query(collection(db, "layouts"), where("devId", "==", developer.id)))
                ]);

                setManagers(managersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                setAvailableLayouts(layoutsSnap.docs.map(d => ({ id: d.id, name: d.data().name })));
            } catch (error) {
                console.error("Error fetching data:", error);
            }
            setLoading(false);
        };
        fetchData();
    }, [developer.id]);

    const handleDelete = async (managerId) => {
        if (!window.confirm("Are you sure you want to remove this manager? They will lose access immediately.")) return;
        
        setActionLoading(true);
        try {
            await deleteDoc(doc(db, "users", managerId));
            setManagers(prev => prev.filter(m => m.id !== managerId));
        } catch (error) {
            alert("Error deleting manager: " + error.message);
        }
        setActionLoading(false);
    };

    const handleSaveEdit = async () => {
        if (!editingManager.name || !editingManager.email) return alert("Name and Email are required.");
        if (editingManager.assignedLayouts.length === 0) return alert("Assign at least one layout.");

        setActionLoading(true);
        try {
            const updateData = {
                name: editingManager.name,
                email: editingManager.email,
                assignedLayouts: editingManager.assignedLayouts
            };

            // Only update password if they typed a new one
            if (editingManager.newPassword) {
                updateData.password = editingManager.newPassword;
            }

            await updateDoc(doc(db, "users", editingManager.id), updateData);
            
            // Update local state
            setManagers(prev => prev.map(m => m.id === editingManager.id ? { ...m, ...updateData, password: updateData.password || m.password } : m));
            setEditingManager(null); // Go back to list
        } catch (error) {
            alert("Error updating manager: " + error.message);
        }
        setActionLoading(false);
    };

    const toggleLayout = (layoutId) => {
        setEditingManager(prev => {
            const isAssigned = prev.assignedLayouts.includes(layoutId);
            return {
                ...prev,
                assignedLayouts: isAssigned 
                    ? prev.assignedLayouts.filter(id => id !== layoutId)
                    : [...prev.assignedLayouts, layoutId]
            };
        });
    };

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="glass-panel w-full max-w-2xl p-6 bg-[#121214] border border-white/10 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
                
                {/* Header */}
                <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            {editingManager ? (
                                <>
                                    <button onClick={() => setEditingManager(null)} className="hover:text-blue-400 transition mr-2">
                                        <ArrowLeft size={20} />
                                    </button>
                                    <Edit2 className="text-blue-500" size={20} /> Edit Manager
                                </>
                            ) : (
                                <><Users className="text-blue-500" size={20} /> Manage Team</>
                            )}
                        </h2>
                        <p className="text-[10px] text-gray-500 mt-1">
                            {editingManager ? 'Update manager details and permissions.' : 'View, edit, or remove your assigned managers.'}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition"><X size={20} /></button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    {loading ? (
                        <div className="flex justify-center items-center py-20 text-gray-500">
                            <Loader2 className="animate-spin" size={24} />
                        </div>
                    ) : editingManager ? (
                        /* --- EDIT MANAGER VIEW --- */
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Name</label>
                                    <input 
                                        className="w-full bg-black/40 border border-white/10 rounded p-2.5 text-sm text-white focus:border-blue-500 outline-none"
                                        value={editingManager.name} onChange={e => setEditingManager({...editingManager, name: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Email (Login ID)</label>
                                    <input 
                                        className="w-full bg-black/40 border border-white/10 rounded p-2.5 text-sm text-white focus:border-blue-500 outline-none"
                                        value={editingManager.email} onChange={e => setEditingManager({...editingManager, email: e.target.value})}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Change Password (Leave blank to keep current)</label>
                                    <input 
                                        type="text"
                                        placeholder="Enter new password"
                                        className="w-full bg-black/40 border border-white/10 rounded p-2.5 text-sm text-white font-mono focus:border-blue-500 outline-none"
                                        value={editingManager.newPassword || ''} onChange={e => setEditingManager({...editingManager, newPassword: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/10">
                                <label className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1 mb-3">
                                    <Map size={12}/> Assigned Layouts
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {availableLayouts.map(layout => (
                                        <label key={layout.id} className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 hover:border-blue-500/50 rounded-lg cursor-pointer transition group">
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4 accent-blue-600 cursor-pointer"
                                                checked={editingManager.assignedLayouts.includes(layout.id)}
                                                onChange={() => toggleLayout(layout.id)}
                                            />
                                            <span className="text-sm text-gray-300 group-hover:text-white transition font-medium truncate">
                                                {layout.name}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* --- LIST MANAGERS VIEW --- */
                        <div className="space-y-3">
                            {managers.length === 0 ? (
                                <div className="text-center py-10 bg-white/5 rounded-xl border border-white/5 border-dashed">
                                    <ShieldCheck size={32} className="mx-auto text-gray-600 mb-2" />
                                    <p className="text-sm text-gray-400">No managers found.</p>
                                </div>
                            ) : (
                                managers.map(manager => (
                                    <div key={manager.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:border-white/10 transition group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                                                {manager.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-white">{manager.name}</h4>
                                                <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-0.5">
                                                    <span className="flex items-center gap-1"><Mail size={10} /> {manager.email}</span>
                                                    <span className="flex items-center gap-1 text-blue-400"><Map size={10} /> {manager.assignedLayouts?.length || 0} Layouts</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => setEditingManager({ ...manager, newPassword: '' })}
                                                className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition"
                                                title="Edit Permissions"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(manager.id)}
                                                disabled={actionLoading}
                                                className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition disabled:opacity-50"
                                                title="Remove Manager"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Footer / Actions */}
                <div className="pt-6 mt-4 border-t border-white/10 flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-bold text-gray-400 hover:bg-white/5 transition">
                        {editingManager ? 'Cancel' : 'Close'}
                    </button>
                    {editingManager && (
                        <button 
                            onClick={handleSaveEdit}
                            disabled={actionLoading}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-900/20 disabled:opacity-50"
                        >
                            {actionLoading ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> Save Changes</>}
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ManageManagersModal;