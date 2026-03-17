import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { AlertTriangle, Package, Truck, Users, TrendingUp } from 'lucide-react';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const API_URL = import.meta.env.VITE_API_URL || '/api';

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
        labels: (stats?.trend || []).map(t => {
            const date = new Date(t.jour);
            return date.toLocaleDateString('fr-FR', { weekday: 'short' });
        }),
        datasets: [
            {
                label: 'Chiffre d\'Affaires',
                data: (stats?.trend || []).map(t => t.revenue),
                borderColor: '#111827',
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                    gradient.addColorStop(0, 'rgba(17, 24, 39, 0.1)');
                    gradient.addColorStop(1, 'rgba(17, 24, 39, 0)');
                    return gradient;
                },
                fill: true,
                tension: 0.4,
                borderWidth: 2,
                pointRadius: 3,
                pointBackgroundColor: '#111827',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 6,
            },
            {
                label: 'Marge',
                data: (stats?.trend || []).map(t => t.margin),
                borderColor: '#10b981',
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.1)');
                    gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
                    return gradient;
                },
                fill: true,
                tension: 0.4,
                borderWidth: 2,
                pointRadius: 0, 
                pointHoverRadius: 5,
                pointBackgroundColor: '#10b981',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top',
                align: 'end',
                labels: {
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 20,
                    font: { family: 'Inter', size: 11, weight: '500' },
                    color: '#6b7280'
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: '#111827',
                padding: 12,
                titleFont: { size: 12, weight: '600', family: 'Inter' },
                bodyFont: { size: 12, family: 'Inter' },
                cornerRadius: 8,
                caretSize: 6,
                callbacks: {
                    label: (context) => {
                        let label = context.dataset.label || '';
                        if (label) label += ': ';
                        if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(context.parsed.y);
                        }
                        return label;
                    }
                }
            }
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
        },
        scales: {
            x: {
                grid: { display: false },
                border: { display: false },
                ticks: { color: '#9ca3af', font: { size: 11, family: 'Inter' } }
            },
            y: {
                beginAtZero: true,
                grid: { color: '#f3f4f6', drawTicks: false },
                border: { display: false },
                ticks: {
                    color: '#9ca3af',
                    font: { size: 11, family: 'Inter' },
                    padding: 10,
                    callback: (val) => `${val}€`
                }
            }
        }
    };

    return (
        <div className="max-w-6xl mx-auto flex flex-col gap-4 sm:gap-6">
            {}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="pro-card p-4 sm:p-5">
                    <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 sm:mb-2 line-clamp-1">Chiffre d'Affaires</p>
                    <p className="text-lg sm:text-2xl font-semibold text-gray-900 truncate">{stats.today.revenue.toFixed(2)} €</p>
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-1 truncate">Mois: {stats.month.revenue.toFixed(2)} €</p>
                </div>
                <div className="pro-card p-4 sm:p-5">
                    <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 sm:mb-2 line-clamp-1">Coût de Revient</p>
                    <p className="text-lg sm:text-2xl font-semibold text-gray-900 truncate">{stats.today.cost.toFixed(2)} €</p>
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-1 truncate">Mois: {stats.month.cost.toFixed(2)} €</p>
                </div>
                <div className="pro-card p-4 sm:p-5 col-span-2 sm:col-span-1">
                    <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 sm:mb-2 line-clamp-1">Marge Nette</p>
                    <p className="text-xl sm:text-2xl font-semibold text-emerald-600 truncate">{stats.today.margin.toFixed(2)} €</p>
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-1 truncate">Mois: {stats.month.margin.toFixed(2)} €</p>
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
                    <div className="divide-y divide-gray-100 max-h-52 overflow-y-auto">
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

            {/* Chart Area */}
            <div className="pro-card p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900">Activité des 7 derniers jours</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Évolution du volume d'affaires et de la rentabilité</p>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-md border border-gray-100">
                        <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">LIVE TREND</span>
                    </div>
                </div>
                <div className="h-[200px] sm:h-[300px] w-full">
                    <Line options={options} data={data} />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
