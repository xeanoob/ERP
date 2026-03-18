import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Plus, Search, Check, ClipboardList, Pencil } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExportMenu from '../components/ExportMenu';
import LotModal from '../components/LotModal';
import InventoryModal from '../components/InventoryModal';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const Inventaire = () => {
    const [stocks, setStocks] = useState([]);
    const [products, setProducts] = useState([]);
    const [fournisseurs, setFournisseurs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [editingSeuil, setEditingSeuil] = useState(null);
    const [seuilValue, setSeuilValue] = useState('');
    const [editingPriceId, setEditingPriceId] = useState(null);
    const [editingPriceValue, setEditingPriceValue] = useState('');
    const [message, setMessage] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [newLot, setNewLot] = useState({ produit_id: '', fournisseur_id: '', quantite_achetee: '', prix_achat_unitaire: '' });
    
    // Inventory Verification State
    const [showInventoryModal, setShowInventoryModal] = useState(false);
    const [inventoryCounts, setInventoryCounts] = useState({}); // { productId: physicalCount }
    const [isSubmittingInventory, setIsSubmittingInventory] = useState(false);

    useEffect(() => {
        fetchProducts();
        fetchFournisseurs();
    }, []);

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchStocks(search);
        }, 500);
        return () => clearTimeout(timeout);
    }, [search]);

    const fetchStocks = async (q = '') => {
        try {
            const res = await axios.get(`${API_URL}/entrees/stock`, { params: { search: q } });
            setStocks(res.data);
            setLoading(false);
        } catch (err) { console.error(err); setLoading(false); }
    };

    const handleSearch = (e) => setSearch(e.target.value);

    const fetchProducts = async () => {
        try {
            const res = await axios.get(`${API_URL}/products`);
            setProducts(res.data.data || res.data);
        } catch (err) { console.error(err); }
    };

    const fetchFournisseurs = async () => {
        try {
            const res = await axios.get(`${API_URL}/fournisseurs`);
            setFournisseurs(res.data);
        } catch (err) { console.error(err); }
    };

    const handleAddLot = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/entrees`, newLot);
            setShowModal(false);
            setNewLot({ produit_id: '', fournisseur_id: '', quantite_achetee: '', prix_achat_unitaire: '' });
            fetchStocks();
            fetchProducts();
        } catch (err) { alert('Erreur: ' + (err.response?.data || err.message)); }
    };

    const handleInventorySubmit = async (e) => {
        e.preventDefault();
        setIsSubmittingInventory(true);
        const losses = [];
        
        try {
            for (const s of stocks) {
                const physical = parseFloat(inventoryCounts[s.id] || 0);
                const system = parseFloat(s.quantite_stock);
                const diff = system - physical;

                if (diff > 0.05) { // Small threshold to avoid floating point issues
                    losses.push({
                        produit_id: s.id,
                        quantite_sortie: diff,
                        type: 'perte',
                        prix_reel: 0,
                        lieu_vente_id: null,
                        date_vente: new Date().toISOString()
                    });
                }
            }

            if (losses.length > 0) {
                // Submit each loss
                await Promise.all(losses.map(l => axios.post(`${API_URL}/sales`, l)));
                toast.success(`${losses.length} perte(s) enregistrée(s)`);
            } else {
                toast.success('Inventaire validé (aucune perte détectée)');
            }
            
            setShowInventoryModal(false);
            fetchStocks();
        } catch (err) {
            console.error(err);
            toast.error('Erreur lors de l\'enregistrement de l\'inventaire');
        } finally {
            setIsSubmittingInventory(false);
        }
    };

    const startEditSeuil = (product) => {
        setEditingSeuil(product.id);
        setSeuilValue(parseFloat(product.seuil_alerte_stock || 10).toString());
    };

    const saveSeuil = async (productId) => {
        try {
            const product = stocks.find(s => s.id === productId);
            await axios.put(`${API_URL}/products/${productId}`, {
                nom: product.nom,
                categorie_id: product.categorie_id,
                taux_tva_id: product.taux_tva_id,
                origine: product.origine || '',
                unite: product.unite || 'kg',
                prix_actif: product.prix_actif,
                seuil_alerte_stock: parseFloat(seuilValue)
            });
            setEditingSeuil(null);
            setMessage('Seuil mis à jour');
            setTimeout(() => setMessage(''), 2500);
            fetchStocks();
        } catch (err) { console.error(err); }
    };

    const handleSeuilKeyDown = (e, productId) => {
        if (e.key === 'Enter') saveSeuil(productId);
        if (e.key === 'Escape') setEditingSeuil(null);
    };

    const startEditingPrice = (product) => {
        setEditingPriceId(product.id);
        setEditingPriceValue(parseFloat(product.prix_actif || 0).toFixed(2));
    };

    const saveEditPrice = async (productId) => {
        if (!editingPriceId) return;
        try {
            const product = stocks.find(s => s.id === productId);
            await axios.put(`${API_URL}/products/${productId}`, {
                nom: product.nom,
                categorie_id: product.categorie_id,
                taux_tva_id: product.taux_tva_id,
                origine: product.origine || '',
                unite: product.unite || 'kg',
                seuil_alerte_stock: product.seuil_alerte_stock,
                prix_actif: parseFloat(editingPriceValue)
            });
            setEditingPriceId(null);
            setMessage('Prix mis à jour');
            setTimeout(() => setMessage(''), 2500);
            fetchStocks();
            fetchProducts();
        } catch (err) { console.error(err); }
    };

    const handlePriceKeyDown = (e, productId) => {
        if (e.key === 'Enter') saveEditPrice(productId);
        if (e.key === 'Escape') setEditingPriceId(null);
    };

    const exportCSV = () => {
        const headers = ['Produit', 'Catégorie', 'Stock', 'Unité', 'Seuil Alerte', 'Statut', 'Prix de Vente (€)'];
        const rows = filteredStocks.map(p => {
            const qty = parseFloat(p.quantite_stock);
            const seuil = parseFloat(p.seuil_alerte_stock || 10);
            const status = qty <= seuil * 0.5 ? 'CRITIQUE' : qty <= seuil ? 'BAS' : 'OK';
            return [
                p.nom,
                p.categorie_nom || '',
                qty.toFixed(1),
                p.unite || 'kg',
                seuil.toFixed(0),
                status,
                parseFloat(p.prix_actif).toFixed(2)
            ];
        });

        const csvContent = "\uFEFF" + [headers, ...rows].map(row =>
            row.map(cell => `"${(cell ?? '').toString().replace(/"/g, '""')}"`).join(",")
        ).join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `inventaire_stocko_${new Date().toISOString().split('T')[0]}.csv`);
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
        doc.text("État des Stocks (Inventaire)", 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(107, 114, 128);
        doc.text(`Rapport généré le: ${dateStr}`, 14, 30);

        const tableColumn = ["Produit", "Catégorie", "Stock", "Unité", "Seuil", "Statut", "Prix"];
        const tableRows = filteredStocks.map(p => {
            const qty = parseFloat(p.quantite_stock);
            const seuil = parseFloat(p.seuil_alerte_stock || 10);
            const status = qty <= seuil * 0.5 ? 'CRITIQUE' : qty <= seuil ? 'BAS' : 'OK';
            return [
                p.nom,
                p.categorie_nom || '-',
                qty.toFixed(1),
                p.unite || 'kg',
                seuil.toFixed(0),
                status,
                `${parseFloat(p.prix_actif).toFixed(2)} €`
            ];
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [17, 24, 39], fontSize: 9 },
            bodyStyles: { fontSize: 8 },
            alternateRowStyles: { fillColor: [249, 250, 251] },
            margin: { top: 40 },
            didParseCell: function (data) {
                if (data.column.index === 4 && data.cell.section === 'body') {
                    if (data.cell.text[0] === 'CRITIQUE') doc.setTextColor(220, 38, 38);
                    else if (data.cell.text[0] === 'BAS') doc.setTextColor(217, 119, 6);
                    else doc.setTextColor(21, 128, 61);
                }
            }
        });

        doc.save(`etat_stocks_${new Date().toISOString().split('T')[0]}.pdf`);
        toast.success('Inventaire PDF généré');
    };

    const uniqueCategories = useMemo(() => {
        return [...new Set(stocks.map(s => s.categorie_nom).filter(Boolean))].sort();
    }, [stocks]);

    const filteredStocks = useMemo(() => {
        return stocks.filter(s => {
            const matchSearch = s.nom.toLowerCase().includes(search.toLowerCase());
            const matchCategory = selectedCategory ? s.categorie_nom === selectedCategory : true;
            return matchSearch && matchCategory;
        });
    }, [stocks, search, selectedCategory]);

    return (
        <div className="max-w-6xl mx-auto flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">État des Stocks</h2>
                    <p className="text-sm text-gray-500">Cliquez sur un seuil pour le modifier.</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                    {message && <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">{message}</span>}
                    <button onClick={() => {
                        const counts = {};
                        stocks.forEach(s => counts[s.id] = parseFloat(s.quantite_stock).toFixed(1));
                        setInventoryCounts(counts);
                        setShowInventoryModal(true);
                    }}
                        className="bg-white text-gray-900 border border-gray-200 px-3 sm:px-4 py-2 rounded-md hover:bg-gray-50 transition-colors text-xs sm:text-sm font-bold flex items-center shadow-sm">
                        <ClipboardList className="w-4 h-4 mr-1.5 sm:mr-2" /> Faire l'inventaire
                    </button>
                    <button onClick={() => setShowModal(true)}
                        className="bg-gray-900 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-gray-800 transition-colors text-xs sm:text-sm font-bold flex items-center shadow-sm">
                        <Plus className="w-4 h-4 mr-1.5 sm:mr-2" /> Entrée de lot
                    </button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filtrer un produit..."
                            className="w-full bg-white border border-gray-300 rounded-md pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900" />
                    </div>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full sm:w-48 bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                    >
                        <option value="">Toutes les catégories</option>
                        {uniqueCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
                <ExportMenu onExportCSV={exportCSV} onExportPDF={exportPDF} />
            </div>

            {/* Mobile Card View */}
            <div className="block sm:hidden space-y-3">
                {loading ? (
                    Array(5).fill(0).map((_, i) => (
                        <div key={i} className="pro-card p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div className="space-y-2 w-full">
                                    <div className="h-4 bg-gray-100 rounded w-2/3 animate-pulse"></div>
                                    <div className="h-3 bg-gray-100 rounded w-1/3 animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : filteredStocks.length === 0 ? (
                    <div className="pro-card p-8 text-center text-sm text-gray-500">Aucun produit trouvé.</div>
                ) : filteredStocks.map(p => {
                    const qty = parseFloat(p.quantite_stock);
                    const seuil = parseFloat(p.seuil_alerte_stock || 10);
                    const isLow = qty <= seuil;
                    const isCritical = qty <= seuil * 0.5;

                    return (
                        <div key={p.id} className={`pro-card p-4 flex flex-col gap-3 transition-all ${isCritical ? 'border-red-200 bg-red-50/5' : isLow ? 'border-amber-200 bg-amber-50/5' : ''}`}>
                            <div className="flex justify-between items-start">
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight truncate">{p.nom}</h4>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                                            {p.categorie_nom || '-'}
                                        </span>
                                        {p.origine && <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">· {p.origine}</span>}
                                    </div>
                                </div>
                                <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${
                                    isCritical ? 'bg-red-50 text-red-600 border-red-100' : 
                                    isLow ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                                    'bg-green-50 text-green-600 border-green-100'
                                }`}>
                                    {isCritical ? 'Critique' : isLow ? 'Bas' : 'OK'}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-50">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Stock Actuel</p>
                                    <p className={`text-sm font-mono font-black ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
                                        {qty.toFixed(1)} <span className="text-[10px] font-bold opacity-30">{p.unite || 'kg'}</span>
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Seuil Alerte</p>
                                    <div className="flex items-center gap-1.5">
                                        {editingSeuil === p.id ? (
                                            <input autoFocus type="number" value={seuilValue} onChange={e => setSeuilValue(e.target.value)}
                                                onKeyDown={e => handleSeuilKeyDown(e, p.id)} onBlur={() => saveSeuil(p.id)}
                                                className="w-16 bg-white border border-gray-900 rounded px-1.5 py-0.5 text-xs font-mono focus:outline-none" />
                                        ) : (
                                            <button onClick={() => { setEditingSeuil(p.id); setSeuilValue(p.seuil_alerte_stock || 10); }} className="flex items-center gap-1 text-xs font-mono text-gray-600 hover:text-gray-900 group">
                                                {seuil.toFixed(0)}
                                                <Pencil className="w-3 h-3 text-gray-300 group-hover:text-blue-500 transition-colors" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Prix Vente</p>
                                    <div className="flex items-center gap-1.5">
                                        {editingPriceId === p.id ? (
                                            <input autoFocus type="number" step="0.01" value={editingPriceValue} onChange={e => setEditingPriceValue(e.target.value)}
                                                onKeyDown={e => handlePriceKeyDown(e, p.id)} onBlur={() => saveEditPrice(p.id)}
                                                className="w-20 bg-white border border-gray-900 rounded px-1.5 py-0.5 text-xs font-mono focus:outline-none" />
                                        ) : (
                                            <button onClick={() => startEditingPrice(p)} className="flex items-center gap-1 text-xs font-mono text-gray-900 font-bold group">
                                                {parseFloat(p.prix_actif).toFixed(2)} €
                                                <Pencil className="w-3 h-3 text-gray-300 group-hover:text-blue-500 transition-colors" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-end justify-end">
                                    <p className="text-[10px] font-bold text-gray-300 italic opacity-50">#{p.id}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block pro-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Produit</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Stock</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Seuil Alerte</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Statut</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Prix de Vente (€)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {loading ? (
                                <tr><td colSpan="5" className="px-4 py-8 text-center text-sm text-gray-500">Chargement...</td></tr>
                            ) : filteredStocks.length === 0 ? (
                                <tr><td colSpan="5" className="px-4 py-8 text-center text-sm text-gray-500">Aucun produit en stock.</td></tr>
                            ) : filteredStocks.map(p => {
                                const qty = parseFloat(p.quantite_stock);
                                const seuil = parseFloat(p.seuil_alerte_stock || 10);
                                const isLow = qty <= seuil;
                                const isCritical = qty <= seuil * 0.5;

                                return (
                                    <React.Fragment key={p.id}>
                                        <tr className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-4 py-3 flex items-center gap-2">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{p.nom}</div>
                                                    <div className="text-xs text-gray-500">{p.categorie_nom || '-'}</div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right font-medium">
                                                <span className={isCritical ? 'text-red-600 font-bold' : isLow ? 'text-amber-600 font-semibold' : 'text-gray-900'}>
                                                    {qty.toFixed(1)} <span className="text-gray-500 font-normal text-xs">{p.unite || 'kg'}</span>
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right" onClick={(e) => e.stopPropagation()}>
                                                {editingSeuil === p.id ? (
                                                    <div className="flex items-center justify-end gap-1">
                                                        <input type="number" step="1" value={seuilValue}
                                                            onChange={e => setSeuilValue(e.target.value)}
                                                            onKeyDown={e => handleSeuilKeyDown(e, p.id)} autoFocus
                                                            className="w-16 bg-white border border-gray-900 rounded px-2 py-1 text-sm text-right font-mono focus:outline-none" />
                                                        <button onClick={() => saveSeuil(p.id)} className="p-1 text-green-600 hover:text-green-800">
                                                            <Check className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => startEditSeuil(p)}
                                                        className="text-gray-400 hover:text-gray-900 hover:underline transition-colors cursor-pointer"
                                                        title="Cliquer pour modifier">{seuil.toFixed(0)}</button>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {isCritical ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-200">CRITIQUE</span>
                                                ) : isLow ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">BAS</span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200">OK</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium" onDoubleClick={(e) => { e.stopPropagation(); startEditingPrice(p); }}>
                                                {editingPriceId === p.id ? (
                                                    <div className="flex items-center justify-end gap-1">
                                                        <input type="number" step="0.01" value={editingPriceValue}
                                                            onChange={e => setEditingPriceValue(e.target.value)}
                                                            onKeyDown={e => handlePriceKeyDown(e, p.id)} autoFocus
                                                            className="w-20 bg-white border border-gray-900 rounded px-2 py-1 text-sm text-right font-mono focus:outline-none focus:ring-1 focus:ring-gray-900" />
                                                        <button onClick={() => saveEditPrice(p.id)} className="p-1 text-green-600 hover:text-green-800">
                                                            <Check className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button onClick={(e) => { e.stopPropagation(); startEditingPrice(p); }}
                                                        className="text-gray-600 hover:text-gray-900 hover:underline transition-colors cursor-pointer"
                                                        title="Cliquer pour modifier">{parseFloat(p.prix_actif).toFixed(2)}</button>
                                                )}
                                            </td>
                                        </tr>
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <LotModal
                show={showModal}
                onHide={() => setShowModal(false)}
                newLot={newLot}
                setNewLot={setNewLot}
                products={products}
                fournisseurs={fournisseurs}
                onAddLot={handleAddLot}
            />

            <InventoryModal
                show={showInventoryModal}
                onHide={() => setShowInventoryModal(false)}
                stocks={stocks}
                inventoryCounts={inventoryCounts}
                setInventoryCounts={setInventoryCounts}
                isSubmitting={isSubmittingInventory}
                onSubmit={handleInventorySubmit}
            />
        </div>
    );
};

export default Inventaire;
