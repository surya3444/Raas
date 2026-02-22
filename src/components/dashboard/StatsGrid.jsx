import React from 'react';
import { IndianRupee, Layers, CheckCircle, Clock, Lock, BarChart3, PieChart } from 'lucide-react';

const StatsGrid = ({ layouts, limits = {}, user = JSON.parse(localStorage.getItem('rajchavin_user') || '{}') }) => {
    let totalPlots = 0;
    let totalSold = 0;
    let totalBooked = 0;
    let totalOpen = 0;
    
    // Revenue = (Sold * Full Price) + (Booked * Booking Amount)
    let totalRevenue = 0;
    
    // Project Value = Sum of Full Price of ALL plots (Sold + Booked + Open)
    let totalProjectValue = 0;

    layouts.forEach(l => {
        const elems = l.elements || [];
        totalPlots += elems.length;
        
        elems.forEach(p => {
            const price = Number(p.price) || 0;
            const bookingAmt = Number(p.bookingAmount) || 0;

            // 1. Total Potential Value (Always full price)
            totalProjectValue += price;

            // 2. Status & Realized Revenue
            if(p.status === 'sold') { 
                totalSold++; 
                totalRevenue += price; // Sold = Full Price
            } else if(p.status === 'booked') { 
                totalBooked++; 
                totalRevenue += bookingAmt; // Booked = Only Booking Amount
            } else {
                totalOpen++;
            }
        });
    });

    const formatCurr = (n) => {
        if(n >= 10000000) return `₹ ${(n/10000000).toFixed(2)} Cr`;
        if(n >= 100000) return `₹ ${(n/100000).toFixed(2)} L`;
        return `₹ ${n.toLocaleString('en-IN')}`;
    };

    // --- Format Expiry Date Safely ---
    let expiryDateStr = "N/A";
    if (user?.subscriptionEnd) {
        let dateObj;
        // Handle Firestore timestamp objects or string dates
        if (typeof user.subscriptionEnd.toDate === 'function') {
            dateObj = user.subscriptionEnd.toDate();
        } else if (user.subscriptionEnd.seconds) {
            dateObj = new Date(user.subscriptionEnd.seconds * 1000);
        } else {
            dateObj = new Date(user.subscriptionEnd);
        }
        
        if (!isNaN(dateObj)) {
            expiryDateStr = dateObj.toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric'
            });
        }
    }

    const Card = ({ title, value, sub, icon: Icon, span = "" }) => (
        <div 
            className={`relative overflow-hidden rounded-2xl p-6 border border-white/10 shadow-xl group transition-all hover:scale-[1.01] ${span}`}
            style={{
                background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.3) 0%, rgba(17, 24, 39, 0.4) 100%)', 
                backdropFilter: 'blur(10px)',
            }}
        >
            <div className="absolute -right-4 -bottom-4 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity duration-500 pointer-events-none z-0">
                <img src="/rajchavin-removebg-preview.png" alt="Watermark" className="w-24 h-24 object-contain grayscale invert" />
            </div>

            <div className="relative z-10 flex justify-between items-start">
                <div>
                    <p className="text-[10px] text-blue-300 uppercase font-bold tracking-wider mb-1 opacity-80">{title}</p>
                    <h3 className="text-2xl font-bold text-white tracking-tight truncate max-w-[180px]">{value}</h3>
                    {sub && <p className="text-[10px] text-gray-400 mt-1">{sub}</p>}
                </div>
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 group-hover:text-white group-hover:bg-blue-600 transition-colors">
                    <Icon size={20} />
                </div>
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            
            <Card 
                title="Total Project Value" 
                value={formatCurr(totalProjectValue)} 
                sub="Total estimated inventory value"
                icon={BarChart3} 
            />

            <Card 
                title="Secured Revenue" 
                value={formatCurr(totalRevenue)} 
                sub="Sold (Full) + Booked (Paid Amt)"
                icon={IndianRupee} 
            />

            <Card 
                title="Balance Revenue" 
                value={formatCurr(totalProjectValue - totalRevenue)} 
                sub="Total Value - Secured Revenue"
                icon={IndianRupee} 
            />

            <Card 
                title="Total Inventory" 
                value={totalPlots} 
                sub={`${layouts.length} Active Layouts`}
                icon={Layers} 
            />

            <Card 
                title="Sold Plots" 
                value={totalSold} 
                sub={`${((totalSold/Math.max(totalPlots,1))*100).toFixed(0)}% Conversion Rate`}
                icon={CheckCircle} 
            />

            <Card 
                title="Booked Plots" 
                value={totalBooked} 
                sub="Pending Registration"
                icon={Clock} 
            />

            <Card 
                title="Available Plots" 
                value={totalOpen} 
                sub="Open Inventory"
                icon={Lock} 
            />

            {/* --- UPDATED PLAN DETAILS CARD --- */}
            <Card 
                title="Plan Details" 
                value={user?.planName || 'Active Plan'}
                sub={`Exp: ${expiryDateStr} • Usage: ${layouts.length}/${limits.maxLayouts || 1} Proj, ${totalPlots}/${limits.maxPlots || 50} Plots`}
                icon={PieChart}
            />

        </div>
    );
};

export default StatsGrid;