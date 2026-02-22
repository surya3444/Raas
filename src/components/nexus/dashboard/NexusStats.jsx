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

    const Card = ({ title, value, sub, icon: Icon, color }) => {
        
        // --- CUSTOM GOLD CARD STYLING ---
        if (color === 'gold') {
            return (
                <div className="p-5 border-[2px] border-amber-500/80 rounded-2xl relative overflow-hidden group transition-all duration-500 hover:-translate-y-1 bg-gradient-to-br from-amber-600/40 via-amber-900/20 to-[#121214] backdrop-blur-md shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_40px_rgba(245,158,11,0.5)]">
                    <div className="absolute right-[-10px] top-[-10px] opacity-[0.1] group-hover:opacity-[0.2] transition-opacity duration-500 text-amber-300">
                        {Icon && <Icon size={80} />}
                    </div>
                    <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-amber-400/20 blur-3xl pointer-events-none group-hover:bg-amber-400/30 transition-all duration-500"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-[10px] text-amber-200 font-bold uppercase tracking-wider group-hover:text-amber-100 transition-colors drop-shadow-md">{title}</p>
                            <h3 className="text-2xl font-bold text-white mt-1 tracking-tight drop-shadow-md">{value}</h3>
                            {sub && <p className="text-[10px] text-amber-100 mt-1 font-medium opacity-80">{sub}</p>}
                        </div>
                        <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-400/30 transition-colors duration-500 group-hover:bg-amber-500/40 shadow-inner text-amber-300 group-hover:text-white">
                            {Icon && <Icon size={20} />}
                        </div>
                    </div>
                </div>
            );
        }

        // --- STANDARD CARDS STYLING ---
        const glowStyles = {
            purple: "border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.15)] hover:shadow-[0_0_30px_rgba(168,85,247,0.35)]",
            blue: "border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)] hover:shadow-[0_0_30px_rgba(59,130,246,0.35)]",
            cyan: "border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:shadow-[0_0_30px_rgba(6,182,212,0.35)]",
            green: "border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.15)] hover:shadow-[0_0_30px_rgba(34,197,94,0.35)]",
            yellow: "border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.15)] hover:shadow-[0_0_30px_rgba(234,179,8,0.35)]",
            gray: "border-gray-500 shadow-[0_0_15px_rgba(107,114,128,0.15)] hover:shadow-[0_0_30px_rgba(107,114,128,0.35)]",
            indigo: "border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.15)] hover:shadow-[0_0_30px_rgba(99,102,241,0.35)]",
            red: "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)] hover:shadow-[0_0_30px_rgba(239,68,68,0.35)]",
        };

        const iconColors = {
            purple: "text-purple-400 group-hover:text-purple-300",
            blue: "text-blue-400 group-hover:text-blue-300",
            cyan: "text-cyan-400 group-hover:text-cyan-300",
            green: "text-green-400 group-hover:text-green-300",
            yellow: "text-yellow-400 group-hover:text-yellow-300",
            gray: "text-gray-400 group-hover:text-gray-300",
            indigo: "text-indigo-400 group-hover:text-indigo-300",
            red: "text-red-400 group-hover:text-red-300",
        };

        const bgGradients = {
            purple: "bg-gradient-to-br from-purple-900/30 to-[#121214]",
            blue: "bg-gradient-to-br from-blue-900/30 to-[#121214]",
            cyan: "bg-gradient-to-br from-cyan-900/30 to-[#121214]",
            green: "bg-gradient-to-br from-green-900/30 to-[#121214]",
            yellow: "bg-gradient-to-br from-yellow-900/30 to-[#121214]",
            gray: "bg-gradient-to-br from-gray-800/30 to-[#121214]",
            indigo: "bg-gradient-to-br from-indigo-900/30 to-[#121214]",
            red: "bg-gradient-to-br from-red-900/30 to-[#121214]",
        };

        return (
            <div className={`p-5 border-l-[3px] border-y border-r border-white/5 rounded-2xl relative overflow-hidden group transition-all duration-500 hover:-translate-y-1 backdrop-blur-md ${bgGradients[color]} ${glowStyles[color]}`}>
                
                {/* Background Icon (Subtle) */}
                <div className={`absolute right-[-10px] top-[-10px] opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-500 ${iconColors[color]}`}>
                    {Icon && <Icon size={80} />}
                </div>

                {/* Inner Ambient Glow (Top Left) */}
                <div className={`absolute -top-10 -left-10 w-32 h-32 rounded-full bg-${color}-500/10 blur-3xl pointer-events-none group-hover:bg-${color}-500/20 transition-all duration-500`}></div>

                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider group-hover:text-gray-300 transition-colors">{title}</p>
                        <h3 className="text-2xl font-bold text-white mt-1 tracking-tight">{value}</h3>
                        {sub && <p className="text-[10px] text-gray-500 mt-1 font-medium">{sub}</p>}
                    </div>
                    <div className={`p-2 rounded-xl bg-white/[0.04] border border-white/10 transition-colors duration-500 group-hover:bg-white/10 shadow-inner ${iconColors[color]}`}>
                        {Icon && <Icon size={20} />}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1. TOTAL PROJECT VALUE (Hidden for Managers) */}
            {!isManager && (
                <Card 
                    title="Total Project Value" 
                    value={formatCurr(totalProjectValue)} 
                    sub="Estimated Total Inventory"
                    color="blue"
                    icon={TrendingUp}
                />
            )}

            {/* 2. SECURED REVENUE */}
            <Card 
                title="Secured Revenue" 
                value={formatCurr(totalRevenue)} 
                sub="Sold (Full) + Booked (Part)"
                color="green"
                icon={IndianRupee}
            />

            {/* 3. BALANCE REVENUE */}
            <Card 
                title="Pending Collection" 
                value={formatCurr(totalProjectValue - totalRevenue)} 
                sub="Pending = Total Sale Value - Secured Revenue"
                color="red"
                icon={IndianRupee}
            />

            {/* 4. TOTAL INVENTORY */}
            <Card 
                title="Total Inventory" 
                value={totalPlots} 
                sub={isManager ? "Across Assigned Projects" : "Across All Projects"}
                color="indigo"
                icon={Layers}
            />

            {/* 5. SOLD PLOTS */}
            <Card 
                title="Sold Plots" 
                value={totalSold} 
                sub={`${totalPlots > 0 ? ((totalSold/totalPlots)*100).toFixed(1) : 0}% Conversion Rate`}
                color="green"
                icon={CheckCircle}
            />

            {/* 6. BOOKED PLOTS */}
            <Card 
                title="Booked Plots" 
                value={totalBooked} 
                sub="Pending Finalization"
                color="yellow"
                icon={Clock}
            />

             {/* 7. AVAILABLE INVENTORY */}
             <Card 
                title="Available Plots" 
                value={totalOpen} 
                sub="Open for Sale"
                color="gray"
                icon={Lock}
            />

            {/* 8. LAYOUTS (Dynamically hides limits for managers) */}
             <Card 
                title="Active Projects" 
                value={isManager ? layouts.length : `${layouts.length} / ${limits.maxLayouts || 5}`} 
                sub={isManager ? "Assigned Layouts" : "Active Project capacty"}
                color="cyan"
                icon={PieChart}
            />

            {/* 9. PLAN DETAILS (Hidden for Managers) */}
            {!isManager && (
                <Card 
                    title="Plan Details" 
                    value={user?.planName || 'Active Plan'} 
                    sub={`Exp: ${expiryDateStr} • Plots: ${totalPlots}/${limits.maxPlots || 50}`}
                    color="gold"
                    icon={BarChart3}
                />
            )}
            
        </div>
    );
};

export default NexusStats;