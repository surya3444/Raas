import React, { useState } from 'react';
import { updateDoc, doc } from "firebase/firestore";
import { db } from '../../firebase';
import { Plus } from 'lucide-react';
import CustomerModal from '../modals/CustomerModal';

const InteractiveGrid = ({ layout }) => {
    const [activeCustomerIndex, setActiveCustomerIndex] = useState(null);

    const handleAddPlots = async () => {
        // Simple prompt for now, could be a modal later
        const countStr = prompt("How many plots to add?");
        const count = parseInt(countStr);
        if(!count) return;

        const prefix = prompt("Prefix (e.g. B-)") || "P-";
        const currentLen = (layout.elements || []).length;
        
        const newEls = Array.from({ length: count }, (_, i) => ({
            id: `${prefix}${currentLen + i + 1}`,
            status: 'open',
            price: '',
            type: 'plot'
        }));

        await updateDoc(doc(db, "layouts", layout.id), {
            elements: [...(layout.elements || []), ...newEls]
        });
    };

    // Helper for grid box colors
    const getStatusColor = (status) => {
        switch(status) {
            case 'sold': return 'bg-green-500 text-black border-green-500';
            case 'booked': return 'bg-yellow-500 text-black border-yellow-500';
            default: return 'bg-[#18181b] text-gray-500 border-white/10 hover:border-white/30';
        }
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden p-4">
            {/* Header inside Grid View */}
            <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">Plot Grid</h3>
                <button 
                    onClick={handleAddPlots}
                    className="bg-white/10 hover:bg-white/20 text-[10px] font-bold px-3 py-1.5 rounded transition border border-white/10 flex items-center gap-1 text-white"
                >
                    <Plus size={12} /> Add Plots
                </button>
            </div>

            {/* The Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 xl:grid-cols-10 gap-2 pb-10">
                    {(layout.elements || []).map((p, idx) => (
                        <div 
                            key={idx}
                            onClick={() => setActiveCustomerIndex(idx)}
                            className={`aspect-square flex items-center justify-center rounded-md font-bold text-[10px] cursor-pointer transition active:scale-95 border ${getStatusColor(p.status)}`}
                        >
                            {p.id}
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal */}
            {activeCustomerIndex !== null && (
                <CustomerModal 
                    layout={layout}
                    index={activeCustomerIndex}
                    data={layout.elements[activeCustomerIndex]}
                    onClose={() => setActiveCustomerIndex(null)}
                />
            )}
        </div>
    );
};

export default InteractiveGrid;