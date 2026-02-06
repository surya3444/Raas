import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const ChartsSection = ({ layouts }) => {
    
    // 1. REVENUE DATA (Bar Chart)
    // Sold = Full Price, Booked = Booking Amount
    const revenueData = layouts.map(l => {
        return (l.elements || []).reduce((acc, p) => {
            if (p.status === 'sold') return acc + (Number(p.price) || 0);
            if (p.status === 'booked') return acc + (Number(p.bookingAmount) || 0);
            return acc;
        }, 0);
    });

    const barData = {
        labels: layouts.map(l => l.name),
        datasets: [{
            label: 'Secured Revenue (₹)',
            data: revenueData,
            backgroundColor: '#3b82f6',
            borderRadius: 6,
        }],
    };

    // 2. INVENTORY DATA (Doughnut Chart)
    // Aggregating counts across ALL layouts
    let totalSold = 0, totalBooked = 0, totalOpen = 0;
    layouts.forEach(l => {
        (l.elements || []).forEach(p => {
            if(p.status === 'sold') totalSold++;
            else if(p.status === 'booked') totalBooked++;
            else totalOpen++;
        });
    });

    const doughnutData = {
        labels: ['Sold', 'Booked', 'Open'],
        datasets: [{
            data: [totalSold, totalBooked, totalOpen],
            backgroundColor: ['#22c55e', '#eab308', '#374151'],
            borderColor: '#121214',
            borderWidth: 2,
        }],
    };

    // Shared Options
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { color: '#9ca3af', font: { size: 10 } }
            }
        },
        scales: {
            y: { 
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: { color: '#6b7280', font: { size: 10 } }
            },
            x: { 
                grid: { display: false },
                ticks: { color: '#6b7280', font: { size: 10 } }
            }
        }
    };

    const pieOptions = {
        ...options,
        scales: { x: { display: false }, y: { display: false } }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel p-6 border border-white/10 h-[300px] flex flex-col">
                <h3 className="text-xs font-bold uppercase text-gray-500 mb-4">Revenue by Project</h3>
                <div className="flex-1 min-h-0 relative">
                    <Bar data={barData} options={options} />
                </div>
            </div>

            <div className="glass-panel p-6 border border-white/10 h-[300px] flex flex-col">
                <h3 className="text-xs font-bold uppercase text-gray-500 mb-4">Overall Inventory Distribution</h3>
                <div className="flex-1 min-h-0 relative flex justify-center">
                    <Doughnut data={doughnutData} options={pieOptions} />
                </div>
            </div>
        </div>
    );
};

export default ChartsSection;