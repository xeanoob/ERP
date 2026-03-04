import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { AlertTriangle, Package, Truck, Users } from 'lucide-react';
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
            { label: 'CA (€)', data: [stats.today.revenue, stats.month.revenue], backgroundColor: '#111827' },
            { label: 'Coût (€)', data: [stats.today.cost, stats.month.cost], backgroundColor: '#9ca3af' },
            { label: 'Marge (€)', data: [stats.today.margin, stats.month.margin], backgroundColor: '#4ade80' },
        ],
    };

    const options = {
        responsive: true,
        plugins: { legend: { position: 'top', labels: { font: { family: 'Inter', size: 12 } } }, title: { display: false } },
        scales: { x: { grid: { display: false } }, y: { grid: { color: '#f3f4f6' } } }
    };

    return (
        <div className="max-w-6xl mx-auto flex flex-col gap-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="pro-card p-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Chiffre d'Affaires</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.today.revenue.toFixed(2)} €</p>
                    <p className="text-xs text-gray-400 mt-1">Mois : {stats.month.revenue.toFixed(2)} €</p>
                </div>
                <div className="pro-card p-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Coût de Revient</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.today.cost.toFixed(2)} €</p>
                    <p className="text-xs text-gray-400 mt-1">Mois : {stats.month.cost.toFixed(2)} €</p>
                </div>
                <div className="pro-card p-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Marge Nette</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.today.margin.toFixed(2)} €</p>
                    <p className="text-xs text-gray-400 mt-1">Mois : {stats.month.margin.toFixed(2)} €</p>
                </div>
            </div>

            {/* Counters Row */}
            <div className="grid grid-cols-2 gap-4">
                <div className="pro-card p-4 flex items-center gap-3">
                    <Package className="w-5 h-5 text-gray-400" />
                    <div>
                        <p className="text-lg font-semibold text-gray-900">{stats.counts?.produits ?? '-'}</p>
                        <p className="text-xs text-gray-500">Produits</p>
                    </div>
                </div>
                <div className="pro-card p-4 flex items-center gap-3">
                    <Truck className="w-5 h-5 text-gray-400" />
                    <div>
                        <p className="text-lg font-semibold text-gray-900">{stats.counts?.fournisseurs ?? '-'}</p>
                        <p className="text-xs text-gray-500">Fournisseurs</p>
                    </div>
                </div>
            </div>

            {/* Stock Alerts */}
            {stats.alertes_stock && stats.alertes_stock.length > 0 && (
                <div className="pro-card overflow-hidden">
                    <div className="px-4 py-3 bg-red-50 border-b border-red-100 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span className="text-xs font-semibold text-red-700 uppercase tracking-wider">Alertes Stock Bas ({stats.alertes_stock.length})</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {stats.alertes_stock.map(a => (
                            <div key={a.id} className="px-4 py-3 flex items-center justify-between">
                                <div>
                                    <span className="text-sm font-medium text-gray-900">{a.nom}</span>
                                    <span className="text-xs text-gray-500 ml-2">{a.categorie}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-semibold text-red-600">{a.stock_actuel.toFixed(1)} kg</span>
                                    <span className="text-xs text-gray-400 ml-2">/ seuil {a.seuil.toFixed(0)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Chart */}
            <div className="pro-card p-6">
                <Bar options={options} data={data} height={100} />
            </div>
        </div>
    );
};

export default Dashboard;
