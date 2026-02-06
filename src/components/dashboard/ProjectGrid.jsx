import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Pencil, Trash2, MapPin, LayoutGrid } from 'lucide-react';
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from '../../firebase';

// ADDED: linkPrefix prop with a default value
const ProjectGrid = ({ layouts, linkPrefix = "/static/layout" }) => {
    const navigate = useNavigate();

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if(confirm("Permanently delete this layout and all its data?")) {
            await deleteDoc(doc(db, "layouts", id));
        }
    };

    const handleRename = async (e, id, oldName) => {
        e.stopPropagation();
        const n = prompt("New Name:", oldName);
        if(n) await updateDoc(doc(db, "layouts", id), { name: n });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {layouts.map(l => {
                const plots = l.elements || [];
                const soldCount = plots.filter(p => p.status === 'sold').length;
                const bookedCount = plots.filter(p => p.status === 'booked').length;
                const progress = plots.length > 0 ? ((soldCount + bookedCount) / plots.length) * 100 : 0;

                return (
                    <div 
                        key={l.id} 
                        // UPDATED: Use the dynamic linkPrefix
                        onClick={() => navigate(`${linkPrefix}/${l.id}`)}
                        className="relative overflow-hidden rounded-2xl p-6 border border-white/10 shadow-lg group transition-all hover:scale-[1.02] cursor-pointer"
                        style={{
                            background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.25) 0%, rgba(15, 23, 42, 0.6) 100%)', // Deep Blue Gradient
                            backdropFilter: 'blur(10px)',
                        }}
                    >
                        {/* Watermark */}
                        <div className="absolute -right-6 -bottom-6 opacity-[0.05] group-hover:opacity-[0.08] transition-opacity duration-500 pointer-events-none z-0">
                            <img src="/rajchavin-removebg-preview.png" alt="Watermark" className="w-32 h-32 object-contain grayscale invert" />
                        </div>

                        {/* Content */}
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="bg-blue-500/20 p-1.5 rounded-lg text-blue-400">
                                            <LayoutGrid size={14} />
                                        </div>
                                        <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition tracking-wide">{l.name}</h3>
                                    </div>
                                    <p className="text-xs text-gray-400 flex items-center gap-1">
                                        <MapPin size={10} /> {l.address ? 'Location set' : 'No address'}
                                    </p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-white group-hover:bg-blue-600 transition shadow-inner">
                                    <ChevronRight size={16} />
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="flex justify-between items-end text-xs mb-2">
                                <span className="text-gray-400">Inventory Status</span>
                                <span className="font-bold text-blue-300">
                                    {soldCount} Sold <span className="text-gray-600">|</span> {bookedCount} Booked <span className="text-gray-600">/</span> {plots.length}
                                </span>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden mb-5 border border-white/5">
                                <div 
                                    className="h-full transition-all duration-700 ease-out relative"
                                    style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #3b82f6 0%, #22c55e 100%)' }}
                                >
                                    {/* Shimmer Effect */}
                                    <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite] skew-x-12 translate-x-[-150%]"></div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="flex justify-between items-center border-t border-white/5 pt-4">
                                <button 
                                    onClick={(e) => handleRename(e, l.id, l.name)} 
                                    className="text-xs font-medium text-gray-500 hover:text-white flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/5 transition"
                                >
                                    <Pencil size={12}/> Rename
                                </button>
                                <button 
                                    onClick={(e) => handleDelete(e, l.id)} 
                                    className="text-xs font-medium text-red-500/70 hover:text-red-400 flex items-center gap-1.5 px-2 py-1 rounded hover:bg-red-500/10 transition"
                                >
                                    <Trash2 size={12}/> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ProjectGrid;