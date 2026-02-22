import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, FileSpreadsheet, MapPin, Wallet } from 'lucide-react';
import { useNexus } from '../../../context/NexusContext';

const ReportModal = ({ layout, onClose }) => {
    const printRef = useRef();
    const { user } = useNexus();

    // --- ROBUST NAME FETCHER ---
    const getDeveloperName = () => {
        // 1. Try Logged In User's Display Name
        if (user?.displayName) return user.displayName;
        
        // 2. Try Email Username (e.g., "john" from "john@example.com")
        if (user?.email) return user.email.split('@')[0];
        
        // 3. Try Layout Creator field (if exists in DB)
        if (layout?.createdBy) return layout.createdBy;

        // 4. Professional Fallback
        return "Authorized Signatory";
    };

    const developerName = getDeveloperName();

    // 1. Filter Plots Only
    const plots = (layout.elements || []).filter(e => e.type === 'plot');

    // 2. Calculate Financials
    const stats = plots.reduce((acc, p) => {
        const price = Number(p.price) || 0;
        const bookingAmt = Number(p.bookingAmount) || 0;

        acc.totalValue += price;

        if (p.status === 'sold') {
            acc.soldCount++;
            acc.realizedRevenue += price;
        } else if (p.status === 'booked') {
            acc.bookedCount++;
            acc.collectedBooking += bookingAmt;
            acc.realizedRevenue += bookingAmt;
        } else {
            acc.openCount++;
        }
        return acc;
    }, { totalValue: 0, realizedRevenue: 0, collectedBooking: 0, soldCount: 0, bookedCount: 0, openCount: 0 });

    // Calculate Balance
    const balanceAmount = stats.totalValue - stats.realizedRevenue;

    // 3. Handle Print
    const handlePrint = () => {
        const printContent = printRef.current.innerHTML;
        const originalContent = document.body.innerHTML;
        document.body.innerHTML = printContent;
        window.print();
        document.body.innerHTML = originalContent;
        window.location.reload(); 
    };

    // 4. Handle CSV
    const handleExportCSV = () => {
        const headers = ["Plot ID", "Status", "Dimensions", "Facing", "Price", "Booking Amount", "Customer Name", "Phone", "Booking Date", "Purchase Date"];
        const rows = plots.map(p => [
            p.id,
            p.status.toUpperCase(),
            p.dimensions || '-',
            p.facing || '-',
            p.price || 0,
            p.bookingAmount || 0,
            `"${p.customerName || ''}"`, 
            p.customerPhone || '-',
            p.bookingDate ? new Date(p.bookingDate).toLocaleDateString() : '-',
            p.purchaseDate ? new Date(p.purchaseDate).toLocaleDateString() : '-'
        ]);
        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${layout.name}_Report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div className="bg-[#121214] w-full max-w-5xl h-[90vh] rounded-2xl border border-white/10 flex flex-col shadow-2xl overflow-hidden">
                
                {/* --- HEADER --- */}
                <div className="h-16 border-b border-white/10 flex justify-between items-center px-6 bg-[#18181b] shrink-0">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Wallet size={20} className="text-blue-500"/> Financial Report
                    </h2>
                    <div className="flex gap-3">
                        <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600/10 text-green-500 hover:bg-green-600 hover:text-white border border-green-600/20 transition text-xs font-bold">
                            <FileSpreadsheet size={16}/> CSV Export
                        </button>
                        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition text-xs font-bold shadow-lg shadow-blue-900/20">
                            <Printer size={16}/> Print PDF
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition"><X size={20}/></button>
                    </div>
                </div>

                {/* --- PRINTABLE AREA --- */}
                <div className="flex-1 overflow-y-auto p-10 bg-white text-black font-sans" ref={printRef}>
                    
                    {/* BRANDING HEADER */}
                    <div className="flex justify-between items-center mb-8 pb-6 border-b-2 border-black">
                        <div>
                            {/* FALLBACK TITLE IF IMAGE FAILS */}
                            <div className="flex flex-col">
                                <img 
                                    src="/rajchavin.jpeg" 
                                    alt="Rajchavin" 
                                    className="h-16 w-auto object-contain mb-2"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'block'; // Show text if img fails
                                    }} 
                                />
                                
                            </div>
                        </div>
                        <div className="text-right w-80">
                            <h2 className="text-xl font-bold text-gray-800">{layout.name}</h2>
                            <p className="text-sm text-gray-600 flex items-center justify-end gap-1 mt-1"><MapPin size={12}/> {layout.address || "Location"}</p>
                            <p className="text-xs text-gray-500 mt-1">Date: {new Date().toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* --- SINGLE CONSOLIDATED SUMMARY CARD --- */}
                    <div className="mb-10 bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                        <div className="bg-gray-100 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800 uppercase tracking-wide text-sm">Project Summary Dashboard</h3>
                            <span className="text-xs font-semibold text-gray-500">Total Plots: {plots.length} | Area: {layout.totalArea || "N/A"}</span>
                        </div>
                        
                        <div className="p-6">
                            {/* Top Row: Core Financials */}
                            <div className="grid grid-cols-3 gap-6 mb-6 pb-6 border-b border-gray-200">
                                <div>
                                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Total Project Value</p>
                                    <p className="text-3xl font-black text-blue-900">{formatCurrency(stats.totalValue)}</p>
                                </div>
                                <div className="border-l border-gray-200 pl-6">
                                    <p className="text-[11px] font-bold text-green-600 uppercase tracking-wider mb-1">Total Collected</p>
                                    <p className="text-3xl font-black text-green-700">{formatCurrency(stats.realizedRevenue)}</p>
                                </div>
                                <div className="border-l border-gray-200 pl-6">
                                    <p className="text-[11px] font-bold text-orange-600 uppercase tracking-wider mb-1">Balance Amount</p>
                                    <p className="text-3xl font-black text-orange-600">{formatCurrency(balanceAmount)}</p>
                                </div>
                            </div>

                            {/* Bottom Row: Inventory Stats */}
                            <div className="flex gap-12">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    <div>
                                        <p className="text-xl font-bold text-gray-800">{stats.soldCount}</p>
                                        <p className="text-[10px] uppercase text-gray-500 font-bold">Sold Plots</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                    <div>
                                        <p className="text-xl font-bold text-gray-800">{stats.bookedCount}</p>
                                        <p className="text-[10px] uppercase text-gray-500 font-bold">Booked Plots</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                                    <div>
                                        <p className="text-xl font-bold text-gray-800">{stats.openCount}</p>
                                        <p className="text-[10px] uppercase text-gray-500 font-bold">Open Plots</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TABLE */}
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b-2 border-black bg-gray-100">
                                <th className="py-3 pl-3 font-black text-gray-700 uppercase tracking-wider w-16">ID</th>
                                <th className="py-3 font-black text-gray-700 uppercase tracking-wider w-24">Status</th>
                                <th className="py-3 font-black text-gray-700 uppercase tracking-wider">Customer</th>
                                <th className="py-3 font-black text-gray-700 uppercase tracking-wider text-right">Price</th>
                                <th className="py-3 font-black text-gray-700 uppercase tracking-wider text-right">Paid</th>
                                <th className="py-3 pr-3 font-black text-gray-700 uppercase tracking-wider text-right">Date</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-800 font-medium">
                            {plots.map((p, i) => (
                                <tr key={p.id} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                    <td className="py-3 pl-3 font-bold">{p.id}</td>
                                    <td className="py-3">
                                        <span className={`px-2 py-1 rounded uppercase text-[9px] font-bold border ${
                                            p.status === 'sold' ? 'bg-green-100 text-green-800 border-green-200' : 
                                            p.status === 'booked' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 
                                            'bg-gray-100 text-gray-600 border-gray-200'
                                        }`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="py-3">
                                        <div>
                                            <p className="text-black font-bold">{p.customerName || '-'}</p>
                                            {p.customerPhone && <p className="text-[10px] text-gray-500">{p.customerPhone}</p>}
                                        </div>
                                    </td>
                                    <td className="py-3 text-right">{p.price ? formatCurrency(p.price) : '-'}</td>
                                    <td className="py-3 text-right font-mono font-bold text-gray-700">
                                        {p.status === 'sold' ? formatCurrency(p.price) : (p.bookingAmount ? formatCurrency(p.bookingAmount) : '-')}
                                    </td>
                                    <td className="py-3 pr-3 text-right">
                                        {p.status === 'sold' && p.purchaseDate ? (
                                            <div>
                                                <p className="font-bold">{new Date(p.purchaseDate).toLocaleDateString()}</p>
                                                <p className="text-[9px] text-gray-400 uppercase">Purchased</p>
                                            </div>
                                        ) : p.status === 'booked' && p.bookingDate ? (
                                            <div>
                                                <p className="font-bold text-yellow-700">{new Date(p.bookingDate).toLocaleDateString()}</p>
                                                <p className="text-[9px] text-gray-400 uppercase">Booked On</p>
                                            </div>
                                        ) : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* FOOTER */}
                    <div className="mt-16 pt-8 border-t border-gray-200 flex justify-between items-end text-gray-400">
                        <div className="text-left">
                            <h1>Rajchavin</h1>
                            <p className="text-[10px] uppercase tracking-widest font-bold">Generated by Nexus Engine</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-bold mb-1 uppercase tracking-wider text-gray-500">Report Issued By</p>
                            <p className="text-lg font-black text-black uppercase tracking-tighter">
                                {developerName}
                            </p>
                            <p className="text-[9px] text-gray-500">Authorized Agent / Developer</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ReportModal;