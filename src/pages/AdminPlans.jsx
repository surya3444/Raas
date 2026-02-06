import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { Plus, Trash2 } from 'lucide-react';
import CreatePlanModal from '../components/modals/CreatePlanModal';

const AdminPlans = () => {
    const [plans, setPlans] = useState([]);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const unsub = onSnapshot(collection(db, "plans"), (snap) => {
            setPlans(snap.docs.map(d => ({id: d.id, ...d.data()})));
        });
        return () => unsub();
    }, []);

    const deletePlan = async (id) => {
        if(window.confirm("Delete plan?")) await deleteDoc(doc(db, "plans", id));
    };

    return (
        <div className="flex-1 h-full overflow-y-auto p-8">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Subscription Plans</h1>
                    <p className="text-sm text-gray-500 mt-1">Define feature sets and limits for your customers.</p>
                </div>
                <button onClick={() => setShowModal(true)} className="bg-brand hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-blue-900/20">
                    <Plus size={16} /> Create Plan
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.length === 0 && <p className="text-gray-500 col-span-3 text-center py-10">No plans defined.</p>}
                
                {plans.map(p => (
                    <div key={p.id} className="glass-panel p-6 relative group hover:border-brand/50 transition">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-lg text-white">{p.name}</h3>
                                <p className="text-xs text-gray-500 font-mono">{p.validity} Days Validity</p>
                            </div>
                            <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center font-bold text-xs">
                                {p.name[0]}
                            </div>
                        </div>
                        <div className="space-y-2 mb-6">
                            <div className="flex justify-between text-xs text-gray-300 border-b border-white/5 pb-2">
                                <span>Max Logins</span><span className="font-mono">{p.maxLogins}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-300 border-b border-white/5 pb-2">
                                <span>Max Layouts</span><span className="font-mono">{p.maxLayouts}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-300 border-b border-white/5 pb-2">
                                <span>Max Plots</span><span className="font-mono">{p.maxPlots}</span>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {p.features?.map(f => (
                                <span key={f} className="px-2 py-1 rounded bg-white/5 text-[10px] text-gray-400 border border-white/5">{f}</span>
                            ))}
                        </div>
                        <button 
                            onClick={() => deletePlan(p.id)} 
                            className="absolute top-4 right-4 text-red-500 opacity-0 group-hover:opacity-100 transition hover:bg-red-500/10 p-2 rounded"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>

            {showModal && <CreatePlanModal onClose={() => setShowModal(false)} />}
        </div>
    );
};

export default AdminPlans;