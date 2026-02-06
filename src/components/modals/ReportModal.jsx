import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, FileSpreadsheet, Printer, Filter, Calendar, CheckCircle, MapPin } from 'lucide-react';

const ReportModal = ({ layout, onClose }) => {
    // --- FILTERS ---
    const [statusFilter, setStatusFilter] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // --- HELPER: SAFE DATE PARSING ---
    const parseDate = (val) => {
        if (!val) return null;
        // Handle Firestore Timestamp
        if (val?.seconds) return new Date(val.seconds * 1000);
        // Handle String/Date object
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d;
    };

    // --- FILTER LOGIC (Memoized) ---
    const filteredData = useMemo(() => {
        // Only consider plots, exclude infrastructure for reports
        let data = (layout.elements || []).filter(e => e.type === 'plot');

        // 1. Status Filter
        if (statusFilter !== 'all') {
            data = data.filter(p => p.status === statusFilter);
        }

        // 2. Date Filter
        if (startDate || endDate) {
            const start = startDate ? new Date(startDate) : new Date('1970-01-01');
            const end = endDate ? new Date(endDate) : new Date();
            end.setHours(23, 59, 59); // Include full end day

            data = data.filter(p => {
                // Determine which date to check based on status
                let dateVal = null;
                if (p.status === 'sold') dateVal = p.purchaseDate;
                else if (p.status === 'booked') dateVal = p.bookingDate;
                
                const txnDate = parseDate(dateVal);
                if (!txnDate) return false; // Exclude if no transaction date exists for filter

                return txnDate >= start && txnDate <= end;
            });
        }
        
        return data;
    }, [layout.elements, statusFilter, startDate, endDate]);

    const totalValue = filteredData.reduce((sum, p) => sum + (Number(p.price) || 0), 0);

    // --- EXPORT: CSV ---
    const downloadCSV = () => {
        const headers = ["Plot No", "Status", "Size (Sq.ft)", "Facing", "Price", "Customer Name", "Phone", "Date"];
        
        const rows = filteredData.map(p => {
            const dateStr = p.status === 'sold' ? p.purchaseDate : (p.status === 'booked' ? p.bookingDate : '-');
            // Safe date formatting
            const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString() : '-';
            
            return [
                p.id,
                p.status.toUpperCase(),
                p.dimensions || '-',
                p.facing || '-',
                p.price || 0,
                `"${p.customerName || ''}"`,
                `"${p.customerPhone || ''}"`,
                formattedDate
            ];
        });

        // Add Layout Info to top of CSV
        const meta = [
            `Project Name: ${layout.name}`,
            `Location: ${layout.address || 'Not Specified'}`,
            `Generated: ${new Date().toLocaleDateString()}`,
            `Filters: Status=${statusFilter}`,
            "" // Empty row
        ];

        const csvContent = [
            ...meta,
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${layout.name.replace(/\s+/g, '_')}_Report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- EXPORT: PDF (PRINT VIEW) ---
    const printReport = () => {
        const printWindow = window.open('', '_blank');
        
        // Define Logo URL (Ensure this exists in public folder)
        const logoUrl = window.location.origin + "/rajchavin.jpeg"; 

        printWindow.document.write(`
            <html>
            <head>
                <title>Report - ${layout.name}</title>
                <style>
                    body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #111; }
                    
                    /* Branding Header */
                    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
                    .brand { display: flex; align-items: center; gap: 15px; }
                    .brand img { height: 50px; width: auto; object-fit: contain; }
                    .brand-text h1 { margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; }
                    .brand-text p { margin: 2px 0 0; font-size: 10px; color: #666; text-transform: uppercase; font-weight: bold; }
                    
                    .meta { text-align: right; font-size: 12px; color: #444; }

                    /* Project Details */
                    .project-info { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 30px; display: flex; gap: 40px; border: 1px solid #eee; }
                    .info-item label { display: block; font-size: 10px; text-transform: uppercase; font-weight: bold; color: #666; margin-bottom: 4px; }
                    .info-item p { margin: 0; font-size: 14px; font-weight: 600; }

                    /* Table */
                    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; }
                    th { background-color: #111; color: #fff; padding: 10px 8px; text-align: left; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px; }
                    td { border-bottom: 1px solid #ddd; padding: 10px 8px; color: #333; vertical-align: middle; }
                    tr:nth-child(even) { background-color: #f9f9f9; }

                    .status-badge { padding: 4px 8px; border-radius: 4px; font-weight: bold; display: inline-block; font-size: 9px; text-transform: uppercase; border: 1px solid transparent; }
                    .st-sold { background: #dcfce7; color: #166534; border-color: #bbf7d0; }
                    .st-booked { background: #fef9c3; color: #854d0e; border-color: #fde047; }
                    .st-open { background: #f3f4f6; color: #4b5563; border-color: #e5e7eb; }

                    .footer { margin-top: 50px; font-size: 10px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
                    .total-box { margin-top: 20px; text-align: right; font-size: 14px; font-weight: bold; padding: 15px; background: #f8f9fa; border-radius: 8px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="brand">
                        <img src="${logoUrl}" onerror="this.style.display='none'">
                        
                    </div>
                    <div class="meta">
                        <p><strong>Report Date:</strong> ${new Date().toLocaleDateString()}</p>
                        <p><strong>Time:</strong> ${new Date().toLocaleTimeString()}</p>
                    </div>
                </div>

                <div class="project-info">
                    <div class="info-item">
                        <label>Project Name</label>
                        <p>${layout.name}</p>
                    </div>
                    <div class="info-item">
                        <label>Location</label>
                        <p>${layout.address || 'Not Specified'}</p>
                    </div>
                    <div class="info-item">
                        <label>Filtered Records</label>
                        <p>${filteredData.length}</p>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th width="10%">Plot No</th>
                            <th width="15%">Status</th>
                            <th width="15%">Size</th>
                            <th width="20%">Customer Name</th>
                            <th width="15%">Phone</th>
                            <th width="15%">Date</th>
                            <th width="10%" style="text-align:right">Price (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredData.map(p => {
                            const dateStr = p.status === 'sold' ? p.purchaseDate : (p.status === 'booked' ? p.bookingDate : null);
                            const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString() : '-';
                            return `
                                <tr>
                                    <td><b>${p.id}</b></td>
                                    <td><span class="status-badge st-${p.status}">${p.status}</span></td>
                                    <td>${p.dimensions || '-'}</td>
                                    <td>${p.customerName || '-'}</td>
                                    <td>${p.customerPhone || '-'}</td>
                                    <td>${formattedDate}</td>
                                    <td style="text-align:right">${Number(p.price || 0).toLocaleString('en-IN')}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>

                <div class="total-box">
                    Total Inventory Value (Filtered): ₹ ${totalValue.toLocaleString('en-IN')}
                </div>

                <div class="footer">
                    Generated by Rajchavin Software • www.rajchavin.com
                </div>

                <script>
                    // Wait for image to load before printing
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="glass-panel w-full max-w-lg p-6 bg-[#121214] border border-white/10 shadow-2xl rounded-2xl">
                
                <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <FileSpreadsheet className="text-blue-500" size={20} /> Report Generator
                    </h2>
                    <button onClick={onClose}><X size={20} className="text-gray-500 hover:text-white transition" /></button>
                </div>

                {/* Filters */}
                <div className="space-y-5 mb-6">
                    <div>
                        <label className="text-[10px] text-gray-500 uppercase font-bold mb-1.5 flex items-center gap-1"><Filter size={12}/> Filter by Status</label>
                        <select 
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none transition"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Records</option>
                            <option value="sold">Sold Only</option>
                            <option value="booked">Booked Only</option>
                            <option value="open">Available / Open</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold mb-1.5 flex items-center gap-1"><Calendar size={12}/> Start Date</label>
                            <input type="date" className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none transition" 
                                value={startDate} onChange={e => setStartDate(e.target.value)} 
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold mb-1.5 flex items-center gap-1"><Calendar size={12}/> End Date</label>
                            <input type="date" className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none transition" 
                                value={endDate} onChange={e => setEndDate(e.target.value)} 
                            />
                        </div>
                    </div>

                    {/* Summary Preview */}
                    <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20 flex justify-between items-center">
                        <div>
                            <span className="text-xs text-blue-400 font-bold uppercase block">Preview Summary</span>
                            <span className="text-[10px] text-gray-400">Records matching criteria</span>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-bold text-white flex items-center gap-2 justify-end">
                                {filteredData.length} <CheckCircle size={18} className="text-emerald-500"/>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
                    <button onClick={downloadCSV} disabled={filteredData.length===0} className="flex flex-col items-center justify-center gap-2 p-4 bg-emerald-900/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-900/30 transition disabled:opacity-50 disabled:cursor-not-allowed group">
                        <FileSpreadsheet className="text-emerald-500 group-hover:scale-110 transition" size={24} />
                        <span className="text-xs font-bold text-emerald-400">Download CSV</span>
                    </button>

                    <button onClick={printReport} disabled={filteredData.length===0} className="flex flex-col items-center justify-center gap-2 p-4 bg-blue-900/10 border border-blue-500/20 rounded-xl hover:bg-blue-900/30 transition disabled:opacity-50 disabled:cursor-not-allowed group">
                        <Printer className="text-blue-500 group-hover:scale-110 transition" size={24} />
                        <span className="text-xs font-bold text-blue-400">Print PDF</span>
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ReportModal;