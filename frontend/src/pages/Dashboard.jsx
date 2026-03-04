import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const API_URL = 'http://localhost:5000/api';

const Dashboard = () => {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get(`${API_URL}/dashboard/stats`);
                setStats(res.data);
            } catch (err) { console.error(err); }
        };
        fetchStats();
    }, []);

    if (!stats) return <div className="text-sm text-gray-500 font-medium">Chargement des données...</div>;

    const data = {
        labels: ['Aujourd\'hui', 'Ce Mois'],
        datasets: [
            {
                label: 'Chiffre d\'Affaires (€)',
                data: [stats.today.revenue, stats.month.revenue],
                backgroundColor: '#111827', // dark slate
            },
            {
                label: 'Cout de Revient (€)',
                data: [stats.today.cost, stats.month.cost],
                backgroundColor: '#9ca3af', // gray 400
            },
            {
                label: 'Marge Nette (€)',
                data: [stats.today.margin, stats.month.margin],
                backgroundColor: '#4ade80', // green 400
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
                labels: { font: { family: 'Inter', size: 12 } }
            },
            title: { display: false },
        },
        scales: {
            x: { grid: { display: false } },
            y: { grid: { color: '#f3f4f6' } }
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="pro-card p-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Chiffre d'Affaires</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.today.revenue.toFixed(2)} €</p>
                    <p className="text-xs text-gray-400 mt-1">Aujourd'hui</p>
                </div>
                <div className="pro-card p-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Coût de Revient</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.today.cost.toFixed(2)} €</p>
                    <p className="text-xs text-gray-400 mt-1">Aujourd'hui</p>
                </div>
                <div className="pro-card p-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Marge Nette</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.today.margin.toFixed(2)} €</p>
                    <p className="text-xs text-gray-400 mt-1">Aujourd'hui</p>
                </div>
            </div>

            <div className="pro-card p-6">
                <Bar options={options} data={data} height={100} />
            </div>
        </div>
    );
};

export default Dashboard;
