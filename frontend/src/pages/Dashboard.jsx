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
    const [range, setRange] = useState('7days');
    const [loading, setLoading] = useState(true);

    const ranges = [
        { value: '7days', label: '7 derniers jours' },
        { value: '30days', label: '30 derniers jours' },
        { value: 'lastMonth', label: 'Mois dernier' },
        { value: '3months', label: '3 derniers mois' },
        { value: 'thisYear', label: 'Cette année' },
        { value: 'lastYear', label: 'L\'année dernière' }
    ];

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`${API_URL}/dashboard/stats?range=${range}`);
                setStats(res.data);
            } catch (err) { console.error(err); }
            setLoading(false);
        };
        fetchStats();
    }, [range]);

    if (!stats || loading) return <div className="text-sm text-gray-500 font-medium p-4">Chargement des données...</div>;

    const data = {
        labels: (stats?.trend || []).map(t => {
            const date = new Date(t.jour);
            if (range === '7days') return date.toLocaleDateString('fr-FR', { weekday: 'short' });
            return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
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
                ticks: { color: '#9ca3af', font: { size: 11, family: 'Inter' }, maxTicksLimit: 15 }
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
            <div className="flex justify-between items-center bg-white p-3 sm:p-4 rounded-md shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Tableau de Bord</h2>
                <select 
                    value={range} 
                    onChange={e => setRange(e.target.value)}
                    className="bg-gray-50 border border-gray-200 text-gray-900 text-sm font-medium rounded-md focus:ring-gray-900 focus:border-gray-900 block p-2 cursor-pointer"
                >
                    {ranges.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="pro-card p-3 sm:p-5">
                    <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 sm:mb-2 line-clamp-1">Chiffre d'Affaires</p>
                    <p className="text-base sm:text-2xl font-bold text-gray-900 truncate">{stats.period.revenue.toFixed(2)} €</p>
                </div>
                <div className="pro-card p-3 sm:p-5">
                    <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 sm:mb-2 line-clamp-1">Coût de Revient</p>
                    <p className="text-base sm:text-2xl font-bold text-gray-900 truncate">{stats.period.cost.toFixed(2)} €</p>
                </div>
                <div className="pro-card p-3 sm:p-5 border-red-50 bg-red-50/10">
                    <p className="text-[10px] sm:text-xs font-bold text-red-400 uppercase tracking-widest mb-1 sm:mb-2 line-clamp-1">Pertes</p>
                    <p className="text-base sm:text-2xl font-bold text-red-600 truncate">{stats.period.perte_cost?.toFixed(2) || '0.00'} €</p>
                </div>
                <div className="pro-card p-3 sm:p-5 border-emerald-50 bg-emerald-50/10">
                    <p className="text-[10px] sm:text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1 sm:mb-2 line-clamp-1">Marge Nette</p>
                    <p className="text-base sm:text-2xl font-bold text-emerald-600 truncate">{stats.period.margin.toFixed(2)} €</p>
                </div>
            </div>

            {/* Counters Row */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="pro-card p-4 flex items-center gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg">
                        <Package className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                        <p className="text-lg font-bold text-gray-900 leading-tight">{stats.counts?.produits ?? '-'}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Produits</p>
                    </div>
                </div>
                <div className="pro-card p-4 flex items-center gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg">
                        <Truck className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                        <p className="text-lg font-bold text-gray-900 leading-tight">{stats.counts?.fournisseurs ?? '-'}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Fournisseurs</p>
                    </div>
                </div>
            </div>

            {/* Stock Alerts */}
            {stats.alertes_stock && stats.alertes_stock.length > 0 && (
                <div className="pro-card overflow-hidden">
                    <div className="px-4 py-3 bg-red-50 border-b border-red-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <span className="text-[10px] font-bold text-red-700 uppercase tracking-widest">Alertes Stock Bas ({stats.alertes_stock.length})</span>
                        </div>
                    </div>
                    <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto hide-scrollbar">
                        {stats.alertes_stock.map(a => (
                            <div key={a.id} className="px-4 py-3 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors">
                                <div className="min-w-0 flex-1 mr-4">
                                    <p className="text-sm font-bold text-gray-900 truncate">{a.nom}</p>
                                    <p className="text-[10px] text-gray-400 uppercase font-medium">{a.categorie || '-'}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-sm font-black text-red-600 leading-tight">{a.stock_actuel.toFixed(1)} <span className="text-[10px] font-normal text-gray-400">kg</span></p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Seuil: {a.seuil.toFixed(0)}</p>
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
                        <h3 className="text-sm font-semibold text-gray-900">Activité ({ranges.find(r => r.value === range)?.label})</h3>
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
