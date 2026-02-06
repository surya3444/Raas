import React, { useState } from 'react';
import { updateDoc, doc } from "firebase/firestore";
import { db } from '../../firebase';
import { Plus } from 'lucide-react';
import CustomerModal from '../modals/CustomerModal';

const CustomerList = ({ layout }) => {
    const [activeCustomerIndex, setActiveCustomerIndex] = useState(null);

    const formatPrice = (p) => p ? `₹${Number(p).toLocaleString('en-IN')}` : '-';

    const handleAdd = async () => {
        const id = prompt("New Plot ID:");
        if (!id) return;
        const newEl = { id, status: 'open', price: '', type: 'plot' };
        await updateDoc(doc(db, "layouts", layout.id), { 
            elements: [...(layout.elements || []), newEl] 
        });
    };

    return (
        // Main container must fill the parent
        <div className="flex flex-col h-full w-full">
            
            {/* Header: Fixed */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#121214] shrink-0 z-10 shadow-sm">
                <div>
                    <h3 className="font-bold text-sm text-white">Inventory</h3>
                    <p className="text-[10px] text-gray-500">{(layout.elements || []).length} Plots</p>
                </div>
                <button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition">
                    <Plus size={14} /> New Entry
                </button>
            </div>

            {/* List: Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar bg-[#0e0e10]">
                {(layout.elements || []).length === 0 && (
                    <div className="text-center py-10 text-gray-600 text-xs">
                        No inventory added yet.
                    </div>
                )}

                {(layout.elements || []).map((p, idx) => (
                    <div 
                        key={idx}
                        onClick={() => setActiveCustomerIndex(idx)}
                        className={`glass-card p-3 flex justify-between items-center cursor-pointer border-l-2 shrink-0
                            ${p.status === 'sold' ? 'border-green-500' : (p.status === 'booked' ? 'border-yellow-500' : 'border-transparent')}`}
                    >
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-1.5 rounded">{p.id}</span>
                                <span className="text-xs font-bold text-white">{p.customerName || 'Available'}</span>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-0.5">{p.customerPhone || 'No Contact'}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-gray-300">{formatPrice(p.price)}</p>
                            <p className={`text-[9px] uppercase font-bold ${p.status==='sold'?'text-green-500':(p.status==='booked'?'text-yellow-500':'text-gray-600')}`}>
                                {p.status}
                            </p>
                        </div>
                    </div>
                ))}
                
                {/* Spacer to allow scrolling past last item comfortably */}
                <div className="h-10"></div>
            </div>

            {/* Modal Portal */}
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

export default CustomerList;