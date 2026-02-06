import React, { useState, useEffect } from 'react';
import { updateDoc, doc } from "firebase/firestore";
import { db } from '../../firebase';
import { Pencil, Save, X, MapPin, Link as LinkIcon, FileText } from 'lucide-react';
import DocumentList from './DocumentList'; // Reusing your existing component

const ProjectInfo = ({ layout }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        address: layout.address || '',
        addressLink: layout.addressLink || ''
    });

    // Reset form when layout changes
    useEffect(() => {
        setFormData({
            address: layout.address || '',
            addressLink: layout.addressLink || ''
        });
    }, [layout]);

    const handleSave = async () => {
        await updateDoc(doc(db, "layouts", layout.id), {
            address: formData.address,
            addressLink: formData.addressLink
        });
        setIsEditing(false);
    };

    return (
        <div className="glass-panel p-6 space-y-6">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <FileText size={16} className="text-blue-500" /> Project Details
                </h3>
                {!isEditing ? (
                    <button onClick={() => setIsEditing(true)} className="text-xs font-bold text-gray-400 hover:text-white flex items-center gap-1 transition">
                        <Pencil size={12} /> Edit Info
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button onClick={() => setIsEditing(false)} className="text-xs font-bold text-gray-500 hover:text-white">Cancel</button>
                        <button onClick={handleSave} className="text-xs font-bold text-green-500 hover:text-green-400 flex items-center gap-1">
                            <Save size={12} /> Save
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Col: Address & Link */}
                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] text-gray-500 uppercase font-bold mb-1.5 flex items-center gap-1">
                            <MapPin size={12} /> Project Address
                        </label>
                        {isEditing ? (
                            <textarea 
                                className="w-full bg-black/20 border border-white/10 rounded p-3 text-sm text-white focus:border-blue-500 outline-none min-h-[80px]"
                                value={formData.address}
                                onChange={e => setFormData({...formData, address: e.target.value})}
                                placeholder="Enter physical address..."
                            />
                        ) : (
                            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {layout.address || <span className="text-gray-600 italic">No address provided.</span>}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="text-[10px] text-gray-500 uppercase font-bold mb-1.5 flex items-center gap-1">
                            <LinkIcon size={12} /> Location Map
                        </label>
                        {isEditing ? (
                            <input 
                                className="w-full bg-black/20 border border-white/10 rounded p-3 text-sm text-blue-400 focus:border-blue-500 outline-none"
                                value={formData.addressLink}
                                onChange={e => setFormData({...formData, addressLink: e.target.value})}
                                placeholder="https://maps.google.com/..."
                            />
                        ) : (
                            layout.addressLink ? (
                                <a 
                                    href={layout.addressLink} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="text-sm text-blue-500 hover:text-blue-400 hover:underline truncate block"
                                >
                                    {layout.addressLink}
                                </a>
                            ) : (
                                <p className="text-sm text-gray-600 italic">No map link added.</p>
                            )
                        )}
                    </div>
                </div>

                {/* Right Col: Documents (Reuse existing component) */}
                <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                     {/* Passing layout prop down to DocumentList */}
                    <DocumentList layout={layout} />
                </div>
            </div>
        </div>
    );
};

export default ProjectInfo;