import React from 'react';
import { updateDoc, doc } from "firebase/firestore";
import { db } from '../../firebase';
import { Download, Trash2, Plus } from 'lucide-react';

const DocumentList = ({ layout }) => {
    const docs = layout.docs || [];

    const handleUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (ev) => {
            const newDoc = { name: file.name, url: ev.target.result };
            await updateDoc(doc(db, "layouts", layout.id), { docs: [...docs, newDoc] });
        };
        reader.readAsDataURL(file);
    };

    const handleDelete = async (index) => {
        if(!confirm("Remove document?")) return;
        const newDocs = docs.filter((_, i) => i !== index);
        await updateDoc(doc(db, "layouts", layout.id), { docs: newDocs });
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold uppercase text-gray-500">Documents</h3>
                <label className="text-[10px] text-blue-500 hover:text-white font-bold cursor-pointer flex items-center gap-1">
                    <Plus size={12} /> Upload
                    <input type="file" className="hidden" onChange={handleUpload} />
                </label>
            </div>
            
            <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 max-h-32">
                {docs.length === 0 && <p className="text-xs text-gray-600 italic">No documents.</p>}
                
                {docs.map((d, i) => (
                    <div key={i} className="flex justify-between items-center text-[10px] p-2 bg-white/5 rounded border border-white/5 group">
                        <span className="truncate w-24 text-gray-300">{d.name}</span>
                        <div className="flex gap-2 opacity-60 group-hover:opacity-100 transition">
                            <a href={d.url} download={d.name} className="text-white hover:text-blue-500"><Download size={12}/></a>
                            <button onClick={() => handleDelete(i)} className="text-red-500 hover:text-red-400"><Trash2 size={12}/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DocumentList;