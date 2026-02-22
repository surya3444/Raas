import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const NexusCharts = ({ layouts, isManager }) => {
    // 1. Inventory Distribution
    let sold = 0, booked = 0, open = 0;
    layouts.forEach(l => {
        (l.elements || []).forEach(p => {
            if (p.type !== 'plot') return;
            if (p.status === 'sold') sold++;
            else if (p.status === 'booked') booked++;
            else open++;
        });
    });

    const pieData = {
        labels: ['Sold', 'Booked', 'Open'],
        datasets: [{
            data: [sold, booked, open],
            backgroundColor: ['#22c55e', '#eab308', '#374151'],
            borderWidth: 0,
        }],
    };

    // 2. Revenue Trend (Per Layout)
    const barData = {
        // Truncate long layout names for the chart labels
        labels: layouts.map(l => l.name.length > 15 ? l.name.substring(0, 15) + '...' : l.name),
        datasets: [{
            label: 'Revenue',
            data: layouts.map(l => (l.elements || []).reduce((acc, p) => {
                // Ensure we only calculate revenue from plots
                if (p.type !== 'plot') return acc;
                
                if (p.status === 'sold') return acc + (Number(p.price) || 0);
                if (p.status === 'booked') return acc + (Number(p.bookingAmount) || 0);
                return acc;
            }, 0)),
            backgroundColor: '#3b82f6',
            borderRadius: 4
        }]
    };

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
            legend: { display: false }, 
            tooltip: { 
                mode: 'index', 
                intersect: false,
                callbacks: {
                    // Format large numbers in the tooltip nicely
                    label: function(context) {
                        let value = context.raw || 0;
                        if(value >= 10000000) return `₹ ${(value/10000000).toFixed(2)} Cr`;
                        if(value >= 100000) return `₹ ${(value/100000).toFixed(2)} L`;
                        return `₹ ${value.toLocaleString('en-IN')}`;
                    }
                }
            } 
        },
        scales: { x: { display: false }, y: { display: false } }
    };

    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
            legend: { position: 'right', labels: { color: 'white', font: { size: 10 } } } 
        }
    };

    return (
        <div className="space-y-6">
            <div className="glass-panel p-5 bg-[#121214] border border-white/5 rounded-2xl">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-4">
                    {isManager ? 'Assigned Sales Distribution' : 'Overall Sales Distribution'}
                </h3>
                <div className="h-40 flex justify-center">
                    {layouts.length > 0 ? (
                        <Doughnut data={pieData} options={pieOptions} />
                    ) : (
                        <div className="flex items-center justify-center h-full text-xs text-gray-600">No data available</div>
                    )}
                </div>
            </div>
            
            <div className="glass-panel p-5 bg-[#121214] border border-white/5 rounded-2xl">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-4">
                    {isManager ? 'Assigned Revenue by Project' : 'Revenue by Project'}
                </h3>
                <div className="h-32">
                    {layouts.length > 0 ? (
                        <Bar data={barData} options={barOptions} />
                    ) : (
                        <div className="flex items-center justify-center h-full text-xs text-gray-600">No data available</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NexusCharts;