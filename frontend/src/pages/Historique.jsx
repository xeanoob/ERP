import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, Download } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const Historique = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    useEffect(() => { fetchSales(); }, []);

    const fetchSales = async () => {
        try {
            const res = await axios.get(`${API_URL}/sales/history`);
            setSales(res.data);
            setLoading(false);
        } catch (err) { console.error(err); setLoading(false); }
    };

    const exportCSV = () => {
        const headers = ['Date', 'Produit', 'Qté (kg)', 'Prix Unitaire (€)', 'Total (€)'];
        const rows = filtered.map(s => [
            new Date(s.date_sortie).toLocaleString('fr-FR'),
            s.produit_nom,
            s.quantite_sortie,
            s.prix_reel,
            (parseFloat(s.quantite_sortie) * parseFloat(s.prix_reel)).toFixed(2)
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `ventes_erp_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Export CSV généré');
    };

    const filtered = sales.filter(s => {
        const matchSearch = !search ||
            s.produit_nom?.toLowerCase().includes(search.toLowerCase());
        const saleDate = new Date(s.date_sortie);
        const matchFrom = !dateFrom || saleDate >= new Date(dateFrom);
        const matchTo = !dateTo || saleDate <= new Date(dateTo + 'T23:59:59');
        return matchSearch && matchFrom && matchTo;
    });

    const totalRevenue = filtered.reduce((acc, s) => acc + parseFloat(s.quantite_sortie) * parseFloat(s.prix_reel), 0);
    const totalCost = filtered.reduce((acc, s) => acc + parseFloat(s.quantite_sortie) * parseFloat(s.prix_achat_unitaire), 0);

    return (
        <div className="max-w-6xl mx-auto flex flex-col gap-4 sm:gap-6">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Historique des Ventes</h2>
                    <p className="text-sm text-gray-500">Consultez et filtrez l'ensemble des transactions.</p>
                </div>
                <button onClick={exportCSV} className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-50 flex items-center transition-colors">
                    <Download className="w-4 h-4 mr-2" /> Export CSV
                </button>
            </div>

            {/* Filtres */}
            <div className="pro-card p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Filtres</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un produit..."
                            className="w-full bg-white border border-gray-300 rounded-md pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900" />
                    </div>
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                        className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900" />
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                        className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900" />
                </div>
            </div>

            {/* KPI résumé */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div className="pro-card p-3 sm:p-4">
                    <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Ventes</p>
                    <p className="text-lg sm:text-xl font-semibold text-gray-900">{filtered.length}</p>
                </div>
                <div className="pro-card p-3 sm:p-4">
                    <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">C.A.</p>
                    <p className="text-lg sm:text-xl font-semibold text-gray-900">{totalRevenue.toFixed(2)} €</p>
                </div>
                <div className="pro-card p-3 sm:p-4">
                    <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Marge</p>
                    <p className={`text-lg sm:text-xl font-semibold ${(totalRevenue - totalCost) >= 0 ? 'text-green-700' : 'text-red-600'}`}>{(totalRevenue - totalCost).toFixed(2)} €</p>
                </div>
            </div>

            {/* Table */}
            <div className="pro-card overflow-hidden">
                {/* Mobile: card layout */}
                <div className="sm:hidden divide-y divide-gray-200">
                    {loading ? (
                        <div className="px-4 py-8 text-center text-sm text-gray-500">Chargement...</div>
                    ) : filtered.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-gray-500">Aucune vente.</div>
                    ) : filtered.map(s => (
                        <div key={s.id} className="px-4 py-3 space-y-1">
                            <div className="flex justify-between items-start">
                                <span className="text-sm font-medium text-gray-900">{s.produit_nom}</span>
                                <span className="text-sm font-semibold text-gray-900">{(parseFloat(s.quantite_sortie) * parseFloat(s.prix_reel)).toFixed(2)} €</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>{parseFloat(s.quantite_sortie).toFixed(1)} kg × {parseFloat(s.prix_reel).toFixed(2)} €</span>
                            </div>
                            <div className="text-[10px] text-gray-400">
                                {new Date(s.date_sortie).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop: table layout */}
                <div className="overflow-x-auto hidden sm:block">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Produit</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Qté (kg)</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Prix Réel</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {loading ? (
                                <tr><td colSpan="5" className="px-4 py-8 text-center text-sm text-gray-500">Chargement...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="5" className="px-4 py-8 text-center text-sm text-gray-500">Aucune vente.</td></tr>
                            ) : filtered.map(s => (
                                <tr key={s.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                                        {new Date(s.date_sortie).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        <span className="text-xs text-gray-400 ml-1">{new Date(s.date_sortie).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </td>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.produit_nom}</td>
                                    <td className="px-4 py-3 text-sm text-right text-gray-900">{parseFloat(s.quantite_sortie).toFixed(1)}</td>
                                    <td className="px-4 py-3 text-sm text-right text-gray-600">{parseFloat(s.prix_reel).toFixed(2)} €</td>
                                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                                        {(parseFloat(s.quantite_sortie) * parseFloat(s.prix_reel)).toFixed(2)} €
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Historique;
