import React from 'react';
import { IndianRupee, Layers, CheckCircle, Clock, Lock, BarChart3, PieChart, TrendingUp } from 'lucide-react';
import { useNexus } from '../../../context/NexusContext';

const NexusStats = ({ layouts }) => {
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
            
            {/* 1. SECURED REVENUE */}
            <Card 
                title="Secured Revenue" 
                value={formatCurr(totalRevenue)} 
                sub="Sold (Full) + Booked (Part)"
                colorClass="border-blue-500"
                icon={IndianRupee}
            />

            {/* 2. TOTAL PROJECT VALUE */}
            <Card 
                title="Total Project Value" 
                value={formatCurr(totalProjectValue)} 
                sub="Estimated Total Inventory"
                colorClass="border-purple-500"
                icon={TrendingUp}
            />

            {/* 3. SOLD PLOTS */}
            <Card 
                title="Sold Plots" 
                value={totalSold} 
                sub={`${totalPlots > 0 ? ((totalSold/totalPlots)*100).toFixed(1) : 0}% Conversion Rate`}
                colorClass="border-green-500"
                icon={CheckCircle}
            />

            {/* 4. BOOKED PLOTS */}
            <Card 
                title="Booked Plots" 
                value={totalBooked} 
                sub="Pending Finalization"
                colorClass="border-yellow-500"
                icon={Clock}
            />

             {/* 5. AVAILABLE INVENTORY */}
             <Card 
                title="Available Plots" 
                value={totalOpen} 
                sub="Open for Sale"
                colorClass="border-gray-500"
                icon={Lock}
            />

            {/* 6. PLAN USAGE */}
            <Card 
                title="Plan Usage" 
                value={`${totalPlots} / ${limits.maxPlots || 50}`} 
                sub="Total Plots Used"
                colorClass="border-red-500"
                icon={BarChart3}
            />

             {/* 7. LAYOUTS */}
             <Card 
                title="Active Projects" 
                value={`${layouts.length} / ${limits.maxLayouts || 5}`} 
                sub="Layout Limit"
                colorClass="border-indigo-500"
                icon={PieChart}
            />

            {/* 8. TOTAL INVENTORY */}
            <Card 
                title="Total Units" 
                value={totalPlots} 
                sub="Across All Projects"
                colorClass="border-cyan-500"
                icon={Layers}
            />

        </div>
    );
};

export default NexusStats;