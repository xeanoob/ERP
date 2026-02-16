import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

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

    if (!stats) return <div className="p-10 text-center">Chargement du Dashboard...</div>;

    const data = {
        labels: ['Aujourd\'hui', 'Ce Mois'],
        datasets: [
            {
                label: 'Chiffre d\'Affaires (€)',
                data: [stats.today.revenue, stats.month.revenue],
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
            },
            {
                label: 'Cout de Revient (€)',
                data: [stats.today.cost, stats.month.cost],
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
            },
            {
                label: 'Marge Nette (€)',
                data: [stats.today.margin, stats.month.margin],
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Performance Financière' },
        },
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Tableau de Bord</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Cards */}
                <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                    <p className="text-gray-500 text-sm">Chiffre d'Affaires (Jour)</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.today.revenue.toFixed(2)} €</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-red-500">
                    <p className="text-gray-500 text-sm">Coût de Revient (Jour)</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.today.cost.toFixed(2)} €</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
                    <p className="text-gray-500 text-sm">Marge Nette (Jour)</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.today.margin.toFixed(2)} €</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
                <Bar options={options} data={data} />
            </div>
        </div>
    );
};

export default Dashboard;
