import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Plus, Trash2, Search, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExportMenu from '../components/ExportMenu';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const Catalogue = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [taxes, setTaxes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
    const [search, setSearch] = useState('');
    const [newProduct, setNewProduct] = useState({ nom: '', categorie_id: '', taxe_id: '', variete: '', prix_actif: '', seuil_alerte_stock: '10' });
    const [message, setMessage] = useState('');

    const fetchProducts = useCallback(async (page = 1, searchTerm = '') => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/products`, { params: { page, limit: 20, search: searchTerm } });
            setProducts(res.data.data);
            setPagination(res.data.pagination);
            setLoading(false);
        } catch (err) { console.error(err); setLoading(false); }
    }, []);

    const fetchCategoriesAndTaxes = async () => {
        try {
            const [catRes, taxRes] = await Promise.all([
                axios.get(`${API_URL}/categories`),
                axios.get(`${API_URL}/taxes`)
            ]);
            setCategories(catRes.data);
            setTaxes(taxRes.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { fetchProducts(); fetchCategoriesAndTaxes(); }, [fetchProducts]);

    const handleSearch = (e) => {
        const val = e.target.value;
        setSearch(val);
        fetchProducts(1, val);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newProduct.nom || !newProduct.categorie_id) return;
        try {
            await axios.post(`${API_URL}/products`, newProduct);
            setNewProduct({ nom: '', categorie_id: '', taxe_id: '', variete: '', prix_actif: '', seuil_alerte_stock: '10' });
            fetchProducts(pagination.page, search);
            toast.success('Produit ajouté avec succès');
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.error || 'Erreur lors de l\'ajout');
        }
    };

    const exportCSV = () => {
        const headers = ['ID', 'Nom', 'Catégorie', 'Taxe', 'Variété', 'Stock', 'Prix Actif (€)', 'Seuil Alerte'];
        const rows = products.map(p => [
            p.id,
            p.nom,
            p.categorie_nom || '',
            p.taxe_nom ? `${p.taxe_nom} (${p.taxe_taux}%)` : '',
            p.variete || '',
            p.quantite_stock,
            p.prix_actif,
            p.seuil_alerte_stock
        ]);

        // Professional CSV with BOM and Quoting
        const csvContent = "\uFEFF" + [headers, ...rows].map(row =>
            row.map(cell => `"${(cell ?? '').toString().replace(/"/g, '""')}"`).join(",")
        ).join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `catalogue_erp_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Export CSV généré');
    };

    const exportPDF = () => {
        const doc = new jsPDF();
        const dateStr = new Date().toLocaleDateString('fr-FR');

        // Header
        doc.setFontSize(20);
        doc.setTextColor(17, 24, 39); // Gray-900
        doc.text("Catalogue Produits", 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(107, 114, 128); // Gray-500
        doc.text(`Généré le: ${dateStr}`, 14, 30);
        doc.text(`Total produits: ${pagination.total}`, 14, 35);

        const tableColumn = ["ID", "Nom", "Catégorie", "Taxe", "Variété", "Stock", "Prix (€)"];
        const tableRows = products.map(p => [
            p.id,
            p.nom,
            p.categorie_nom || '-',
            p.taxe_nom ? `${p.taxe_taux}%` : '-',
            p.variete || '-',
            p.quantite_stock,
            parseFloat(p.prix_actif || 0).toFixed(2)
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 45,
            theme: 'grid',
            headStyles: { fillColor: [17, 24, 39], fontSize: 9 }, // Gray-900 head
            bodyStyles: { fontSize: 8 },
            alternateRowStyles: { fillColor: [249, 250, 251] }, // Gray-50 rows
            margin: { top: 45 },
            didDrawPage: function (data) {
                // Footer
                const str = "Page " + doc.internal.getNumberOfPages();
                doc.setFontSize(8);
                const pageSize = doc.internal.pageSize;
                const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
                doc.text(str, data.settings.margin.left, pageHeight - 10);
            }
        });

        doc.save(`catalogue_erp_${new Date().toISOString().split('T')[0]}.pdf`);
        toast.success('Catalogue PDF généré');
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Archiver ce produit ?')) return;
        try {
            await axios.delete(`${API_URL}/products/${id}`);
            fetchProducts(pagination.page, search);
            toast.success('Produit archivé');
        } catch (err) {
            console.error(err);
            toast.error('Erreur lors de l\'archivage');
        }
    };

    return (
        <div className="max-w-6xl mx-auto flex flex-col gap-4 sm:gap-6">
            {/* Formulaire création */}
            <div className="pro-card p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900">Nouveau Produit</h3>
                    {message && <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">{message}</span>}
                </div>
                <form onSubmit={handleCreate} className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Nom *</label>
                            <input type="text" value={newProduct.nom} onChange={e => setNewProduct({ ...newProduct, nom: e.target.value })}
                                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="Ex: Pomme Golden" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Catégorie *</label>
                            <select value={newProduct.categorie_id} onChange={e => setNewProduct({ ...newProduct, categorie_id: e.target.value })}
                                className="w-full bg-white border border-gray-300 rounded-md px-2 py-2 text-sm">
                                <option value="" disabled>Choisir</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Taxe</label>
                            <select value={newProduct.taxe_id} onChange={e => setNewProduct({ ...newProduct, taxe_id: e.target.value })}
                                className="w-full bg-white border border-gray-300 rounded-md px-2 py-2 text-sm">
                                <option value="">(Aucune)</option>
                                {taxes.map(t => <option key={t.id} value={t.id}>{t.nom} ({t.taux}%)</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Variété</label>
                            <input type="text" value={newProduct.variete} onChange={e => setNewProduct({ ...newProduct, variete: e.target.value })}
                                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="Golden" />
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Prix Actif</label>
                                <input type="number" step="0.01" value={newProduct.prix_actif} onChange={e => setNewProduct({ ...newProduct, prix_actif: e.target.value })}
                                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="€" />
                            </div>
                            <div className="w-16">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Seuil</label>
                                <input type="number" step="1" value={newProduct.seuil_alerte_stock} onChange={e => setNewProduct({ ...newProduct, seuil_alerte_stock: e.target.value })}
                                    className="w-full bg-white border border-gray-300 rounded-md px-2 py-2 text-sm" placeholder="10" />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end pt-1">
                        <button type="submit" className="w-full sm:w-auto bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 flex items-center justify-center transition-colors">
                            <Plus className="w-4 h-4 mr-2" /> Ajouter
                        </button>
                    </div>
                </form>
            </div>

            {/* Barre de recherche */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input value={search} onChange={handleSearch} placeholder="Rechercher un produit..."
                        className="w-full bg-white border border-gray-300 rounded-md pl-9 pr-3 py-2 text-sm" />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <p className="hidden sm:block text-xs text-gray-500 self-center mr-2">{pagination.total} produit(s) — page {pagination.page}/{pagination.totalPages}</p>
                    <ExportMenu onExportCSV={exportCSV} onExportPDF={exportPDF} />
                </div>
            </div>

            {/* Mobile: card layout */}
            <div className="sm:hidden space-y-2">
                {loading ? (
                    Array(5).fill(0).map((_, i) => (
                        <div key={i} className="pro-card px-4 py-3">
                            <Skeleton height={20} width="60%" />
                            <Skeleton height={14} width="40%" className="mt-2" />
                        </div>
                    ))
                ) : products.length === 0 ? (
                    <div className="pro-card px-4 py-8 text-center text-sm text-gray-500">Aucun produit.</div>
                ) : products.map(p => (
                    <div key={p.id} className="pro-card px-4 py-3 flex items-center justify-between">
                        <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{p.nom}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-gray-500">{p.categorie_nom || '-'}</span>
                                {p.variete && <span className="text-xs text-gray-400">· {p.variete}</span>}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">{parseFloat(p.prix_actif || 0).toFixed(2)} € · Seuil: {p.seuil_alerte_stock ?? 10}</div>
                        </div>
                        <button onClick={() => handleDelete(p.id)} className="text-gray-400 hover:text-red-600 p-1 shrink-0">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>

            {/* Desktop: table layout */}
            <div className="hidden sm:block pro-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">ID</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nom</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Catégorie</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Taxe</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Variété</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Prix Actif</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Seuil</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right w-20">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-4 py-3"><Skeleton /></td>
                                        <td className="px-4 py-3"><Skeleton width="80%" /></td>
                                        <td className="px-4 py-3"><Skeleton width="60%" /></td>
                                        <td className="px-4 py-3"><Skeleton width="40%" /></td>
                                        <td className="px-4 py-3"><Skeleton width="50%" /></td>
                                        <td className="px-4 py-3"><Skeleton width="30%" /></td>
                                        <td className="px-4 py-3"><Skeleton width="20%" /></td>
                                    </tr>
                                ))
                            ) : products.length === 0 ? (
                                <tr><td colSpan="7" className="px-4 py-8 text-center text-sm text-gray-500">Aucun produit trouvé.</td></tr>
                            ) : products.map(p => (
                                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">{p.id}</td>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.nom}</td>
                                    <td className="px-4 py-3 text-sm">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border bg-gray-50 text-gray-700 border-gray-200">
                                            {p.categorie_nom || '-'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {p.taxe_nom ? (
                                            <span className="text-xs text-blue-600 font-medium">{p.taxe_nom} ({p.taxe_taux}%)</span>
                                        ) : <span className="text-gray-400">-</span>}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{p.variete || <span className="text-gray-400">-</span>}</td>
                                    <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">{parseFloat(p.prix_actif || 0).toFixed(2)} €</td>
                                    <td className="px-4 py-3 text-sm text-right text-gray-500">{p.seuil_alerte_stock ?? 10}</td>
                                    <td className="px-4 py-3 text-sm text-right">
                                        <button onClick={() => handleDelete(p.id)} className="text-gray-400 hover:text-red-600 transition-colors p-1 opacity-0 group-hover:opacity-100">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                        <button disabled={pagination.page <= 1} onClick={() => fetchProducts(pagination.page - 1, search)}
                            className="flex items-center text-xs font-medium text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed">
                            <ChevronLeft className="w-4 h-4 mr-1" /> Précédent
                        </button>
                        <span className="text-xs text-gray-500">Page {pagination.page} / {pagination.totalPages}</span>
                        <button disabled={pagination.page >= pagination.totalPages} onClick={() => fetchProducts(pagination.page + 1, search)}
                            className="flex items-center text-xs font-medium text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed">
                            Suivant <ChevronRight className="w-4 h-4 ml-1" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Catalogue;
