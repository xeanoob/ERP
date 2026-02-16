import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingCart } from 'lucide-react';

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
            const res = await axios.post(`${API_URL}/sales`, sale);
            setMessage({ type: 'success', text: 'Vente enregistrée avec succès !' });
            setSale({ produit_id: '', quantite_sortie: '', prix_vente_unitaire: '' });
        } catch (err) {
            console.error(err);
            setMessage({
                type: 'error',
                text: err.response?.data?.error || 'Erreur lors de la vente'
            });
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
                <ShoppingCart className="mr-2" /> Enregistrer une Vente
            </h2>

            <div className="bg-white p-8 rounded-lg shadow-md">
                {message.text && (
                    <div className={`p-4 mb-6 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSale} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Produit</label>
                        <select
                            value={sale.produit_id}
                            onChange={e => setSale({ ...sale, produit_id: e.target.value })}
                            required
                            className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-green-500"
                        >
                            <option value="">Sélectionner un produit...</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>{p.nom} ({p.categorie})</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Quantité Vendu (kg/unité)</label>
                            <input
                                type="number" step="0.01"
                                value={sale.quantite_sortie}
                                onChange={e => setSale({ ...sale, quantite_sortie: e.target.value })}
                                required
                                className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Prix de Vente Unitaire (€)</label>
                            <input
                                type="number" step="0.01"
                                value={sale.prix_vente_unitaire}
                                onChange={e => setSale({ ...sale, prix_vente_unitaire: e.target.value })}
                                required
                                className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-green-600 text-white font-bold py-3 rounded-md hover:bg-green-700 transition duration-300"
                    >
                        Valider la Vente
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Sorties;
