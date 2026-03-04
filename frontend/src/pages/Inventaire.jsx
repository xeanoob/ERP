import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Check } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const Inventaire = () => {
    const [stocks, setStocks] = useState([]);
    const [products, setProducts] = useState([]);
    const [fournisseurs, setFournisseurs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [editingSeuil, setEditingSeuil] = useState(null);
    const [seuilValue, setSeuilValue] = useState('');
    const [message, setMessage] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [newLot, setNewLot] = useState({ produit_id: '', fournisseur_id: '', quantite_achetee: '', prix_achat_unitaire: '' });

    useEffect(() => {
        fetchStocks();
        fetchProducts();
        fetchFournisseurs();
    }, []);

    const fetchStocks = async () => {
        try {
            const res = await axios.get(`${API_URL}/lots/stock`);
            setStocks(res.data);
            setLoading(false);
        } catch (err) { console.error(err); setLoading(false); }
    };

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
            await axios.post(`${API_URL}/lots`, newLot);
            setShowModal(false);
            setNewLot({ produit_id: '', fournisseur_id: '', quantite_achetee: '', prix_achat_unitaire: '' });
            fetchStocks();
            fetchProducts();
        } catch (err) { alert('Erreur: ' + (err.response?.data || err.message)); }
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
                categorie: product.categorie,
                variete: product.variete || '',
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

    const filteredStocks = stocks.filter(s => s.nom.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="max-w-6xl mx-auto flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">État des Stocks</h2>
                    <p className="text-sm text-gray-500">Cliquez sur un seuil pour le modifier.</p>
                </div>
                <div className="flex items-center gap-3">
                    {message && <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">{message}</span>}
                    <button onClick={() => setShowModal(true)}
                        className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors text-sm font-medium flex items-center shadow-sm">
                        <Plus className="w-4 h-4 mr-2" /> Entrée de lot
                    </button>
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filtrer un produit..."
                    className="w-full sm:w-80 bg-white border border-gray-300 rounded-md pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900" />
            </div>

            <div className="pro-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Produit</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Stock</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Seuil Alerte</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Statut</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Prix Actif (€)</th>
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
                                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-medium text-gray-900">{p.nom}</div>
                                            <div className="text-xs text-gray-500">{p.categorie_nom || '-'}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-medium">
                                            <span className={isCritical ? 'text-red-600 font-bold' : isLow ? 'text-amber-600 font-semibold' : 'text-gray-900'}>
                                                {qty.toFixed(1)} kg
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right">
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
                                        <td className="px-4 py-3 text-sm text-right text-gray-600 font-medium">
                                            {parseFloat(p.prix_actif).toFixed(2)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-md shadow-2xl max-w-sm w-full overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-900">Nouvelle Entrée de Lot</h3>
                        </div>
                        <form onSubmit={handleAddLot} className="px-5 py-4 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Produit *</label>
                                <select className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                                    value={newLot.produit_id} onChange={e => setNewLot({ ...newLot, produit_id: e.target.value })} required>
                                    <option value="" disabled>Sélectionner...</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.nom} ({p.categorie})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Fournisseur</label>
                                <select className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                                    value={newLot.fournisseur_id} onChange={e => setNewLot({ ...newLot, fournisseur_id: e.target.value })}>
                                    <option value="">(Aucun)</option>
                                    {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Qté achetée (kg)</label>
                                    <input type="number" step="0.01" className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                                        value={newLot.quantite_achetee} onChange={e => setNewLot({ ...newLot, quantite_achetee: e.target.value })} placeholder="0.00" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">P.U Achat (€)</label>
                                    <input type="number" step="0.01" className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                                        value={newLot.prix_achat_unitaire} onChange={e => setNewLot({ ...newLot, prix_achat_unitaire: e.target.value })} placeholder="0.00" required />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Annuler</button>
                                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800">Valider</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventaire;
