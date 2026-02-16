import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const Inventaire = () => {
    const [stocks, setStocks] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // New Lot Form State
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
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">État des Stocks</h2>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center shadow-lg"
                >
                    <Plus className="w-4 h-4 mr-2" /> Nouvelle Entrée de Stock
                </button>
            </div>

            {/* Stock Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600">Produit</th>
                            <th className="p-4 font-semibold text-gray-600 text-right">Quantité Totale</th>
                            <th className="p-4 font-semibold text-gray-600 text-right">Prix Moyen Pondéré</th>
                            <th className="p-4 font-semibold text-gray-600 text-right">Valeur Stock</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan="4" className="p-4 text-center">Chargement...</td></tr> : stocks.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50 border-b last:border-0">
                                <td className="p-4">
                                    <div className="font-medium text-gray-900">{p.nom}</div>
                                    <div className="text-xs text-gray-500">{p.categorie}</div>
                                </td>
                                <td className="p-4 text-right font-medium">
                                    {parseFloat(p.stock_total).toFixed(2)} kg
                                </td>
                                <td className="p-4 text-right text-gray-600">
                                    {parseFloat(p.prix_moyen_pondere).toFixed(2)} €/kg
                                </td>
                                <td className="p-4 text-right text-green-600 font-semibold">
                                    {(parseFloat(p.stock_total) * parseFloat(p.prix_moyen_pondere)).toFixed(2)} €
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add Lot Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
                        <h3 className="text-lg font-bold mb-4">Ajouter un Lot (Entrée)</h3>
                        <form onSubmit={handleAddLot} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Produit</label>
                                <select
                                    className="w-full border rounded p-2"
                                    value={newLot.produit_id}
                                    onChange={e => setNewLot({ ...newLot, produit_id: e.target.value })}
                                    required
                                >
                                    <option value="">Choisir...</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Quantité (kg/unité)</label>
                                <input
                                    type="number" step="0.01"
                                    className="w-full border rounded p-2"
                                    value={newLot.quantite}
                                    onChange={e => setNewLot({ ...newLot, quantite: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Prix Achat Unitaire (€)</label>
                                <input
                                    type="number" step="0.01"
                                    className="w-full border rounded p-2"
                                    value={newLot.prix_achat_unitaire}
                                    onChange={e => setNewLot({ ...newLot, prix_achat_unitaire: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                >Annuler</button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                >Enregistrer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventaire;
