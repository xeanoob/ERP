import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Plus, Trash2, Search, ChevronLeft, ChevronRight, Download, Pencil } from 'lucide-react';
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
    const [newProduct, setNewProduct] = useState({ nom: '', categorie_id: '', taux_tva_id: '', origine: '', unite: 'kg', prix_actif: '', seuil_alerte_stock: '10' });
    const [message, setMessage] = useState('');
    const [editingCell, setEditingCell] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [search, setSearch] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [productToEdit, setProductToEdit] = useState(null);
    const [editForm, setEditForm] = useState({ nom: '', categorie_id: '', taux_tva_id: '', origine: '', unite: '', prix_actif: '', seuil_alerte_stock: '' });

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
                axios.get(`${API_URL}/tauxTva`)
            ]);
            setCategories(catRes.data);
            setTaxes(taxRes.data);
            
            // Set default tax if available
            const defaultTax = taxRes.data.find(t => t.is_default);
            if (defaultTax) {
                setNewProduct(prev => ({ ...prev, taux_tva_id: defaultTax.id }));
            }
        } catch (err) { console.error(err); }
    };

    useEffect(() => { fetchCategoriesAndTaxes(); }, []);

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchProducts(1, search);
        }, 500);
        return () => clearTimeout(timeout);
    }, [search, fetchProducts]);

    const handleSearch = (e) => setSearch(e.target.value);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newProduct.nom || !newProduct.categorie_id) return;
        try {
            await axios.post(`${API_URL}/products`, newProduct);
            const defaultTax = taxes.find(t => t.is_default);
            setNewProduct({ nom: '', categorie_id: '', taux_tva_id: defaultTax ? defaultTax.id : '', origine: '', unite: 'kg', prix_actif: '', seuil_alerte_stock: '10' });
            fetchProducts(pagination.page, search);
            toast.success('Produit ajouté avec succès');
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.error || 'Erreur lors de l\'ajout');
        }
    };

    const handleOpenEditModal = (p) => {
        setProductToEdit(p);
        setEditForm({
            nom: p.nom || '',
            categorie_id: p.categorie_id || '',
            taux_tva_id: p.taux_tva_id || '',
            origine: p.origine || '',
            unite: p.unite || 'kg',
            prix_actif: p.prix_actif || '',
            seuil_alerte_stock: p.seuil_alerte_stock ?? 10
        });
        setShowEditModal(true);
    };

    const handleSaveQuickEdit = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`${API_URL}/products/${productToEdit.id}`, editForm);
            toast.success('Produit mis à jour');
            setShowEditModal(false);
            fetchProducts(pagination.page, search);
        } catch (err) {
            toast.error('Erreur lors de la mise à jour');
        }
    };

    const exportCSV = () => {
        const headers = ['ID', 'Nom', 'Catégorie', 'Taxe', 'Origine', 'Unité', 'Stock', 'Prix de Vente (€)', 'Seuil Alerte'];
        const rows = products.map(p => [
            p.id,
            p.nom,
            p.categorie_nom || '',
            p.tauxTva_nom ? `${p.tauxTva_nom} (${p.tauxTva_taux}%)` : '',
            p.origine || '',
            p.unite || 'kg',
            p.quantite_stock,
            p.prix_actif,
            p.seuil_alerte_stock
        ]);

        
        const csvContent = "\uFEFF" + [headers, ...rows].map(row =>
            row.map(cell => `"${(cell ?? '').toString().replace(/"/g, '""')}"`).join(",")
        ).join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `catalogue_stocko_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Export CSV généré');
    };

    const exportPDF = () => {
        const doc = new jsPDF();
        const dateStr = new Date().toLocaleDateString('fr-FR');

        
        doc.setFontSize(20);
        doc.setTextColor(17, 24, 39); 
        doc.text("Catalogue Produits", 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(107, 114, 128); 
        doc.text(`Généré le: ${dateStr}`, 14, 30);
        doc.text(`Total produits: ${pagination.total}`, 14, 35);

        const tableColumn = ["ID", "Nom", "Catégorie", "Taxe", "Origine", "Unité", "Stock", "Prix (€)"];
        const tableRows = products.map(p => [
            p.id,
            p.nom,
            p.categorie_nom || '-',
            p.tauxTva_nom ? `${p.tauxTva_taux}%` : '-',
            p.origine || '-',
            p.unite || 'kg',
            p.quantite_stock,
            parseFloat(p.prix_actif || 0).toFixed(2)
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 45,
            theme: 'grid',
            headStyles: { fillColor: [17, 24, 39], fontSize: 9 }, 
            bodyStyles: { fontSize: 8 },
            alternateRowStyles: { fillColor: [249, 250, 251] }, 
            margin: { top: 45 },
            didDrawPage: function (data) {
                
                const str = "Page " + doc.internal.getNumberOfPages();
                doc.setFontSize(8);
                const pageSize = doc.internal.pageSize;
                const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
                doc.text(str, data.settings.margin.left, pageHeight - 10);
            }
        });

        doc.save(`catalogue_stocko_${new Date().toISOString().split('T')[0]}.pdf`);
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

    const startEdit = (p, field) => {
        setEditingCell({ id: p.id, field });
        setEditValue(field === 'prix_actif' ? parseFloat(p.prix_actif || 0).toFixed(2) : (p[field] || ''));
    };

    const saveEdit = async (p, customValue = null) => {
        if (!editingCell) return;
        const val = customValue !== null ? customValue : editValue;
        
        try {
            const payload = {
                ...p,
                [editingCell.field]: (editingCell.field === 'prix_actif' || editingCell.field === 'seuil_alerte_stock') ? parseFloat(val) : val
            };
            
            payload.categorie_id = payload.categorie_id || null;
            payload.taux_tva_id = payload.taux_tva_id || null;

            await axios.put(`${API_URL}/products/${p.id}`, payload);
            toast.success('Produit mis à jour');
            setEditingCell(null);
            fetchProducts(pagination.page, search);
        } catch (err) {
            console.error(err);
            toast.error('Erreur lors de la mise à jour');
        }
    };

    const handleEditKeyDown = (e, p) => {
        if (e.key === 'Enter') saveEdit(p);
        if (e.key === 'Escape') setEditingCell(null);
    };

    return (
        <div className="max-w-6xl mx-auto flex flex-col gap-4 sm:gap-6">
            {}
            <div className="pro-card p-4 sm:p-5 order-first sm:order-none">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-50">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Nouveau Produit</h3>
                    {message && <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded uppercase tracking-widest">{message}</span>}
                </div>
                <form onSubmit={handleCreate} className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nom *</label>
                            <input type="text" value={newProduct.nom} onChange={e => setNewProduct({ ...newProduct, nom: e.target.value })}
                                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900" placeholder="Ex: Pomme Golden" />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Catégorie *</label>
                            <select value={newProduct.categorie_id} onChange={e => setNewProduct({ ...newProduct, categorie_id: e.target.value })}
                                className="w-full bg-white border border-gray-300 rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900">
                                <option value="" disabled>Choisir</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                            </select>
                        </div>
                        <div className="col-span-1">
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Taxe</label>
                            <select value={newProduct.taux_tva_id} onChange={e => setNewProduct({ ...newProduct, taux_tva_id: e.target.value })}
                                className="w-full bg-white border border-gray-300 rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900">
                                <option value="">(Aucune)</option>
                                {taxes.map(t => <option key={t.id} value={t.id}>{t.nom} ({t.taux}%)</option>)}
                            </select>
                        </div>
                        <div className="col-span-1 sm:col-span-1">
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Origine</label>
                            <input type="text" value={newProduct.origine} onChange={e => setNewProduct({ ...newProduct, origine: e.target.value })}
                                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900" placeholder="France" />
                        </div>
                        <div className="col-span-1 sm:col-span-1">
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Unité</label>
                            <select value={newProduct.unite} onChange={e => setNewProduct({ ...newProduct, unite: e.target.value })}
                                className="w-full bg-white border border-gray-300 rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900">
                                <option value="kg">kg</option>
                                <option value="unité">unité</option>
                            </select>
                        </div>
                        <div className="col-span-1 sm:col-span-1">
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Prix Vente (€)</label>
                            <input type="number" step="0.01" value={newProduct.prix_actif} onChange={e => setNewProduct({ ...newProduct, prix_actif: e.target.value })}
                                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900" placeholder="0.00" />
                        </div>
                        <div className="col-span-1 sm:col-span-1">
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Seuil Alerte</label>
                            <input type="number" step="1" value={newProduct.seuil_alerte_stock} onChange={e => setNewProduct({ ...newProduct, seuil_alerte_stock: e.target.value })}
                                className="w-full bg-white border border-gray-300 rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900" placeholder="10" />
                        </div>
                    </div>
                    <div className="flex justify-end pt-1">
                        <button type="submit" className="w-full sm:w-auto bg-gray-900 text-white px-8 py-2 rounded-md text-sm font-bold hover:bg-gray-800 transition-all shadow-lg active:scale-95 flex items-center justify-center">
                            <Plus className="w-4 h-4 mr-2" /> Ajouter au Catalogue
                        </button>
                    </div>
                </form>
            </div>

            {}
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

            {}
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
                    <div key={p.id} className="pro-card px-4 py-3 flex items-center justify-between group">
                        <div className="min-w-0 flex-1">
                            <div className="text-sm font-bold text-gray-900 truncate uppercase tracking-tight">{p.nom}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">{p.categorie_nom || '-'}</span>
                                {p.origine && <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">· {p.origine}</span>}
                            </div>
                            <div className="text-[11px] font-medium text-gray-500 mt-1">
                                <span className="text-gray-900 font-bold">{parseFloat(p.prix_actif || 0).toFixed(2)} €</span> / {p.unite || 'kg'} 
                                <span className="mx-1 text-gray-200">|</span> 
                                Seuil: <span className={p.quantite_stock <= p.seuil_alerte_stock ? 'text-red-500 font-bold' : ''}>{p.seuil_alerte_stock ?? 10}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => handleOpenEditModal(p)} className="p-2 text-gray-400 hover:text-blue-600 active:scale-95 transition-all">
                                <Pencil className="w-4 h-4" />
                                <span className="sr-only">Modifier</span>
                            </button>
                            <button onClick={() => handleDelete(p.id)} className="p-2 text-gray-300 hover:text-red-500 active:scale-95 transition-all">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {}
            <div className="hidden sm:block pro-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">ID</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nom</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Catégorie</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Taxe</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Origine</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Unité</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Prix de Vente</th>
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
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900" onDoubleClick={() => startEdit(p, 'nom')}>
                                        {editingCell?.id === p.id && editingCell?.field === 'nom' ? (
                                            <input autoFocus type="text" value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => handleEditKeyDown(e, p)} onBlur={() => saveEdit(p)} className="w-full bg-white border border-gray-900 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900" />
                                        ) : (
                                            <span className="cursor-pointer hover:underline" title="Double clic pour modifier">{p.nom}</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm" onDoubleClick={() => startEdit(p, 'categorie_id')}>
                                        {editingCell?.id === p.id && editingCell?.field === 'categorie_id' ? (
                                            <select autoFocus value={editValue || ''} onChange={e => { setEditValue(e.target.value); saveEdit(p, e.target.value); }} onBlur={() => setEditingCell(null)} className="w-full bg-white border border-gray-900 rounded px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-900">
                                                <option value="" disabled>Choisir</option>
                                                {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                                            </select>
                                        ) : (
                                            <span className="cursor-pointer inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-400" title="Double clic pour modifier">
                                                {p.categorie_nom || '-'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm" onDoubleClick={() => startEdit(p, 'taux_tva_id')}>
                                        {editingCell?.id === p.id && editingCell?.field === 'taux_tva_id' ? (
                                            <select autoFocus value={editValue || ''} onChange={e => { setEditValue(e.target.value); saveEdit(p, e.target.value); }} onBlur={() => setEditingCell(null)} className="w-full bg-white border border-gray-900 rounded px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-900">
                                                <option value="">Aucune</option>
                                                {taxes.map(t => <option key={t.id} value={t.id}>{t.nom}</option>)}
                                            </select>
                                        ) : p.tauxTva_nom ? (
                                            <span className="cursor-pointer hover:underline text-xs text-blue-600 font-medium" title="Double clic pour modifier">{p.tauxTva_nom} ({p.tauxTva_taux}%)</span>
                                        ) : <span className="cursor-pointer hover:underline text-gray-400" title="Double clic pour modifier">-</span>}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600" onDoubleClick={() => startEdit(p, 'origine')}>
                                        {editingCell?.id === p.id && editingCell?.field === 'origine' ? (
                                            <input autoFocus type="text" value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => handleEditKeyDown(e, p)} onBlur={() => saveEdit(p)} className="w-full bg-white border border-gray-900 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900" />
                                        ) : (
                                            <span className="cursor-pointer hover:underline" title="Double clic pour modifier">{p.origine || '-'}</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600 font-mono text-xs" onDoubleClick={() => startEdit(p, 'unite')}>
                                        {editingCell?.id === p.id && editingCell?.field === 'unite' ? (
                                            <select autoFocus value={editValue || 'kg'} onChange={e => { setEditValue(e.target.value); saveEdit(p, e.target.value); }} onBlur={() => setEditingCell(null)} className="w-16 bg-white border border-gray-900 rounded px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-900">
                                                <option value="kg">kg</option>
                                                <option value="unité">unité</option>
                                            </select>
                                        ) : (
                                            <span className="cursor-pointer hover:underline" title="Double clic pour modifier">{p.unite || 'kg'}</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium" onDoubleClick={() => startEdit(p, 'prix_actif')}>
                                        {editingCell?.id === p.id && editingCell?.field === 'prix_actif' ? (
                                            <input autoFocus type="number" step="0.01" value={editValue} 
                                                onChange={e => setEditValue(e.target.value)} 
                                                onKeyDown={e => handleEditKeyDown(e, p)} 
                                                onBlur={() => saveEdit(p)} 
                                                className="w-20 bg-white border border-gray-900 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-gray-900" />
                                        ) : (
                                            <span className="cursor-pointer hover:underline" title="Double clic pour modifier">{parseFloat(p.prix_actif || 0).toFixed(2)} €</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right text-gray-500" onDoubleClick={() => startEdit(p, 'seuil_alerte_stock')}>
                                        {editingCell?.id === p.id && editingCell?.field === 'seuil_alerte_stock' ? (
                                            <input autoFocus type="number" step="1" value={editValue} 
                                                onChange={e => setEditValue(e.target.value)} 
                                                onKeyDown={e => handleEditKeyDown(e, p)} 
                                                onBlur={() => saveEdit(p)} 
                                                className="w-16 bg-white border border-gray-900 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-gray-900" />
                                        ) : (
                                            <span className="cursor-pointer hover:underline" title="Double clic pour modifier">{p.seuil_alerte_stock ?? 10}</span>
                                        )}
                                    </td>
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

            {/* Quick Edit Modal for Mobile */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Modifier Produit</h3>
                        </div>
                        <form onSubmit={handleSaveQuickEdit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Nom *</label>
                                <input type="text" value={editForm.nom} onChange={e => setEditForm({ ...editForm, nom: e.target.value })}
                                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 outline-none" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Catégorie</label>
                                    <select value={editForm.categorie_id} onChange={e => setEditForm({ ...editForm, categorie_id: e.target.value })}
                                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-900">
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Prix (€)</label>
                                    <input type="number" step="0.01" value={editForm.prix_actif} onChange={e => setEditForm({ ...editForm, prix_actif: e.target.value })}
                                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-900" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Unité</label>
                                    <select value={editForm.unite} onChange={e => setEditForm({ ...editForm, unite: e.target.value })}
                                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-900">
                                        <option value="kg">kg</option>
                                        <option value="unité">unité</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Seuil Alerte</label>
                                    <input type="number" value={editForm.seuil_alerte_stock} onChange={e => setEditForm({ ...editForm, seuil_alerte_stock: e.target.value })}
                                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-900" />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="flex-1 bg-gray-900 text-white py-2.5 rounded-lg text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Enregistrer</button>
                                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 bg-white border border-gray-200 text-gray-400 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-gray-50 active:scale-95 transition-all">Annuler</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Catalogue;
