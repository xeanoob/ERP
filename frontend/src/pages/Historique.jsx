import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExportMenu from '../components/ExportMenu';

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
        const headers = ['Date', 'Lieu', 'Produit', 'Qté', 'Prix Unitaire (€)', 'Total (€)'];
        const rows = filtered.map(s => [
            new Date(s.created_at).toLocaleString('fr-FR'),
            s.lieu_vente_nom || '-',
            s.produit_nom,
            s.quantite_sortie,
            s.prix_reel,
            (parseFloat(s.quantite_sortie) * parseFloat(s.prix_reel)).toFixed(2)
        ]);

        
        const csvContent = "\uFEFF" + [headers, ...rows].map(row =>
            row.map(cell => `"${(cell ?? '').toString().replace(/"/g, '""')}"`).join(",")
        ).join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `ventes_stocko_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Export CSV généré');
    };

    const exportPDF = () => {
        const doc = new jsPDF();
        const dateStr = new Date().toLocaleDateString('fr-FR');

        
        doc.setFontSize(22);
        doc.setTextColor(17, 24, 39);
        doc.text("Rapport des Ventes", 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(107, 114, 128);
        doc.text(`Période: ${dateFrom || 'Début'} au ${dateTo || 'Aujourd\'hui'}`, 14, 30);
        doc.text(`Généré le: ${dateStr}`, 14, 35);

        
        doc.setDrawColor(229, 231, 235);
        doc.setFillColor(249, 250, 251);
        doc.roundedRect(14, 42, 182, 20, 2, 2, 'FD');

        doc.setFontSize(9);
        doc.setTextColor(107, 114, 128);
        doc.text("TOTAL VENTES", 20, 50);
        doc.text("C.A. TOTAL", 80, 50);
        doc.text("MARGE NETTE", 140, 50);

        doc.setFontSize(12);
        doc.setTextColor(17, 24, 39);
        doc.text(`${filtered.length}`, 20, 57);
        doc.text(`${totalRevenue.toFixed(2)} €`, 80, 57);
        doc.setTextColor((totalRevenue - totalCost) >= 0 ? [21, 128, 61] : [220, 38, 38]);
        doc.text(`${(totalRevenue - totalCost).toFixed(2)} €`, 140, 57);

        const tableColumn = ["Date", "Lieu", "Produit", "Qté", "Prix Unitaire", "Total"];
        const tableRows = filtered.map(s => [
            new Date(s.created_at).toLocaleDateString('fr-FR'),
            s.lieu_vente_nom || '-',
            s.produit_nom,
            parseFloat(s.quantite_sortie).toFixed(1),
            `${parseFloat(s.prix_reel).toFixed(2)} €`,
            `${(parseFloat(s.quantite_sortie) * parseFloat(s.prix_reel)).toFixed(2)} €`
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 70,
            theme: 'grid',
            headStyles: { fillColor: [17, 24, 39], fontSize: 9 },
            bodyStyles: { fontSize: 8 },
            alternateRowStyles: { fillColor: [249, 250, 251] },
            margin: { top: 70 },
            columnStyles: {
                3: { halign: 'right' },
                4: { halign: 'right' },
                5: { halign: 'right' }
            }
        });

        doc.save(`rapport_ventes_${new Date().toISOString().split('T')[0]}.pdf`);
        toast.success('Rapport PDF généré');
    };

    const filtered = sales.filter(s => {
        const matchSearch = !search ||
            s.produit_nom?.toLowerCase().includes(search.toLowerCase());
        const saleDate = new Date(s.created_at);
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
                <ExportMenu onExportCSV={exportCSV} onExportPDF={exportPDF} label="Rapport / Export" />
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
                                <span>{parseFloat(s.quantite_sortie).toFixed(1)} * {parseFloat(s.prix_reel).toFixed(2)} €</span>
                            </div>
                            <div className="text-[10px] text-gray-400 flex justify-between">
                                <span>{new Date(s.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                <span>{s.lieu_vente_nom || 'Sans lieu'}</span>
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
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Lieu de Vente</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Produit</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Qté</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Prix de Vente</th>
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
                                        {new Date(s.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        <span className="text-xs text-gray-400 ml-1">{new Date(s.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </td>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-500">{s.lieu_vente_nom || '-'}</td>
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
