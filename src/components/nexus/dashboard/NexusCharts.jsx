import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const NexusCharts = ({ layouts }) => {
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

    // 2. Revenue Trend
    const barData = {
        labels: layouts.map(l => l.name),
        datasets: [{
            label: 'Revenue',
            data: layouts.map(l => (l.elements || []).reduce((acc, p) => {
                if (p.status === 'sold') return acc + (Number(p.price) || 0);
                if (p.status === 'booked') return acc + (Number(p.bookingAmount) || 0);
                return acc;
            }, 0)),
            backgroundColor: '#3b82f6',
            borderRadius: 4
        }]
    };

    const options = {
        responsive: true,
        plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
        scales: { x: { display: false }, y: { display: false } }
    };

    return (
        <div className="space-y-6">
            <div className="glass-panel p-5">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-4">Sales Distribution</h3>
                <div className="h-40 flex justify-center">
                    <Doughnut data={pieData} options={{ ...options, plugins: { legend: { position: 'right', labels: { color: 'white', font: { size: 10 } } } } }} />
                </div>
            </div>
            <div className="glass-panel p-5">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-4">Revenue Trend</h3>
                <div className="h-32">
                    <Bar data={barData} options={options} />
                </div>
            </div>
        </div>
    );
};

export default NexusCharts;