import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { updateDoc, doc, getDoc } from "firebase/firestore";
import { db } from '../../firebase';
import { X, Trash2, Upload, FileText, Download, User, MapPin, Phone, StickyNote, Ruler, Compass, IndianRupee, Calendar, Plus, Mail } from 'lucide-react';

// --- UTILITY: Convert Number to Words (Indian Format) ---
const numberToWords = (num) => {
    if (!num) return '';
    const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

    const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';

    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';

    return str ? str.trim() + ' only' : '';
};

const CustomerModal = ({ layout, index, data, onClose }) => {
    
    // Initialize form data. Notice we parse installaments or default to an empty array.
    const [formData, setFormData] = useState({ 
        id: '',
        status: 'open',
        price: '',
        size: '',
        facing: '',
        installments: [], // Array of { id, amount, date, reference }
        purchaseDueDate: '',  
        purchaseDate: '',     
        customerName: '',
        customerPhone: '',
        customerEmail: '', // NEW: Email field
        customerAddress: '',
        remarks: '',
        documents: []
    });

    // Sync prop changes safely
    useEffect(() => { 
        if(data) {
            setFormData(prev => ({ 
                ...prev, 
                ...data,
                // Ensure default fallbacks are applied correctly
                size: data.size || '',
                facing: data.facing || '',
                purchaseDueDate: data.purchaseDueDate || '',
                purchaseDate: data.purchaseDate || '',
                price: data.price || '',
                installments: data.installments || []
            })); 
        }
    }, [data]);

    // Calculate Total Paid and Balance
    const price = Number(formData.price) || 0;
    
    // Calculate total paid by summing all installments
    const totalPaid = formData.installments.reduce((sum, inst) => sum + (Number(inst.amount) || 0), 0);
    const balance = Math.max(0, price - totalPaid);

    // --- INSTALLMENT HANDLERS ---
    const addInstallment = () => {
        const newInstallment = {
            id: Date.now().toString(),
            amount: '',
            date: new Date().toISOString().split('T')[0], // Default to today
            reference: '' // e.g. "Cash", "Cheque #123", "UPI"
        };
        setFormData(prev => ({ ...prev, installments: [...prev.installments, newInstallment] }));
    };

    const updateInstallment = (id, field, value) => {
        setFormData(prev => ({
            ...prev,
            installments: prev.installments.map(inst => 
                inst.id === id ? { ...inst, [field]: value } : inst
            )
        }));
    };

    const removeInstallment = (id) => {
        if(!confirm("Remove this payment record?")) return;
        setFormData(prev => ({
            ...prev,
            installments: prev.installments.filter(inst => inst.id !== id)
        }));
    };

    const handleSave = async () => {
        try {
            // Fetch fresh layout data to ensure we don't overwrite other users' concurrent edits
            const layoutRef = doc(db, "layouts", layout.id);
            const layoutSnap = await getDoc(layoutRef);

            if (layoutSnap.exists()) {
                const freshData = layoutSnap.data();
                const allElements = freshData.elements || [];

                // Instead of a single 'bookingAmount', we save 'totalPaid' for easy querying in dashboards, 
                // alongside the detailed 'installments' array.
                const updatedElementData = {
                    ...formData,
                    bookingAmount: totalPaid // Keep this for backward compatibility with your dashboard stats
                };

                const newElements = allElements.map(el => 
                    el.id === data.id ? { ...el, ...updatedElementData } : el
                );

                await updateDoc(layoutRef, { elements: newElements });
                onClose();
            }
        } catch (error) {
            console.error("Save failed:", error);
            alert("Failed to save changes: " + error.message);
        }
    };

    const handleDelete = async () => {
        if(!confirm("Delete this plot entry?")) return;
        
        try {
            const layoutRef = doc(db, "layouts", layout.id);
            const layoutSnap = await getDoc(layoutRef);

            if (layoutSnap.exists()) {
                const freshData = layoutSnap.data();
                const allElements = freshData.elements || [];

                const newElements = allElements.filter(el => el.id !== data.id);
                
                await updateDoc(layoutRef, { elements: newElements });
                onClose();
            }
        } catch (error) {
            console.error("Delete failed:", error);
            alert("Failed to delete: " + error.message);
        }
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
                            <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 flex items-center gap-1"><Ruler size={10}/> Size</label>
                            <input 
                                className="w-full bg-black/40 border border-white/10 rounded p-2.5 text-sm text-white focus:border-blue-500 outline-none"
                                value={formData.size} 
                                onChange={e => setFormData({...formData, size: e.target.value})}
                                placeholder="e.g. 1200 Sq.ft"
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
                                {/* --- MONEY IN WORDS --- */}
                                {formData.price > 0 && (
                                    <p className="text-[10px] text-blue-400 mt-1 italic capitalize">
                                        {numberToWords(formData.price)}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* --- 1. BOOKED STATUS (INSTALLMENTS LOGIC) --- */}
                        {formData.status === 'booked' && (
                            <div className="mt-4 pt-4 border-t border-white/10 animate-in fade-in slide-in-from-top-2">
                                
                                <div className="flex justify-between items-end mb-3">
                                    <div>
                                        <h3 className="text-xs font-bold text-yellow-500 uppercase flex items-center gap-1">Payment Log</h3>
                                        <p className="text-[10px] text-gray-500 mt-0.5">Record partial payments</p>
                                    </div>
                                    <button 
                                        onClick={addInstallment} 
                                        className="text-[10px] bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500 hover:text-white px-3 py-1.5 rounded flex items-center gap-1 transition font-bold"
                                    >
                                        <Plus size={12}/> Add Payment
                                    </button>
                                </div>

                                {/* Installments List */}
                                <div className="space-y-2 mb-4 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
                                    {formData.installments.length === 0 ? (
                                        <div className="text-center py-4 bg-black/20 rounded border border-white/5 text-xs text-gray-500 italic">No payments recorded yet.</div>
                                    ) : (
                                        formData.installments.map((inst, idx) => (
                                            <div key={inst.id} className="flex flex-col gap-1 bg-black/40 border border-white/10 p-2 rounded-lg group focus-within:border-yellow-500/50 transition">
                                                <div className="flex gap-2 items-center">
                                                    <span className="text-[10px] font-bold text-gray-600 w-4">{idx + 1}.</span>
                                                    <input 
                                                        type="date" 
                                                        className="bg-transparent text-xs text-white outline-none w-28"
                                                        value={inst.date}
                                                        onChange={(e) => updateInstallment(inst.id, 'date', e.target.value)}
                                                    />
                                                    <input 
                                                        type="number" 
                                                        className="bg-transparent text-sm text-yellow-400 font-bold outline-none w-24 flex-1"
                                                        placeholder="Amount"
                                                        value={inst.amount}
                                                        onChange={(e) => updateInstallment(inst.id, 'amount', e.target.value)}
                                                    />
                                                    <input 
                                                        type="text" 
                                                        className="bg-transparent text-xs text-gray-400 outline-none flex-1 hidden sm:block"
                                                        placeholder="Ref/Mode (e.g. UPI)"
                                                        value={inst.reference}
                                                        onChange={(e) => updateInstallment(inst.id, 'reference', e.target.value)}
                                                    />
                                                    <button onClick={() => removeInstallment(inst.id)} className="text-gray-600 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition"><X size={14}/></button>
                                                </div>
                                                {/* --- DYNAMIC MONEY IN WORDS FOR INSTALLMENT --- */}
                                                {inst.amount > 0 && (
                                                    <p className="text-[9px] text-yellow-500/70 italic capitalize ml-6 pl-1">
                                                        {numberToWords(inst.amount)}
                                                    </p>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Summary & Due Date */}
                                <div className="grid grid-cols-2 gap-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3">
                                    <div>
                                        <label className="text-[10px] text-gray-500 uppercase font-bold mb-1">Total Paid</label>
                                        <div className="text-sm font-bold text-yellow-400">₹ {totalPaid.toLocaleString('en-IN')}</div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-500 uppercase font-bold mb-1">Balance Due</label>
                                        <div className="text-sm font-bold text-red-400">₹ {balance.toLocaleString('en-IN')}</div>
                                    </div>
                                    <div className="col-span-2 mt-2 pt-2 border-t border-white/5">
                                        <label className="text-[10px] text-red-400 uppercase font-bold mb-1 flex items-center gap-1">
                                            <Calendar size={10} /> Final Due Date
                                        </label>
                                        <input 
                                            type="date"
                                            className="w-full bg-black/40 border border-white/10 rounded p-2 text-xs text-white focus:border-red-500 outline-none"
                                            value={formData.purchaseDueDate || ''}
                                            onChange={e => setFormData({...formData, purchaseDueDate: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- 2. SOLD STATUS --- */}
                        {formData.status === 'sold' && (
                            <div className="mt-4 pt-4 border-t border-white/10 animate-in fade-in slide-in-from-top-2">
                                <div>
                                    <label className="text-[10px] text-green-500 uppercase font-bold mb-1 flex items-center gap-1">
                                        <Calendar size={10} /> Purchase / Registration Date
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
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 flex items-center gap-1"><Phone size={10}/> Mobile</label>
                                        <input 
                                            className="w-full bg-black/40 border border-white/10 rounded p-2.5 text-sm text-white focus:border-blue-500 outline-none"
                                            value={formData.customerPhone || ''} 
                                            onChange={e => setFormData({...formData, customerPhone: e.target.value})}
                                            placeholder="+91..."
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 flex items-center gap-1"><Mail size={10}/> Email</label>
                                        <input 
                                            type="email"
                                            className="w-full bg-black/40 border border-white/10 rounded p-2.5 text-sm text-white focus:border-blue-500 outline-none"
                                            value={formData.customerEmail || ''} 
                                            onChange={e => setFormData({...formData, customerEmail: e.target.value})}
                                            placeholder="@"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 flex items-center gap-1"><MapPin size={10}/> Address</label>
                                <textarea 
                                    className="w-full bg-black/40 border border-white/10 rounded p-2.5 text-sm text-white focus:border-blue-500 outline-none min-h-[40px]"
                                    value={formData.customerAddress || ''} 
                                    onChange={e => setFormData({...formData, customerAddress: e.target.value})}
                                    placeholder="Permanent address"
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