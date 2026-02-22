import React, { useState } from 'react';
import { updateDoc, doc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db } from '../../firebase';
import { Download, Trash2, Plus, Loader2 } from 'lucide-react';

const DocumentList = ({ layout }) => {
    const [isUploading, setIsUploading] = useState(false);
    const docs = layout.docs || [];

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const storage = getStorage();
            // Sanitize filename and make it unique to avoid overwriting
            const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
            const uniqueFileName = `${Date.now()}_${safeFileName}`;
            
            // Reference in storage: layouts/{layoutId}/docs/{filename}
            const storageRef = ref(storage, `layouts/${layout.id}/docs/${uniqueFileName}`);
            
            // Upload to Firebase Storage
            await uploadBytes(storageRef, file);
            
            // Get the public URL
            const downloadURL = await getDownloadURL(storageRef);
            
            // Save to Firestore
            const newDoc = { name: file.name, url: downloadURL };
            await updateDoc(doc(db, "layouts", layout.id), { docs: [...docs, newDoc] });
            
        } catch (error) {
            console.error("Upload error:", error);
            alert("Failed to upload document: " + error.message);
        } finally {
            setIsUploading(false);
            // Reset the input so the same file can be selected again if needed
            e.target.value = null; 
        }
    };

    const handleDelete = async (index) => {
        if(!window.confirm("Remove document?")) return;
        
        const docToRemove = docs[index];

        // Attempt to delete from Firebase Storage if it's a valid storage URL
        if (docToRemove && docToRemove.url && docToRemove.url.includes("firebasestorage")) {
            try {
                const storage = getStorage();
                const fileRef = ref(storage, docToRemove.url); 
                await deleteObject(fileRef);
            } catch (err) {
                console.error("Failed to delete from storage, continuing to remove from UI", err);
            }
        }

        // Update Firestore
        const newDocs = docs.filter((_, i) => i !== index);
        await updateDoc(doc(db, "layouts", layout.id), { docs: newDocs });
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold uppercase text-gray-500">Documents</h3>
                <label className={`text-[10px] ${isUploading ? 'text-gray-500' : 'text-blue-500 hover:text-white'} font-bold cursor-pointer flex items-center gap-1 transition`}>
                    {isUploading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} 
                    {isUploading ? 'Uploading...' : 'Upload'}
                    <input type="file" className="hidden" onChange={handleUpload} disabled={isUploading} />
                </label>
            </div>
            
            <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 max-h-32 pr-1">
                {docs.length === 0 && !isUploading && <p className="text-xs text-gray-600 italic">No documents.</p>}
                
                {docs.map((d, i) => (
                    <div key={i} className="flex justify-between items-center text-[10px] p-2 bg-white/5 rounded border border-white/5 group transition hover:border-white/10">
                        <span className="truncate w-24 text-gray-300" title={d.name}>{d.name}</span>
                        <div className="flex gap-2 opacity-60 group-hover:opacity-100 transition">
                            <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-white hover:text-blue-500 transition">
                                <Download size={14}/>
                            </a>
                            <button onClick={() => handleDelete(i)} className="text-red-500 hover:text-red-400 transition">
                                <Trash2 size={14}/>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DocumentList;