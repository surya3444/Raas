import React from 'react';
import { IndianRupee, Layers, CheckCircle, Clock, Lock, BarChart3, PieChart, TrendingUp } from 'lucide-react';
import { useNexus } from '../../../context/NexusContext';

const NexusStats = ({ layouts, isManager }) => {
    const { user } = useNexus();
    const limits = user?.limits || {};

    let totalPlots = 0;
    let totalSold = 0;
    let totalBooked = 0;
    let totalOpen = 0;
    
    // Financials
    let totalRevenue = 0; // Sold (Full) + Booked (Booking Amt)
    let totalProjectValue = 0; // Sum of price of ALL plots

    layouts.forEach(l => {
        const elems = l.elements || [];
        totalPlots += elems.filter(e => e.type === 'plot').length;
        
        elems.forEach(p => {
            if (p.type !== 'plot') return;
            const price = Number(p.price) || 0;
            const bookingAmt = Number(p.bookingAmount) || 0;

            // Project Value includes everything
            totalProjectValue += price;

            if(p.status === 'sold') { 
                totalSold++; 
                totalRevenue += price; 
            } else if(p.status === 'booked') { 
                totalBooked++; 
                totalRevenue += bookingAmt; 
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

    // Safely format the expiry date from Firestore Timestamp or string
    let expiryDateStr = "N/A";
    if (user?.subscriptionEnd) {
        let dateObj;
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

    const Card = ({ title, value, sub, icon: Icon, colorClass }) => (
        <div className={`glass-panel p-5 border-l-2 relative overflow-hidden group transition hover:-translate-y-1 hover:shadow-lg ${colorClass}`}>
            <div className="absolute right-[-10px] top-[-10px] opacity-5 group-hover:opacity-10 transition-opacity">
                {Icon && <Icon size={80} />}
            </div>
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{title}</p>
                    <h3 className="text-2xl font-bold text-white mt-1 tracking-tight">{value}</h3>
                    {sub && <p className="text-[10px] text-gray-400 mt-1 font-medium">{sub}</p>}
                </div>
                <div className={`p-2 rounded-lg bg-white/5 text-gray-400`}>
                    {Icon && <Icon size={20} />}
                </div>
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1. TOTAL PROJECT VALUE (Hidden for Managers) */}
            {!isManager && (
                <Card 
                    title="Total Project Value" 
                    value={formatCurr(totalProjectValue)} 
                    sub="Estimated Total Inventory"
                    colorClass="border-purple-500"
                    icon={TrendingUp}
                />
            )}

            {/* 2. SECURED REVENUE */}
            <Card 
                title="Secured Revenue" 
                value={formatCurr(totalRevenue)} 
                sub="Sold (Full) + Booked (Part)"
                colorClass="border-blue-500"
                icon={IndianRupee}
            />

            {/* 3. BALANCE REVENUE */}
            <Card 
                title="Balance Revenue" 
                value={formatCurr(totalProjectValue - totalRevenue)} 
                sub="Sold (Full) + Booked (Part)"
                colorClass="border-blue-500"
                icon={IndianRupee}
            />

            {/* 4. TOTAL INVENTORY */}
            <Card 
                title="Total Inventory" 
                value={totalPlots} 
                sub={isManager ? "Across Assigned Projects" : "Across All Projects"}
                colorClass="border-cyan-500"
                icon={Layers}
            />

            {/* 5. SOLD PLOTS */}
            <Card 
                title="Sold Plots" 
                value={totalSold} 
                sub={`${totalPlots > 0 ? ((totalSold/totalPlots)*100).toFixed(1) : 0}% Conversion Rate`}
                colorClass="border-green-500"
                icon={CheckCircle}
            />

            {/* 6. BOOKED PLOTS */}
            <Card 
                title="Booked Plots" 
                value={totalBooked} 
                sub="Pending Finalization"
                colorClass="border-yellow-500"
                icon={Clock}
            />

             {/* 7. AVAILABLE INVENTORY */}
             <Card 
                title="Available Plots" 
                value={totalOpen} 
                sub="Open for Sale"
                colorClass="border-gray-500"
                icon={Lock}
            />

            {/* 8. LAYOUTS (Dynamically hides limits for managers) */}
             <Card 
                title="Active Projects" 
                value={isManager ? layouts.length : `${layouts.length} / ${limits.maxLayouts || 5}`} 
                sub={isManager ? "Assigned Layouts" : "Layout Limit"}
                colorClass="border-indigo-500"
                icon={PieChart}
            />

            {/* 9. PLAN DETAILS (Hidden for Managers) */}
            {!isManager && (
                <Card 
                    title="Plan Details" 
                    value={user?.planName || 'Active Plan'} 
                    sub={`Exp: ${expiryDateStr} • Plots: ${totalPlots}/${limits.maxPlots || 50}`}
                    colorClass="border-red-500"
                    icon={BarChart3}
                />
            )}
            
        </div>
    );
};

export default NexusStats;