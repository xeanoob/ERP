import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const Sorties = () => {
    const [products, setProducts] = useState([]);
    const [sale, setSale] = useState({ produit_id: '', quantite_sortie: '', prix_vente_unitaire: '' });
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await axios.get(`${API_URL}/products`);
            setProducts(res.data);
        } catch (err) { console.error(err); }
    };

    const handleSale = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        try {
            await axios.post(`${API_URL}/sales`, sale);
            setMessage({ type: 'success', text: 'Vente validée et stock déduit.' });
            setSale({ produit_id: '', quantite_sortie: '', prix_vente_unitaire: '' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (err) {
            console.error(err);
            setMessage({
                type: 'error',
                text: err.response?.data?.error || 'Erreur lors de la vente'
            });
        }
    };

    return (
        <div className="max-w-xl mx-auto flex flex-col gap-6">

            <div>
                <h2 className="text-lg font-semibold text-gray-900">Nouvelle Vente</h2>
                <p className="text-sm text-gray-500">Enregistrer une expédition client et déduire les lots du stock (FIFO).</p>
            </div>

            <div className="pro-card p-6">
                {message.text && (
                    <div className={`px-4 py-3 mb-6 rounded-md text-sm font-medium border ${message.type === 'success'
                            ? 'bg-green-50 text-green-800 border-green-200'
                            : 'bg-red-50 text-red-800 border-red-200'
                        }`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSale} className="space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Produit Catalogue</label>
                        <select
                            value={sale.produit_id}
                            onChange={e => setSale({ ...sale, produit_id: e.target.value })}
                            required
                            className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                        >
                            <option value="" disabled>Rechercher un produit...</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>{p.nom} ({p.categorie})</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Volume / Poids <span className="text-gray-400 lowercase font-normal">(kg)</span></label>
                            <input
                                type="number" step="0.01"
                                value={sale.quantite_sortie}
                                onChange={e => setSale({ ...sale, quantite_sortie: e.target.value })}
                                required
                                placeholder="0.00"
                                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-right font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Prix de Vente <span className="text-gray-400 lowercase font-normal">(€/u)</span></label>
                            <input
                                type="number" step="0.01"
                                value={sale.prix_vente_unitaire}
                                onChange={e => setSale({ ...sale, prix_vente_unitaire: e.target.value })}
                                required
                                placeholder="0.00"
                                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-right font-mono"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            className="w-full bg-gray-900 text-white px-4 py-2.5 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
                        >
                            Confirmer la Vente
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Sorties;
