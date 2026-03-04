import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const Inventaire = () => {
    const [stocks, setStocks] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [newLot, setNewLot] = useState({ produit_id: '', quantite: '', prix_achat_unitaire: '' });

    useEffect(() => {
        fetchStocks();
        fetchProducts();
    }, []);

    const fetchStocks = async () => {
        try {
            const res = await axios.get(`${API_URL}/lots/stock`);
            setStocks(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await axios.get(`${API_URL}/products`);
            setProducts(res.data);
        } catch (err) { console.error(err); }
    };

    const handleAddLot = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/lots`, newLot);
            setShowModal(false);
            setNewLot({ produit_id: '', quantite: '', prix_achat_unitaire: '' });
            fetchStocks();
        } catch (err) {
            alert('Erreur: ' + (err.response?.data || err.message));
        }
    };

    return (
        <div className="max-w-6xl mx-auto flex flex-col gap-6">

            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">État des Stocks</h2>
                    <p className="text-sm text-gray-500">Vue d'ensemble des quantités et valorisation en temps réel.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors text-sm font-medium flex items-center shadow-sm"
                >
                    <Plus className="w-4 h-4 mr-2" /> Entrée de lot
                </button>
            </div>

            {/* Data Grid */}
            <div className="pro-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Produit</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Quantité En Stock</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">PRMP (€/kg)</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Valeur Nette (€)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {loading ? (
                                <tr><td colSpan="4" className="px-4 py-8 text-center text-sm text-gray-500">Chargement des données...</td></tr>
                            ) : stocks.length === 0 ? (
                                <tr><td colSpan="4" className="px-4 py-8 text-center text-sm text-gray-500">Aucun stock disponible.</td></tr>
                            ) : stocks.map(p => (
                                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="text-sm font-medium text-gray-900">{p.nom}</div>
                                        <div className="text-xs text-gray-500">{p.categorie}</div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                                        {parseFloat(p.stock_total).toFixed(2)} <span className="text-gray-500 font-normal">kg</span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                                        {parseFloat(p.prix_moyen_pondere).toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                                        {(parseFloat(p.stock_total) * parseFloat(p.prix_moyen_pondere)).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-md shadow-2xl max-w-sm w-full overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-900">Nouvelle Entrée de Lot</h3>
                        </div>
                        <form onSubmit={handleAddLot} className="px-5 py-4 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Produit concerné</label>
                                <select
                                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                                    value={newLot.produit_id}
                                    onChange={e => setNewLot({ ...newLot, produit_id: e.target.value })}
                                    required
                                >
                                    <option value="" disabled>Sélectionner...</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.nom} ({p.categorie})</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Volume (kg)</label>
                                    <input
                                        type="number" step="0.01"
                                        className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                                        value={newLot.quantite}
                                        onChange={e => setNewLot({ ...newLot, quantite: e.target.value })}
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">P.U Achat (€)</label>
                                    <input
                                        type="number" step="0.01"
                                        className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                                        value={newLot.prix_achat_unitaire}
                                        onChange={e => setNewLot({ ...newLot, prix_achat_unitaire: e.target.value })}
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
                                >Annuler</button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
                                >Valider</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventaire;
