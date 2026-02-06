import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { updateDoc, doc } from "firebase/firestore";
import { db } from '../../firebase';
import { X, Trash2, Upload, FileText, Download, User, MapPin, Phone, StickyNote, Ruler, Compass, IndianRupee, Calendar } from 'lucide-react';

const CustomerModal = ({ layout, index, data, onClose }) => {
    const [formData, setFormData] = useState({ 
        id: '',
        status: 'open',
        price: '',
        size: '',
        facing: '',
        bookingAmount: '',
        bookingDate: '',      // New: Date of Booking
        purchaseDueDate: '',  // New: Deadline for full payment
        purchaseDate: '',     // New: Final Purchase Date (for Sold)
        customerName: '',
        customerPhone: '',
        customerAddress: '',
        remarks: '',
        documents: [],
        ...data
    });

    useEffect(() => { setFormData({ ...data }); }, [data]);

    // Calculate Balance
    const price = Number(formData.price) || 0;
    const bookingAmt = Number(formData.bookingAmount) || 0;
    const balance = price - bookingAmt;

    const handleSave = async () => {
        const newElements = [...layout.elements];
        newElements[index] = { ...formData };
        await updateDoc(doc(db, "layouts", layout.id), { elements: newElements });
        onClose();
    };

    const handleDelete = async () => {
        if(!confirm("Delete this plot entry?")) return;
        const newElements = layout.elements.filter((_, i) => i !== index);
        await updateDoc(doc(db, "layouts", layout.id), { elements: newElements });
        onClose();
    };

    const handleDocUpload = (e) => {
        const file = e.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const newDoc = { name: file.name, url: ev.target.result };
            setFormData(prev => ({ ...prev, documents: [...(prev.documents || []), newDoc] }));
        };
        reader.readAsDataURL(file);
    };

    const removeDoc = (docIdx) => {
        setFormData(prev => ({
            ...prev,
            documents: prev.documents.filter((_, i) => i !== docIdx)
        }));
    };

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="glass-panel w-full max-w-2xl p-6 bg-[#121214] border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                
                {/* Header */}
                <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            Plot Details <span className="bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded text-sm font-mono">{formData.id}</span>
                        </h2>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleDelete} className="text-red-500 hover:bg-red-500/10 p-2 rounded transition" title="Delete Plot"><Trash2 size={18}/></button>
                        <button onClick={onClose} className="text-gray-500 hover:text-white p-2 rounded transition"><X size={18}/></button>
                    </div>
                </div>

                <div className="space-y-6">
                    
                    {/* --- SECTION 1: PLOT INFO --- */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Plot No</label>
                            <input 
                                className="w-full bg-black/40 border border-white/10 rounded p-2.5 text-sm text-white font-mono focus:border-blue-500 outline-none"
                                value={formData.id} 
                                onChange={e => setFormData({...formData, id: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 flex items-center gap-1"><Ruler size={10}/> Size (Sq.ft)</label>
                            <input 
                                className="w-full bg-black/40 border border-white/10 rounded p-2.5 text-sm text-white focus:border-blue-500 outline-none"
                                value={formData.size} 
                                onChange={e => setFormData({...formData, size: e.target.value})}
                                placeholder="e.g. 1200"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 flex items-center gap-1"><Compass size={10}/> Facing</label>
                            <select 
                                className="w-full bg-black/40 border border-white/10 rounded p-2.5 text-sm text-white focus:border-blue-500 outline-none appearance-none"
                                value={formData.facing} 
                                onChange={e => setFormData({...formData, facing: e.target.value})}
                            >
                                <option value="">Select...</option>
                                <option value="North">North</option>
                                <option value="South">South</option>
                                <option value="East">East</option>
                                <option value="West">West</option>
                                <option value="N-East">North-East</option>
                                <option value="N-West">North-West</option>
                                <option value="S-East">South-East</option>
                                <option value="S-West">South-West</option>
                            </select>
                        </div>
                    </div>

                    {/* --- SECTION 2: STATUS & PRICING --- */}
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Status</label>
                                <select 
                                    className={`w-full border rounded p-2.5 text-sm font-bold outline-none 
                                        ${formData.status === 'open' ? 'bg-gray-800 text-gray-300 border-gray-700' : ''}
                                        ${formData.status === 'booked' ? 'bg-yellow-900/30 text-yellow-400 border-yellow-700/50' : ''}
                                        ${formData.status === 'sold' ? 'bg-green-900/30 text-green-400 border-green-700/50' : ''}
                                    `}
                                    value={formData.status}
                                    onChange={e => setFormData({...formData, status: e.target.value})}
                                >
                                    <option value="open">Open</option>
                                    <option value="booked">Booked</option>
                                    <option value="sold">Sold</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 flex items-center gap-1"><IndianRupee size={10}/> Total Price</label>
                                <input 
                                    type="number" 
                                    className="w-full bg-black/40 border border-white/10 rounded p-2.5 text-sm text-white focus:border-blue-500 outline-none"
                                    value={formData.price} 
                                    onChange={e => setFormData({...formData, price: e.target.value})}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {/* --- DYNAMIC FIELDS BASED ON STATUS --- */}
                        
                        {/* 1. BOOKED STATUS */}
                        {formData.status === 'booked' && (
                            <div className="mt-4 pt-4 border-t border-white/10 animate-in fade-in slide-in-from-top-2">
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="text-[10px] text-yellow-500 uppercase font-bold mb-1">Booking Amount Paid</label>
                                        <input 
                                            type="number" 
                                            className="w-full bg-yellow-500/10 border border-yellow-500/30 rounded p-2.5 text-sm text-white focus:border-yellow-500 outline-none"
                                            value={formData.bookingAmount} 
                                            onChange={e => setFormData({...formData, bookingAmount: e.target.value})}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-500 uppercase font-bold mb-1">Balance Pending</label>
                                        <div className="w-full bg-black/40 border border-white/10 rounded p-2.5 text-sm text-gray-400 font-mono">
                                            ₹ {balance.toLocaleString('en-IN')}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Dates for Booking */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 flex items-center gap-1">
                                            <Calendar size={10} /> Booking Date
                                        </label>
                                        <input 
                                            type="date"
                                            className="w-full bg-black/40 border border-white/10 rounded p-2.5 text-sm text-white focus:border-blue-500 outline-none"
                                            value={formData.bookingDate || ''}
                                            onChange={e => setFormData({...formData, bookingDate: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-red-400 uppercase font-bold mb-1 flex items-center gap-1">
                                            <Calendar size={10} /> Due Date (Purchase)
                                        </label>
                                        <input 
                                            type="date"
                                            className="w-full bg-black/40 border border-white/10 rounded p-2.5 text-sm text-white focus:border-blue-500 outline-none"
                                            value={formData.purchaseDueDate || ''}
                                            onChange={e => setFormData({...formData, purchaseDueDate: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 2. SOLD STATUS */}
                        {formData.status === 'sold' && (
                            <div className="mt-4 pt-4 border-t border-white/10 animate-in fade-in slide-in-from-top-2">
                                <div>
                                    <label className="text-[10px] text-green-500 uppercase font-bold mb-1 flex items-center gap-1">
                                        <Calendar size={10} /> Purchase / Sale Date
                                    </label>
                                    <input 
                                        type="date"
                                        className="w-full bg-green-500/10 border border-green-500/30 rounded p-2.5 text-sm text-white focus:border-green-500 outline-none"
                                        value={formData.purchaseDate || ''}
                                        onChange={e => setFormData({...formData, purchaseDate: e.target.value})}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* --- SECTION 3: CUSTOMER DETAILS --- */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                            <User size={14} /> Customer Information
                        </h3>
                        <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Name</label>
                                    <input 
                                        className="w-full bg-black/40 border border-white/10 rounded p-2.5 text-sm text-white focus:border-blue-500 outline-none"
                                        value={formData.customerName || ''} 
                                        onChange={e => setFormData({...formData, customerName: e.target.value})}
                                        placeholder="Full Name"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 flex items-center gap-1"><Phone size={10}/> Mobile</label>
                                    <input 
                                        className="w-full bg-black/40 border border-white/10 rounded p-2.5 text-sm text-white focus:border-blue-500 outline-none"
                                        value={formData.customerPhone || ''} 
                                        onChange={e => setFormData({...formData, customerPhone: e.target.value})}
                                        placeholder="+91 99999 99999"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 flex items-center gap-1"><MapPin size={10}/> Address</label>
                                <textarea 
                                    className="w-full bg-black/40 border border-white/10 rounded p-2.5 text-sm text-white focus:border-blue-500 outline-none min-h-[60px]"
                                    value={formData.customerAddress || ''} 
                                    onChange={e => setFormData({...formData, customerAddress: e.target.value})}
                                    placeholder="Customer's permanent address"
                                />
                            </div>
                        </div>
                    </div>

                    {/* --- SECTION 4: DOCUMENTS & NOTES --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Documents */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1"><FileText size={10}/> Documents</label>
                                <label className="text-[10px] text-blue-500 font-bold cursor-pointer hover:text-blue-400 transition flex items-center gap-1">
                                    <Upload size={10} /> Upload
                                    <input type="file" className="hidden" onChange={handleDocUpload} />
                                </label>
                            </div>
                            <div className="bg-black/20 border border-white/5 rounded-lg p-2 space-y-2 min-h-[80px]">
                                {(formData.documents || []).length === 0 && <p className="text-[10px] text-gray-600 text-center py-4">No files uploaded</p>}
                                
                                {(formData.documents || []).map((d, i) => (
                                    <div key={i} className="flex justify-between items-center text-[11px] bg-white/5 p-2 rounded group border border-transparent hover:border-white/10 transition">
                                        <span className="truncate w-32 text-gray-300">{d.name}</span>
                                        <div className="flex gap-2">
                                            <a href={d.url} download={d.name} className="text-gray-400 hover:text-blue-500 transition"><Download size={14}/></a>
                                            <button onClick={() => removeDoc(i)} className="text-gray-400 hover:text-red-500 transition"><Trash2 size={14}/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Remarks */}
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold mb-2 flex items-center gap-1"><StickyNote size={10}/> Remarks / Notes</label>
                            <textarea 
                                className="w-full bg-yellow-500/5 border border-yellow-500/10 rounded p-2.5 text-sm text-gray-300 focus:border-yellow-500/50 outline-none h-[80px]"
                                value={formData.remarks || ''} 
                                onChange={e => setFormData({...formData, remarks: e.target.value})}
                                placeholder="Any private notes about this deal..."
                            />
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex gap-3 pt-4 border-t border-white/10">
                        <button onClick={onClose} className="flex-1 bg-white/5 hover:bg-white/10 text-sm font-bold py-3 rounded text-gray-300 transition">Cancel</button>
                        <button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold py-3 rounded transition shadow-lg shadow-blue-900/20">
                            Save Changes
                        </button>
                    </div>

                </div>
            </div>
        </div>,
        document.body
    );
};

export default CustomerModal;