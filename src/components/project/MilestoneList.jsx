import React from 'react';
import { updateDoc, doc } from "firebase/firestore";
import { db } from '../../firebase';
import { Check, Pencil, Trash2, Plus } from 'lucide-react';

const MilestoneList = ({ layout }) => {
    const milestones = layout.milestones || [];

    const handleAdd = async () => {
        const title = prompt("Milestone Name:");
        if (!title) return;
        const newMs = [...milestones, { title, done: false }];
        await updateDoc(doc(db, "layouts", layout.id), { milestones: newMs });
    };

    const handleToggle = async (index) => {
        const newMs = [...milestones];
        newMs[index].done = !newMs[index].done;
        await updateDoc(doc(db, "layouts", layout.id), { milestones: newMs });
    };

    const handleDelete = async (index) => {
        if(!confirm("Delete milestone?")) return;
        const newMs = milestones.filter((_, i) => i !== index);
        await updateDoc(doc(db, "layouts", layout.id), { milestones: newMs });
    };

    return (
        <div className="glass-panel p-4 relative">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold uppercase text-gray-500">Milestones</h3>
                <button 
                    onClick={handleAdd}
                    className="text-[10px] text-blue-500 hover:text-white font-bold bg-blue-500/10 px-2 py-1 rounded flex items-center gap-1"
                >
                    <Plus size={12} /> Add Milestone
                </button>
            </div>
            
            <div className="space-y-4 pl-4 border-l-2 border-white/10 ml-2">
                {milestones.length === 0 && <p className="text-xs text-gray-600 italic">No milestones set.</p>}
                
                {milestones.map((m, i) => (
                    <div key={i} className="relative">
                        {/* Dot */}
                        <div className={`absolute -left-[23px] top-1 w-3 h-3 rounded-full border-2 ${m.done ? 'bg-green-500 border-green-500' : 'bg-[#09090b] border-gray-600'}`}></div>
                        
                        <div className="flex justify-between items-center text-xs">
                            <h4 className={`font-bold transition ${m.done ? 'text-green-500 line-through' : 'text-gray-300'}`}>
                                {m.title}
                            </h4>
                            <div className="flex gap-2 text-gray-500">
                                <button onClick={() => handleToggle(i)} className="hover:text-green-500"><Check size={14}/></button>
                                <button onClick={() => handleDelete(i)} className="hover:text-red-500"><Trash2 size={14}/></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MilestoneList;