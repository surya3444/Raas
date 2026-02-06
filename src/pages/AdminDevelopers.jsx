import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { Search, UserPlus, Pencil, Trash2, Circle } from 'lucide-react';

// 👇 THESE IMPORTS MUST BE EXACT. CHECK YOUR FOLDER NAMES.
import CreateDevModal from '../components/modals/CreateDevModal';
import EditDevModal from '../components/modals/EditDevModal';

const AdminDevelopers = () => {
    const [developers, setDevelopers] = useState([]);
    const [filter, setFilter] = useState('');
    
    // 👇 THESE STATES CONTROL THE MODALS
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingDev, setEditingDev] = useState(null);

    useEffect(() => {
        const q = query(collection(db, "users"), where("role", "==", "developer"));
        const unsub = onSnapshot(q, (snap) => {
            setDevelopers(snap.docs.map(d => ({id: d.id, ...d.data()})));
        });
        return () => unsub();
    }, []);

    const deleteDev = async (id) => {
        if(window.confirm("Revoke license? This cannot be undone.")) {
            await deleteDoc(doc(db, "users", id));
        }
    };

    const filteredDevs = developers.filter(d => 
        d.name.toLowerCase().includes(filter.toLowerCase()) || 
        d.email.toLowerCase().includes(filter.toLowerCase())
    );

    const activeLicenses = developers.filter(u => {
        const now = new Date();
        const expiry = u.subscriptionEnd ? new Date(u.subscriptionEnd.seconds * 1000) : now;
        return expiry > now;
    }).length;

    return (
        <div className="flex-1 h-full overflow-hidden flex flex-col">
            <div className="p-8 pb-0">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Developer Management</h1>
                        <p className="text-sm text-gray-500 mt-1">Manage accounts, renew licenses, and assign plans.</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
                            <input 
                                type="text" 
                                value={filter}
                                onChange={e => setFilter(e.target.value)}
                                placeholder="Search developers..." 
                                className="w-full bg-[#18181b] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:border-brand outline-none transition"
                            />
                        </div>
                        
                        {/* 👇 ONBOARD BUTTON: Checks showCreateModal state */}
                        <button 
                            onClick={() => setShowCreateModal(true)} 
                            className="bg-white text-black hover:bg-gray-200 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition shadow-lg"
                        >
                            <UserPlus size={16} /> Onboard
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="glass-panel p-4 border-l-2 border-brand">
                        <p className="text-[10px] font-bold text-gray-500 uppercase">Total Developers</p>
                        <h3 className="text-2xl font-bold text-white mt-1">{developers.length}</h3>
                    </div>
                    <div className="glass-panel p-4 border-l-2 border-green-500">
                        <p className="text-[10px] font-bold text-gray-500 uppercase">Active Licenses</p>
                        <h3 className="text-2xl font-bold text-white mt-1">{activeLicenses}</h3>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 pb-8">
                <div className="glass-panel overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface border-b border-border text-[10px] uppercase text-gray-500">
                                <th className="px-6 py-4 font-bold">Company / Name</th>
                                <th className="px-6 py-4 font-bold">Plan</th>
                                <th className="px-6 py-4 font-bold">Status</th>
                                <th className="px-6 py-4 font-bold">Limits</th>
                                <th className="px-6 py-4 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-gray-300">
                            {filteredDevs.map(u => {
                                const now = new Date();
                                const expiry = u.subscriptionEnd ? new Date(u.subscriptionEnd.seconds * 1000) : now;
                                const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
                                const isActive = daysLeft > 0;

                                return (
                                    <tr key={u.id} className="hover:bg-white/5 transition border-b border-border last:border-0">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-gradient-to-br from-gray-700 to-black border border-white/10 flex items-center justify-center text-xs font-bold">
                                                    {u.name[0]}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white">{u.name}</div>
                                                    <div className="text-xs text-gray-500 font-mono">{u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-brand/10 text-brand border border-brand/20 px-2 py-1 rounded text-xs font-bold">{u.planName || 'Custom'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`${isActive ? 'text-green-500' : 'text-red-500'} text-xs font-bold flex items-center gap-1`}>
                                                <Circle size={8} fill="currentColor" /> {isActive ? 'Active' : 'Expired'}
                                            </div>
                                            <div className="text-[10px] text-gray-500 mt-0.5">{daysLeft} days left</div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-gray-400">
                                            {u.limits?.maxLayouts || 0} / {u.limits?.maxPlots || 0}
                                        </td>
                                        <td className="px-6 py-4 text-right flex gap-2 justify-end">
                                            {/* 👇 EDIT BUTTON: Sets editingDev state */}
                                            <button onClick={() => setEditingDev(u)} className="text-brand bg-brand/10 hover:bg-brand/20 p-2 rounded transition">
                                                <Pencil size={16} />
                                            </button>
                                            <button onClick={() => deleteDev(u.id)} className="text-red-500 bg-red-500/10 hover:bg-red-500/20 p-2 rounded transition">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 👇 CONDITIONAL RENDERING OF MODALS */}
            {showCreateModal && (
                <CreateDevModal onClose={() => setShowCreateModal(false)} />
            )}
            
            {editingDev && (
                <EditDevModal user={editingDev} onClose={() => setEditingDev(null)} />
            )}
        </div>
    );
};

export default AdminDevelopers;