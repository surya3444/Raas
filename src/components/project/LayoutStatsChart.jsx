import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const LayoutStatsChart = ({ elements = [] }) => {
    const sold = elements.filter(p => p.status === 'sold').length;
    const booked = elements.filter(p => p.status === 'booked').length;
    const open = elements.length - sold - booked;

    const data = {
        labels: ['Sold', 'Booked', 'Open'],
        datasets: [
            {
                data: [sold, booked, open],
                backgroundColor: ['#22c55e', '#eab308', '#3f3f46'],
                borderWidth: 0,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
    };

    return (
        <div className="h-32 w-full relative">
            <Doughnut data={data} options={options} />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                    <span className="text-xl font-bold text-white">{elements.length}</span>
                    <p className="text-[8px] uppercase text-gray-500">Total Plots</p>
                </div>
            </div>
        </div>
    );
};

export default LayoutStatsChart;